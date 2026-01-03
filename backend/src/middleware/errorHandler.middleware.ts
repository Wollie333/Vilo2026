import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, isAppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 * Must be registered last in the middleware chain
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error details
  const errorContext = {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  // Handle known AppError instances
  if (isAppError(err)) {
    // Log at appropriate level based on status code
    if (err.statusCode >= 500) {
      logger.error('Internal server error', { error: err, ...errorContext });
    } else if (err.statusCode >= 400) {
      logger.warn('Client error', { error: err, ...errorContext });
    }

    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Zod validation errors (if they somehow bypass validate middleware)
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || 'value';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }

    logger.warn('Validation error', { errors, ...errorContext });
    sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, { errors });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT error', { error: err.message, ...errorContext });
    sendError(res, 'UNAUTHORIZED', 'Invalid token', 401);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn('Token expired', { error: err.message, ...errorContext });
    sendError(res, 'UNAUTHORIZED', 'Token has expired', 401);
    return;
  }

  // Handle Supabase errors
  if (err.message?.includes('JWT')) {
    logger.warn('Supabase JWT error', { error: err.message, ...errorContext });
    sendError(res, 'UNAUTHORIZED', 'Authentication failed', 401);
    return;
  }

  // Handle unexpected errors
  logger.error('Unexpected error', {
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    ...errorContext,
  });

  // Don't expose internal error details in production
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev ? err.message : 'An unexpected error occurred';
  const details = isDev ? { stack: err.stack } : undefined;

  sendError(res, 'INTERNAL_ERROR', message, 500, details);
};

/**
 * 404 Not Found handler
 * Catches requests to undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404);
};

/**
 * Async handler wrapper to catch async errors
 * Use this to wrap async route handlers
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
