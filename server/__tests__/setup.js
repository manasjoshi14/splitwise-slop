const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const TEST_DB_URL = 'postgresql://postgres@localhost:5432/splitwise_test';
const JWT_SECRET = 'test-jwt-secret';

// Set env vars before requiring app
process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = JWT_SECRET;
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const pool = new Pool({ connectionString: TEST_DB_URL });

async function setupDatabase() {
  const schema = fs.readFileSync(
    path.join(__dirname, '../db/migrate.js'),
    'utf8'
  );

  // Run migration SQL directly
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      joined_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(group_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
      description VARCHAR(255) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      paid_by INTEGER REFERENCES users(id) NOT NULL,
      split_type VARCHAR(20) DEFAULT 'equal',
      created_by INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS expense_splits (
      id SERIAL PRIMARY KEY,
      expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL(12,2) NOT NULL,
      UNIQUE(expense_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS settlements (
      id SERIAL PRIMARY KEY,
      group_id INTEGER REFERENCES groups(id),
      paid_by INTEGER REFERENCES users(id) NOT NULL,
      paid_to INTEGER REFERENCES users(id) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function cleanDatabase() {
  await pool.query(`
    DELETE FROM expense_splits;
    DELETE FROM expenses;
    DELETE FROM settlements;
    DELETE FROM group_members;
    DELETE FROM groups;
    DELETE FROM users;
  `);
}

async function seedUsers() {
  const { rows } = await pool.query(`
    INSERT INTO users (google_id, email, name, avatar_url) VALUES
    ('google-1', 'alice@test.com', 'Alice', null),
    ('google-2', 'bob@test.com', 'Bob', null),
    ('google-3', 'charlie@test.com', 'Charlie', null)
    ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING *
  `);
  return rows;
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = {
  pool,
  setupDatabase,
  cleanDatabase,
  seedUsers,
  generateToken,
  JWT_SECRET,
  TEST_DB_URL,
};
