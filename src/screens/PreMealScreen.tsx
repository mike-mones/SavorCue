import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type {
  MealContext,
  MealMode,
  LocationType,
  SocialType,
  MealType,
  HealthyIndulgent,
} from '../types';

function fullnessLabel(v: number): string {
  if (v === 0) return 'Completely empty';
  if (v <= 2) return 'Pretty hungry';
  if (v <= 4) return 'Slightly hungry';
  if (v === 5) return 'Neutral';
  if (v <= 7) return 'Satisfied';
  if (v <= 9) return 'Full';
  return 'Stuffed';
}

function Chips({ label, options, value, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8a8a8a', marginBottom: 10 }}>{label}</p>
      <div className="flex gap-2">
        {options.map((o) => {
          const sel = value === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onChange(sel ? '' : o.key)}
              style={{
                flex: 1,
                padding: '13px 0',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: sel ? '#0d9488' : '#f0eeeb',
                color: sel ? '#fff' : '#5a5a5a',
                transition: 'all 0.15s',
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

export default function PreMealScreen() {
  const { engine } = useApp();
  const navigate = useNavigate();

  const [fullness, setFullness] = useState<number | null>(null);
  const [location, setLocation] = useState<LocationType | ''>('');
  const [social, setSocial] = useState<SocialType | ''>('');
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [healthyIndulgent, setHealthyIndulgent] = useState<HealthyIndulgent | ''>('');
  const [alcohol, setAlcohol] = useState<boolean | null>(null);

  const handleStart = async () => {
    if (fullness === null) return;
    const context: MealContext = {
      location: location || null,
      social: social || null,
      mealType: mealType || null,
      hungerBefore: fullness,
      healthyIndulgent: healthyIndulgent || null,
      alcohol,
    };
    const mode: MealMode = location === 'restaurant' ? 'restaurant' : social === 'with_people' ? 'social' : mealType === 'snack' ? 'snack' : 'quick';
    await engine.startMeal(mode, context);
    navigate('/meal');
  };

  const active = fullness !== null;

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(250,249,247,0.92)', backdropFilter: 'blur(20px)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New meal</h2>
        <button onClick={() => navigate('/')} style={{ fontSize: 14, color: '#b0ada8' }}>Cancel</button>
      </div>

      <div style={{ padding: '0 20px 140px', maxWidth: 480, margin: '0 auto' }}>
        {/* Fullness */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8a8a8a', marginBottom: 16 }}>
            How full are you?
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: active ? '#0d9488' : '#ddd' }}>
              {active ? fullness : '\u2014'}
            </span>
            <span style={{ fontSize: 14, color: '#8a8a8a' }}>
              {active ? fullnessLabel(fullness!) : 'Drag to set'}
            </span>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: '0 0', top: '50%', transform: 'translateY(-50%)',
              height: 6, borderRadius: 999,
              background: active
                ? 'linear-gradient(to right, #0d9488 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)'
                : '#e8e6e3',
            }} />
            <input
              type="range" min={0} max={10} step={1}
              value={fullness ?? 5}
              onChange={(e) => setFullness(Number(e.target.value))}
              style={{ position: 'relative', width: '100%', height: 32, background: 'transparent', zIndex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#b0ada8', marginTop: 6 }}>
            <span>Empty</span><span>Neutral</span><span>Stuffed</span>
          </div>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Chips
            label="What meal?"
            options={[
              { key: 'breakfast', label: 'Breakfast' },
              { key: 'lunch', label: 'Lunch' },
              { key: 'dinner', label: 'Dinner' },
              { key: 'snack', label: 'Snack' },
            ]}
            value={mealType}
            onChange={(v) => setMealType(v as MealType)}
          />
          <Chips
            label="Where?"
            options={[
              { key: 'home', label: 'Home' },
              { key: 'restaurant', label: 'Out' },
              { key: 'other', label: 'Other' },
            ]}
            value={location}
            onChange={(v) => setLocation(v as LocationType)}
          />
          <Chips
            label="With who?"
            options={[
              { key: 'alone', label: 'Solo' },
              { key: 'with_people', label: 'With others' },
            ]}
            value={social}
            onChange={(v) => setSocial(v as SocialType)}
          />
          <Chips
            label="Food vibe"
            options={[
              { key: 'healthy', label: 'Healthy' },
              { key: 'mixed', label: 'Mixed' },
              { key: 'indulgent', label: 'Indulgent' },
            ]}
            value={healthyIndulgent}
            onChange={(v) => setHealthyIndulgent(v as HealthyIndulgent)}
          />
          <Chips
            label="Drinking?"
            options={[
              { key: 'yes', label: 'Yes' },
              { key: 'no', label: 'No' },
            ]}
            value={alcohol === true ? 'yes' : alcohol === false ? 'no' : ''}
            onChange={(v) => setAlcohol(v === 'yes' ? true : v === 'no' ? false : null)}
          />
        </div>
      </div>

      {/* Start */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px', paddingBottom: 28, backgroundColor: 'rgba(250,249,247,0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid #f0eeeb' }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button
            onClick={handleStart}
            disabled={!active}
            style={{
              width: '100%',
              padding: '16px 0',
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 700,
              backgroundColor: active ? '#0d9488' : '#e8e6e3',
              color: active ? '#fff' : '#b0ada8',
              transition: 'all 0.2s',
            }}
          >
            {active ? 'Start Meal' : 'Set fullness to begin'}
          </button>
        </div>
      </div>
    </div>
  );
}
