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

  // Create group so Alice and Bob are connected
  await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${aliceToken}`)
    .send({ name: 'Friend Group', member_emails: ['bob@test.com'] });
});

afterAll(async () => {
  await pool.end();
});

describe('Friends API', () => {
  test('GET /api/friends lists friends', async () => {
    const res = await request(app)
      .get('/api/friends')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.find((f) => f.email === 'bob@test.com')).toBeDefined();
  });

  test('GET /api/friends/search finds users by email', async () => {
    const res = await request(app)
      .get('/api/friends/search?email=bob')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe('bob@test.com');
  });

  test('GET /api/friends/search returns empty without query', async () => {
    const res = await request(app)
      .get('/api/friends/search')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});
