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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function ChipRow({ label, options, value, onChange }: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-3">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              value === o.key
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PreMealScreen() {
  const { engine } = useApp();
  const navigate = useNavigate();

  const [hungerBefore, setHungerBefore] = useState<number | null>(null);
  const [mode, setMode] = useState<MealMode>('quick');
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
    await engine.startMeal(mode, context);
    navigate('/meal');
  };

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

      {/* Mandatory: hunger/fullness baseline */}
      <Card title="How hungry or full are you?">
        <div className="grid grid-cols-4 gap-2 mb-2">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              onClick={() => setHungerBefore(i)}
              style={hungerBefore === i ? { backgroundColor: '#10b981', color: '#fff' } : undefined}
              className={`py-3 rounded-xl text-lg font-bold active:scale-95 transition-transform ${
                hungerBefore === i
                  ? 'ring-2 ring-emerald-400'
                  : i <= 3
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : i <= 6
                  ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                  : 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-1 pb-1">
          <span>Very hungry</span>
          <span>Very full</span>
        </div>
      </Card>

      {/* Optional details */}
      {!showOptional ? (
        <button
          onClick={() => setShowOptional(true)}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl px-4 py-4 shadow-sm text-sm text-emerald-600 dark:text-emerald-400 font-medium text-left mb-5"
        >
          + Add more details (optional)
        </button>
      ) : (
        <>
          <Card title="Meal Details">
            <ChipRow
              label="Meal mode"
              options={[
                { key: 'quick', label: 'Quick' },
                { key: 'restaurant', label: 'Restaurant' },
                { key: 'snack', label: 'Snack' },
                { key: 'social', label: 'Social' },
              ]}
              value={mode}
              onChange={(v) => setMode(v as MealMode)}
            />
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <ChipRow
              label="Meal type"
              options={[
                { key: 'breakfast', label: 'Breakfast' },
                { key: 'lunch', label: 'Lunch' },
                { key: 'dinner', label: 'Dinner' },
                { key: 'snack', label: 'Snack' },
              ]}
              value={mealType}
              onChange={(v) => setMealType(v as MealType)}
            />
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <ChipRow
              label="Where?"
              options={[
                { key: 'home', label: 'Home' },
                { key: 'restaurant', label: 'Restaurant' },
                { key: 'other', label: 'Other' },
              ]}
              value={location}
              onChange={(v) => setLocation(v as LocationType)}
            />
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <ChipRow
              label="Eating with?"
              options={[
                { key: 'alone', label: 'Alone' },
                { key: 'with_people', label: 'With people' },
              ]}
              value={social}
              onChange={(v) => setSocial(v as SocialType)}
            />
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <ChipRow
              label="Meal vibe"
              options={[
                { key: 'healthy', label: 'Healthy' },
                { key: 'mixed', label: 'Mixed' },
                { key: 'indulgent', label: 'Indulgent' },
              ]}
              value={healthyIndulgent}
              onChange={(v) => setHealthyIndulgent(v as HealthyIndulgent)}
            />
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <ChipRow
              label="Alcohol?"
              options={[
                { key: 'yes', label: 'Yes' },
                { key: 'no', label: 'No' },
              ]}
              value={alcohol === true ? 'yes' : alcohol === false ? 'no' : ''}
              onChange={(v) => setAlcohol(v === 'yes')}
            />
          </Card>
          <button
            onClick={() => setShowOptional(false)}
            className="text-sm text-gray-400 dark:text-gray-500 mb-5 block px-1"
          >
            Hide details
          </button>
        </>
      )}

      {/* Start button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleStart}
            disabled={hungerBefore === null}
            style={hungerBefore !== null ? { backgroundColor: '#10b981' } : undefined}
            className={`w-full font-semibold py-3.5 rounded-2xl text-lg active:scale-95 transition-all ${
              hungerBefore !== null
                ? 'text-white shadow-lg shadow-emerald-500/25'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {hungerBefore !== null ? 'Start Meal' : 'Select fullness to start'}
          </button>
        </div>
      </div>
    </div>
  );
}
