import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import type { AppSettings, UnlockMethod, NotificationStyle } from '../types';
import { DEFAULT_SETTINGS } from '../defaults';
import { exportAllData, exportCSV } from '../db';

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const navigate = useNavigate();
  const [local, setLocal] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateSchedule = (band: string, value: number) => {
    setLocal((prev) => ({
      ...prev,
      promptScheduleByRating: { ...prev.promptScheduleByRating, [band]: value },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    await updateSettings(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocal({ ...DEFAULT_SETTINGS });
    setSaved(false);
  };

  const handleExportJSON = async () => {
    const data = await exportAllData();
    downloadFile(data, 'savorcue-export.json', 'application/json');
  };

  const handleExportCSV = async () => {
    const data = await exportCSV();
    downloadFile(data, 'savorcue-sessions.csv', 'text/csv');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chipClass = (selected: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
      selected
        ? 'bg-emerald-600 text-white'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }`;

  const schedule = local.promptScheduleByRating;
  const bands = ['0-2', '3-4', '5-6', '7', '8', '9-10'];

  return (
    <div className="min-h-screen px-6 py-8 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 underline">
          Back
        </button>
      </div>

      {/* Prompt schedule */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
          Prompt timing (seconds)
        </h3>
        {bands.map((band) => (
          <div key={band} className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600 dark:text-gray-300 w-16">
              Rating {band}
            </label>
            <input
              type="number"
              min={0}
              max={600}
              value={schedule[band] ?? 0}
              onChange={(e) => updateSchedule(band, Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-center outline-none focus:border-emerald-500"
            />
          </div>
        ))}
      </section>

      {/* Thresholds */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Thresholds</h3>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">High fullness</label>
          <input
            type="number"
            min={1}
            max={10}
            value={local.highFullnessThreshold}
            onChange={(e) => update('highFullnessThreshold', Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-center outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">Done threshold</label>
          <input
            type="number"
            min={1}
            max={10}
            value={local.doneThreshold}
            onChange={(e) => update('doneThreshold', Number(e.target.value))}
            className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-center outline-none focus:border-emerald-500"
          />
        </div>
      </section>

      {/* Unlock method */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Unlock method</h3>
        <div className="flex gap-2 mb-3">
          {(['tap', 'hold', 'type_code'] as UnlockMethod[]).map((m) => (
            <button
              key={m}
              className={chipClass(local.unlockMethod === m)}
              onClick={() => update('unlockMethod', m)}
            >
              {m === 'type_code' ? 'Type code' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {local.unlockMethod === 'type_code' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">Code:</label>
            <input
              type="text"
              value={local.unlockCode}
              onChange={(e) => update('unlockCode', e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 uppercase font-mono outline-none focus:border-emerald-500"
              maxLength={20}
            />
          </div>
        )}
      </section>

      {/* Durations */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Durations (seconds)</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-300">Unlock window</label>
            <input
              type="number"
              min={10}
              max={300}
              value={local.unlockWindowSec}
              onChange={(e) => update('unlockWindowSec', Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-center outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-300">Pause duration</label>
            <input
              type="number"
              min={10}
              max={600}
              value={local.doneFlowPauseSec}
              onChange={(e) => update('doneFlowPauseSec', Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-center outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-300">Re-prompt if ignored</label>
            <input
              type="number"
              min={5}
              max={120}
              value={local.ignoredPromptRepromptSec}
              onChange={(e) => update('ignoredPromptRepromptSec', Number(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-center outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Notification style */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Notification style</h3>
        <div className="flex gap-2">
          {(['in_app', 'subtle', 'strong'] as NotificationStyle[]).map((n) => (
            <button
              key={n}
              className={chipClass(local.notificationStyle === n)}
              onClick={() => update('notificationStyle', n)}
            >
              {n.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>
      </section>

      {/* Social mode */}
      <section className="mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Social mode</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Less aggressive re-prompts</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => update('socialMode', true)}
            className={chipClass(local.socialMode === true)}
          >
            On
          </button>
          <button
            onClick={() => update('socialMode', false)}
            className={chipClass(local.socialMode === false)}
          >
            Off
          </button>
        </div>
      </section>

      {/* Home Assistant */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Home Assistant</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Webhook URL</label>
            <input
              type="url"
              value={local.haWebhookUrl ?? ''}
              onChange={(e) => update('haWebhookUrl', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm outline-none focus:border-emerald-500"
              placeholder="https://your-ha-instance/api/webhook/..."
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-2 block">Mirror events to HA</label>
            <div className="flex gap-2">
              <button
                onClick={() => update('haEventMirroring', true)}
                className={chipClass(local.haEventMirroring === true)}
              >
                On
              </button>
              <button
                onClick={() => update('haEventMirroring', false)}
                className={chipClass(local.haEventMirroring !== true)}
              >
                Off
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Export */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Export data</h3>
        <div className="flex gap-3">
          <button
            onClick={handleExportJSON}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 max-w-md mx-auto">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
