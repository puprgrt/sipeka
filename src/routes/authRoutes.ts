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

// === SSO PUPR-ID AUTH ENDPOINTS ===

/**
 * POST /api/auth/sso/pupr-id
 * Receives a token from puprID after the user logs in there.
 * Validates the token against puprID API Gateway's /api/v1/userinfo endpoint,
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
    if (!apiGatewayUrl) {
      return res.status(500).json({ success: false, message: 'URL API Gateway puprID belum dikonfigurasi.' });
    }

    // Validate token against puprID userinfo endpoint
    let puprIdUser: any;
    try {
      const userinfoRes = await fetch(`${apiGatewayUrl}/api/v1/userinfo`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!userinfoRes.ok) {
        logger.warn({ status: userinfoRes.status }, 'puprID userinfo validation failed');
        return res.status(401).json({
          success: false,
          message: 'Token puprID tidak valid atau telah kedaluwarsa.',
        });
      }

      puprIdUser = await userinfoRes.json();
    } catch (fetchErr: any) {
      logger.error({ err: fetchErr }, 'Failed to validate token against puprID API Gateway');
      return res.status(502).json({
        success: false,
        message: 'Gagal menghubungi API Gateway puprID untuk validasi token.',
      });
    }

    // Map puprID role to sipeka role
    const puprIdRole = puprIdUser.role || 'Guest';
    const roleMapping = ssoConfig.roleMapping || {};
    const sipekaRole = roleMapping[puprIdRole] || ssoConfig.defaultRole || 'Pengelola_Bangunan';

    const email = puprIdUser.email || `${puprIdUser.username}@garutkab.go.id`;
    const displayName = puprIdUser.username || email.split('@')[0];

    // Check if user exists in sipeka DB
    let [existingUser] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

    if (existingUser) {
      // Update existing user — sync name (role stays as configured in sipeka unless admin overrides)
      logger.info({ email, puprIdRole, sipekaRole }, 'SSO user found in sipeka DB');
    } else if (ssoConfig.autoCreateUser) {
      // Auto-create user
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
        message: 'Akun Anda belum terdaftar di SI-PEKA. Hubungi Administrator untuk mendaftarkan akun.',
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

