import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom Error class untuk aplikasi
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Validation Error class
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error class
 */
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

/**
 * Authorization Error class
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * Not Found Error class
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Internal Server Error class
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Centralized Error Handler Middleware
 * Harus dipasang paling akhir setelah semua route
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof SyntaxError) {
    // Handle JSON parsing errors
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err instanceof Error) {
    // Handle generic errors
    message = err.message;

    // Log the full error stack in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', err);
    }
  }

  // Log error dengan structured format
  logger.error({
    statusCode,
    message,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.idUser,
    details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      statusCode,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

/**
 * Async handler wrapper untuk menangkap errors di async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
