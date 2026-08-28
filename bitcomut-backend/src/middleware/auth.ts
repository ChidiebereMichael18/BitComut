import { Request, Response, NextFunction } from "express";
import { verifyToken, getUserById, Role, AuthUser } from "../services/auth";
import { asyncHandler, HttpError } from "./handlers";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

async function authenticate(req: Request): Promise<AuthUser> {
  const header = req.headers.authorization ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Missing or malformed Authorization header");
  const payload = verifyToken(match[1]);
  const user = await getUserById(payload.sub);
  if (!user) throw new HttpError(401, "Account no longer exists");
  return user;
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  req.user = await authenticate(req);
  next();
});

export function requireRole(...roles: Role[]) {
  return asyncHandler(async (req, _res, next) => {
    if (!req.user) throw new HttpError(401, "Authentication required");
    if (!roles.includes(req.user.role)) {
      throw new HttpError(403, "You do not have permission to perform this action");
    }
    next();
  });
}

export function isAdmin(req: Request): boolean {
  return !!req.user && req.user.role === "admin";
}

/** Guards that the caller owns the given student (or is an admin). */
export function requireStudentAccess(req: Request, studentId: string): void {
  if (!req.user) throw new HttpError(401, "Authentication required");
  if (req.user.role === "admin") return;
  if (req.user.role !== "student" || req.user.ownerId !== studentId) {
    throw new HttpError(403, "You can only access your own student account");
  }
}

/** Guards that the caller owns the given university (or is an admin). */
export function requireUniversityAccess(req: Request, universityId: string): void {
  if (!req.user) throw new HttpError(401, "Authentication required");
  if (req.user.role === "admin") return;
  if (req.user.role !== "university" || req.user.ownerId !== universityId) {
    throw new HttpError(403, "You can only access your own university account");
  }
}
