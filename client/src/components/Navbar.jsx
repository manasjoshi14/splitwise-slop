import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const tabs = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/groups', label: 'Groups', icon: '👥' },
  { path: '/friends', label: 'Friends', icon: '🤝' },
  { path: '/activity', label: 'Activity', icon: '📋' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-teal-600 no-underline">
          SplitSlop
        </Link>
        {user && (
          <div className="flex items-center gap-3">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          {tabs.map(tab => (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center py-2 px-3 text-xs no-underline ${
                location.pathname === tab.path
                  ? 'text-teal-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
