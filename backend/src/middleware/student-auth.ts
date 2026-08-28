import type { Request, Response, NextFunction } from 'express';
import { ApiError } from './error-handler';
import { findStudentSession } from '../modules/student-auth/student-auth.repo';
import type { Student } from '../modules/types';

export const STUDENT_SESSION_COOKIE = 'bitcomut_student_session';

export interface StudentAuthLocals {
  studentId: string;
  tenantId: string;
  student: Student;
}

/**
 * Require a valid student session cookie. On success attaches the resolved
 * student + tenant to `res.locals.studentAuth`.
 */
export async function requireStudentAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = (req.cookies as Record<string, string> | undefined)?.[
      STUDENT_SESSION_COOKIE
    ];
    if (!token) throw ApiError.forbidden('Not authenticated', 'UNAUTHENTICATED');

    const session = await findStudentSession(token);
    if (!session) throw ApiError.forbidden('Session expired', 'UNAUTHENTICATED');

    res.locals.studentAuth = {
      studentId: session.studentId,
      tenantId: session.tenantId,
      student: session.student,
    } satisfies StudentAuthLocals;

    next();
  } catch (err) {
    next(err);
  }
}
