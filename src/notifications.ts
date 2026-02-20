import { getApp } from 'firebase/app';

let fcmToken: string | null = null;
let initError: string | null = null;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    initError = 'Notification API not available';
    return false;
  }
  if (Notification.permission === 'granted') {
    await initFCMToken();
    return true;
  }
  if (Notification.permission === 'denied') {
    initError = 'Notifications denied by user';
    return false;
  }
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    await initFCMToken();
    return true;
  }
  initError = `Permission result: ${result}`;
  return false;
}

async function initFCMToken(): Promise<void> {
  try {
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(getApp());
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    fcmToken = await getToken(messaging, {
      vapidKey: 'BBv5ledEIHpTOeinm4m7xkb4y3PDIvxsQTxTsWCjEK-xgULZIHVPaoJiYdhtE_J4dDv4NXA0Q85TBA3mEYVUbn8',
      serviceWorkerRegistration: reg,
    });
    initError = fcmToken ? null : 'getToken returned empty';
  } catch (e) {
    fcmToken = null;
    initError = e instanceof Error ? e.message : String(e);
  }
}

export function getFCMToken(): string | null {
  return fcmToken;
}

export function getNotificationDebugInfo(): string {
  const lines: string[] = [];
  lines.push(`Permission: ${typeof Notification !== 'undefined' ? Notification.permission : 'N/A'}`);
  lines.push(`FCM token: ${fcmToken ? fcmToken.substring(0, 20) + '...' : 'none'}`);
  lines.push(`Error: ${initError ?? 'none'}`);
  lines.push(`SW support: ${'serviceWorker' in navigator}`);
  return lines.join('\n');
}

export function showNotification(title: string, body: string): void {
  // Try service worker notification first (works better in PWA)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: '/icon-192.png',
        tag: 'savorcue-prompt',
      });
    });
    return;
  }
  // Fallback to Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png', tag: 'savorcue-prompt' } as NotificationOptions);
  }
}

export async function schedulePushNotification(
  uid: string,
  sessionId: string,
  delaySec: number,
  ntfyTopic?: string,
): Promise<void> {
  const token = getFCMToken();
  if ((!token && !ntfyTopic) || delaySec <= 0) return;

  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions(getApp());
    const schedule = httpsCallable(functions, 'schedulePrompt');
    await schedule({ uid, fcmToken: token, delaySec, sessionId, ntfyTopic: ntfyTopic || null });
  } catch {
    // Fallback to local notification handled by the app
  }
}

export async function cancelPushNotifications(
  uid: string,
  sessionId: string,
): Promise<void> {
  const token = getFCMToken();
  if (!token) return;

  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions(getApp());
    const cancel = httpsCallable(functions, 'cancelPrompts');
    await cancel({ uid, sessionId });
  } catch {
    // Ignore
  }
}
