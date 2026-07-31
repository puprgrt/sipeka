import { Request, Response, NextFunction } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

/**
 * HTTP Request/Response Logger Middleware
 * Menggunakan pino-http untuk tracking semua request
 */
export const createHttpLogger = () => {
  return pinoHttp({
    logger,
    // Custom settings
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    // Sanitize sensitive data
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.refreshToken',
        'req.body.accessToken',
      ],
      remove: true,
    },
    // Custom message
    customSuccessMessage: (req, res) => {
      if (res.statusCode === 404) {
        return `route not found: ${req.method} ${req.url}`;
      }
      return `${req.method} ${req.url} completed`;
    },
    customErrorMessage: (req, res, err) => {
      return `request errored with status code ${res.statusCode}`;
    },
  });
};

/**
 * Logger middleware untuk mencatat aktivitas user
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.idUser;
  const email = (req as any).user?.email;

  if (userId) {
    // Add user info ke logger context
    (req as any).log = logger.child({ userId, email });
  }

  next();
};
