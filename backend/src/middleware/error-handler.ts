import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static badRequest(message = 'Bad request', code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, code, message, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL', details?: unknown) {
    return new ApiError(500, code, message, details);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  const status = (err as { status?: number })?.status ?? 500;
  logger.error({ err }, 'Unhandled error');
  res.status(status).json({
    error: {
      code: status === 404 ? 'NOT_FOUND' : 'INTERNAL',
      message:
        status === 404
          ? 'Resource not found'
          : 'An unexpected error occurred',
    },
  });
}
