import { useState } from 'react';
import api from '../api';

export default function SettleUpModal({
  balance,
  groupId,
  onClose,
  onSettled,
}) {
  const [amount, setAmount] = useState(Math.abs(balance.balance).toFixed(2));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/settlements', {
        paid_to: balance.user_id,
        amount: parseFloat(amount),
        group_id: groupId || null,
      });
      onSettled?.();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to settle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Settle Up with {balance.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          You owe {balance.name} ${Math.abs(balance.balance).toFixed(2)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </form>
      </div>
    </div>
  );
}
