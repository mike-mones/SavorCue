# SavorCue

Mindful meal pacing assistant — no guilt, no shame.

SavorCue helps you pace meals with adaptive fullness prompts, friction-based "continue eating" unlocks, and meal analytics. It's designed to reduce overeating without diet-style restriction or shame language.

## Features

- **One-tap start** — begin a meal instantly or customize context first
- **Adaptive fullness prompts** — rate fullness 0–10, timing adjusts automatically
- **Friction-based unlock** — high fullness requires a conscious choice to continue
- **Done flow** — gentle "you're done eating" nudge with 2-minute pause
- **Session logging** — every prompt, rating, and unlock is recorded
- **End-of-meal summary** — capture final fullness, discomfort, and notes
- **Analytics dashboard** — track trends, overshoot rate, context breakdowns
- **Configurable settings** — timing, thresholds, unlock method, social mode
- **Data export** — JSON and CSV exports
- **Dark mode** — follows system preference
- **Mobile-first** — large buttons, one-handed use
- **Offline-capable** — all data stored locally in IndexedDB
- **Home Assistant integration** — optional webhook event mirroring

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173/SavorCue/](http://localhost:5173/SavorCue/) in your browser.

## Usage Flow

1. **Start Meal** — tap the big green button (or pick a preset: Quick, Restaurant, Snack, Social)
2. **Eat** — the app counts down to your first check-in
3. **Rate fullness** — tap a number 0–10 when prompted
4. **Adaptive timing** — lower fullness → longer intervals; higher → shorter
5. **High fullness (≥7)** — app asks if you want to keep eating; unlock required
6. **Very high fullness (≥9)** — "You're done eating" flow with 2-minute pause
7. **End meal** — fill out summary (optional) and review stats
8. **Analytics** — review trends over time

## Default Prompt Timing

| Fullness | Next prompt |
|----------|-------------|
| 0–2      | 5 min       |
| 3–4      | 3 min       |
| 5–6      | 2 min       |
| 7        | 1 min       |
| 8        | 45 sec      |
| 9–10     | Done flow   |

All timings are configurable in Settings.

## Unlock Methods

When fullness is high, continuing to eat requires friction:

- **Tap** — simple tap to continue
- **Hold** — hold button for 2 seconds
- **Type code** — type a word (default: `MORE`) to continue

Default: Type code. Configurable in Settings.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Prompt schedule | See table above | Seconds until next prompt per fullness band |
| High fullness threshold | 7 | Rating that triggers unlock flow |
| Done threshold | 9 | Rating that triggers done flow |
| Unlock method | Type code | tap / hold / type_code |
| Unlock code | MORE | Word to type for type_code unlock |
| Unlock window | 60s | Time granted after unlock |
| Pause duration | 120s | Length of the pause timer |
| Re-prompt if ignored | 10s | Seconds before re-prompt on no response |
| Notification style | In-app | in_app / subtle / strong |
| Social mode | Off | Less aggressive re-prompts when eating with others |

## Data Export

From Settings, export all data as:

- **JSON** — complete dump of sessions, events, and settings
- **CSV** — session-level data in spreadsheet format

### JSON Export Schema

```json
{
  "sessions": [
    {
      "id": "uuid",
      "startedAt": "2026-01-15T12:00:00.000Z",
      "endedAt": "2026-01-15T12:25:00.000Z",
      "mode": "quick",
      "context": { "location": "home", "social": "alone", "mealType": "lunch" },
      "finalSummary": { "finalFullness": 7, "overshot": false, "discomfort": 2, "amountLeft": "few_bites" },
      "status": "ended"
    }
  ],
  "events": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "ts": "2026-01-15T12:05:00.000Z",
      "type": "fullness_rated",
      "fullnessRating": 4,
      "nextIntervalSec": 180,
      "responseDelayMs": 3200
    }
  ],
  "settings": { "..." }
}
```

## Home Assistant Integration

SavorCue can optionally mirror events to Home Assistant via webhook.

### Setup

1. In Home Assistant, create a webhook automation and copy the URL
2. In SavorCue Settings → Home Assistant, paste the webhook URL
3. Enable "Mirror events to HA"

### Events Sent

- `session_started`
- `prompt_shown`
- `fullness_rated`
- `unlock_success`
- `done_flow_shown`
- `session_ended`

Each event is POSTed as JSON. The app continues normally if HA is unreachable.

## GitHub Pages Deployment

### Automatic (GitHub Actions)

Push to `main` and the included workflow will build and deploy.

1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to `main`

### Manual

```bash
npm run build
# Upload the contents of dist/ to your GitHub Pages branch
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- IndexedDB via `idb`
- React Router (HashRouter for GitHub Pages compatibility)
- No backend required

## Project Structure

```
src/
  types.ts          — Data model types
  defaults.ts       — Default settings and interval mapping
  db.ts             — IndexedDB persistence layer
  engine.ts         — Session state machine and timer engine
  analytics.ts      — Analytics computation
  ha.ts             — Home Assistant webhook integration
  context.tsx       — React context provider
  screens/
    HomeScreen.tsx        — Start screen
    PreMealScreen.tsx     — Pre-meal context form
    ActiveMealScreen.tsx  — Main meal flow (prompts, unlock, pause, done)
    EndMealScreen.tsx     — End-of-meal summary form
    SummaryScreen.tsx     — Post-meal summary view
    AnalyticsScreen.tsx   — Analytics dashboard
    HistoryScreen.tsx     — Meal history list
    SettingsScreen.tsx    — All settings
```

## License

MIT
