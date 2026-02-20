import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type { AmountLeft, FinalSummary } from '../types';

function SliderCard({ label, value, onChange, leftLabel, rightLabel, color }: {
  label: string; value: number; onChange: (v: number) => void;
  leftLabel: string; rightLabel: string; color: string;
}) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{label}</p>
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, top: '50%', transform: 'translateY(-50%)', height: 6, borderRadius: 999, background: '#e8e6e3' }} />
        <input
          type="range" min={0} max={10} step={1} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ position: 'relative', width: '100%', height: 32, background: 'transparent', zIndex: 1, '--thumb-color': color } as React.CSSProperties}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#b0ada8', marginTop: 4 }}>
        <span>{leftLabel}</span><span>{rightLabel}</span>
      </div>
    </div>
  );
}

function Chips({ label, options, value, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 12 }}>{label}</p>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((o) => {
          const sel = value === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onChange(sel ? '' : o.key)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 600,
                backgroundColor: sel ? '#0d9488' : '#f0eeeb',
                color: sel ? '#fff' : '#5a5a5a',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function feelingColor(v: number): string {
  if (v <= 2) return '#ef4444';
  if (v <= 4) return '#f97316';
  if (v <= 6) return '#eab308';
  if (v <= 8) return '#84cc16';
  return '#0d9488';
}

function fullnessColor(v: number): string {
  if (v <= 3) return '#0d9488';
  if (v <= 6) return '#eab308';
  return '#ef4444';
}

export default function EndMealScreen() {
  const { engine, active } = useApp();
  const navigate = useNavigate();

  const [finalFullness, setFinalFullness] = useState<number>(active?.lastFullnessRating ?? 5);
  const [feelingAfter, setFeelingAfter] = useState<number>(5);
  const [overshot, setOvershot] = useState<boolean | null>(null);
  const [discomfort, setDiscomfort] = useState<number>(0);
  const [amountLeft, setAmountLeft] = useState<AmountLeft | ''>('');
  const [note, setNote] = useState('');

  if (!active) {
    try {
      if (localStorage.getItem('savorcue_admin') === '1') {
        return <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', padding: 40, textAlign: 'center', color: '#8a8a8a' }}>No active session (admin preview)</div>;
      }
    } catch {}
    navigate('/');
    return null;
  }

  const handleSubmit = async () => {
    const summary: FinalSummary = {
      finalFullness,
      feelingAfter,
      overshot,
      discomfort,
      amountLeft: amountLeft || null,
      note: note || null,
    };
    await engine.endMeal(summary);
    navigate('/summary');
  };

  const handleSkip = async () => {
    await engine.endMeal();
    navigate('/analytics');
  };

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(250,249,247,0.92)', backdropFilter: 'blur(20px)', padding: '16px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>How was your meal?</h2>
      </div>

      <div style={{ padding: '0 20px 100px', maxWidth: 480, margin: '0 auto' }}>
        <SliderCard
          label="Final fullness"
          value={finalFullness}
          onChange={setFinalFullness}
          leftLabel="Empty"
          rightLabel="Stuffed"
          color={fullnessColor(finalFullness)}
        />

        <SliderCard
          label="How do you feel?"
          value={feelingAfter}
          onChange={setFeelingAfter}
          leftLabel="Terrible"
          rightLabel="Great"
          color={feelingColor(feelingAfter)}
        />

        <SliderCard
          label="Discomfort"
          value={discomfort}
          onChange={setDiscomfort}
          leftLabel="None"
          rightLabel="Severe"
          color={discomfort <= 3 ? '#0d9488' : discomfort <= 6 ? '#eab308' : '#ef4444'}
        />

        <Chips
          label="Did you eat more than you wanted?"
          options={[{ key: 'yes', label: 'Yes' }, { key: 'no', label: 'No' }]}
          value={overshot === true ? 'yes' : overshot === false ? 'no' : ''}
          onChange={(v) => setOvershot(v === 'yes' ? true : v === 'no' ? false : null)}
        />

        <Chips
          label="Amount left on the plate"
          options={[
            { key: 'none', label: 'Nothing' },
            { key: 'few_bites', label: 'Few bites' },
            { key: '25_percent', label: '~25%' },
            { key: '50_percent_plus', label: '50%+' },
          ]}
          value={amountLeft}
          onChange={(v) => setAmountLeft(v as AmountLeft)}
        />

        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Notes (optional)</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid #e8e6e3', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 60, backgroundColor: '#faf9f7' }}
            placeholder="Any thoughts about this meal?"
          />
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 20px 28px', backgroundColor: 'rgba(250,249,247,0.92)', backdropFilter: 'blur(20px)' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', gap: 10 }}>
          <button
            onClick={handleSubmit}
            style={{ flex: 1, padding: '15px 0', borderRadius: 14, fontSize: 16, fontWeight: 700, backgroundColor: '#0d9488', color: '#fff' }}
          >
            Save & Finish
          </button>
          <button
            onClick={handleSkip}
            style={{ padding: '15px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600, backgroundColor: '#f0eeeb', color: '#8a8a8a' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
