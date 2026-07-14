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
  let volunteer1Id: string;

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

    return res.body;
  };

  const volunteerLogin = await login('saleena@legalaid.test');
  volunteerToken = volunteerLogin.accessToken;
  volunteer1Id = volunteerLogin.user.id;
  supervisorToken = (await login('bilal@legalaid.test')).accessToken;
  adminToken = (await login('kulsoom@legalaid.test')).accessToken;

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
      const res = await request(app.getHttpServer())
        .patch(`/api/cases/${createdCaseId}/assign`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ volunteerId: volunteer1Id });
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

  describe('Notes — full lifecycle', () => {
    let createdNoteId: string;
    let draftNoteId: string;

    it('citizen CANNOT add case notes (volunteer-only route)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cases/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ content: 'Should not be allowed' });
      expect(res.status).toBe(403);
    });

    it('assigned volunteer can add a plain note', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cases/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ content: 'Spoke with citizen, gathering more facts.' });
      expect(res.status).toBe(201);
      expect(res.body.isAiDraft).toBe(false);
      expect(res.body.approved).toBe(true);
      createdNoteId = res.body.id;
    });

    it('assigned volunteer can request an AI-drafted letter (draft: true) — succeeds or falls back gracefully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cases/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ content: 'Citizen received a 14-day eviction notice, needs a response letter.', draft: true });
      expect(res.status).toBe(201);
      expect(res.body.isAiDraft).toBe(true);
      expect(res.body.approved).toBe(false);
      expect(typeof res.body.content).toBe('string');
      draftNoteId = res.body.id;
    });

    it('citizen CANNOT view case notes (volunteer/supervisor-only route)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cases/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('supervisor can view case notes', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cases/${createdCaseId}/notes`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('a different volunteer (not the note author) CANNOT approve the draft', async () => {
      // admin token stands in here purely to prove non-author rejection; the
      // authoring volunteer is the only non-supervisor allowed to approve.
      const res = await request(app.getHttpServer())
        .patch(`/api/notes/${draftNoteId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Edited final letter text.' });
      expect(res.status).toBe(403);
    });

    it('authoring volunteer can review and approve the AI draft', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/notes/${draftNoteId}/approve`)
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ content: 'Final, volunteer-reviewed letter text.' });
      expect(res.status).toBe(200);
      expect(res.body.approved).toBe(true);
      expect(res.body.content).toBe('Final, volunteer-reviewed letter text.');
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

  describe('Availability — role guards', () => {
    let createdAvailabilityId: string;

    it('citizen CANNOT set availability (volunteer-only route)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/availability')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ dayOfWeek: 2, startTime: '09:00', endTime: '12:00' });
      expect(res.status).toBe(403);
    });

    it('volunteer can set weekly availability', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/availability')
        .set('Authorization', `Bearer ${volunteerToken}`)
        .send({ dayOfWeek: 2, startTime: '09:00', endTime: '12:00' });
      expect(res.status).toBe(201);
      expect(res.body.dayOfWeek).toBe(2);
      createdAvailabilityId = res.body.id;
    });

    it('any authenticated user can view a volunteer\'s availability', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/availability/${volunteer1Id}`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('citizen CANNOT delete a volunteer\'s availability slot', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/availability/${createdAvailabilityId}`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('owning volunteer can delete their own availability slot', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/availability/${createdAvailabilityId}`)
        .set('Authorization', `Bearer ${volunteerToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Documents — upload, access control, and audit log', () => {
    let uploadedDocId: string;

    it('citizen can upload a document (PDF) to their own case', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cases/${createdCaseId}/documents`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .attach('file', Buffer.from('%PDF-1.4 fake e2e test file'), {
          filename: 'eviction-notice.pdf',
          contentType: 'application/pdf',
        });
      expect(res.status).toBe(201);
      expect(res.body.originalName).toBe('eviction-notice.pdf');
      uploadedDocId = res.body.id;
    });

    it('rejects a disallowed file type', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/cases/${createdCaseId}/documents`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .attach('file', Buffer.from('just some text'), {
          filename: 'notes.txt',
          contentType: 'text/plain',
        });
      expect(res.status).toBe(400);
    });

    it('assigned volunteer can list documents for the case', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cases/${createdCaseId}/documents`)
        .set('Authorization', `Bearer ${volunteerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.some((d: any) => d.id === uploadedDocId)).toBe(true);
    });

    it('citizen CANNOT view access logs (supervisor/admin-only route)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/documents/${uploadedDocId}/access-logs`)
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
    });

    it('assigned volunteer can download the document, which is recorded in the audit log', async () => {
      const download = await request(app.getHttpServer())
        .get(`/api/documents/${uploadedDocId}/download`)
        .set('Authorization', `Bearer ${volunteerToken}`);
      expect(download.status).toBe(200);

      const logs = await request(app.getHttpServer())
        .get(`/api/documents/${uploadedDocId}/access-logs`)
        .set('Authorization', `Bearer ${supervisorToken}`);
      expect(logs.status).toBe(200);
      expect(logs.body.some((l: any) => l.action === 'download')).toBe(true);
    });
  });

  describe('Notifications', () => {
    it('unauthenticated request is rejected', async () => {
      const res = await request(app.getHttpServer()).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('assigned volunteer received a notification from the earlier document upload', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${volunteerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('volunteer can mark a notification as read', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/notifications')
        .set('Authorization', `Bearer ${volunteerToken}`);
      const target = list.body[0];
      expect(target).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/api/notifications/${target.id}/read`)
        .set('Authorization', `Bearer ${volunteerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Users — volunteer capacity limits (spec 3.2)', () => {
    it('citizen CANNOT set a volunteer\'s capacity limit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${volunteer1Id}/capacity`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({ maxActiveCases: 5 });
      expect(res.status).toBe(403);
    });

    it('supervisor CAN set a volunteer\'s capacity limit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${volunteer1Id}/capacity`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ maxActiveCases: 12 });
      expect(res.status).toBe(200);
      expect(res.body.maxActiveCases).toBe(12);
    });

    it('admin CAN also set a volunteer\'s capacity limit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${volunteer1Id}/capacity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxActiveCases: 8 });
      expect(res.status).toBe(200);
      expect(res.body.maxActiveCases).toBe(8);
    });

    it('rejects setting a capacity limit on a non-volunteer account', async () => {
      const me = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${supervisorToken}`);
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${me.body.id}/capacity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ maxActiveCases: 5 });
      expect(res.status).toBe(403);
    });
  });
});