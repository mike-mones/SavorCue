import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type { AmountLeft, FinalSummary } from '../types';

export default function EndMealScreen() {
  const { engine, active } = useApp();
  const navigate = useNavigate();

  const [finalFullness, setFinalFullness] = useState<number>(active?.lastFullnessRating ?? 5);
  const [overshot, setOvershot] = useState<boolean | null>(null);
  const [discomfort, setDiscomfort] = useState<number>(0);
  const [amountLeft, setAmountLeft] = useState<AmountLeft | ''>('');
  const [note, setNote] = useState('');

  if (!active) {
    navigate('/');
    return null;
  }

  const handleSubmit = async () => {
    const summary: FinalSummary = {
      finalFullness,
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
    navigate('/');
  };

  const chipClass = (selected: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      selected
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`;

  return (
    <div className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        How was your meal?
      </h2>

      {/* Final fullness */}
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
        Final fullness: {finalFullness}
      </label>
      <input
        type="range"
        min={0}
        max={10}
        value={finalFullness}
        onChange={(e) => setFinalFullness(Number(e.target.value))}
        className="w-full mb-5 accent-emerald-600"
      />

      {/* Overshot */}
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
        Did you eat more than you wanted?
      </label>
      <div className="flex gap-2 mb-5">
        <button className={chipClass(overshot === true)} onClick={() => setOvershot(true)}>
          Yes
        </button>
        <button className={chipClass(overshot === false)} onClick={() => setOvershot(false)}>
          No
        </button>
      </div>

      {/* Discomfort */}
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
        Discomfort level: {discomfort}
      </label>
      <input
        type="range"
        min={0}
        max={10}
        value={discomfort}
        onChange={(e) => setDiscomfort(Number(e.target.value))}
        className="w-full mb-5 accent-emerald-600"
      />

      {/* Amount left */}
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Amount left</label>
      <div className="flex flex-wrap gap-2 mb-5">
        {([
          ['none', 'Nothing'],
          ['few_bites', 'Few bites'],
          ['25_percent', '~25%'],
          ['50_percent_plus', '50%+'],
        ] as [AmountLeft, string][]).map(([val, label]) => (
          <button key={val} className={chipClass(amountLeft === val)} onClick={() => setAmountLeft(val)}>
            {label}
          </button>
        ))}
      </div>

      {/* Note */}
      <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Note (optional)</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-full p-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 mb-6 outline-none focus:border-emerald-500"
        rows={2}
        placeholder="Any thoughts on this meal?"
      />

      <button
        onClick={handleSubmit}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold py-4 rounded-xl mb-3 active:scale-95 transition-transform"
      >
        Save & Finish
      </button>
      <button onClick={handleSkip} className="text-sm text-gray-500 underline block mx-auto">
        Skip summary
      </button>
    </div>
  );
}
