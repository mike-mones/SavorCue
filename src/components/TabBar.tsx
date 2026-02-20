import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { key: 'analytics', label: 'Analytics', path: '/analytics', icon: 'M3 3v18h18M7 16l4-8 4 4 4-6' },
  { key: 'history', label: 'History', path: '/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'start', label: 'Start', path: '/pre-meal', icon: '' },
  { key: 'settings', label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

// Paths where the tab bar should be hidden (active meal flow)
const hiddenPaths = ['/meal', '/end-meal', '/summary'];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  const currentPath = location.pathname;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid #1a1a1a',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: 480, margin: '0 auto', padding: '8px 0' }}>
        {tabs.map((tab) => {
          const isStart = tab.key === 'start';
          const isActive = currentPath === tab.path || (tab.path === '/pre-meal' && currentPath === '/');

          if (isStart) {
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                style={{
                  width: 56, height: 56, borderRadius: 28,
                  backgroundColor: '#22c55e', color: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: -20, boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
            );
          }

          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 16px', color: isActive ? '#22c55e' : '#555',
                transition: 'color 0.15s',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
