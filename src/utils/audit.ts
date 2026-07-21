import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { sendPushNotification } from './firebaseAdmin';
import { eq } from 'drizzle-orm';

export async function logAuditTrail(
  idPermohonan: string | null,
  req: express.Request,
  action: string,
  details: string
) {
  try {
    const email = req.user?.email || (req.headers["x-user-email"] as string) || "admin@sipeka.com";
    const name = req.user?.namaLengkap || (req.headers["x-user-name"] as string) || "Sistem Admin";
    const role = req.user?.role || (req.headers["x-user-role"] as string) || "Administrator";

    await db.insert(schema.auditTrails).values({
      idPermohonan,
      userEmail: email,
      userName: name,
      role: role,
      action: action,
      details: details,
    });
  } catch (error) {
    console.error("Failed to log audit trail:", error);
  }
}

export async function sendDisposisiNotification(
  userId: number,
  role: string,
  title: string,
  body: string,
  idPermohonan: string
) {
  try {
    await db.insert(schema.notifications).values({
      userId,
      targetRole: role,
      title,
      message: body,
      idPermohonan,
      isRead: false
    });

    const [user] = await db.select().from(schema.users).where(eq(schema.users.idUser, userId));
    if (user && user.fcmToken) {
      await sendPushNotification(user.fcmToken, title, body, { idPermohonan, type: 'DISPOSISI' });
    }
  } catch (err) {
    console.error("Failed to create disposisi notifications", err);
  }
}
