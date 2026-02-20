import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';

function formatElapsed(startIso: string): string {
  const sec = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCountdown(targetIso: string): string {
  const sec = Math.max(0, Math.ceil((new Date(targetIso).getTime() - Date.now()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ActiveMealScreen() {
  const { engine, active, settings } = useApp();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);

  // Force re-render every second for timers
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Redirect if no active session (unless admin testing)
  useEffect(() => {
    if (!active) {
      try { if (localStorage.getItem('savorcue_admin') === '1') return; } catch {}
      navigate('/');
    }
  }, [active, navigate]);

  if (!active) {
    try { if (localStorage.getItem('savorcue_admin') === '1') return <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', padding: 40, textAlign: 'center', color: '#8a8a8a' }}>No active session (admin preview)</div>; } catch {}
    return null;
  }

  const { session, state, timer, lastFullnessRating } = active;

  const handleRate = async (rating: number) => {
    await engine.rateFullness(rating);
  };

  const handleIgnore = async () => {
    await engine.handleIgnoredPrompt();
  };

  const handleUnlockSubmit = async () => {
    const success = await engine.attemptUnlock(unlockInput);
    if (!success) {
      setUnlockError(true);
      setUnlockInput('');
      setTimeout(() => setUnlockError(false), 2000);
    }
  };

  const handleTapUnlock = async () => {
    await engine.attemptUnlock();
  };

  const handleHoldStart = () => {
    setHoldProgress(0);
    const start = Date.now();
    holdTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / 2000, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        engine.attemptUnlock();
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const handlePause = async () => {
    await engine.startPause();
  };

  const handleEndMeal = () => {
    navigate('/end-meal');
  };

  const handleContinueFromDone = async () => {
    await engine.continueFromDone();
  };

  const handleDeleteMeal = async () => {
    if (window.confirm('Delete this meal? This cannot be undone.')) {
      await engine.deleteCurrentMeal();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen px-6 py-6 max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Elapsed</span>
          <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-100">
            {formatElapsed(session.startedAt)}
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-500 dark:text-gray-400">Fullness</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {lastFullnessRating != null ? `${lastFullnessRating}/10` : '—'}
          </p>
        </div>
      </div>

      {/* State indicator */}
      <div className="mb-4 text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
          state === 'pause'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : state === 'done_flow'
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
        }`}>
          {state === 'active_waiting_for_prompt_time' && 'Eating'}
          {state === 'active_waiting_for_fullness_input' && 'Check in'}
          {state === 'active_high_fullness_unlock' && 'Continue?'}
          {state === 'pause' && 'Paused'}
          {state === 'done_flow' && "You're done"}
        </span>
      </div>

      {/* Countdown to next prompt */}
      {state === 'active_waiting_for_prompt_time' && timer.nextPromptAt && (
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next check-in</p>
          <p className="text-4xl font-mono font-bold text-gray-800 dark:text-gray-100">
            {formatCountdown(timer.nextPromptAt)}
          </p>
        </div>
      )}

      {/* Fullness input prompt */}
      {state === 'active_waiting_for_fullness_input' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-6 text-center">
            How full are you right now?
          </p>
          <div className="grid grid-cols-4 gap-3 w-full max-w-xs mb-6">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => handleRate(i)}
                className={`py-3 rounded-xl text-lg font-bold active:scale-95 transition-transform ${
                  i <= 3
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : i <= 6
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : i <= 8
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <button onClick={handleIgnore} className="text-sm text-gray-400 underline">
            Not now
          </button>
        </div>
      )}

      {/* High fullness unlock */}
      {state === 'active_high_fullness_unlock' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-2 text-center">
            Do you want to keep eating?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
            Leftovers are always okay.
          </p>

          <button
            onClick={handlePause}
            className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold py-4 rounded-xl mb-3 active:scale-95 transition-transform"
          >
            Pause now
          </button>

          {/* Unlock methods */}
          {settings.unlockMethod === 'tap' && (
            <button
              onClick={handleTapUnlock}
              className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 text-white text-lg py-3 rounded-xl active:scale-95 transition-transform"
            >
              Continue eating
            </button>
          )}

          {settings.unlockMethod === 'hold' && (
            <button
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
              className="w-full max-w-xs bg-orange-500 text-white text-lg py-3 rounded-xl relative overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-orange-700 transition-none"
                style={{ width: `${holdProgress * 100}%` }}
              />
              <span className="relative z-10">Hold to continue</span>
            </button>
          )}

          {settings.unlockMethod === 'type_code' && (
            <div className="w-full max-w-xs">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center">
                Type <span className="font-mono font-bold">{settings.unlockCode}</span> to continue
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={unlockInput}
                  onChange={(e) => setUnlockInput(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 text-center text-lg font-mono uppercase bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ${
                    unlockError
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-orange-500'
                  } outline-none`}
                  placeholder="Type here"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                />
                <button
                  onClick={handleUnlockSubmit}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  Go
                </button>
              </div>
              {unlockError && (
                <p className="text-red-500 text-sm mt-1 text-center">Try again</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pause screen */}
      {state === 'pause' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-2 text-center">
            Take a breath.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
            Move the plate away if you can.
          </p>
          {timer.pauseEndsAt && (
            <p className="text-4xl font-mono font-bold text-yellow-600 dark:text-yellow-400 mb-6">
              {formatCountdown(timer.pauseEndsAt)}
            </p>
          )}
          <button
            onClick={() => engine.endPause()}
            className="w-full max-w-xs bg-emerald-600 text-white text-lg py-3 rounded-xl mb-3 active:scale-95 transition-transform"
          >
            Re-check
          </button>
          <button
            onClick={handleEndMeal}
            className="text-sm text-gray-500 dark:text-gray-400 underline"
          >
            End meal
          </button>
        </div>
      )}

      {/* Done flow */}
      {state === 'done_flow' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
            You're done eating
          </p>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
            Take a 2-minute pause and move the plate away.
          </p>
          <button
            onClick={handlePause}
            className="w-full max-w-xs bg-emerald-600 text-white text-lg font-semibold py-4 rounded-xl mb-3 active:scale-95 transition-transform"
          >
            Start 2-minute pause
          </button>
          <button
            onClick={handleContinueFromDone}
            className="text-sm text-gray-500 dark:text-gray-400 underline"
          >
            I want to continue
          </button>
        </div>
      )}

      {/* Bottom bar */}
      <div className="mt-auto pt-6 flex justify-center gap-3">
        <button
          onClick={handleEndMeal}
          className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl text-sm font-medium"
        >
          End meal
        </button>
        <button
          onClick={handleDeleteMeal}
          className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-6 py-3 rounded-xl text-sm font-medium"
        >
          Delete meal
        </button>
      </div>
    </div>
  );
}
