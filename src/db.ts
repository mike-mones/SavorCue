import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import type { MealSession, MealEvent, AppSettings } from './types';
import { DEFAULT_SETTINGS } from './defaults';

const DB_NAME = 'savorcue';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('status', 'status');
          sessions.createIndex('startedAt', 'startedAt');
        }
        if (!db.objectStoreNames.contains('events')) {
          const events = db.createObjectStore('events', { keyPath: 'id' });
          events.createIndex('sessionId', 'sessionId');
          events.createIndex('ts', 'ts');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// === Sessions ===

export async function saveSession(session: MealSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getSession(id: string): Promise<MealSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function getAllSessions(): Promise<MealSession[]> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getActiveSession(): Promise<MealSession | undefined> {
  const db = await getDB();
  const all = await db.getAllFromIndex('sessions', 'status', 'active');
  return all[0];
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
  // Also delete all events for this session
  const events = await db.getAllFromIndex('events', 'sessionId', id);
  const tx = db.transaction('events', 'readwrite');
  for (const event of events) {
    await tx.store.delete(event.id);
  }
  await tx.done;
}

// === Events ===

export async function saveEvent(event: MealEvent): Promise<void> {
  const db = await getDB();
  await db.put('events', event);
}

export async function getEventsForSession(sessionId: string): Promise<MealEvent[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('events', 'sessionId', sessionId);
  return all.sort((a, b) => a.ts.localeCompare(b.ts));
}

export async function getAllEvents(): Promise<MealEvent[]> {
  const db = await getDB();
  return db.getAll('events');
}

// === Settings ===

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDB();
  const row = await db.get('settings', 'app');
  return row?.value ?? { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'app', value: settings });
}

// === Export ===

export async function exportAllData(): Promise<string> {
  const sessions = await getAllSessions();
  const events = await getAllEvents();
  const settings = await loadSettings();
  return JSON.stringify({ sessions, events, settings }, null, 2);
}

export async function exportCSV(): Promise<string> {
  const sessions = await getAllSessions();
  const headers = [
    'id', 'startedAt', 'endedAt', 'mode', 'status',
    'location', 'social', 'mealType', 'hungerBefore',
    'finalFullness', 'overshot', 'discomfort', 'amountLeft',
  ];
  const rows = sessions.map(s => [
    s.id,
    s.startedAt,
    s.endedAt ?? '',
    s.mode,
    s.status,
    s.context?.location ?? '',
    s.context?.social ?? '',
    s.context?.mealType ?? '',
    s.context?.hungerBefore?.toString() ?? '',
    s.finalSummary?.finalFullness?.toString() ?? '',
    s.finalSummary?.overshot?.toString() ?? '',
    s.finalSummary?.discomfort?.toString() ?? '',
    s.finalSummary?.amountLeft ?? '',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
