import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from './firebase';
import type { MealSession, MealEvent, AppSettings } from './types';

function userSessionsCol(uid: string) {
  return collection(firestore, 'users', uid, 'sessions');
}

function userEventsCol(uid: string) {
  return collection(firestore, 'users', uid, 'events');
}

function userSettingsDoc(uid: string) {
  return doc(firestore, 'users', uid, 'settings', 'app');
}

// === Sessions ===

export async function syncSessionToCloud(uid: string, session: MealSession): Promise<void> {
  await setDoc(doc(userSessionsCol(uid), session.id), session);
}

export async function deleteSessionFromCloud(uid: string, sessionId: string): Promise<void> {
  await deleteDoc(doc(userSessionsCol(uid), sessionId));
  // Delete events for this session
  const q = query(userEventsCol(uid), where('sessionId', '==', sessionId));
  const snap = await getDocs(q);
  const batch = writeBatch(firestore);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function getAllSessionsFromCloud(uid: string): Promise<MealSession[]> {
  const snap = await getDocs(userSessionsCol(uid));
  return snap.docs.map((d) => d.data() as MealSession);
}

// === Events ===

export async function syncEventToCloud(uid: string, event: MealEvent): Promise<void> {
  await setDoc(doc(userEventsCol(uid), event.id), event);
}

export async function getAllEventsFromCloud(uid: string): Promise<MealEvent[]> {
  const snap = await getDocs(userEventsCol(uid));
  return snap.docs.map((d) => d.data() as MealEvent);
}

// === Settings ===

export async function syncSettingsToCloud(uid: string, settings: AppSettings): Promise<void> {
  await setDoc(userSettingsDoc(uid), settings);
}

export async function getSettingsFromCloud(uid: string): Promise<AppSettings | null> {
  const snap = await getDoc(userSettingsDoc(uid));
  return snap.exists() ? (snap.data() as AppSettings) : null;
}
