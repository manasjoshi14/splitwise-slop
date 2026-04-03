const router = require('express').Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.use(auth);

// Overall balances for current user across everything
router.get('/', async (req, res) => {
  try {
    // Calculate net balances: for each expense, the payer is owed by each split participant
    // Net balance = (what others owe me from my paid expenses) - (what I owe from others' paid expenses)
    const { rows } = await pool.query(
      `WITH debts AS (
        -- Money owed: each split participant owes the payer
        SELECT e.paid_by AS creditor, es.user_id AS debtor, es.amount, e.group_id
        FROM expenses e
        JOIN expense_splits es ON es.expense_id = e.id
        WHERE es.user_id != e.paid_by
      ),
      settlements_net AS (
        SELECT paid_by AS debtor, paid_to AS creditor, amount, group_id
        FROM settlements
      ),
      net AS (
        SELECT creditor, debtor, SUM(amount) as total FROM debts
        WHERE creditor = $1 OR debtor = $1
        GROUP BY creditor, debtor
        UNION ALL
        SELECT creditor, debtor, -SUM(amount) as total FROM settlements_net
        WHERE creditor = $1 OR debtor = $1
        GROUP BY creditor, debtor
      ),
      combined AS (
        SELECT
          CASE WHEN creditor = $1 THEN debtor ELSE creditor END as other_user,
          CASE WHEN creditor = $1 THEN total ELSE -total END as amount
        FROM net
      )
      SELECT c.other_user as user_id, u.name, u.email, u.avatar_url,
        ROUND(SUM(c.amount)::numeric, 2) as balance
      FROM combined c
      JOIN users u ON u.id = c.other_user
      GROUP BY c.other_user, u.name, u.email, u.avatar_url
      HAVING SUM(c.amount) != 0
      ORDER BY SUM(c.amount) DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Balances within a specific group
router.get('/group/:groupId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `WITH debts AS (
        SELECT e.paid_by AS creditor, es.user_id AS debtor, es.amount
        FROM expenses e
        JOIN expense_splits es ON es.expense_id = e.id
        WHERE e.group_id = $1 AND es.user_id != e.paid_by
      ),
      settlements_net AS (
        SELECT paid_by AS debtor, paid_to AS creditor, amount
        FROM settlements WHERE group_id = $1
      ),
      net AS (
        SELECT creditor, debtor, SUM(amount) as total FROM debts GROUP BY creditor, debtor
        UNION ALL
        SELECT creditor, debtor, -SUM(amount) as total FROM settlements_net GROUP BY creditor, debtor
      ),
      combined AS (
        SELECT
          CASE WHEN creditor = $2 THEN debtor ELSE creditor END as other_user,
          CASE WHEN creditor = $2 THEN total ELSE -total END as amount
        FROM net
        WHERE creditor = $2 OR debtor = $2
      )
      SELECT c.other_user as user_id, u.name, u.email, u.avatar_url,
        ROUND(SUM(c.amount)::numeric, 2) as balance
      FROM combined c
      JOIN users u ON u.id = c.other_user
      GROUP BY c.other_user, u.name, u.email, u.avatar_url
      HAVING SUM(c.amount) != 0
      ORDER BY SUM(c.amount) DESC`,
      [req.params.groupId, req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
