import { useState } from 'react';
import { useApp } from '../context';
import type { AppSettings, UnlockMethod } from '../types';
import { DEFAULT_SETTINGS } from '../defaults';
import { exportAllData, exportCSV } from '../db';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ backgroundColor: on ? '#10b981' : '#9ca3af' }}
      className="relative inline-flex h-9 w-16 shrink-0 items-center rounded-full transition-colors"
    >
      <span
        style={{
          transform: on ? 'translateX(30px)' : 'translateX(4px)',
          transition: 'transform 0.2s',
        }}
        className="inline-block h-7 w-7 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        {desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-700 px-4 shadow-sm">
        {children}
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - (max > 100 ? 15 : 1)))}
        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-lg font-bold flex items-center justify-center"
      >
        −
      </button>
      <span className="w-14 text-center text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + (max > 100 ? 15 : 1)))}
        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-lg font-bold flex items-center justify-center"
      >
        +
      </button>
    </div>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
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

  const schedule = local.promptScheduleByRating;

  const unlockLabels: Record<UnlockMethod, string> = {
    tap: 'Tap',
    hold: 'Hold 2s',
    type_code: 'Type code',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 pt-6 pb-28 max-w-md mx-auto">
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(20px)', padding: '16px 0', marginBottom: 16 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h2>
      </div>

      {/* Prompt Timing */}
      <Card title="Prompt Timing">
        {[
          { band: '0-2', label: 'Fullness 0–2', desc: 'Not hungry yet' },
          { band: '3-4', label: 'Fullness 3–4', desc: 'Getting there' },
          { band: '5-6', label: 'Fullness 5–6', desc: 'Moderate' },
          { band: '7', label: 'Fullness 7', desc: 'High' },
          { band: '8', label: 'Fullness 8', desc: 'Very high' },
          { band: '9-10', label: 'Fullness 9–10', desc: 'Triggers done flow' },
        ].map(({ band, label, desc }) => (
          <Row key={band} label={label} desc={`${desc} · ${schedule[band] ?? 0}s`}>
            <NumberInput
              value={schedule[band] ?? 0}
              onChange={(v) => updateSchedule(band, v)}
              min={0}
              max={600}
            />
          </Row>
        ))}
      </Card>

      {/* Thresholds */}
      <Card title="Thresholds">
        <Row label="High fullness" desc="Shows unlock prompt at this level">
          <NumberInput
            value={local.highFullnessThreshold}
            onChange={(v) => update('highFullnessThreshold', v)}
            min={1}
            max={10}
          />
        </Row>
        <Row label="Done threshold" desc="Triggers 'you're done' at this level">
          <NumberInput
            value={local.doneThreshold}
            onChange={(v) => update('doneThreshold', v)}
            min={1}
            max={10}
          />
        </Row>
      </Card>

      {/* Unlock */}
      <Card title="Unlock to Continue">
        <Row label="Method" desc="How to unlock after high fullness">
          <div className="flex gap-1">
            {(['tap', 'hold', 'type_code'] as UnlockMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => update('unlockMethod', m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  local.unlockMethod === m
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {unlockLabels[m]}
              </button>
            ))}
          </div>
        </Row>
        {local.unlockMethod === 'type_code' && (
          <Row label="Unlock code" desc="Word to type to continue eating">
            <input
              type="text"
              value={local.unlockCode}
              onChange={(e) => update('unlockCode', e.target.value)}
              className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-sm font-mono uppercase outline-none focus:border-emerald-500"
              maxLength={20}
            />
          </Row>
        )}
        <Row label="Unlock window" desc="Seconds of eating granted after unlock">
          <NumberInput
            value={local.unlockWindowSec}
            onChange={(v) => update('unlockWindowSec', v)}
            min={10}
            max={300}
          />
        </Row>
      </Card>

      {/* Timing */}
      <Card title="Timers">
        <Row label="Pause duration" desc="Length of the 'take a break' pause">
          <NumberInput
            value={local.doneFlowPauseSec}
            onChange={(v) => update('doneFlowPauseSec', v)}
            min={10}
            max={600}
          />
        </Row>
        <Row label="Re-prompt delay" desc="Seconds before re-asking if ignored">
          <NumberInput
            value={local.ignoredPromptRepromptSec}
            onChange={(v) => update('ignoredPromptRepromptSec', v)}
            min={5}
            max={120}
          />
        </Row>
      </Card>

      {/* Behavior */}
      <Card title="Behavior">
        <Row label="Social mode" desc="Gentler prompts when eating with others">
          <Toggle on={local.socialMode} onChange={(v) => update('socialMode', v)} />
        </Row>
      </Card>

      {/* Home Assistant */}
      <Card title="Home Assistant">
        <div className="py-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Webhook URL</p>
          <input
            type="url"
            value={local.haWebhookUrl ?? ''}
            onChange={(e) => update('haWebhookUrl', e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-emerald-500"
            placeholder="https://your-ha-instance/api/webhook/..."
          />
        </div>
        <Row label="Mirror events" desc="Send meal events to Home Assistant">
          <Toggle on={!!local.haEventMirroring} onChange={(v) => update('haEventMirroring', v)} />
        </Row>
      </Card>

      {/* Data */}
      <Card title="Data">
        <div className="py-3 flex gap-3">
          <button
            onClick={handleExportJSON}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            Export JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg text-sm font-medium active:scale-95 transition-transform"
          >
            Export CSV
          </button>
        </div>
        <div className="py-3">
          <button
            onClick={handleReset}
            className="w-full text-red-500 dark:text-red-400 text-sm font-medium py-1"
          >
            Reset all settings to defaults
          </button>
        </div>
      </Card>

      {/* Save bar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            className={`w-full font-semibold py-3.5 rounded-2xl text-lg active:scale-95 transition-all ${
              saved
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
            }`}
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
