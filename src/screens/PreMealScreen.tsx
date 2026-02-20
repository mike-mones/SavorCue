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

function fullnessEmoji(v: number): string {
  if (v <= 2) return '🟢';
  if (v <= 5) return '🟡';
  if (v <= 7) return '🟠';
  return '🔴';
}

function PickerGroup({ label, options, value, onChange }: {
  label: string;
  options: { key: string; label: string; icon?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">{label}</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, 1fr)` }}>
        {options.map((o) => {
          const selected = value === o.key;
          return (
            <button
              key={o.key}
              onClick={() => onChange(selected ? '' : o.key)}
              style={{
                backgroundColor: selected ? '#10b981' : '#f3f4f6',
                color: selected ? '#fff' : '#4b5563',
                border: selected ? '2px solid #059669' : '2px solid transparent',
              }}
              className="py-3.5 px-3 rounded-2xl text-sm font-semibold transition-all active:scale-[0.96] text-center"
            >
              {o.icon && <span className="block text-lg mb-0.5">{o.icon}</span>}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md px-5 pt-5 pb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">New meal</h2>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-medium text-gray-400 dark:text-gray-500"
        >
          Cancel
        </button>
      </div>

      <div className="px-5 pb-32 max-w-md mx-auto space-y-6">
        {/* Fullness slider */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            How full are you right now?
          </p>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl font-bold tabular-nums" style={{ color: active ? '#10b981' : '#d1d5db' }}>
              {active ? fullness : '—'}
            </span>
            <div className="flex-1">
              {active && (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{fullnessEmoji(fullness!)} {fullnessLabel(fullness!)}</span>
                </>
              )}
              {!active && <span className="text-sm text-gray-400">Drag the slider below</span>}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full" style={{
              background: active
                ? 'linear-gradient(to right, #10b981 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)'
                : '#e5e7eb',
            }} />
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={fullness ?? 5}
              onChange={(e) => setFullness(Number(e.target.value))}
              className="relative w-full h-8 appearance-none bg-transparent cursor-pointer z-10"
              style={{ WebkitAppearance: 'none' }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-1 px-0.5 font-medium">
            <span>Empty</span>
            <span>Neutral</span>
            <span>Stuffed</span>
          </div>
        </div>

        {/* Meal type */}
        <PickerGroup
          label="What are you eating?"
          options={[
            { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
            { key: 'lunch', label: 'Lunch', icon: '☀️' },
            { key: 'dinner', label: 'Dinner', icon: '🌙' },
            { key: 'snack', label: 'Snack', icon: '🍿' },
          ]}
          value={mealType}
          onChange={(v) => setMealType(v as MealType)}
        />

        {/* Location */}
        <PickerGroup
          label="Where are you?"
          options={[
            { key: 'home', label: 'Home', icon: '🏠' },
            { key: 'restaurant', label: 'Out', icon: '🍽️' },
            { key: 'other', label: 'Other', icon: '📍' },
          ]}
          value={location}
          onChange={(v) => setLocation(v as LocationType)}
        />

        {/* Social */}
        <PickerGroup
          label="Who's with you?"
          options={[
            { key: 'alone', label: 'Solo', icon: '🧘' },
            { key: 'with_people', label: 'With others', icon: '👥' },
          ]}
          value={social}
          onChange={(v) => setSocial(v as SocialType)}
        />

        {/* Food vibe */}
        <PickerGroup
          label="How's the food?"
          options={[
            { key: 'healthy', label: 'Healthy', icon: '🥗' },
            { key: 'mixed', label: 'Mixed', icon: '🍱' },
            { key: 'indulgent', label: 'Indulgent', icon: '🍕' },
          ]}
          value={healthyIndulgent}
          onChange={(v) => setHealthyIndulgent(v as HealthyIndulgent)}
        />

        {/* Alcohol */}
        <PickerGroup
          label="Drinking?"
          options={[
            { key: 'yes', label: 'Yes', icon: '🍷' },
            { key: 'no', label: 'No', icon: '💧' },
          ]}
          value={alcohol === true ? 'yes' : alcohol === false ? 'no' : ''}
          onChange={(v) => setAlcohol(v === 'yes' ? true : v === 'no' ? false : null)}
        />
      </div>

      {/* Start button */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleStart}
            disabled={!active}
            style={active ? { backgroundColor: '#10b981' } : undefined}
            className={`w-full font-bold py-4 rounded-2xl text-lg transition-all active:scale-[0.97] ${
              active
                ? 'text-white shadow-xl shadow-emerald-500/30'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {active ? 'Start Meal' : 'Set your fullness to begin'}
          </button>
        </div>
      </div>
    </div>
  );
}
