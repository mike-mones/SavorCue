import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type {
  MealMode,
  MealContext,
  LocationType,
  SocialType,
  MealType,
  HealthyIndulgent,
} from '../types';

function OptionRow({ label, options, value, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(value === o.key ? '' : o.key)}
            style={{
              backgroundColor: value === o.key ? '#10b981' : '#e5e7eb',
              color: value === o.key ? '#fff' : '#374151',
            }}
            className="px-5 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95 shadow-sm"
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function fullnessLabel(value: number): string {
  if (value === 0) return 'Empty';
  if (value <= 2) return 'Pretty hungry';
  if (value <= 4) return 'A little hungry';
  if (value === 5) return 'Neutral';
  if (value <= 7) return 'Satisfied';
  if (value <= 9) return 'Full';
  return 'Stuffed';
}

function fullnessColor(value: number): string {
  if (value <= 2) return '#10b981';
  if (value <= 5) return '#eab308';
  if (value <= 7) return '#f97316';
  return '#ef4444';
}

export default function PreMealScreen() {
  const { engine } = useApp();
  const navigate = useNavigate();

  const [hungerBefore, setHungerBefore] = useState<number | null>(null);
  const [mode, setMode] = useState<MealMode | ''>('');
  const [location, setLocation] = useState<LocationType | ''>('');
  const [social, setSocial] = useState<SocialType | ''>('');
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [healthyIndulgent, setHealthyIndulgent] = useState<HealthyIndulgent | ''>('');
  const [alcohol, setAlcohol] = useState<boolean | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  const handleStart = async () => {
    if (hungerBefore === null) return;
    const context: MealContext = {
      location: location || null,
      social: social || null,
      mealType: mealType || null,
      hungerBefore,
      healthyIndulgent: healthyIndulgent || null,
      alcohol,
    };
    await engine.startMeal((mode || 'quick') as MealMode, context);
    navigate('/meal');
  };

  const sliderActive = hungerBefore !== null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 pt-6 pb-28 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Before you eat</h2>
        <button
          onClick={() => navigate('/')}
          className="text-emerald-600 dark:text-emerald-400 text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      {/* Fullness slider */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-5 shadow-sm mb-5">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
          How full are you right now?
        </p>
        <div className="flex items-baseline justify-between mb-4">
          <span
            className="text-3xl font-bold"
            style={{ color: sliderActive ? fullnessColor(hungerBefore!) : '#9ca3af' }}
          >
            {sliderActive ? hungerBefore : '—'}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {sliderActive ? fullnessLabel(hungerBefore!) : 'Slide to set'}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={hungerBefore ?? 5}
          onChange={(e) => setHungerBefore(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: sliderActive
              ? `linear-gradient(to right, #10b981 0%, #eab308 45%, #f97316 70%, #ef4444 100%)`
              : '#d1d5db',
          }}
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-2 px-0.5">
          <span>Empty</span>
          <span>Neutral</span>
          <span>Stuffed</span>
        </div>
      </div>

      {/* Optional details */}
      {!showOptional ? (
        <button
          onClick={() => setShowOptional(true)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 shadow-sm text-sm text-emerald-600 dark:text-emerald-400 font-medium text-left mb-5"
        >
          + Add more details (optional)
        </button>
      ) : (
        <div className="mb-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm px-4 py-5 space-y-5">
            <OptionRow
            label="Meal mode"
            options={[
              { key: 'quick', label: 'Quick' },
              { key: 'restaurant', label: 'Restaurant' },
              { key: 'snack', label: 'Snack' },
              { key: 'social', label: 'Social' },
            ]}
            value={mode}
            onChange={(v) => setMode((v || 'quick') as MealMode)}
          />
          <OptionRow
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
          <OptionRow
            label="Where are you eating?"
            options={[
              { key: 'home', label: 'Home' },
              { key: 'restaurant', label: 'Restaurant' },
              { key: 'other', label: 'Somewhere else' },
            ]}
            value={location}
            onChange={(v) => setLocation(v as LocationType)}
          />
          <OptionRow
            label="Who are you with?"
            options={[
              { key: 'alone', label: 'Just me' },
              { key: 'with_people', label: 'With others' },
            ]}
            value={social}
            onChange={(v) => setSocial(v as SocialType)}
          />
          <OptionRow
            label="How's the food?"
            options={[
              { key: 'healthy', label: 'Healthy' },
              { key: 'mixed', label: 'Mixed' },
              { key: 'indulgent', label: 'Indulgent' },
            ]}
            value={healthyIndulgent}
            onChange={(v) => setHealthyIndulgent(v as HealthyIndulgent)}
          />
          <OptionRow
            label="Drinking alcohol?"
            options={[
              { key: 'yes', label: 'Yes' },
              { key: 'no', label: 'No' },
            ]}
            value={alcohol === true ? 'yes' : alcohol === false ? 'no' : ''}
            onChange={(v) => setAlcohol(v === 'yes' ? true : v === 'no' ? false : null)}
          />
          </div>
          <button
            onClick={() => setShowOptional(false)}
            className="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-2 block px-1"
          >
            Hide details
          </button>
        </div>
      )}

      {/* Start button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleStart}
            disabled={!sliderActive}
            style={sliderActive ? { backgroundColor: '#10b981' } : undefined}
            className={`w-full font-semibold py-3.5 rounded-2xl text-lg active:scale-95 transition-all ${
              sliderActive
                ? 'text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {sliderActive ? 'Start Meal' : 'Set your fullness to start'}
          </button>
        </div>
      </div>
    </div>
  );
}
