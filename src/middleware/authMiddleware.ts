import { Request, Response, NextFunction } from 'express';
import { supabaseServer } from '../lib/supabaseServer';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    
    // Validate token with Supabase
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Attach supabase user to request
    req.supabaseUser = user;

    // Fetch user details from our local DB to get their role and exact name
    const [localUser] = await db.select().from(schema.users).where(eq(schema.users.email, user.email || '')).limit(1);
    
    if (localUser) {
      // Attach local user details to request
      req.user = {
        idUser: localUser.idUser,
        namaLengkap: localUser.namaLengkap,
        email: localUser.email,
        role: localUser.role,
        supabaseId: localUser.uid
      };
    } else {
      // User authenticated via Supabase but not yet in local DB.
      // Allow them through so /api/profile can auto-create their record.
      logger.info({ email: user.email }, 'Authenticated user not in local DB — allowing through for auto-registration');
    }

    next();
  } catch (err) {
    logger.error({ err }, 'verifyToken middleware error');
    return res.status(500).json({ error: 'Internal Server Error during authentication' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Forbidden: No role assigned' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]` });
    }
    
    next();
  };
}
