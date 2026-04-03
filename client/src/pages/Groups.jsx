import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchGroups = () => {
    api
      .get('/api/groups')
      .then((res) => setGroups(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/groups', { name });
      setName('');
      setShowCreate(false);
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create group');
    }
  };

  if (loading)
    return <div className="p-4 text-center text-gray-500">Loading...</div>;

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm bg-teal-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          Create group
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={createGroup}
          className="bg-white rounded-xl p-4 shadow-sm mb-4 flex gap-2"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            required
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="bg-teal-600 text-white px-4 py-2 rounded-lg"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="text-gray-500 px-2"
          >
            Cancel
          </button>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No groups yet. Create one to get started!
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}`}
              className="block bg-white rounded-xl p-4 shadow-sm no-underline text-gray-900 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{g.name}</p>
                  <p className="text-sm text-gray-500">
                    {g.member_count} members
                  </p>
                </div>
                <span className="text-gray-400">&rsaquo;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
