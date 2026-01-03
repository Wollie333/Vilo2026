import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';

/**
 * Validation target - which part of request to validate
 */
type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Format Zod validation errors into user-friendly messages
 */
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
};

/**
 * Middleware factory to validate request body against a Zod schema
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await schema.safeParseAsync(req.body);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw new AppError('VALIDATION_ERROR', 'Invalid request body', {
          errors,
        });
      }

      // Replace body with parsed data (applies defaults and transformations)
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory to validate query parameters against a Zod schema
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await schema.safeParseAsync(req.query);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw new AppError('VALIDATION_ERROR', 'Invalid query parameters', {
          errors,
        });
      }

      // Replace query with parsed data
      req.query = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory to validate URL parameters against a Zod schema
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await schema.safeParseAsync(req.params);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        throw new AppError('VALIDATION_ERROR', 'Invalid URL parameters', {
          errors,
        });
      }

      // Replace params with parsed data
      req.params = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware factory to validate multiple parts of a request
 */
export const validate = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const allErrors: Record<string, Record<string, string[]>> = {};

      // Validate body
      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (!result.success) {
          allErrors.body = formatZodErrors(result.error);
        } else {
          req.body = result.data;
        }
      }

      // Validate query
      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query);
        if (!result.success) {
          allErrors.query = formatZodErrors(result.error);
        } else {
          req.query = result.data as any;
        }
      }

      // Validate params
      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params);
        if (!result.success) {
          allErrors.params = formatZodErrors(result.error);
        } else {
          req.params = result.data as any;
        }
      }

      // If any validation errors, throw
      if (Object.keys(allErrors).length > 0) {
        throw new AppError('VALIDATION_ERROR', 'Validation failed', {
          errors: allErrors,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: (fieldName: string) => ({
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    message: `${fieldName} must be a valid UUID`,
  }),

  pagination: {
    page: { min: 1, default: 1 },
    limit: { min: 1, max: 100, default: 20 },
  },
};
