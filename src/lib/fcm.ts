import { getMessaging, getToken } from "firebase/messaging";
import { getApp } from "firebase/app";

export async function requestFcmToken(uid: string) {
  try {
    const messaging = getMessaging(getApp());
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { 
        // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
      });
      if (token) {
        console.log("FCM Token obtained");
        // Send to backend
        await fetch("/api/users/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, token })
        });
      }
    }
  } catch (error) {
    console.error("FCM Token error:", error);
  }
}
