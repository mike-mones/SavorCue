import { v4 as uuidv4 } from 'uuid';
import type {
  ActiveSession,
  AppSettings,
  MealContext,
  MealEvent,
  MealEventType,
  MealMode,
  MealSession,
  TimerState,
  FinalSummary,
} from './types';
import { getIntervalForRating } from './defaults';
import { saveSession, saveEvent, getEventsForSession, getActiveSession, deleteSession } from './db';
import { mirrorEvent } from './ha';
import { syncSessionToCloud, syncEventToCloud, deleteSessionFromCloud } from './cloud';
import { showNotification, schedulePushNotification, cancelPushNotifications } from './notifications';

const ACTIVE_SESSION_KEY = 'savorcue_active_session';

// === Persistence in sessionStorage for crash recovery ===

function persistActiveSession(active: ActiveSession): void {
  try {
    sessionStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(active));
  } catch { /* ignore */ }
}

function loadPersistedActiveSession(): ActiveSession | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPersistedActiveSession(): void {
  sessionStorage.removeItem(ACTIVE_SESSION_KEY);
}

// === Event logging ===

function createEvent(
  sessionId: string,
  type: MealEventType,
  extra?: Partial<MealEvent>,
): MealEvent {
  return {
    id: uuidv4(),
    sessionId,
    ts: new Date().toISOString(),
    type,
    ...extra,
  };
}

async function logEvent(
  event: MealEvent,
  settings: AppSettings,
  uid: string | null,
): Promise<void> {
  await saveEvent(event);
  if (uid) syncEventToCloud(uid, event).catch(() => {});
  await mirrorEvent(settings, event.type, {
    sessionId: event.sessionId,
    fullnessRating: event.fullnessRating,
    ts: event.ts,
  });
}

// === Timer helpers ===

function schedulePromptAt(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function emptyTimer(): TimerState {
  return {
    nextPromptAt: null,
    pauseEndsAt: null,
    unlockWindowEndsAt: null,
    promptShownAt: null,
  };
}

// === Session Engine ===

export class SessionEngine {
  private active: ActiveSession | null = null;
  private settings: AppSettings;
  private listeners: Set<() => void> = new Set();
  private uid: string | null = null;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  setUid(uid: string | null): void {
    this.uid = uid;
  }

  updateSettings(settings: AppSettings): void {
    this.settings = settings;
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    if (this.active) persistActiveSession(this.active);
    this.listeners.forEach((fn) => fn());
  }

  getActive(): ActiveSession | null {
    return this.active;
  }

  // === Restore session on reload ===

  async restore(): Promise<boolean> {
    // First try sessionStorage (in-progress state)
    const persisted = loadPersistedActiveSession();
    if (persisted && persisted.session.status === 'active') {
      this.active = persisted;
      // Reconcile missed prompts etc.
      this.reconcileAfterResume();
      this.notify();
      return true;
    }

    // Then try IndexedDB
    const dbSession = await getActiveSession();
    if (dbSession) {
      const events = await getEventsForSession(dbSession.id);
      const lastRating = this.findLastFullness(events);
      this.active = {
        session: dbSession,
        state: 'active_waiting_for_prompt_time',
        timer: emptyTimer(),
        events,
        lastFullnessRating: lastRating,
      };
      this.reconcileAfterResume();
      this.notify();
      return true;
    }

    return false;
  }

  private findLastFullness(events: MealEvent[]): number | null {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'fullness_rated' && events[i].fullnessRating != null) {
        return events[i].fullnessRating!;
      }
    }
    return null;
  }

  private reconcileAfterResume(): void {
    if (!this.active) return;

    const now = Date.now();
    const timer = this.active.timer;

    // If we were waiting for a prompt and it's past due, show it now
    if (
      this.active.state === 'active_waiting_for_prompt_time' &&
      timer.nextPromptAt &&
      new Date(timer.nextPromptAt).getTime() <= now
    ) {
      this.active.state = 'active_waiting_for_fullness_input';
      this.active.timer.promptShownAt = new Date().toISOString();
    }

    // If pause has ended
    if (
      this.active.state === 'pause' &&
      timer.pauseEndsAt &&
      new Date(timer.pauseEndsAt).getTime() <= now
    ) {
      this.active.state = 'active_waiting_for_fullness_input';
      this.active.timer.pauseEndsAt = null;
      this.active.timer.promptShownAt = new Date().toISOString();
    }

    // If unlock window expired
    if (
      timer.unlockWindowEndsAt &&
      new Date(timer.unlockWindowEndsAt).getTime() <= now
    ) {
      this.active.timer.unlockWindowEndsAt = null;
      // Re-prompt
      this.active.state = 'active_waiting_for_fullness_input';
      this.active.timer.promptShownAt = new Date().toISOString();
    }
  }

  // === Start Meal ===

  async startMeal(
    mode: MealMode = 'quick',
    context?: MealContext,
  ): Promise<ActiveSession> {
    const session: MealSession = {
      id: uuidv4(),
      startedAt: new Date().toISOString(),
      mode,
      context,
      status: 'active',
    };

    await saveSession(session);
    if (this.uid) syncSessionToCloud(this.uid, session).catch(() => {});

    const startEvent = createEvent(session.id, 'session_started', {
      metadata: { mode, context },
    });
    await logEvent(startEvent, this.settings, this.uid);

    const firstInterval = getIntervalForRating(0, this.settings);

    this.active = {
      session,
      state: 'active_waiting_for_prompt_time',
      timer: {
        nextPromptAt: schedulePromptAt(firstInterval),
        pauseEndsAt: null,
        unlockWindowEndsAt: null,
        promptShownAt: null,
      },
      events: [startEvent],
      lastFullnessRating: null,
    };

    // Schedule push notification
    if (this.uid && firstInterval > 0) {
      schedulePushNotification(this.uid, session.id, firstInterval, this.settings.ntfyTopic).catch(() => {});
    }

    this.notify();
    return this.active;
  }

  // === Show prompt (called by tick) ===

  async showPrompt(): Promise<void> {
    if (!this.active) return;

    this.active.state = 'active_waiting_for_fullness_input';
    this.active.timer.promptShownAt = new Date().toISOString();
    this.active.timer.nextPromptAt = null;

    const event = createEvent(this.active.session.id, 'prompt_shown');
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);

    showNotification('SavorCue', 'How full are you right now?');

    // Vibrate the device if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    this.notify();
  }

  // === Rate fullness ===

  async rateFullness(rating: number): Promise<void> {
    if (!this.active) return;

    const promptShown = this.active.timer.promptShownAt;
    const responseDelay = promptShown
      ? Date.now() - new Date(promptShown).getTime()
      : undefined;

    const interval = getIntervalForRating(rating, this.settings);

    const event = createEvent(this.active.session.id, 'fullness_rated', {
      fullnessRating: rating,
      nextIntervalSec: interval,
      responseDelayMs: responseDelay,
    });
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);
    this.active.lastFullnessRating = rating;

    // Decide next state
    if (rating >= this.settings.doneThreshold) {
      await this.triggerDoneFlow();
    } else if (rating >= this.settings.highFullnessThreshold) {
      await this.triggerUnlockPrompt();
    } else {
      // Schedule next prompt
      this.active.state = 'active_waiting_for_prompt_time';
      this.active.timer = {
        ...this.active.timer,
        nextPromptAt: schedulePromptAt(interval),
        promptShownAt: null,
      };

      // Schedule push notification
      if (this.uid && interval > 0) {
        cancelPushNotifications(this.uid, this.active.session.id).catch(() => {});
        schedulePushNotification(this.uid, this.active.session.id, interval, this.settings.ntfyTopic).catch(() => {});
      }
    }

    this.notify();
  }

  // === Handle ignored prompt ===

  async handleIgnoredPrompt(): Promise<void> {
    if (!this.active) return;

    const event = createEvent(this.active.session.id, 'prompt_ignored');
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);

    // Re-prompt after reprompt interval
    const repromptSec = this.settings.socialMode
      ? this.settings.ignoredPromptRepromptSec * 3
      : this.settings.ignoredPromptRepromptSec;

    this.active.state = 'active_waiting_for_prompt_time';
    this.active.timer.nextPromptAt = schedulePromptAt(repromptSec);
    this.active.timer.promptShownAt = null;

    this.notify();
  }

  // === Unlock flow ===

  private async triggerUnlockPrompt(): Promise<void> {
    if (!this.active) return;

    this.active.state = 'active_high_fullness_unlock';

    const event = createEvent(this.active.session.id, 'unlock_prompt_shown');
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);
  }

  async attemptUnlock(input?: string): Promise<boolean> {
    if (!this.active) return false;

    const attemptEvent = createEvent(this.active.session.id, 'unlock_attempt', {
      metadata: { method: this.settings.unlockMethod },
    });
    await logEvent(attemptEvent, this.settings, this.uid);
    this.active.events.push(attemptEvent);

    let success = false;

    switch (this.settings.unlockMethod) {
      case 'tap':
        success = true;
        break;
      case 'hold':
        success = true; // hold duration validated in UI
        break;
      case 'type_code':
        success = input?.toUpperCase() === this.settings.unlockCode.toUpperCase();
        break;
    }

    if (success) {
      const successEvent = createEvent(this.active.session.id, 'unlock_success');
      await logEvent(successEvent, this.settings, this.uid);
      this.active.events.push(successEvent);

      // Grant unlock window
      this.active.state = 'active_waiting_for_prompt_time';
      this.active.timer = {
        ...this.active.timer,
        nextPromptAt: schedulePromptAt(this.settings.unlockWindowSec),
        unlockWindowEndsAt: schedulePromptAt(this.settings.unlockWindowSec),
        promptShownAt: null,
      };

      // Schedule push
      if (this.uid) {
        cancelPushNotifications(this.uid, this.active.session.id).catch(() => {});
        schedulePushNotification(this.uid, this.active.session.id, this.settings.unlockWindowSec, this.settings.ntfyTopic).catch(() => {});
      }
    } else {
      const deniedEvent = createEvent(this.active.session.id, 'unlock_denied');
      await logEvent(deniedEvent, this.settings, this.uid);
      this.active.events.push(deniedEvent);
    }

    this.notify();
    return success;
  }

  // === Done flow ===

  private async triggerDoneFlow(): Promise<void> {
    if (!this.active) return;

    this.active.state = 'done_flow';

    const event = createEvent(this.active.session.id, 'done_flow_shown');
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);
  }

  // === Pause ===

  async startPause(): Promise<void> {
    if (!this.active) return;

    this.active.state = 'pause';
    this.active.timer.pauseEndsAt = schedulePromptAt(this.settings.doneFlowPauseSec);
    this.active.timer.nextPromptAt = null;

    const event = createEvent(this.active.session.id, 'pause_started');
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);

    this.notify();
  }

  async endPause(): Promise<void> {
    if (!this.active) return;

    this.active.state = 'active_waiting_for_fullness_input';
    this.active.timer.pauseEndsAt = null;
    this.active.timer.promptShownAt = new Date().toISOString();

    const event = createEvent(this.active.session.id, 'pause_ended');
    await logEvent(event, this.settings, this.uid);
    this.active.events.push(event);

    this.notify();
  }

  // === Continue from done flow (with unlock) ===

  async continueFromDone(): Promise<void> {
    if (!this.active) return;
    // Transition to unlock flow
    this.active.state = 'active_high_fullness_unlock';
    this.notify();
  }

  // === End Meal ===

  async endMeal(summary?: FinalSummary): Promise<MealSession> {
    if (!this.active) throw new Error('No active session');

    const session = this.active.session;
    session.endedAt = new Date().toISOString();
    session.status = 'ended';
    if (summary) session.finalSummary = summary;

    await saveSession(session);
    if (this.uid) syncSessionToCloud(this.uid, session).catch(() => {});

    const event = createEvent(session.id, 'session_ended', {
      metadata: { summary },
    });
    await logEvent(event, this.settings, this.uid);

    const result = { ...session };
    this.active = null;
    clearPersistedActiveSession();
    // Cancel any pending push notifications
    if (this.uid) cancelPushNotifications(this.uid, session.id).catch(() => {});
    this.notify();
    return result;
  }

  // === Abandon ===

  async abandonMeal(): Promise<void> {
    if (!this.active) return;
    this.active.session.status = 'abandoned';
    this.active.session.endedAt = new Date().toISOString();
    await saveSession(this.active.session);
    if (this.uid) syncSessionToCloud(this.uid, this.active.session).catch(() => {});
    this.active = null;
    clearPersistedActiveSession();
    this.notify();
  }

  // === Delete current meal (accidental start) ===

  async deleteCurrentMeal(): Promise<void> {
    if (!this.active) return;
    const id = this.active.session.id;
    this.active = null;
    clearPersistedActiveSession();
    await deleteSession(id);
    if (this.uid) deleteSessionFromCloud(this.uid, id).catch(() => {});
    this.notify();
  }

  // === Tick (call from setInterval) ===

  tick(): void {
    if (!this.active) return;

    const now = Date.now();
    const timer = this.active.timer;

    // Check if prompt time has arrived
    if (
      this.active.state === 'active_waiting_for_prompt_time' &&
      timer.nextPromptAt &&
      new Date(timer.nextPromptAt).getTime() <= now
    ) {
      this.showPrompt();
      return;
    }

    // Check if pause has ended
    if (
      this.active.state === 'pause' &&
      timer.pauseEndsAt &&
      new Date(timer.pauseEndsAt).getTime() <= now
    ) {
      this.endPause();
      return;
    }
  }
}
