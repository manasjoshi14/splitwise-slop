const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// List user's groups with balances
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.created_at,
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create group
router.post('/', async (req, res) => {
  const { name, member_emails } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO groups (name, created_by) VALUES ($1, $2) RETURNING *',
      [name, req.user.id]
    );
    const group = rows[0];

    // Add creator as member
    await client.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
      [group.id, req.user.id]
    );

    // Add other members by email (if they exist)
    if (member_emails?.length) {
      for (const email of member_emails) {
        const userRes = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );
        if (userRes.rows.length) {
          await client.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [group.id, userRes.rows[0].id]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(group);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get group detail with members
router.get('/:id', async (req, res) => {
  try {
    const groupRes = await pool.query('SELECT * FROM groups WHERE id = $1', [
      req.params.id,
    ]);
    if (!groupRes.rows.length)
      return res.status(404).json({ error: 'Group not found' });

    const membersRes = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [req.params.id]
    );

    res.json({ ...groupRes.rows[0], members: membersRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add member to group
router.post('/:id/members', async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    if (!userRes.rows.length)
      return res
        .status(404)
        .json({ error: 'User not found. They need to sign up first.' });

    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, userRes.rows[0].id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove member from group
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
