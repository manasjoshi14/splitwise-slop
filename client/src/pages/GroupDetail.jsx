import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import AddExpenseModal from '../components/AddExpenseModal';
import SettleUpModal from '../components/SettleUpModal';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [tab, setTab] = useState('expenses');

  const fetchAll = () => {
    api.get(`/api/groups/${id}`).then(res => setGroup(res.data));
    api.get(`/api/expenses/group/${id}`).then(res => setExpenses(res.data));
    api.get(`/api/balances/group/${id}`).then(res => setBalances(res.data));
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/groups/${id}/members`, { email: addMemberEmail });
      setAddMemberEmail('');
      setShowAddMember(false);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add member');
    }
  };

  if (!group) return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-1">{group.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{group.members?.length} members</p>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
        {['expenses', 'balances', 'members'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium capitalize ${
              tab === t ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'expenses' && (
        <>
          <button
            onClick={() => setShowAddExpense(true)}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium mb-4"
          >
            + Add Expense
          </button>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No expenses yet.</p>
          ) : (
            <div className="space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-sm text-gray-500">
                        {e.paid_by_name} paid ${parseFloat(e.amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${parseFloat(e.amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(e.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'balances' && (
        <div className="space-y-2">
          {balances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All settled up!</p>
          ) : (
            balances.map(b => (
              <div key={b.user_id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={b.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=random`}
                    alt={b.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className={`text-sm ${parseFloat(b.balance) > 0 ? 'text-green-600' : 'text-orange-600'}`}>
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
            ))
          )}
        </div>
      )}

      {tab === 'members' && (
        <>
          <button
            onClick={() => setShowAddMember(true)}
            className="w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg mb-4"
          >
            + Add Member
          </button>
          {showAddMember && (
            <form onSubmit={handleAddMember} className="bg-white rounded-xl p-4 shadow-sm mb-4 flex gap-2">
              <input
                type="email"
                value={addMemberEmail}
                onChange={e => setAddMemberEmail(e.target.value)}
                placeholder="Email address"
                required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
              />
              <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg">Add</button>
            </form>
          )}
          <div className="space-y-2">
            {group.members?.map(m => (
              <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                <img
                  src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`}
                  alt={m.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddExpense && (
        <AddExpenseModal
          groupId={parseInt(id)}
          members={group.members}
          onClose={() => setShowAddExpense(false)}
          onAdded={fetchAll}
        />
      )}

      {settleTarget && (
        <SettleUpModal
          balance={settleTarget}
          groupId={parseInt(id)}
          onClose={() => setSettleTarget(null)}
          onSettled={fetchAll}
        />
      )}
    </div>
  );
}
