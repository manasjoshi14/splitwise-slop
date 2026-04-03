import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AddExpenseModal({
  groupId,
  members,
  friendId,
  onClose,
  onAdded,
}) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.id);
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState([]);
  const [exactAmounts, setExactAmounts] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (members) {
      setParticipants(members.map((m) => m.id));
    } else if (friendId) {
      setParticipants([user.id, friendId]);
    }
  }, [members, friendId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const splits =
        splitType === 'exact'
          ? participants.map((id) => ({
              user_id: id,
              amount: parseFloat(exactAmounts[id] || 0),
            }))
          : participants.map((id) => ({ user_id: id }));

      await api.post('/api/expenses', {
        group_id: groupId || null,
        description,
        amount: parseFloat(amount),
        paid_by: paidBy,
        split_type: splitType,
        splits,
      });
      onAdded?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const availableUsers = members || [
    { id: user.id, name: user.name },
    ...(friendId ? [{ id: friendId, name: 'Friend' }] : []),
  ];

  const toggleParticipant = (id) => {
    setParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Description (e.g. Dinner)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            step="0.01"
            min="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <div>
            <label className="text-sm text-gray-600 block mb-1">Paid by</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.id === user.id ? 'You' : u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Split type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSplitType('equal')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  splitType === 'equal'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Equal
              </button>
              <button
                type="button"
                onClick={() => setSplitType('exact')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                  splitType === 'exact'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Exact amounts
              </button>
            </div>
          </div>

          {members && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">
                Split between
              </label>
              <div className="space-y-2">
                {availableUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={participants.includes(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      className="rounded"
                    />
                    <span className="text-sm flex-1">
                      {u.id === user.id ? 'You' : u.name}
                    </span>
                    {splitType === 'exact' && participants.includes(u.id) && (
                      <input
                        type="number"
                        step="0.01"
                        value={exactAmounts[u.id] || ''}
                        onChange={(e) =>
                          setExactAmounts((prev) => ({
                            ...prev,
                            [u.id]: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {splitType === 'equal' && amount && participants.length > 0 && (
            <p className="text-sm text-gray-500">
              ${(parseFloat(amount) / participants.length).toFixed(2)} per
              person
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}
