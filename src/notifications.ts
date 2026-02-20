import { getMessaging, getToken } from 'firebase/messaging';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';

let fcmToken: string | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') {
    await initFCMToken();
    return true;
  }
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await initFCMToken();
    return true;
  }
  return false;
}

async function initFCMToken(): Promise<void> {
  try {
    const messaging = getMessaging(getApp());
    // You need to generate a VAPID key in Firebase Console > Project Settings > Cloud Messaging
    fcmToken = await getToken(messaging, {
      vapidKey: '', // Will be set after console setup
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    });
  } catch {
    fcmToken = null;
  }
}

export function getFCMToken(): string | null {
  return fcmToken;
}

export function showNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/icon-192.png',
    tag: 'savorcue-prompt',
  } as NotificationOptions);
}

// Schedule a push notification via Cloud Function
export async function schedulePushNotification(
  uid: string,
  sessionId: string,
  delaySec: number,
): Promise<void> {
  const token = getFCMToken();
  if (!token || delaySec <= 0) return;

  try {
    const functions = getFunctions(getApp());
    const schedule = httpsCallable(functions, 'schedulePrompt');
    await schedule({ uid, fcmToken: token, delaySec, sessionId });
  } catch {
    // Fallback to local notification handled by the app
  }
}

// Cancel pending push notifications
export async function cancelPushNotifications(
  uid: string,
  sessionId: string,
): Promise<void> {
  const token = getFCMToken();
  if (!token) return;

  try {
    const functions = getFunctions(getApp());
    const cancel = httpsCallable(functions, 'cancelPrompts');
    await cancel({ uid, sessionId });
  } catch {
    // Ignore
  }
}
