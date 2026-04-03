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
    .send({ name: 'Balance Group', member_emails: ['bob@test.com'] });
  groupId = res.body.id;
});

afterAll(async () => {
  await pool.end();
});

describe('Balances API', () => {
  test('GET /api/balances returns empty when no expenses', async () => {
    const res = await request(app)
      .get('/api/balances')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  test('GET /api/balances shows correct debt after expense', async () => {
    // Alice pays $100, split equally between Alice and Bob
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Dinner',
        amount: 100,
        paid_by: users[0].id,
        split_type: 'equal',
      });

    const res = await request(app)
      .get('/api/balances')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    // Bob owes Alice $50
    expect(res.body[0].user_id).toBe(users[1].id);
    expect(parseFloat(res.body[0].balance)).toBe(50);
  });

  test('GET /api/balances/group/:id shows group balances', async () => {
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Groceries',
        amount: 60,
        paid_by: users[0].id,
      });

    const res = await request(app)
      .get(`/api/balances/group/${groupId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(parseFloat(res.body[0].balance)).toBe(30);
  });

  test('balances update after settlement', async () => {
    // Alice pays $100 split equally → Bob owes $50
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Big dinner',
        amount: 100,
        paid_by: users[0].id,
      });

    // Bob settles $30
    await request(app)
      .post('/api/settlements')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ paid_to: users[0].id, amount: 30, group_id: groupId });

    const res = await request(app)
      .get('/api/balances')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    // Bob should now owe $20
    expect(parseFloat(res.body[0].balance)).toBe(20);
  });
});
