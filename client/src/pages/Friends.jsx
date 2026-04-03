import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/friends'),
      api.get('/api/balances'),
    ]).then(([friendsRes, balancesRes]) => {
      setFriends(friendsRes.data);
      setBalances(balancesRes.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getBalance = (userId) => {
    const b = balances.find(b => b.user_id === userId);
    return b ? parseFloat(b.balance) : 0;
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>

      {friends.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No friends yet. Add someone to a group or create a 1-on-1 expense!</p>
      ) : (
        <div className="space-y-2">
          {friends.map(f => {
            const balance = getBalance(f.id);
            return (
              <Link
                key={f.id}
                to={`/friends/${f.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm no-underline text-gray-900 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={f.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=random`}
                      alt={f.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-sm text-gray-500">{f.email}</p>
                    </div>
                  </div>
                  {balance !== 0 && (
                    <p className={`text-sm font-medium ${balance > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {balance > 0 ? `owes you $${balance.toFixed(2)}` : `you owe $${Math.abs(balance).toFixed(2)}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
