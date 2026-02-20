import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSessions } from '../db';
import type { MealSession } from '../types';

export default function SummaryScreen() {
  const navigate = useNavigate();
  const [session, setSession] = useState<MealSession | null>(null);

  useEffect(() => {
    (async () => {
      const sessions = await getAllSessions();
      const latest = sessions.find((s) => s.status === 'ended');
      if (latest) setSession(latest);
    })();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-gray-500 dark:text-gray-400">No meal data found.</p>
      </div>
    );
  }

  const duration = session.endedAt
    ? Math.round((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)
    : 0;

  const summary = session.finalSummary;

  return (
    <div className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        Meal Summary
      </h2>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm space-y-4 mb-8">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Duration</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">{duration} min</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Mode</span>
          <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">{session.mode}</span>
        </div>
        {summary?.finalFullness != null && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Final fullness</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{summary.finalFullness}/10</span>
          </div>
        )}
        {summary?.overshot != null && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Overshot?</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{summary.overshot ? 'Yes' : 'No'}</span>
          </div>
        )}
        {summary?.discomfort != null && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Discomfort</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100">{summary.discomfort}/10</span>
          </div>
        )}
        {summary?.amountLeft && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Left on plate</span>
            <span className="font-semibold text-gray-800 dark:text-gray-100 capitalize">
              {summary.amountLeft.replace(/_/g, ' ')}
            </span>
          </div>
        )}
        {summary?.note && (
          <div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">Note</span>
            <p className="text-gray-800 dark:text-gray-100 mt-1">{summary.note}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/')}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold py-4 rounded-xl active:scale-95 transition-transform"
      >
        Done
      </button>
    </div>
  );
}
