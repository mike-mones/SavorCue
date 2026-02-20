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

function fullnessColor(v: number): string {
  if (v <= 2) return '#0d9488';
  if (v <= 4) return '#84cc16';
  if (v <= 5) return '#eab308';
  if (v <= 7) return '#f97316';
  return '#ef4444';
}

function fullnessLabel(v: number): string {
  if (v === 0) return 'Empty';
  if (v <= 2) return 'Hungry';
  if (v <= 4) return 'Slightly hungry';
  if (v === 5) return 'Neutral';
  if (v <= 7) return 'Satisfied';
  if (v <= 9) return 'Full';
  return 'Stuffed';
}

export default function ActiveMealScreen() {
  const { engine, active, settings } = useApp();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  const [sliderValue, setSliderValue] = useState(5);
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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

  const handleRate = async () => {
    await engine.rateFullness(sliderValue);
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

  const handleDeleteMeal = async () => {
    if (window.confirm('Delete this meal? This cannot be undone.')) {
      await engine.deleteCurrentMeal();
      navigate('/');
    }
  };

  const color = fullnessColor(sliderValue);

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
        <div>
          <p style={{ fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Elapsed</p>
          <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace', margin: 0 }}>{formatElapsed(session.startedAt)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Fullness</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: lastFullnessRating != null ? fullnessColor(lastFullnessRating) : '#ddd', margin: 0 }}>
            {lastFullnessRating != null ? `${lastFullnessRating}/10` : '—'}
          </p>
        </div>
      </div>

      {/* State badge */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <span style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          backgroundColor: state === 'pause' ? '#fef3c7' : state === 'done_flow' ? '#fee2e2' : '#d1fae5',
          color: state === 'pause' ? '#92400e' : state === 'done_flow' ? '#991b1b' : '#065f46',
        }}>
          {state === 'active_waiting_for_prompt_time' && 'Eating'}
          {state === 'active_waiting_for_fullness_input' && 'Check in'}
          {state === 'active_high_fullness_unlock' && 'Continue?'}
          {state === 'pause' && 'Paused'}
          {state === 'done_flow' && "You're done"}
        </span>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>

        {/* Countdown */}
        {state === 'active_waiting_for_prompt_time' && timer.nextPromptAt && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#8a8a8a', marginBottom: 4 }}>Next check-in</p>
            <p style={{ fontSize: 56, fontWeight: 800, fontFamily: 'monospace', color: '#1a1a1a', margin: 0 }}>
              {formatCountdown(timer.nextPromptAt)}
            </p>
          </div>
        )}

        {/* Fullness slider prompt */}
        {state === 'active_waiting_for_fullness_input' && (
          <div>
            <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 16, textAlign: 'center' }}>
                How full are you right now?
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color }}>{sliderValue}</span>
                <span style={{ fontSize: 14, color: '#8a8a8a' }}>{fullnessLabel(sliderValue)}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: 0, top: '50%', transform: 'translateY(-50%)',
                  height: 6, borderRadius: 999,
                  background: 'linear-gradient(to right, #0d9488 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)',
                }} />
                <input
                  type="range" min={0} max={10} step={1} value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  style={{ position: 'relative', width: '100%', height: 32, background: 'transparent', zIndex: 1, '--thumb-color': color } as React.CSSProperties}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#b0ada8', marginTop: 6 }}>
                <span>Empty</span><span>Neutral</span><span>Stuffed</span>
              </div>
            </div>
            <button
              onClick={handleRate}
              style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 17, fontWeight: 700, backgroundColor: '#0d9488', color: '#fff', marginBottom: 8 }}
            >
              Submit
            </button>
            <button onClick={handleIgnore} style={{ width: '100%', fontSize: 14, color: '#b0ada8', padding: '8px 0' }}>
              Not now
            </button>
          </div>
        )}

        {/* High fullness unlock */}
        {state === 'active_high_fullness_unlock' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Do you want to keep eating?</p>
            <p style={{ fontSize: 14, color: '#8a8a8a', marginBottom: 24 }}>Leftovers are always okay.</p>

            <button
              onClick={() => engine.startPause()}
              style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, fontWeight: 700, backgroundColor: '#0d9488', color: '#fff', marginBottom: 12 }}
            >
              Pause now
            </button>

            {settings.unlockMethod === 'tap' && (
              <button onClick={handleTapUnlock} style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 15, fontWeight: 600, backgroundColor: '#f97316', color: '#fff' }}>
                Continue eating
              </button>
            )}

            {settings.unlockMethod === 'hold' && (
              <button
                onMouseDown={handleHoldStart} onMouseUp={handleHoldEnd} onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart} onTouchEnd={handleHoldEnd}
                style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 15, fontWeight: 600, backgroundColor: '#f97316', color: '#fff', position: 'relative', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', inset: 0, backgroundColor: '#ea580c', width: `${holdProgress * 100}%` }} />
                <span style={{ position: 'relative', zIndex: 1 }}>Hold to continue</span>
              </button>
            )}

            {settings.unlockMethod === 'type_code' && (
              <div>
                <p style={{ fontSize: 13, color: '#8a8a8a', marginBottom: 8 }}>
                  Type <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{settings.unlockCode}</span> to continue
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text" value={unlockInput}
                    onChange={(e) => setUnlockInput(e.target.value)}
                    style={{ flex: 1, padding: '14px', borderRadius: 14, textAlign: 'center', fontSize: 16, fontFamily: 'monospace', textTransform: 'uppercase', border: unlockError ? '2px solid #ef4444' : '2px solid #e8e6e3', outline: 'none', backgroundColor: '#fff' }}
                    placeholder="Type here" autoComplete="off" autoCorrect="off" autoCapitalize="characters"
                  />
                  <button onClick={handleUnlockSubmit} style={{ padding: '14px 24px', borderRadius: 14, fontSize: 15, fontWeight: 700, backgroundColor: '#f97316', color: '#fff' }}>Go</button>
                </div>
                {unlockError && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 6, textAlign: 'center' }}>Try again</p>}
              </div>
            )}
          </div>
        )}

        {/* Pause */}
        {state === 'pause' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Take a breath.</p>
            <p style={{ fontSize: 14, color: '#8a8a8a', marginBottom: 24 }}>Move the plate away if you can.</p>
            {timer.pauseEndsAt && (
              <p style={{ fontSize: 56, fontWeight: 800, fontFamily: 'monospace', color: '#eab308', marginBottom: 24 }}>
                {formatCountdown(timer.pauseEndsAt)}
              </p>
            )}
            <button onClick={() => engine.endPause()} style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, fontWeight: 700, backgroundColor: '#0d9488', color: '#fff', marginBottom: 12 }}>
              Re-check
            </button>
            <button onClick={() => navigate('/end-meal')} style={{ fontSize: 14, color: '#b0ada8' }}>End meal</button>
          </div>
        )}

        {/* Done flow */}
        {state === 'done_flow' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>You're done eating</p>
            <p style={{ fontSize: 14, color: '#8a8a8a', marginBottom: 32 }}>Take a 2-minute pause and move the plate away.</p>
            <button
              onClick={() => engine.startPause()}
              style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 16, fontWeight: 700, backgroundColor: '#0d9488', color: '#fff', marginBottom: 12 }}
            >
              Start 2-minute pause
            </button>
            <button onClick={() => engine.continueFromDone()} style={{ fontSize: 14, color: '#b0ada8' }}>I want to continue</button>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={{ padding: '16px 20px 28px', display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button onClick={() => navigate('/end-meal')} style={{ padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, backgroundColor: '#f0eeeb', color: '#5a5a5a' }}>
          End meal
        </button>
        <button onClick={handleDeleteMeal} style={{ padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, backgroundColor: '#fee2e2', color: '#dc2626' }}>
          Delete meal
        </button>
      </div>
    </div>
  );
}
