import { useState } from 'react';
import { useApp } from '../context';
import type { AppSettings, UnlockMethod } from '../types';
import { DEFAULT_SETTINGS } from '../defaults';
import { exportAllData, exportCSV } from '../db';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: on ? '#0d9488' : '#d4d2ce', position: 'relative', transition: 'background-color 0.2s' }}
    >
      <span style={{ position: 'absolute', top: 3, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s', transform: on ? 'translateX(24px)' : 'translateX(3px)' }} />
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f0eeeb' }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{label}</p>
        {desc && <p style={{ fontSize: 12, color: '#8a8a8a', margin: '2px 0 0' }}>{desc}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Stepper({ value, onChange, min, max, step }: { value: number; onChange: (n: number) => void; min: number; max: number; step?: number }) {
  const s = step ?? (max > 100 ? 15 : 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => onChange(Math.max(min, value - s))}
        style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#f0eeeb', color: '#1a1a1a', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        −
      </button>
      <span style={{ width: 48, textAlign: 'center', fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#1a1a1a' }}>
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + s))}
        style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#f0eeeb', color: '#1a1a1a', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        +
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: '#8a8a8a', marginBottom: 8, paddingLeft: 4 }}>{title}</p>
      <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '0 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {children}
      </div>
    </div>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useApp();
  const [local, setLocal] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const hasChanges = JSON.stringify(local) !== JSON.stringify(settings);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateSchedule = (key: string, value: number) => {
    setLocal((prev) => ({
      ...prev,
      promptScheduleByRating: { ...prev.promptScheduleByRating, [key]: value },
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

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', padding: '0 16px 140px', maxWidth: 480, margin: '0 auto', color: '#1a1a1a' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(250,249,247,0.92)', backdropFilter: 'blur(20px)', padding: '20px 4px 12px' }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Settings</h2>
      </div>

      {/* Prompt Timing */}
      <Section title="Prompt timing (seconds)">
        <div style={{ padding: '12px 0', borderBottom: '1px solid #f0eeeb' }}>
          <p style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 10 }}>Presets</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Gradual', vals: { '0': 300, '1': 300, '2': 270, '3': 240, '4': 210, '5': 180, '6': 150, '7': 120, '8': 60, '9': 0, '10': 0 } },
              { label: 'Steady', vals: { '0': 180, '1': 180, '2': 180, '3': 180, '4': 180, '5': 120, '6': 120, '7': 90, '8': 60, '9': 0, '10': 0 } },
              { label: 'Aggressive', vals: { '0': 120, '1': 120, '2': 90, '3': 90, '4': 60, '5': 60, '6': 45, '7': 30, '8': 20, '9': 0, '10': 0 } },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setLocal((prev) => ({ ...prev, promptScheduleByRating: p.vals })); setSaved(false); }}
                style={{ flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, backgroundColor: '#f0eeeb', color: '#5a5a5a' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {Array.from({ length: 11 }, (_, i) => {
          const val = schedule[String(i)] ?? 0;
          const isDone = val === 0;
          return (
            <SettingRow
              key={i}
              label={`Fullness ${i}`}
              desc={isDone ? 'Triggers done flow' : undefined}
            >
              <Stepper value={val} onChange={(v) => updateSchedule(String(i), v)} min={0} max={600} />
            </SettingRow>
          );
        })}
      </Section>

      {/* Thresholds */}
      <Section title="Thresholds">
        <SettingRow label="High fullness" desc="Shows unlock prompt">
          <Stepper value={local.highFullnessThreshold} onChange={(v) => update('highFullnessThreshold', v)} min={1} max={10} />
        </SettingRow>
        <SettingRow label="Done threshold" desc="Triggers done flow">
          <Stepper value={local.doneThreshold} onChange={(v) => update('doneThreshold', v)} min={1} max={10} />
        </SettingRow>
      </Section>

      {/* Unlock */}
      <Section title="Unlock to continue">
        <SettingRow label="Method">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['tap', 'hold', 'type_code'] as UnlockMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => update('unlockMethod', m)}
                style={{
                  padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                  backgroundColor: local.unlockMethod === m ? '#0d9488' : '#f0eeeb',
                  color: local.unlockMethod === m ? '#fff' : '#5a5a5a',
                }}
              >
                {m === 'type_code' ? 'Type code' : m === 'hold' ? 'Hold 2s' : 'Tap'}
              </button>
            ))}
          </div>
        </SettingRow>
        {local.unlockMethod === 'type_code' && (
          <SettingRow label="Unlock code">
            <input
              type="text"
              value={local.unlockCode}
              onChange={(e) => update('unlockCode', e.target.value)}
              style={{ width: 80, padding: '8px', borderRadius: 10, border: '1px solid #e8e6e3', textAlign: 'center', fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', outline: 'none', backgroundColor: '#faf9f7' }}
              maxLength={20}
            />
          </SettingRow>
        )}
        <SettingRow label="Unlock window" desc="Seconds granted after unlock">
          <Stepper value={local.unlockWindowSec} onChange={(v) => update('unlockWindowSec', v)} min={10} max={300} />
        </SettingRow>
      </Section>

      {/* Timers */}
      <Section title="Timers">
        <SettingRow label="Pause duration" desc="Break timer length">
          <Stepper value={local.doneFlowPauseSec} onChange={(v) => update('doneFlowPauseSec', v)} min={10} max={600} />
        </SettingRow>
        <SettingRow label="Re-prompt delay" desc="If prompt is ignored">
          <Stepper value={local.ignoredPromptRepromptSec} onChange={(v) => update('ignoredPromptRepromptSec', v)} min={5} max={120} />
        </SettingRow>
      </Section>

      {/* Behavior */}
      <Section title="Behavior">
        <SettingRow label="Social mode" desc="Gentler prompts with others">
          <Toggle on={local.socialMode} onChange={(v) => update('socialMode', v)} />
        </SettingRow>
      </Section>

      {/* Home Assistant */}
      <Section title="Home Assistant">
        <div style={{ padding: '14px 0', borderBottom: '1px solid #f0eeeb' }}>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Webhook URL</p>
          <input
            type="url"
            value={local.haWebhookUrl ?? ''}
            onChange={(e) => update('haWebhookUrl', e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #e8e6e3', fontSize: 13, outline: 'none', backgroundColor: '#faf9f7' }}
            placeholder="https://your-ha-instance/api/webhook/..."
          />
        </div>
        <SettingRow label="Mirror events" desc="Send events to HA">
          <Toggle on={!!local.haEventMirroring} onChange={(v) => update('haEventMirroring', v)} />
        </SettingRow>
      </Section>

      {/* Data */}
      <Section title="Data">
        <div style={{ padding: '14px 0', display: 'flex', gap: 10, borderBottom: '1px solid #f0eeeb' }}>
          <button
            onClick={async () => downloadFile(await exportAllData(), 'savorcue-export.json', 'application/json')}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, backgroundColor: '#f0eeeb', color: '#5a5a5a' }}
          >
            Export JSON
          </button>
          <button
            onClick={async () => downloadFile(await exportCSV(), 'savorcue-sessions.csv', 'text/csv')}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 600, backgroundColor: '#f0eeeb', color: '#5a5a5a' }}
          >
            Export CSV
          </button>
        </div>
        <div style={{ padding: '14px 0' }}>
          <button onClick={handleReset} style={{ width: '100%', fontSize: 14, fontWeight: 600, color: '#d4756b', padding: '4px 0' }}>
            Reset all settings to defaults
          </button>
        </div>
      </Section>

      {/* Save bar — only show if changed */}
      {(hasChanges || saved) && (
        <div style={{ position: 'fixed', bottom: 68, left: 0, right: 0, padding: '10px 16px' }}>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <button
              onClick={handleSave}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 16, fontWeight: 700,
                backgroundColor: saved ? '#e6f7f2' : '#0d9488',
                color: saved ? '#0d7377' : '#fff',
                boxShadow: '0 2px 12px rgba(13,148,136,0.25)',
                transition: 'all 0.2s',
              }}
            >
              {saved ? '✓ Saved' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
