import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { key: 'analytics', label: 'Insights', path: '/analytics', icon: 'M3 3v18h18M7 16l4-8 4 4 4-6' },
  { key: 'history', label: 'History', path: '/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'start', label: 'Start', path: '/pre-meal', icon: '' },
  { key: 'settings', label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'profile', label: 'Profile', path: '/profile', icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 3a4 4 0 100 8 4 4 0 000-8z' },
];

const hiddenPaths = ['/meal', '/end-meal', '/summary'];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  const current = location.pathname;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: '#fff',
      boxShadow: '0 -1px 12px rgba(0,0,0,0.06)',
      paddingBottom: 'env(safe-area-inset-bottom, 6px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', maxWidth: 480, margin: '0 auto', padding: '6px 0 4px' }}>
        {tabs.map((tab) => {
          const isStart = tab.key === 'start';
          const isActive = current === tab.path;

          if (isStart) {
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: '#0d9488', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -14,
                  boxShadow: '0 4px 14px rgba(13,148,136,0.35)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="6 3 20 12 6 21"/>
                </svg>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                padding: '4px 10px',
                color: isActive ? '#0d9488' : '#b0ada8',
                transition: 'color 0.15s',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
