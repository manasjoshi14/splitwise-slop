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
    .send({ name: 'Settlement Group', member_emails: ['bob@test.com'] });
  groupId = res.body.id;
});

afterAll(async () => {
  await pool.end();
});

describe('Settlements API', () => {
  test('POST /api/settlements records a settlement', async () => {
    const res = await request(app)
      .post('/api/settlements')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ paid_to: users[0].id, amount: 50, group_id: groupId });

    expect(res.status).toBe(201);
    expect(parseFloat(res.body.amount)).toBe(50);
    expect(res.body.paid_by).toBe(users[1].id);
    expect(res.body.paid_to).toBe(users[0].id);
  });

  test('GET /api/settlements/group/:id lists settlements', async () => {
    await request(app)
      .post('/api/settlements')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ paid_to: users[0].id, amount: 25, group_id: groupId });

    const res = await request(app)
      .get(`/api/settlements/group/${groupId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].paid_by_name).toBe('Bob');
    expect(res.body[0].paid_to_name).toBe('Alice');
  });
});
