import { useState } from 'react';

interface Props {
  onComplete: () => void;
}

const steps = [
  {
    title: 'Welcome to SavorCue',
    subtitle: 'Mindful meal pacing — no guilt, no shame.',
    body: 'SavorCue helps you pace your meals with adaptive fullness check-ins. To get the most out of it, we need to set up notifications so you get reminded even when your phone is locked.',
    action: null,
  },
  {
    title: 'Step 1: Install ntfy',
    subtitle: 'A free app for push notifications.',
    body: 'ntfy is a free, open-source notification app. SavorCue uses it to send you fullness check-in reminders that work even when your screen is locked.',
    action: {
      label: 'Download ntfy (free)',
      url: 'https://apps.apple.com/app/ntfy/id1625396347',
    },
  },
  {
    title: 'Step 2: Subscribe to your topic',
    subtitle: 'This connects ntfy to SavorCue.',
    body: 'Open the ntfy app, tap the "+" button, and subscribe to this exact topic:',
    topicDisplay: true,
    action: null,
  },
  {
    title: 'Step 3: Install the Shortcut',
    subtitle: 'Auto-opens SavorCue when you get a notification.',
    body: 'This iOS Shortcut will automatically open SavorCue in your browser when you tap a notification from ntfy. After installing, go to Shortcuts → Automation → tap the SavorCue automation → make sure "Run Immediately" is on.',
    action: {
      label: 'Install Shortcut',
      url: 'https://www.icloud.com/shortcuts/savorcue-open', // placeholder
    },
    note: 'Note: You may need to create this automation manually. In Shortcuts → Automation → "When I receive a notification from ntfy" → Open URL → https://savorcue.web.app/meal',
  },
  {
    title: "You're all set!",
    subtitle: 'Start your first meal whenever you\'re ready.',
    body: 'You\'ll get a push notification on your phone (and Apple Watch) every time SavorCue wants to check in with you during a meal. Tap the notification to open the app and rate your fullness.',
    action: null,
  },
];

export default function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState(() => {
    const stored = localStorage.getItem('savorcue_ntfy_topic');
    return stored || `savorcue-${Math.random().toString(36).slice(2, 8)}`;
  });

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('savorcue_onboarded', '1');
      localStorage.setItem('savorcue_ntfy_topic', topic);
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('savorcue_onboarded', '1');
    onComplete();
  };

  const copyTopic = () => {
    navigator.clipboard.writeText(topic).catch(() => {});
  };

  return (
    <div style={{ backgroundColor: '#faf9f7', minHeight: '100vh', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '24px 20px 0' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === step ? '#0d9488' : '#e8e6e3',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, lineHeight: 1.2 }}>{current.title}</h1>
        <p style={{ fontSize: 15, color: '#8a8a8a', marginBottom: 24 }}>{current.subtitle}</p>
        <p style={{ fontSize: 15, color: '#5a5a5a', lineHeight: 1.6, marginBottom: 24 }}>{current.body}</p>

        {/* Topic display for step 2 */}
        {'topicDisplay' in current && current.topicDisplay && (
          <div style={{ marginBottom: 24 }}>
            <div
              onClick={copyTopic}
              style={{
                backgroundColor: '#fff', borderRadius: 14, padding: '16px 20px',
                fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#0d9488',
                textAlign: 'center', cursor: 'pointer', border: '2px solid #e8e6e3',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {topic}
            </div>
            <p style={{ fontSize: 12, color: '#b0ada8', textAlign: 'center', marginTop: 8 }}>Tap to copy</p>
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: '#8a8a8a', marginBottom: 6 }}>Or choose your own:</p>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e8e6e3', fontSize: 14, fontFamily: 'monospace', outline: 'none', backgroundColor: '#fff' }}
              />
            </div>
          </div>
        )}

        {/* Action button (download link) */}
        {current.action && (
          <a
            href={current.action.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center', padding: '16px 0', borderRadius: 14,
              fontSize: 16, fontWeight: 700, backgroundColor: '#0d9488', color: '#fff',
              textDecoration: 'none', marginBottom: 12,
            }}
          >
            {current.action.label}
          </a>
        )}

        {/* Note */}
        {'note' in current && current.note && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e8e6e3', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#8a8a8a', lineHeight: 1.5, margin: 0 }}>{current.note}</p>
          </div>
        )}
      </div>

      {/* Bottom buttons */}
      <div style={{ padding: '16px 28px 36px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <button
          onClick={handleNext}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 14, fontSize: 17, fontWeight: 700,
            backgroundColor: isLast ? '#0d9488' : '#1a1a1a', color: '#fff',
            marginBottom: 12,
          }}
        >
          {isLast ? "Let's go" : 'Next'}
        </button>
        {!isLast && (
          <button onClick={handleSkip} style={{ width: '100%', fontSize: 14, color: '#b0ada8', padding: '8px 0' }}>
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
