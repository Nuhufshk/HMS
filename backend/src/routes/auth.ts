import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../store';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-in-production';
const JWT_EXPIRES_IN_DAYS = 7;
const COOKIE_NAME = 'hms_token';

export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export function issueToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 });
}

export function parseToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return typeof payload.id === 'string' ? payload.id : null;
  } catch {
    return null;
  }
}

/** Never leak the password field to clients. */
export function publicUser(user: User) {
  const { password: _password, ...rest } = user;
  return rest;
}

/** Require a valid bearer token OR httpOnly cookie; resolved user on res.locals.user. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Prefer Authorization header, fall back to cookie
  const header = req.headers.authorization ?? '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  const cookieToken = req.cookies?.[COOKIE_NAME] ?? '';
  const token = headerToken || cookieToken;

  const userId = parseToken(token);
  const user = userId ? db.users.find((u) => u.id === userId) : undefined;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized — please sign in again.' });
    return;
  }
  res.locals.user = user;
  next();
}

const router = Router();

/** POST /api/auth/login — public. */
router.post('/login', (req, res) => {
  const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user || user.password !== password) {
    res.status(401).json({ message: 'Invalid email or password. Please try again.' });
    return;
  }

  const token = issueToken(user.id);

  // Set httpOnly cookie (accessible by the browser, not JS)
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  res.json({ token, user: publicUser(user) });
});

/** POST /api/auth/logout — clear cookie. */
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logged out' });
});

/** GET /api/auth/me — requires auth. */
router.get('/me', requireAuth, (_req, res) => {
  res.json(publicUser(res.locals.user as User));
});

export default router;
