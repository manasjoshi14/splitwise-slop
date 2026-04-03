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
let groupId;

beforeAll(async () => {
  await setupDatabase();
  app = require('../app');
});

beforeEach(async () => {
  await cleanDatabase();
  users = await seedUsers();
  aliceToken = generateToken(users[0]);

  // Create a group with Alice and Bob
  const res = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({ name: 'Expense Group', member_emails: ['bob@test.com'] });
  groupId = res.body.id;
});

afterAll(async () => {
  await pool.end();
});

describe('Expenses API', () => {
  test('POST /api/expenses creates equal split expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Dinner',
        amount: 100,
        paid_by: users[0].id,
        split_type: 'equal',
      });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Dinner');
    expect(parseFloat(res.body.amount)).toBe(100);
  });

  test('POST /api/expenses creates exact split expense', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Custom split',
        amount: 100,
        paid_by: users[0].id,
        split_type: 'exact',
        splits: [
          { user_id: users[0].id, amount: 30 },
          { user_id: users[1].id, amount: 70 },
        ],
      });

    expect(res.status).toBe(201);
  });

  test('GET /api/expenses/group/:id returns expenses', async () => {
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Lunch',
        amount: 50,
        paid_by: users[0].id,
      });

    const res = await request(app)
      .get(`/api/expenses/group/${groupId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('Lunch');
    expect(res.body[0].splits).toBeDefined();
  });

  test('PUT /api/expenses/:id updates expense', async () => {
    const createRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Old',
        amount: 50,
        paid_by: users[0].id,
      });

    const res = await request(app)
      .put(`/api/expenses/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        description: 'Updated',
        amount: 75,
        paid_by: users[0].id,
        split_type: 'equal',
        splits: [{ user_id: users[0].id }, { user_id: users[1].id }],
      });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Updated');
    expect(parseFloat(res.body.amount)).toBe(75);
  });

  test('PUT /api/expenses/:id returns 404 for non-existent expense', async () => {
    const res = await request(app)
      .put('/api/expenses/99999')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        description: 'X',
        amount: 10,
        paid_by: users[0].id,
      });

    expect(res.status).toBe(404);
  });

  test('DELETE /api/expenses/:id deletes expense', async () => {
    const createRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'To delete',
        amount: 20,
        paid_by: users[0].id,
      });

    const res = await request(app)
      .delete(`/api/expenses/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/expenses/between/:userId returns 1-on-1 expenses', async () => {
    // Create a 1-on-1 expense (no group_id)
    await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        description: 'Coffee',
        amount: 10,
        paid_by: users[0].id,
        splits: [{ user_id: users[0].id }, { user_id: users[1].id }],
      });

    const res = await request(app)
      .get(`/api/expenses/between/${users[1].id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].description).toBe('Coffee');
  });

  test('POST /api/expenses with exact splits and update with exact splits', async () => {
    const createRes = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        group_id: groupId,
        description: 'Exact',
        amount: 100,
        paid_by: users[0].id,
        split_type: 'exact',
        splits: [
          { user_id: users[0].id, amount: 40 },
          { user_id: users[1].id, amount: 60 },
        ],
      });

    const updateRes = await request(app)
      .put(`/api/expenses/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        description: 'Exact Updated',
        amount: 100,
        paid_by: users[0].id,
        split_type: 'exact',
        splits: [
          { user_id: users[0].id, amount: 50 },
          { user_id: users[1].id, amount: 50 },
        ],
      });

    expect(updateRes.status).toBe(200);
  });
});
