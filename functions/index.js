const { onCall } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Client calls this to schedule a push notification
exports.schedulePrompt = onCall(async (request) => {
  const { uid, fcmToken, delaySec, sessionId } = request.data;
  if (!uid || !fcmToken || !delaySec || !sessionId) {
    throw new Error("Missing required fields");
  }

  const sendAt = new Date(Date.now() + delaySec * 1000);

  // Store the scheduled notification
  await db.collection("scheduledNotifications").add({
    uid,
    fcmToken,
    sessionId,
    sendAt: admin.firestore.Timestamp.fromDate(sendAt),
    sent: false,
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

// Runs every minute, sends any due notifications
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
    const { fcmToken } = doc.data();

    try {
      await messaging.send({
        token: fcmToken,
        notification: {
          title: "SavorCue",
          body: "How full are you right now?",
        },
        webpush: {
          notification: {
            icon: "/icon-192.png",
            tag: "savorcue-prompt",
            renotify: true,
            requireInteraction: true,
          },
          fcmOptions: {
            link: "https://savorcue.web.app/meal",
          },
        },
      });
    } catch {
      // Token may be invalid — ignore
    }

    batch.update(doc.ref, { sent: true });
  }

  await batch.commit();
});
