import express, { Request, Response } from 'express';

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

export default router;
