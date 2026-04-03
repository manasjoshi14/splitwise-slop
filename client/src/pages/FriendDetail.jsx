import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';

export default function FriendDetail() {
  const { id } = useParams();
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(() => {
    Promise.all([
      api.get(`/api/expenses/between/${id}`),
      api.get('/api/balances'),
    ])
      .then(([expRes, balRes]) => {
        setExpenses(expRes.data);
        setBalances(balRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const friendBalance = balances.find((b) => b.user_id === parseInt(id));

  if (loading)
    return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 pb-20">
      {friendBalance && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={
                friendBalance.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(friendBalance.name)}&background=random`
              }
              alt={friendBalance.name}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-xl font-bold">{friendBalance.name}</h1>
              <p
                className={`text-sm ${parseFloat(friendBalance.balance) > 0 ? 'text-green-600' : 'text-orange-600'}`}
              >
                {parseFloat(friendBalance.balance) > 0
                  ? `owes you $${parseFloat(friendBalance.balance).toFixed(2)}`
                  : `you owe $${Math.abs(parseFloat(friendBalance.balance)).toFixed(2)}`}
              </p>
            </div>
          </div>
          {parseFloat(friendBalance.balance) < 0 && (
            <button
              onClick={() => setSettleTarget(friendBalance)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Settle Up
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setShowAddExpense(true)}
        className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium mb-4"
      >
        + Add Expense
      </button>

      <h2 className="text-lg font-semibold mb-3">Expenses</h2>
      {expenses.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No expenses yet.</p>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{e.description}</p>
                  <p className="text-sm text-gray-500">{e.paid_by_name} paid</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${parseFloat(e.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal
          friendId={parseInt(id)}
          onClose={() => setShowAddExpense(false)}
          onAdded={fetchAll}
        />
      )}

      {settleTarget && (
        <SettleUpModal
          balance={settleTarget}
          onClose={() => setSettleTarget(null)}
          onSettled={fetchAll}
        />
      )}
    </div>
  );
}
