import { useApp } from '../context';
import { useAuth } from '../authContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomeScreen() {
  const { active } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (active) navigate('/meal');
  }, [active, navigate]);

  if (active) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div />
        {user && (
          <div className="flex items-center gap-2.5">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm" referrerPolicy="no-referrer" />
            )}
            <button onClick={logout} className="text-xs text-gray-400 dark:text-gray-500">
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5" style={{ backgroundColor: '#10b981' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">SavorCue</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-center text-sm">
          Mindful meal pacing
        </p>

        <button
          onClick={() => navigate('/pre-meal')}
          style={{ backgroundColor: '#10b981' }}
          className="w-full max-w-sm text-white text-lg font-semibold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-transform mb-4"
        >
          Start Meal
        </button>
      </div>

      {/* Bottom nav */}
      <div className="px-6 pb-8">
        <div className="flex justify-around bg-white dark:bg-gray-800 rounded-2xl shadow-sm py-3">
          {[
            { label: 'Analytics', path: '/analytics', icon: 'M3 3v18h18M7 16l4-8 4 4 4-6' },
            { label: 'History', path: '/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Settings', path: '/settings', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
          ].map(({ label, path, icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 px-4 py-1"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500">
                <path d={icon} />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
