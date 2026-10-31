const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { env } = require('../config/env');
const { sequelize } = require('../config/db');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
require('../models');

describe('CivicTrack API integration', () => {
  let adminToken;
  let districtToken;
  let fieldToken;
  let beneficiaryToken;

  beforeAll(async () => {
    await sequelize.authenticate();

    const login = async (email, password) => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });
      expect(response.status).toBe(200);
      return response.body.token;
    };

    adminToken = await login('admin@govt.in', 'password123');
    districtToken = await login('district@govt.in', 'password123');
    fieldToken = await login('field@govt.in', 'password123');

    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Integration Beneficiary',
        email: `integration.${Date.now()}@example.com`,
        password: 'StrongPass123',
      });
    expect(registration.status).toBe(201);
    beneficiaryToken = registration.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('protects application APIs from unauthenticated requests', async () => {
    const response = await request(app).get('/api/applications');
    expect(response.status).toBe(401);
  });

  test('rejects malformed login input with a validation error', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('rejects expired access tokens', async () => {
    const expiredToken = jwt.sign(
      { id: 1, exp: Math.floor(Date.now() / 1000) - 60 },
      env.JWT_SECRET,
    );
    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  test('blocks beneficiaries from admin user management', async () => {
    const response = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${beneficiaryToken}`);

    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  test('rejects invalid application payloads before database writes', async () => {
    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${beneficiaryToken}`)
      .send({ schemeId: -3, unexpected: true });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('rolls back the application and audit event when submission notifications fail', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Rollback Beneficiary',
        email: `rollback.${Date.now()}@example.com`,
        password: 'StrongPass123',
      });
    expect(registration.status).toBe(201);

    const fieldOfficerId = jwt.verify(fieldToken, env.JWT_SECRET).id;
    const pendingNotificationCountBefore = await Notification.count({
      where: { userId: fieldOfficerId, title: 'New application to verify' },
    });
    const originalBulkCreate = Notification.bulkCreate.bind(Notification);
    const notificationCreate = jest
      .spyOn(Notification, 'bulkCreate')
      .mockImplementationOnce(async (...args) => {
        // Persist inside the request transaction, then fail. The transaction
        // must roll this row back along with the application and audit event.
        await originalBulkCreate(...args);
        throw new Error('Simulated failure after submission notification insert');
      });

    let response;
    try {
      response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${registration.body.token}`)
        .send({ schemeId: 1 });
    } finally {
      notificationCreate.mockRestore();
    }

    expect(response.status).toBe(500);
    expect(
      await Application.count({ where: { beneficiaryUserId: registration.body.id } }),
    ).toBe(0);
    expect(
      await AuditLog.count({
        where: {
          actorId: registration.body.id,
          action: 'application_submitted',
        },
      }),
    ).toBe(0);
    expect(await Notification.count({
      where: { userId: fieldOfficerId, title: 'New application to verify' },
    })).toBe(pendingNotificationCountBefore);
  });

  test('requires a remark when rejecting an application', async () => {
    const response = await request(app)
      .put('/api/applications/101/approve')
      .set('Authorization', `Bearer ${fieldToken}`)
      .send({ action: 'reject' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  test('limits field officer application results to the assigned district', async () => {
    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${fieldToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((application) => application.district === 'Salem')).toBe(true);
  });

  test('prevents a district officer from approving an application outside their district', async () => {
    const applicationBefore = await Application.findByPk(102);
    expect(applicationBefore.district).toBe('Coimbatore');
    expect(applicationBefore.status).toBe('Pending District Officer');
    const auditCountBefore = await AuditLog.count({
      where: { entityType: 'application', entityId: 102 },
    });

    const response = await request(app)
      .put('/api/applications/102/approve')
      .set('Authorization', `Bearer ${districtToken}`)
      .send({ action: 'approve', remark: 'Cross-district access must be denied' });

    expect(response.status).toBe(404);

    const applicationAfter = await Application.findByPk(102);
    expect(applicationAfter.status).toBe('Pending District Officer');
    expect(await AuditLog.count({
      where: { entityType: 'application', entityId: 102 },
    })).toBe(auditCountBefore);
  });

  test("keeps every dashboard analytics series inside the field officer's district", async () => {
    const fieldAnalytics = await request(app)
      .get('/api/dashboard/analytics?district=Coimbatore')
      .set('Authorization', `Bearer ${fieldToken}`);

    const districtAdminAnalytics = await request(app)
      .get('/api/dashboard/analytics?district=Salem')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(fieldAnalytics.status).toBe(200);
    expect(districtAdminAnalytics.status).toBe(200);
    expect(fieldAnalytics.body.districtStats.length).toBeGreaterThan(0);
    expect(fieldAnalytics.body.districtStats.every((row) => row.district === 'Salem')).toBe(true);

    // A field officer cannot override their account district via a query parameter.
    expect(fieldAnalytics.body).toEqual(districtAdminAnalytics.body);
  });

  test('accepts valid dashboard date filters', async () => {
    const response = await request(app)
      .get('/api/dashboard/analytics?startDate=2026-10-01&endDate=2026-10-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('trendData');
  });

  test('rejects impossible calendar dates in dashboard filters', async () => {
    const response = await request(app)
      .get('/api/dashboard/analytics?startDate=2026-02-30')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('startDate must use YYYY-MM-DD format');
  });

  test('rejects dashboard date ranges where the start date follows the end date', async () => {
    const response = await request(app)
      .get('/api/dashboard/analytics?startDate=2026-10-31&endDate=2026-10-01')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('startDate must be on or before endDate');
  });

  test('rolls back an approval when audit-log persistence fails', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Approval Rollback Beneficiary',
        email: `approval.rollback.${Date.now()}@example.com`,
        password: 'StrongPass123',
      });
    expect(registration.status).toBe(201);

    const submitted = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ schemeId: 1 });
    expect(submitted.status).toBe(201);

    const applicationId = submitted.body.application.id;
    const statusBefore = submitted.body.application.status;
    const remarksBefore = submitted.body.application.remarks;
    const auditCountBefore = await AuditLog.count({
      where: { entityType: 'application', entityId: applicationId },
    });

    const auditCreate = jest
      .spyOn(AuditLog, 'create')
      .mockRejectedValueOnce(new Error('Simulated audit-log persistence failure'));

    let response;
    try {
      response = await request(app)
        .put(`/api/applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${fieldToken}`)
        .send({ action: 'approve', remark: 'Verify transactional rollback' });
    } finally {
      auditCreate.mockRestore();
    }

    expect(response.status).toBe(500);
    const applicationAfter = await Application.findByPk(applicationId);
    expect(applicationAfter.status).toBe(statusBefore);
    expect(applicationAfter.remarks).toEqual(remarksBefore);
    expect(await AuditLog.count({
      where: { entityType: 'application', entityId: applicationId },
    })).toBe(auditCountBefore);
  });

  test('enforces every stage of the application approval workflow and records history', async () => {
    const submitted = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${beneficiaryToken}`)
      .send({ schemeId: 1 });

    expect(submitted.status).toBe(201);
    const applicationId = submitted.body.application.id;
    expect(submitted.body.application.status).toBe('Pending Field Officer');

    const prematureDistrictDecision = await request(app)
      .put(`/api/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${districtToken}`)
      .send({ action: 'approve', remark: 'Must wait for field review' });
    expect(prematureDistrictDecision.status).toBe(409);

    const fieldDecision = await request(app)
      .put(`/api/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${fieldToken}`)
      .send({ action: 'approve', remark: 'Field verification complete' });
    expect(fieldDecision.status).toBe(200);
    expect(fieldDecision.body.application.status).toBe('Pending District Officer');

    const repeatedFieldDecision = await request(app)
      .put(`/api/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${fieldToken}`)
      .send({ action: 'approve', remark: 'Duplicate transition' });
    expect(repeatedFieldDecision.status).toBe(409);

    const districtDecision = await request(app)
      .put(`/api/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${districtToken}`)
      .send({ action: 'approve', remark: 'District review complete' });
    expect(districtDecision.status).toBe(200);
    expect(districtDecision.body.application.status).toBe('Pending Admin');

    const adminDecision = await request(app)
      .put(`/api/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve', remark: 'Final approval granted' });
    expect(adminDecision.status).toBe(200);
    expect(adminDecision.body.application.status).toBe('Approved');

    const history = await request(app)
      .get(`/api/applications/${applicationId}/history`)
      .set('Authorization', `Bearer ${beneficiaryToken}`);
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(4);

    const notifications = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${beneficiaryToken}`);
    expect(notifications.status).toBe(200);
    expect(notifications.body.some((notification) => notification.title === 'Application approved')).toBe(true);
  });

  test('rolls back an approval when notification persistence fails', async () => {
    const registration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Approval Notification Rollback Beneficiary',
        email: `approval.notification.rollback.${Date.now()}@example.com`,
        password: 'StrongPass123',
      });
    expect(registration.status).toBe(201);

    const submitted = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({ schemeId: 1 });
    expect(submitted.status).toBe(201);

    const applicationId = submitted.body.application.id;
    const statusBefore = submitted.body.application.status;
    const remarksBefore = submitted.body.application.remarks;
    const auditCountBefore = await AuditLog.count({
      where: { entityType: 'application', entityId: applicationId },
    });

    const districtOfficerId = jwt.verify(districtToken, env.JWT_SECRET).id;
    const forwardedNotificationCountBefore = await Notification.count({
      where: { userId: districtOfficerId, title: 'Application forwarded for district review' },
    });
    const originalBulkCreate = Notification.bulkCreate.bind(Notification);
    const notificationCreate = jest
      .spyOn(Notification, 'bulkCreate')
      .mockImplementationOnce(async (...args) => {
        // Force failure only after the notification INSERT has executed in
        // the same transaction as the application and audit updates.
        await originalBulkCreate(...args);
        throw new Error('Simulated failure after approval notification insert');
      });

    let response;
    try {
      response = await request(app)
        .put(`/api/applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${fieldToken}`)
        .send({ action: 'approve', remark: 'Verify notification rollback' });
    } finally {
      notificationCreate.mockRestore();
    }

    expect(response.status).toBe(500);
    const applicationAfter = await Application.findByPk(applicationId);
    expect(applicationAfter.status).toBe(statusBefore);
    expect(applicationAfter.remarks).toEqual(remarksBefore);
    expect(await AuditLog.count({
      where: { entityType: 'application', entityId: applicationId },
    })).toBe(auditCountBefore);
    expect(await Notification.count({
      where: { userId: districtOfficerId, title: 'Application forwarded for district review' },
    })).toBe(forwardedNotificationCountBefore);
  });

  test('prevents a beneficiary from reading another beneficiary application history', async () => {
    const submitted = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${beneficiaryToken}`)
      .send({ schemeId: 1 });
    expect(submitted.status).toBe(201);

    const otherRegistration = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Different Beneficiary',
        email: `different.beneficiary.${Date.now()}@example.com`,
        password: 'StrongPass123',
      });
    expect(otherRegistration.status).toBe(201);

    const response = await request(app)
      .get(`/api/applications/${submitted.body.application.id}/history`)
      .set('Authorization', `Bearer ${otherRegistration.body.token}`);

    expect(response.status).toBe(404);
    expect(response.body).not.toHaveProperty('history');
  });

  test('prevents a beneficiary from marking another user notification as read', async () => {
    const adminId = jwt.verify(adminToken, env.JWT_SECRET).id;
    const notification = await Notification.create({
      userId: adminId,
      role: 'admin',
      title: 'Private admin notification test',
      message: 'This notification belongs only to the administrator.',
      type: 'info',
      isRead: false,
    });

    const response = await request(app)
      .put(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${beneficiaryToken}`);

    expect(response.status).toBe(404);
    await notification.reload();
    expect(notification.isRead).toBe(false);
  });

  test('rejects public registration attempts to assign privileged roles or districts', async () => {
    const email = `privilege.escalation.${Date.now()}@example.com`;
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Privilege Escalation Attempt',
        email,
        password: 'StrongPass123',
        role: 'admin',
        district: 'Coimbatore',
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(await User.findOne({ where: { email } })).toBeNull();
  });

  test('prevents field and district officers from provisioning privileged users', async () => {
    const timestamp = Date.now();
    const attempts = [
      { token: fieldToken, email: `field.provision.${timestamp}@example.com` },
      { token: districtToken, email: `district.provision.${timestamp}@example.com` },
    ];

    for (const attempt of attempts) {
      const response = await request(app)
        .post('/api/auth/users')
        .set('Authorization', `Bearer ${attempt.token}`)
        .send({
          name: 'Unauthorized Administrator',
          email: attempt.email,
          password: 'StrongPass123',
          role: 'admin',
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('FORBIDDEN');
      expect(await User.findOne({ where: { email: attempt.email } })).toBeNull();
    }
  });

  test('invalidates an existing access token immediately after account deactivation', async () => {
    // Reuse the beneficiary created in beforeAll so this security test does not
    // consume the shared authentication rate-limit budget with another signup.
    const beneficiaryId = jwt.verify(beneficiaryToken, env.JWT_SECRET).id;
    const beneficiary = await User.findByPk(beneficiaryId);
    expect(beneficiary.isActive).toBe(true);

    const deactivate = await request(app)
      .patch(`/api/auth/users/${beneficiaryId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivate.status).toBe(200);

    await beneficiary.reload();
    expect(beneficiary.isActive).toBe(false);

    const protectedRequest = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${beneficiaryToken}`);
    expect(protectedRequest.status).toBe(401);
    expect(protectedRequest.body.code).toBe('UNAUTHORIZED');
  });

  test('limits district officer application results to the assigned district', async () => {
    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${districtToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((application) => application.district === 'Salem')).toBe(true);
  });

  test('prevents district officers from reading application history outside their district', async () => {
    const application = await Application.findByPk(102);
    expect(application.district).toBe('Coimbatore');

    const response = await request(app)
      .get('/api/applications/102/history')
      .set('Authorization', `Bearer ${districtToken}`);

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

});
