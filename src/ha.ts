import type { AppSettings, MealEventType } from './types';

export async function mirrorEvent(
  settings: AppSettings,
  eventType: MealEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!settings.haEventMirroring || !settings.haWebhookUrl) return;

  try {
    const url = settings.haWebhookUrl;
    // Validate URL format before sending
    new URL(url);

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventType, ...payload }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Never block app flow if HA is unavailable
  }
}
