const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// Record a settlement
router.post('/', async (req, res) => {
  const { paid_to, amount, group_id } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO settlements (group_id, paid_by, paid_to, amount)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [group_id || null, req.user.id, paid_to, amount]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get settlements in a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, payer.name as paid_by_name, payee.name as paid_to_name
       FROM settlements s
       JOIN users payer ON payer.id = s.paid_by
       JOIN users payee ON payee.id = s.paid_to
       WHERE s.group_id = $1
       ORDER BY s.created_at DESC`,
      [req.params.groupId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
