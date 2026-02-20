import { useApp } from '../context';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function HomeScreen() {
  const { active } = useApp();
  const navigate = useNavigate();

  // If there's an active session, go to it
  useEffect(() => {
    if (active) {
      navigate('/meal');
    }
  }, [active, navigate]);

  if (active) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8">
      <h1 className="text-4xl font-bold mb-2 text-emerald-600 dark:text-emerald-400">
        SavorCue
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-10 text-center">
        Mindful meal pacing, no guilt
      </p>

      <button
        onClick={() => navigate('/pre-meal')}
        className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-semibold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-transform mb-8"
      >
        Start Meal
      </button>

      <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
        <button onClick={() => navigate('/analytics')} className="underline">Analytics</button>
        <button onClick={() => navigate('/history')} className="underline">History</button>
        <button onClick={() => navigate('/settings')} className="underline">Settings</button>
      </div>
    </div>
  );
}
