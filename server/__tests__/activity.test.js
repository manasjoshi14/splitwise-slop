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
let aliceToken, bobToken;
let groupId;

beforeAll(async () => {
  await setupDatabase();
  app = require('../app');
});

beforeEach(async () => {
  await cleanDatabase();
  users = await seedUsers();
  aliceToken = generateToken(users[0]);
  bobToken = generateToken(users[1]);

  const res = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({ name: 'Activity Group', member_emails: ['bob@test.com'] });
  groupId = res.body.id;
});

afterAll(async () => {
  await pool.end();
});

describe('Activity API', () => {
  test('GET /api/activity returns empty when no activity', async () => {
    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('GET /api/activity shows expenses and settlements', async () => {
    // Add an expense
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Movie tickets',
        amount: 40,
        paid_by: users[0].id,
      });

    // Add a settlement
    await request(app)
      .post('/api/settlements')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ paid_to: users[0].id, amount: 20, group_id: groupId });

    const res = await request(app)
      .get('/api/activity')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const types = res.body.map((a) => a.type);
    expect(types).toContain('expense');
    expect(types).toContain('settlement');
  });
});
