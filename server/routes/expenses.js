const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// Get expenses for a group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, u.name as paid_by_name, u.avatar_url as paid_by_avatar,
        json_agg(json_build_object('user_id', es.user_id, 'amount', es.amount, 'name', su.name)) as splits
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       JOIN expense_splits es ON es.expense_id = e.id
       JOIN users su ON su.id = es.user_id
       WHERE e.group_id = $1
       GROUP BY e.id, u.name, u.avatar_url
       ORDER BY e.created_at DESC`,
      [req.params.groupId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get expenses between two users (1-on-1)
router.get('/between/:userId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, u.name as paid_by_name,
        json_agg(json_build_object('user_id', es.user_id, 'amount', es.amount, 'name', su.name)) as splits
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       JOIN expense_splits es ON es.expense_id = e.id
       JOIN users su ON su.id = es.user_id
       WHERE e.group_id IS NULL
         AND e.id IN (
           SELECT expense_id FROM expense_splits WHERE user_id = $1
           INTERSECT
           SELECT expense_id FROM expense_splits WHERE user_id = $2
         )
       GROUP BY e.id, u.name
       ORDER BY e.created_at DESC`,
      [req.user.id, req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create expense
router.post('/', async (req, res) => {
  const {
    group_id,
    description,
    amount,
    currency,
    paid_by,
    split_type,
    splits,
  } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO expenses (group_id, description, amount, currency, paid_by, split_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        group_id || null,
        description,
        amount,
        currency || 'USD',
        paid_by,
        split_type || 'equal',
        req.user.id,
      ]
    );
    const expense = rows[0];

    // Insert splits
    if (split_type === 'exact' && splits) {
      for (const s of splits) {
        await client.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [expense.id, s.user_id, s.amount]
        );
      }
    } else {
      // Equal split - get participants
      let participants;
      if (splits && splits.length) {
        participants = splits.map((s) => s.user_id);
      } else if (group_id) {
        const memberRes = await client.query(
          'SELECT user_id FROM group_members WHERE group_id = $1',
          [group_id]
        );
        participants = memberRes.rows.map((r) => r.user_id);
      } else {
        participants = [req.user.id, paid_by].filter(
          (v, i, a) => a.indexOf(v) === i
        );
      }

      const splitAmount =
        Math.round((amount / participants.length) * 100) / 100;
      for (const userId of participants) {
        await client.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [expense.id, userId, splitAmount]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(expense);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Update expense
router.put('/:id', async (req, res) => {
  const { description, amount, currency, paid_by, split_type, splits } =
    req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE expenses SET description = $1, amount = $2, currency = COALESCE($3, currency),
       paid_by = $4, split_type = $5 WHERE id = $6 RETURNING *`,
      [
        description,
        amount,
        currency,
        paid_by,
        split_type || 'equal',
        req.params.id,
      ]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Delete old splits and re-insert
    await client.query('DELETE FROM expense_splits WHERE expense_id = $1', [
      req.params.id,
    ]);

    if (split_type === 'exact' && splits) {
      for (const s of splits) {
        await client.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [req.params.id, s.user_id, s.amount]
        );
      }
    } else if (splits) {
      const participants = splits.map((s) => s.user_id);
      const splitAmount =
        Math.round((amount / participants.length) * 100) / 100;
      for (const userId of participants) {
        await client.query(
          'INSERT INTO expense_splits (expense_id, user_id, amount) VALUES ($1, $2, $3)',
          [req.params.id, userId, splitAmount]
        );
      }
    }

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
