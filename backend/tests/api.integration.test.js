const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { env } = require('../config/env');
const { sequelize } = require('../config/db');
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
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

    const notificationCreate = jest
      .spyOn(Notification, 'bulkCreate')
      .mockRejectedValueOnce(new Error('Simulated notification persistence failure'));

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
});
