import { useState, useEffect } from 'react';
import api from '../api';

export default function Activity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/activity')
      .then(res => setActivity(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Recent Activity</h1>

      {activity.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No activity yet.</p>
      ) : (
        <div className="space-y-2">
          {activity.map((a, i) => (
            <div key={`${a.type}-${a.id}-${i}`} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                  {a.type === 'expense' ? '💰' : '✅'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {a.user_name}{' '}
                    <span className="text-gray-500 font-normal">
                      {a.type === 'expense' ? `added "${a.title}"` : 'settled up'}
                    </span>
                  </p>
                  {a.group_name && (
                    <p className="text-sm text-gray-500">in {a.group_name}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-semibold">${parseFloat(a.amount).toFixed(2)}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
