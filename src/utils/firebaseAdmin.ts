import { initializeApp, getApps, getApp, App } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";

let adminApp: App | undefined;

export function getFirebaseAdmin(): App | undefined {
  if (adminApp) return adminApp;

  try {
    if (getApps().length === 0) {
      adminApp = initializeApp();
      console.log("Firebase Admin initialized successfully.");
    } else {
      adminApp = getApp();
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }

  return adminApp;
}

export function getFirebaseMessaging(): Messaging | null {
  const app = getFirebaseAdmin();
  if (!app) return null;

  try {
    return getMessaging(app);
  } catch (error) {
    console.error("Failed to get Firebase Messaging:", error);
    return null;
  }
}

// Send a push notification to a specific FCM token
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return false;

  try {
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      ...(data ? { data } : {}),
    });
    console.log("FCM Notification sent to", fcmToken.substring(0, 20) + "...");
    return true;
  } catch (error) {
    console.error("Failed to send FCM notification:", error);
    return false;
  }
}
