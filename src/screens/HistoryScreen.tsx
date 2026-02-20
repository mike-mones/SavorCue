import { useEffect, useState } from 'react';
import { getAllSessions, deleteSession } from '../db';
import type { MealSession } from '../types';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<MealSession[]>([]);

  useEffect(() => {
    getAllSessions().then(setSessions);
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const duration = (s: MealSession) => {
    if (!s.endedAt) return '—';
    const min = Math.round(
      (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000,
    );
    return `${min} min`;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this meal? This cannot be undone.')) {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a', padding: '24px 20px 120px', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>History</h2>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontSize: 16, color: '#8a8a8a' }}>No meals tracked yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((s) => (
            <div key={s.id} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#8a8a8a' }}>{formatDate(s.startedAt)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
                    backgroundColor: s.status === 'ended' ? '#e6f7f2' : '#f0eeeb',
                    color: s.status === 'ended' ? '#0d7377' : '#8a8a8a',
                  }}>
                    {s.status}
                  </span>
                  <button onClick={() => handleDelete(s.id)} style={{ fontSize: 12, color: '#d4756b' }}>
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.mode}</span>
                <span style={{ color: '#8a8a8a' }}>{duration(s)}</span>
              </div>
              {s.finalSummary?.finalFullness != null && (
                <div style={{ fontSize: 13, color: '#8a8a8a', marginTop: 4 }}>
                  Fullness: {s.finalSummary.finalFullness}/10
                  {s.finalSummary.overshot && (
                    <span style={{ color: '#e6813e', marginLeft: 8 }}>overshot</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
