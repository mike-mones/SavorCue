const { onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const ESCALATION_MESSAGES = [
  "How full are you right now?",
  "Don't forget to check in — how full are you?",
  "Still eating? Take a moment to rate your fullness.",
  "Hey! SavorCue is waiting for your check-in.",
  "Reminder: rate your fullness now.",
];

// Client calls this to schedule a push notification
exports.schedulePrompt = onCall(async (request) => {
  const { uid, fcmToken, delaySec, sessionId, ntfyTopic } = request.data;
  if (!uid || !delaySec || !sessionId) {
    throw new Error("Missing required fields");
  }

  const sendAt = new Date(Date.now() + delaySec * 1000);

  await db.collection("scheduledNotifications").add({
    uid,
    fcmToken: fcmToken || null,
    ntfyTopic: ntfyTopic || null,
    sessionId,
    sendAt: admin.firestore.Timestamp.fromDate(sendAt),
    sent: false,
    attempt: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, sendAt: sendAt.toISOString() };
});

// Client calls this to cancel pending notifications (e.g. when user responds to prompt)
exports.cancelPrompts = onCall(async (request) => {
  const { uid, sessionId } = request.data;
  if (!uid || !sessionId) {
    throw new Error("Missing required fields");
  }

  const snap = await db
    .collection("scheduledNotifications")
    .where("uid", "==", uid)
    .where("sessionId", "==", sessionId)
    .where("sent", "==", false)
    .get();

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return { success: true, cancelled: snap.size };
});

// Runs every minute, sends any due notifications and schedules follow-ups
exports.sendDueNotifications = onSchedule("* * * * *", async () => {
  const now = admin.firestore.Timestamp.now();

  const snap = await db
    .collection("scheduledNotifications")
    .where("sent", "==", false)
    .where("sendAt", "<=", now)
    .limit(100)
    .get();

  if (snap.empty) return;

  const batch = db.batch();

  for (const doc of snap.docs) {
    const data = doc.data();
    const { fcmToken, ntfyTopic, sessionId, uid, attempt = 0 } = data;
    const message = ESCALATION_MESSAGES[Math.min(attempt, ESCALATION_MESSAGES.length - 1)];
    const priority = Math.min(3 + attempt, 5); // escalate priority

    // Send via FCM if token exists
    if (fcmToken) {
      try {
        await messaging.send({
          token: fcmToken,
          notification: { title: "SavorCue", body: message },
          webpush: {
            notification: {
              icon: "/icon-192.png",
              tag: "savorcue-prompt",
              renotify: true,
              requireInteraction: true,
            },
            fcmOptions: { link: "https://savorcue.web.app/meal" },
          },
        });
      } catch {
        // Token may be invalid
      }
    }

    // Send via ntfy if topic exists
    if (ntfyTopic) {
      try {
        await fetch("https://ntfy.sh", {
          method: "POST",
          body: JSON.stringify({
            topic: ntfyTopic,
            title: "SavorCue",
            message,
            click: "https://savorcue.web.app/meal",
            priority,
          }),
        });
      } catch {
        // ntfy unavailable
      }
    }

    // Mark this one as sent
    batch.update(doc.ref, { sent: true });

    // Schedule a follow-up in 60 seconds if not too many attempts (max 10)
    if (attempt < 10) {
      const followUpAt = new Date(Date.now() + 60 * 1000);
      const followUpRef = db.collection("scheduledNotifications").doc();
      batch.set(followUpRef, {
        uid,
        fcmToken: fcmToken || null,
        ntfyTopic: ntfyTopic || null,
        sessionId,
        sendAt: admin.firestore.Timestamp.fromDate(followUpAt),
        sent: false,
        attempt: attempt + 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
});
