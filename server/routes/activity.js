const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// Recent activity feed
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `(
        SELECT 'expense' as type, e.id, e.description as title, e.amount,
          e.created_at, u.name as user_name, u.avatar_url,
          g.name as group_name, e.group_id
        FROM expenses e
        JOIN users u ON u.id = e.created_by
        LEFT JOIN groups g ON g.id = e.group_id
        WHERE e.group_id IN (SELECT group_id FROM group_members WHERE user_id = $1)
          OR e.id IN (SELECT expense_id FROM expense_splits WHERE user_id = $1)
        ORDER BY e.created_at DESC
        LIMIT 30
      )
      UNION ALL
      (
        SELECT 'settlement' as type, s.id, 'Settlement' as title, s.amount,
          s.created_at, payer.name as user_name, payer.avatar_url,
          g.name as group_name, s.group_id
        FROM settlements s
        JOIN users payer ON payer.id = s.paid_by
        LEFT JOIN groups g ON g.id = s.group_id
        WHERE s.paid_by = $1 OR s.paid_to = $1
        ORDER BY s.created_at DESC
        LIMIT 30
      )
      ORDER BY created_at DESC
      LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
