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

export default function PreMealScreen() {
  const { engine } = useApp();
  const navigate = useNavigate();

  // Mandatory baseline
  const [hungerBefore, setHungerBefore] = useState<number | null>(null);

  // Optional fields
  const [mode, setMode] = useState<MealMode>('quick');
  const [location, setLocation] = useState<LocationType | ''>('');
  const [social, setSocial] = useState<SocialType | ''>('');
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [healthyIndulgent, setHealthyIndulgent] = useState<HealthyIndulgent | ''>('');
  const [alcohol, setAlcohol] = useState<boolean | null>(null);
  const [showOptional, setShowOptional] = useState(false);

  const handleStart = async () => {
    if (hungerBefore === null) return; // guard
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

  const chipClass = (selected: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      selected
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`;

  return (
    <div className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">
        Before you eat
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
        Tap your current hunger/fullness level to get started.
      </p>

      {/* Mandatory: hunger/fullness baseline */}
      <label className="block text-base font-semibold text-gray-700 dark:text-gray-200 mb-3">
        How hungry or full are you right now?
      </label>
      <div className="grid grid-cols-4 gap-2 w-full mb-2">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => setHungerBefore(i)}
            className={`py-3 rounded-xl text-lg font-bold active:scale-95 transition-transform ${
              hungerBefore === i
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : i <= 3
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                : i <= 6
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-6 px-1">
        <span>Very hungry</span>
        <span>Very full</span>
      </div>

      {/* Optional details toggle */}
      {!showOptional ? (
        <button
          onClick={() => setShowOptional(true)}
          className="text-sm text-emerald-600 dark:text-emerald-400 underline mb-6 block"
        >
          Add more details (optional)
        </button>
      ) : (
        <div className="mb-6">
          {/* Mode */}
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Meal mode</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {(['quick', 'restaurant', 'snack', 'social'] as MealMode[]).map((m) => (
              <button key={m} className={chipClass(mode === m)} onClick={() => setMode(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Meal type */}
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Meal type</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((t) => (
              <button key={t} className={chipClass(mealType === t)} onClick={() => setMealType(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Location */}
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Where?</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {(['home', 'restaurant', 'other'] as LocationType[]).map((l) => (
              <button key={l} className={chipClass(location === l)} onClick={() => setLocation(l)}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>

          {/* Social */}
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Eating with?</label>
          <div className="flex flex-wrap gap-2 mb-5">
            <button className={chipClass(social === 'alone')} onClick={() => setSocial('alone')}>Alone</button>
            <button className={chipClass(social === 'with_people')} onClick={() => setSocial('with_people')}>With people</button>
          </div>

          {/* Healthy/Indulgent */}
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Meal vibe</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {(['healthy', 'mixed', 'indulgent'] as HealthyIndulgent[]).map((h) => (
              <button key={h} className={chipClass(healthyIndulgent === h)} onClick={() => setHealthyIndulgent(h)}>
                {h.charAt(0).toUpperCase() + h.slice(1)}
              </button>
            ))}
          </div>

          {/* Alcohol */}
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Alcohol?</label>
          <div className="flex gap-2 mb-4">
            <button className={chipClass(alcohol === true)} onClick={() => setAlcohol(true)}>Yes</button>
            <button className={chipClass(alcohol === false)} onClick={() => setAlcohol(false)}>No</button>
          </div>

          <button
            onClick={() => setShowOptional(false)}
            className="text-sm text-gray-400 underline"
          >
            Hide details
          </button>
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={hungerBefore === null}
        className={`w-full text-lg font-semibold py-4 rounded-xl active:scale-95 transition-transform ${
          hungerBefore !== null
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        Start Meal
      </button>

      <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-500 underline block mx-auto">
        Cancel
      </button>
    </div>
  );
}
