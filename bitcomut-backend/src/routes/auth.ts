import { Router } from "express";
import { asyncHandler, HttpError } from "../middleware/handlers";
import { registerUser, loginUser, signToken, AuthUser } from "../services/auth";

export const authRouter = Router();

function publicUser(user: AuthUser) {
  return { user: { id: user.id, email: user.email, role: user.role, ownerId: user.ownerId } };
}

/**
 * POST /api/auth/register
 * Creates an account (student/university/admin) and returns a JWT.
 * The account links to an existing owner row via ownerId (students.id / universities.id).
 */
authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, role, ownerId } = req.body ?? {};
    const allowedRoles = ["student", "university", "admin"];
    if (!allowedRoles.includes(role)) {
      throw new HttpError(400, "role must be one of: " + allowedRoles.join(", "));
    }
    const user = await registerUser({ email, password, role, ownerId: ownerId ?? null });
    const token = signToken(user);
    res.status(201).json({ token, ...publicUser(user) });
  })
);

/**
 * POST /api/auth/login
 * Validates email+password and returns a JWT.
 */
authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, "email and password are required");
    const user = await loginUser(email, password);
    const token = signToken(user);
    res.json({ token, ...publicUser(user) });
  })
);
