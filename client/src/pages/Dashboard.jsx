import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import SettleUpModal from '../components/SettleUpModal';

export default function Dashboard() {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [settleTarget, setSettleTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalances = () => {
    api
      .get('/api/balances')
      .then((res) => setBalances(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const totalOwed = balances
    .filter((b) => b.balance > 0)
    .reduce((s, b) => s + parseFloat(b.balance), 0);
  const totalOwe = balances
    .filter((b) => b.balance < 0)
    .reduce((s, b) => s + Math.abs(parseFloat(b.balance)), 0);

  if (loading)
    return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-1">
        Hi, {user?.name?.split(' ')[0]}
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">You are owed</p>
          <p className="text-2xl font-bold text-green-600">
            ${totalOwed.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500 uppercase">You owe</p>
          <p className="text-2xl font-bold text-orange-600">
            ${totalOwe.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Balances list */}
      <h2 className="text-lg font-semibold mb-3">Balances</h2>
      {balances.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No balances yet. Add an expense to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {balances.map((b) => (
            <div
              key={b.user_id}
              className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    b.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random`
                  }
                  alt={b.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p
                    className={`text-sm ${parseFloat(b.balance) > 0 ? 'text-green-600' : 'text-orange-600'}`}
                  >
                    {parseFloat(b.balance) > 0
                      ? `owes you $${parseFloat(b.balance).toFixed(2)}`
                      : `you owe $${Math.abs(parseFloat(b.balance)).toFixed(2)}`}
                  </p>
                </div>
              </div>
              {parseFloat(b.balance) < 0 && (
                <button
                  onClick={() => setSettleTarget(b)}
                  className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg"
                >
                  Settle
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {settleTarget && (
        <SettleUpModal
          balance={settleTarget}
          onClose={() => setSettleTarget(null)}
          onSettled={fetchBalances}
        />
      )}
    </div>
  );
}
