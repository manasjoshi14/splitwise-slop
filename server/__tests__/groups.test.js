const request = require('supertest');
const {
  pool,
  setupDatabase,
  cleanDatabase,
  seedUsers,
  generateToken,
} = require('./setup');

let app;
let users;
let aliceToken;

beforeAll(async () => {
  await setupDatabase();
  app = require('../app');
});

beforeEach(async () => {
  await cleanDatabase();
  users = await seedUsers();
  aliceToken = generateToken(users[0]);
});

afterAll(async () => {
  await pool.end();
});

describe('Groups API', () => {
  test('POST /api/groups creates a group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Test Group' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Group');
    expect(res.body.id).toBeDefined();
  });

  test('GET /api/groups lists user groups', async () => {
    await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Group 1' });

    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Group 1');
    expect(res.body[0].member_count).toBe('1');
  });

  test('GET /api/groups/:id returns group detail with members', async () => {
    const createRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Detail Group' });

    const res = await request(app)
      .get(`/api/groups/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Detail Group');
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].email).toBe('alice@test.com');
  });

  test('POST /api/groups/:id/members adds a member', async () => {
    const createRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Add Member Group' });

    const addRes = await request(app)
      .post(`/api/groups/${createRes.body.id}/members`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@test.com' });

    expect(addRes.status).toBe(200);

    const detailRes = await request(app)
      .get(`/api/groups/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(detailRes.body.members).toHaveLength(2);
  });

  test('POST /api/groups/:id/members returns 404 for unknown email', async () => {
    const createRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Test' });

    const res = await request(app)
      .post(`/api/groups/${createRes.body.id}/members`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'nobody@test.com' });

    expect(res.status).toBe(404);
  });

  test('DELETE /api/groups/:id/members/:userId removes a member', async () => {
    const createRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'Remove Member Group' });

    await request(app)
      .post(`/api/groups/${createRes.body.id}/members`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@test.com' });

    const removeRes = await request(app)
      .delete(`/api/groups/${createRes.body.id}/members/${users[1].id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(removeRes.status).toBe(200);
  });

  test('GET /api/groups/:id returns 404 for non-existent group', async () => {
    const res = await request(app)
      .get('/api/groups/99999')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(404);
  });

  test('POST /api/groups with member_emails adds members on creation', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ name: 'With Members', member_emails: ['bob@test.com'] });

    expect(res.status).toBe(201);

    const detailRes = await request(app)
      .get(`/api/groups/${res.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(detailRes.body.members).toHaveLength(2);
  });
});
