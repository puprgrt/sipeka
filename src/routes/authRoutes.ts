import express, { Request, Response } from 'express';
import { readSsoSettings } from '../utils/configHelper';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const router = express.Router();
const CF_TURNSTILE_SECRET = process.env.CF_TURNSTILE_SECRET || '1x0000000000000000000000000000000AA'; // testing secret

router.post('/api/auth/verify-turnstile', async (req: Request, res: Response): Promise<any> => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Turnstile token missing.' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', CF_TURNSTILE_SECRET);
    formData.append('response', token);
    
    // Opsional: jika ingin mengirim IP client
    // const ip = req.headers['cf-connecting-ip'] || req.ip;
    // if (ip) formData.append('remoteip', ip as string);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST',
    });

    const outcome = await result.json();
    
    if (outcome.success) {
      return res.json({ success: true, message: 'Verifikasi berhasil.' });
    } else {
      return res.status(400).json({ success: false, message: 'Verifikasi gagal.', details: outcome['error-codes'] });
    }
  } catch (error) {
    console.error("Turnstile error:", error);
    return res.status(500).json({ success: false, message: 'Server error saat memverifikasi captcha.' });
  }
});

// Helper function to decode JWT payload without verification (as fallback when API Gateway is offline)
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const data = JSON.parse(jsonStr);
      return {
        username: data.user_metadata?.full_name || data.user_metadata?.name || data.preferred_username || data.sub || (data.email ? data.email.split('@')[0] : 'User'),
        email: data.email || (data.sub ? `${data.sub}@garutkab.go.id` : null),
        role: data.app_metadata?.role || data.role || 'Guest',
      };
    }
  } catch (err) {
    logger.warn({ err }, 'Failed to decode JWT payload');
  }
  return null;
}

// === SSO PUPR-ID AUTH ENDPOINTS ===

/**
 * POST /api/auth/sso/pupr-id
 * Receives a token from puprID after the user logs in there.
 * Validates token against puprID API Gateway or falls back to JWT token parsing,
 * syncs the user into sipeka's local DB (auto-create if enabled), and returns user info.
 */
router.post('/api/auth/sso/pupr-id', async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token puprID tidak ditemukan.' });
    }

    const ssoConfig = await readSsoSettings();
    if (!ssoConfig.enabled) {
      return res.status(403).json({ success: false, message: 'Integrasi SSO puprID tidak diaktifkan.' });
    }

    const apiGatewayUrl = (ssoConfig.puprIdApiGatewayUrl || '').replace(/\/$/, '');
    let puprIdUser: any = null;

    // Strategy 1: Try API Gateway userinfo endpoint if configured
    if (apiGatewayUrl) {
      try {
        const userinfoRes = await fetch(`${apiGatewayUrl}/api/v1/userinfo`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });

        if (userinfoRes.ok) {
          puprIdUser = await userinfoRes.json();
        }
      } catch (fetchErr: any) {
        logger.warn({ err: fetchErr }, 'API Gateway unreachable — falling back to JWT payload decode');
      }
    }

    // Strategy 2: Fallback to JWT payload decoding
    if (!puprIdUser) {
      puprIdUser = decodeJwtPayload(token);
    }

    if (!puprIdUser || (!puprIdUser.email && !puprIdUser.username)) {
      return res.status(401).json({
        success: false,
        message: 'Token puprID tidak valid atau data profil pengguna tidak dapat dibaca.',
      });
    }

    const puprIdRole = puprIdUser.role || 'Guest';
    const email = puprIdUser.email || (puprIdUser.username ? `${puprIdUser.username}@garutkab.go.id` : 'user@garutkab.go.id');
    const displayName = puprIdUser.username || email.split('@')[0];

    const roleMapping: Record<string, string> = {
      'Super Admin': 'Administrator',
      'Admin': 'Administrator',
      'Administrator': 'Administrator',
      'Tim Teknis': 'Tim_Teknis',
      'Petugas': 'Petugas_Survey',
      'Surveyor': 'Petugas_Survey',
      'Operator': 'Operator',
      'Koordinator': 'Koordinator',
      'Kepala Dinas': 'Kadis',
      'Kadis': 'Kadis',
      'Pengelola': 'Pengelola_Bangunan',
      'Guest': 'Pengelola_Bangunan'
    };

    let sipekaRole = roleMapping[puprIdRole];
    if (!sipekaRole) {
      const ssoRoleMapping = ssoConfig.roleMapping || {};
      sipekaRole = ssoRoleMapping[puprIdRole] || ssoConfig.defaultRole || 'Pengelola_Bangunan';
      logger.info({ puprIdRole, sipekaRole }, 'SSO Role unmapped, falling back to default role');
    }

    // Check if user exists in sipeka DB
    let [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    if (existingUser) {
      logger.info({ email, puprIdRole, sipekaRole }, 'SSO user found in sipeka DB');
    } else if (ssoConfig.autoCreateUser || sipekaRole === 'Administrator') {
      // Auto-create user (Always allow for Administrators to prevent lockout)
      const uid = `puprid_${puprIdUser.username || Date.now()}`;
      const [newUser] = await db.insert(schema.users).values({
        uid,
        namaLengkap: displayName,
        email,
        role: sipekaRole as any,
      }).returning();

      existingUser = newUser;
      logger.info({ email, uid, role: sipekaRole }, 'SSO auto-created new user in sipeka DB');
    } else {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda belum terdaftar di SI-PEKA dan auto-provisioning dinonaktifkan.',
      });
    }

    // Return user info for the frontend to establish local session
    return res.json({
      success: true,
      message: `Selamat datang, ${existingUser.namaLengkap}!`,
      user: {
        idUser: existingUser.idUser,
        namaLengkap: existingUser.namaLengkap,
        email: existingUser.email,
        role: existingUser.role,
        uid: existingUser.uid,
      },
      ssoSource: 'puprID',
    });
  } catch (error: any) {
    logger.error({ err: error }, 'SSO pupr-id auth error');
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal saat memproses login SSO.',
    });
  }
});

export default router;

