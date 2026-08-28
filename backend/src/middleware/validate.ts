import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function formatZodError(err: ZodError): {
  code: string;
  message: string;
  details: { field: string; message: string }[];
} {
  const details = err.issues.map((i) => ({
    field: i.path.join('.'),
    message: i.message,
  }));
  return {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details,
  };
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: formatZodError(result.error) });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: formatZodError(result.error) });
      return;
    }
    // Express 5 exposes req.query as a getter-only property; store the
    // validated result on res.locals for handlers to read.
    res.locals.validatedQuery = result.data;
    next();
  };
}
