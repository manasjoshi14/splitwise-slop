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
let token;

beforeAll(async () => {
  await setupDatabase();
  app = require('../app');
});

beforeEach(async () => {
  await cleanDatabase();
  users = await seedUsers();
  token = generateToken(users[0]);
});

afterAll(async () => {
  await pool.end();
});

describe('Auth Middleware', () => {
  test('returns 401 without token', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  test('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });

  test('returns 200 with valid token', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('GET /auth/me', () => {
  test('returns current user', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('alice@test.com');
    expect(res.body.name).toBe('Alice');
  });

  test('returns 401 without token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /health', () => {
  test('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
