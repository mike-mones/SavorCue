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
    <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fafafa', padding: '20px 20px 120px', maxWidth: 480, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>History</h2>

      {sessions.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-16">
          No meals tracked yet
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(s.startedAt)}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'ended'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                        : s.status === 'abandoned'
                        ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}
                  >
                    {s.status}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-xs text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200 capitalize">{s.mode}</span>
                <span className="text-gray-500 dark:text-gray-400">{duration(s)}</span>
              </div>
              {s.finalSummary?.finalFullness != null && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Fullness: {s.finalSummary.finalFullness}/10
                  {s.finalSummary.overshot && (
                    <span className="text-orange-500 ml-2">• overshot</span>
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
