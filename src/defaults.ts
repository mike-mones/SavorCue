import type { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  promptScheduleByRating: {
    '0': 300,
    '1': 300,
    '2': 300,
    '3': 240,
    '4': 180,
    '5': 150,
    '6': 120,
    '7': 60,
    '8': 45,
    '9': 0,
    '10': 0,
  },
  highFullnessThreshold: 7,
  doneThreshold: 9,
  unlockMethod: 'type_code',
  unlockCode: 'MORE',
  unlockWindowSec: 60,
  doneFlowPauseSec: 120,
  ignoredPromptRepromptSec: 10,
  notificationStyle: 'in_app',
  socialMode: false,
  haWebhookUrl: '',
  haEventMirroring: false,
};

export function getIntervalForRating(rating: number, settings: AppSettings): number {
  const schedule = settings.promptScheduleByRating;
  // Try exact key first
  const exact = schedule[String(rating)];
  if (exact !== undefined) return exact;
  // Fallback to old grouped keys for backwards compat
  if (rating <= 2) return schedule['0-2'] ?? 300;
  if (rating <= 4) return schedule['3-4'] ?? 180;
  if (rating <= 6) return schedule['5-6'] ?? 120;
  if (rating === 7) return schedule['7'] ?? 60;
  if (rating === 8) return schedule['8'] ?? 45;
  return schedule['9-10'] ?? 0;
}
