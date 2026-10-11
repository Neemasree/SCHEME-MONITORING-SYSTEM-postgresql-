const request = require('supertest');
const app = require('../index');
const { sequelize } = require('../config/db');
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

  test('limits field officer application results to the assigned district', async () => {
    const response = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${fieldToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((application) => application.district === 'Salem')).toBe(true);
  });

  test('accepts valid dashboard date filters', async () => {
    const response = await request(app)
      .get('/api/dashboard/analytics?startDate=2026-10-01&endDate=2026-10-31')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('trendData');
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
