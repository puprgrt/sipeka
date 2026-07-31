import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from './errorHandler';

/**
 * Validation Middleware Factory
 * Gunakan untuk validate request body, params, atau query
 */

interface ValidationOptions {
  onError?: (errors: z.ZodError) => string;
}

/**
 * Validate request body
 */
export const validateBody = (schema: z.ZodType, options?: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = options?.onError?.(error) || formatZodError(error);
        throw new ValidationError(message, error.issues);
      }
      throw error;
    }
  };
};

/**
 * Validate request params
 */
export const validateParams = (schema: z.ZodType, options?: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = options?.onError?.(error) || formatZodError(error);
        throw new ValidationError(`Invalid URL parameters: ${message}`, error.issues);
      }
      throw error;
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodType, options?: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = options?.onError?.(error) || formatZodError(error);
        throw new ValidationError(`Invalid query parameters: ${message}`, error.issues);
      }
      throw error;
    }
  };
};

/**
 * Format Zod validation errors ke message yang user-friendly
 */
function formatZodError(error: z.ZodError): string {
  const issueList = error.issues
    .map(issue => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    })
    .join('; ');

  return `Validation failed: ${issueList}`;
}

/**
 * Null coalesce validator - untuk optional fields dengan default values
 */
export const coerceSchema = (schema: z.ZodType) => {
  return schema;
};
