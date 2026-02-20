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
    <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fafafa', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user.photoURL && (
              <img src={user.photoURL} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} referrerPolicy="no-referrer" />
            )}
            <button onClick={logout} style={{ fontSize: 12, color: '#555' }}>Sign out</button>
          </div>
        )}
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px 40px' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>SavorCue</h1>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 40 }}>Mindful meal pacing</p>

        <button
          onClick={() => navigate('/pre-meal')}
          style={{ width: '100%', maxWidth: 360, padding: '18px 0', borderRadius: 16, fontSize: 17, fontWeight: 700, backgroundColor: '#22c55e', color: '#000' }}
        >
          Start Meal
        </button>
      </div>

      {/* Nav */}
      <div style={{ padding: '0 20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#1a1a1a', borderRadius: 16, padding: '14px 0' }}>
          {[
            { label: 'Analytics', path: '/analytics' },
            { label: 'History', path: '/history' },
            { label: 'Settings', path: '/settings' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{ fontSize: 13, color: '#777', fontWeight: 500 }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
