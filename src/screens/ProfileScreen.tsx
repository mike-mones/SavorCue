import { useAuth } from '../authContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', padding: '24px 20px 120px', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', marginBottom: 24 }}>Profile</h2>

      <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {user?.photoURL && (
          <img src={user.photoURL} alt="" style={{ width: 52, height: 52, borderRadius: 26 }} referrerPolicy="no-referrer" />
        )}
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>{user?.displayName || 'User'}</p>
          <p style={{ fontSize: 13, color: '#8a8a8a' }}>{user?.email}</p>
        </div>
      </div>

      <button
        onClick={logout}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14,
          backgroundColor: '#fff', color: '#e74c3c', fontSize: 15, fontWeight: 600,
          border: '1px solid #f0eeeb',
        }}
      >
        Sign Out
      </button>
    </div>
  );
}
