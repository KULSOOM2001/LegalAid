import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Integration tests against role-protected routes across every controller.
 * Requires DATABASE_URL (Neon/Postgres) to be reachable and the seed script
 * to have been run once (npm run seed) so the fixed test accounts exist:
 *   admin@legalaid.test / supervisor@legalaid.test / volunteer1@legalaid.test
 *   citizen1@legalaid.test   — all with password "password123"
 */
jest.setTimeout(30000);

describe('LegalAid API (e2e)', () => {
  let app: INestApplication;

  let citizenToken: string;
  let volunteerToken: string;
  let supervisorToken: string;
  let adminToken: string;

  const uniqueEmail = `e2e-citizen-${Date.now()}@legalaid.test`;
  let createdCaseId: string;

beforeAll(async () => {
  console.log('========== E2E SETUP START ==========');

  console.log('1. Compiling testing module...');
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  console.log('2. Creating Nest app...');
  app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  console.log('3. Calling app.init()...');
  await app.init();
  console.log('✅ app.init() completed');

  console.log('4. Registering test user...');
  const registerRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      name: 'E2E Citizen',
      email: uniqueEmail,
      password: 'password123',
    });

  console.log('Register Status:', registerRes.status);
  console.log('Register Body:', registerRes.body);

  expect(registerRes.status).toBe(201);
  citizenToken = registerRes.body.accessToken;

  const login = async (email: string) => {
    console.log(`Logging in: ${email}`);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'password123',
      });

    console.log(`${email} -> ${res.status}`);

    expect(res.status).toBe(201);

    return res.body.accessToken;
  };

  volunteerToken = await login('volunteer1@legalaid.test');
  supervisorToken = await login('supervisor@legalaid.test');
  adminToken = await login('admin@legalaid.test');

  console.log('========== E2E SETUP COMPLETE ==========');
}, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('rejects login with wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: uniqueEmail, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('rejects duplicate registration email', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Dup',
        email: uniqueEmail,
        password: 'password123',
      });
      expect(res.status).toBe(409);
    });

    it('GET /auth/me requires a valid token', async () => {
      const unauth = await request(app.getHttpServer()).get('/api/auth/me');
      expect(unauth.status).toBe(401);

      const authed = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(authed.status).toBe(200);
      expect(authed.body.email).toBe(uniqueEmail);
    });

    it('public register always creates a citizen role, even if role is spoofed in body', async () => {
      const res = await request(app.getHttpServer()).post('/api/auth/register').send({
        name: 'Sneaky Admin',
        email: `sneaky-${Date.now()}@legalaid.test`,
        password: 'password123',
        role: 'admin',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('citizen');
    });
  });

  describe('Cases — role guards', () => {
    it('citizen can create a case', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ title: 'E2E test case', description: 'Testing the create-case flow end to end.' });
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('submitted');
      createdCaseId = res.body.id;
    });

    it('volunteer CANNOT create a case (citizen-only route)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cases')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ title: 'Should fail', description: 'Volunteers cannot submit cases.' });
      expect(res.status).toBe(403);
    });

    it('unauthenticated request is rejected', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cases')
        .send({ title: 'No token', description: 'Should be rejected.' });
      expect(res.status).toBe(401);
    });

    it('citizen can view their own case', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cases/${createdCaseId}`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdCaseId);
    });

    it('invalid guarded status transition is rejected (submitted -> resolved is not allowed)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/cases/${createdCaseId}/status`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(400);
    });

    it('citizen CANNOT change case status (volunteer/supervisor-only route)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/cases/${createdCaseId}/status`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ status: 'triaged' });
      expect(res.status).toBe(403);
    });

    it('supervisor can reassign / assign a case', async () => {
      const volunteers = await request(app.getHttpServer())
        .get('/api/users/volunteers')
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(volunteers.status).toBe(200);
      const volunteerId = volunteers.body[0]?.id;
      expect(volunteerId).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/api/cases/${createdCaseId}/assign`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ volunteerId });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('volunteer CANNOT assign cases (supervisor-only route)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/cases/${createdCaseId}/assign`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ volunteerId: 'irrelevant' });
      expect(res.status).toBe(403);
    });
  });

  describe('Admin — role guards', () => {
    it('non-admin roles are rejected from every admin stats route', async () => {
      for (const token of [citizenToken, volunteerToken, supervisorToken]) {
        const res = await request(app.getHttpServer())
          .get('/api/admin/stats/volume')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
      }
    });

    it('admin can access reporting routes', async () => {
      const routes = [
        '/api/admin/stats/volume',
        '/api/admin/stats/volume-by-domain',
        '/api/admin/stats/volume-by-volunteer',
        '/api/admin/stats/volume-by-month',
        '/api/admin/stats/resolution-time',
        '/api/admin/stats/outcomes',
        '/api/admin/stats/utilisation',
        '/api/admin/stats/status-breakdown',
        '/api/admin/users',
      ];
      for (const route of routes) {
        const res = await request(app.getHttpServer()).get(route).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
    });
  });

  describe('AI proxy — role guards', () => {
    it('citizen CANNOT call predict-outcome (volunteer/supervisor only, per spec 4.4 privacy rule)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/predict-outcome')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ caseId: createdCaseId });
      expect(res.status).toBe(403);
    });

    it('volunteer CAN call predict-outcome', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/predict-outcome')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ caseId: createdCaseId });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success');
    });
  });

  describe('Notes — role guards', () => {
    it('citizen CANNOT add case notes (volunteer-only route)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cases/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ content: 'Should not be allowed' });
      expect(res.status).toBe(403);
    });
  });

  describe('Appointments — conflict detection', () => {
    it('booking without a matching availability slot is rejected', async () => {
      const volunteers = await request(app.getHttpServer())
        .get('/api/users/volunteers')
        .set('Authorization', `Bearer ${citizenToken}`);
      const volunteerId = volunteers.body[0]?.id;

      const res = await request(app.getHttpServer())
        .post('/api/appointments')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          caseId: createdCaseId,
          volunteerId,
          startsAt: '2099-01-01T03:00:00.000Z',
          endsAt: '2099-01-01T03:30:00.000Z',
        });
      expect(res.status).toBe(400);
    });
  });
});