import { useState, useRef } from 'react';
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

function fullnessColor(v: number): string {
  if (v <= 2) return '#0d9488';
  if (v <= 4) return '#84cc16';
  if (v <= 5) return '#eab308';
  if (v <= 7) return '#f97316';
  return '#ef4444';
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
      <div style={{ display: 'flex', gap: 8 }}>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullness, setFullness] = useState<number | null>(null);
  const [location, setLocation] = useState<LocationType | ''>('');
  const [mealSource, setMealSource] = useState<'homecooked' | 'takeout' | ''>('');
  const [social, setSocial] = useState<SocialType | ''>('');
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [healthyIndulgent, setHealthyIndulgent] = useState<HealthyIndulgent | ''>('');
  const [alcohol, setAlcohol] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleStart = async () => {
    if (fullness === null) return;
    const context: MealContext = {
      location: location || null,
      social: social || null,
      mealType: mealType || null,
      mealSource: mealSource || null,
      hungerBefore: fullness,
      healthyIndulgent: healthyIndulgent || null,
      alcohol,
      photoBlob: photo,
    };
    const mode: MealMode = location === 'restaurant' ? 'restaurant' : social === 'with_people' ? 'social' : mealType === 'snack' ? 'snack' : 'quick';
    await engine.startMeal(mode, context);
    navigate('/meal');
  };

  const active = fullness !== null;
  const numColor = active ? fullnessColor(fullness!) : '#ddd';

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(250,249,247,0.92)', backdropFilter: 'blur(20px)', padding: '16px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>New meal</h2>
      </div>

      <div style={{ padding: '0 20px 140px', maxWidth: 480, margin: '0 auto' }}>
        {/* Fullness */}
        <div style={{ backgroundColor: '#fff', borderRadius: 20, padding: '24px', marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8a8a8a', marginBottom: 16 }}>
            How full are you?
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: numColor }}>
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
              style={{ position: 'relative', width: '100%', height: 32, background: 'transparent', zIndex: 1, '--thumb-color': numColor } as React.CSSProperties}
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
              { key: 'restaurant', label: 'Restaurant' },
              { key: 'other', label: 'Other' },
            ]}
            value={location}
            onChange={(v) => { setLocation(v as LocationType); if (v !== 'home') setMealSource(''); }}
          />
          {location === 'home' && (
            <Chips
              label="Meal source"
              options={[
                { key: 'homecooked', label: 'Homecooked' },
                { key: 'takeout', label: 'Takeout' },
              ]}
              value={mealSource}
              onChange={(v) => setMealSource(v as 'homecooked' | 'takeout' | '')}
            />
          )}
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

          {/* Photo */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8a8a8a', marginBottom: 10 }}>Meal photo</p>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
            {photo ? (
              <div style={{ position: 'relative' }}>
                <img src={photo} alt="Meal" style={{ width: '100%', borderRadius: 14, maxHeight: 200, objectFit: 'cover' }} />
                <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: '2px dashed #d4d2ce', color: '#8a8a8a', fontSize: 14, fontWeight: 600 }}>Take a photo</button>
            )}
          </div>
        </div>
      </div>

      {/* Start */}
      <div style={{ position: 'fixed', bottom: 72, left: 0, right: 0, padding: '10px 20px' }}>
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
