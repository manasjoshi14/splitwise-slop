const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// List friends (people you share expenses with) and their balances
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `WITH all_connections AS (
        -- People in same groups
        SELECT DISTINCT gm2.user_id
        FROM group_members gm1
        JOIN group_members gm2 ON gm2.group_id = gm1.group_id AND gm2.user_id != gm1.user_id
        WHERE gm1.user_id = $1
        UNION
        -- People in 1-on-1 expenses
        SELECT DISTINCT es2.user_id
        FROM expense_splits es1
        JOIN expense_splits es2 ON es2.expense_id = es1.expense_id AND es2.user_id != es1.user_id
        WHERE es1.user_id = $1
      )
      SELECT u.id, u.name, u.email, u.avatar_url
      FROM all_connections ac
      JOIN users u ON u.id = ac.user_id
      ORDER BY u.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search users by email (for adding to groups / 1-on-1)
router.get('/search', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json([]);
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, avatar_url FROM users
       WHERE email ILIKE $1 AND id != $2 LIMIT 10`,
      [`%${email}%`, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
