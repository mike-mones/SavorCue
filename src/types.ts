// === Data Model Types ===

export type MealMode = 'quick' | 'restaurant' | 'snack' | 'social' | 'custom';
export type SessionStatus = 'active' | 'paused' | 'ended' | 'abandoned';
export type LocationType = 'home' | 'restaurant' | 'other';
export type SocialType = 'alone' | 'with_people';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type HealthyIndulgent = 'healthy' | 'mixed' | 'indulgent';
export type AmountLeft = 'none' | 'few_bites' | '25_percent' | '50_percent_plus';
export type UnlockMethod = 'tap' | 'hold' | 'type_code';
export type NotificationStyle = 'in_app' | 'subtle' | 'strong';

export interface MealContext {
  location?: LocationType | null;
  social?: SocialType | null;
  mealType?: MealType | null;
  mealSource?: 'homecooked' | 'takeout' | null;
  estimatedCalories?: number | null;
  cuisine?: string | null;
  healthyIndulgent?: HealthyIndulgent | null;
  hungerBefore?: number | null;
  alcohol?: boolean | null;
  photoBlob?: string | null;  // base64 data URL
}

export interface FinalSummary {
  finalFullness?: number | null;
  overshot?: boolean | null;
  discomfort?: number | null;
  amountLeft?: AmountLeft | null;
  note?: string | null;
}

export interface MealSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  mode: MealMode;
  context?: MealContext;
  finalSummary?: FinalSummary;
  status: SessionStatus;
}

export type MealEventType =
  | 'session_started'
  | 'prompt_shown'
  | 'fullness_rated'
  | 'prompt_ignored'
  | 'unlock_prompt_shown'
  | 'unlock_attempt'
  | 'unlock_success'
  | 'unlock_denied'
  | 'pause_started'
  | 'pause_ended'
  | 'done_flow_shown'
  | 'session_ended'
  | 'settings_applied';

export interface MealEvent {
  id: string;
  sessionId: string;
  ts: string;
  type: MealEventType;
  fullnessRating?: number;
  nextIntervalSec?: number;
  responseDelayMs?: number;
  metadata?: Record<string, unknown>;
}

export interface AppSettings {
  promptScheduleByRating: Record<string, number>;
  highFullnessThreshold: number;
  doneThreshold: number;
  unlockMethod: UnlockMethod;
  unlockCode: string;
  unlockWindowSec: number;
  doneFlowPauseSec: number;
  ignoredPromptRepromptSec: number;
  notificationStyle: NotificationStyle;
  socialMode: boolean;
  haWebhookUrl?: string;
  haEventMirroring?: boolean;
}

// === Session State Machine Types ===

export type SessionState =
  | 'idle'
  | 'pre_meal'
  | 'active_waiting_for_prompt_time'
  | 'active_waiting_for_fullness_input'
  | 'active_high_fullness_unlock'
  | 'pause'
  | 'done_flow'
  | 'ended';

export interface TimerState {
  nextPromptAt: string | null;       // ISO timestamp
  pauseEndsAt: string | null;        // ISO timestamp
  unlockWindowEndsAt: string | null; // ISO timestamp
  promptShownAt: string | null;      // ISO timestamp when current prompt was shown
}

export interface ActiveSession {
  session: MealSession;
  state: SessionState;
  timer: TimerState;
  events: MealEvent[];
  lastFullnessRating: number | null;
}

// === Analytics Types ===

export interface AnalyticsSummary {
  totalMeals: number;
  avgMealDurationMin: number;
  avgFinalFullness: number;
  overshotRate: number;
  avgTimeToFullness7Min: number;
  avgResponseDelayMs: number;
  avgFullnessSlope: number;
  contextBreakdown: {
    homeOvershotRate: number;
    restaurantOvershotRate: number;
    aloneOvershotRate: number;
    withPeopleOvershotRate: number;
  };
  recommendations: string[];
}
