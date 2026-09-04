import type { Request, Response } from 'express';
import { COOKIE_NAME } from './auth.types';
import { findUserByEmail, findUserById } from './auth.repository';
import { issueToken, parseToken, publicUser, verifyPassword } from './auth.service';
import { validateLoginInput } from './auth.validation';
import type { User } from '../../types';

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = validateLoginInput(req.body);

  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(user, password)) {
    res.status(401).json({ message: 'Invalid email or password. Please try again.' });
    return;
  }

  const token = issueToken(user.id);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({ token, user: publicUser(user) });
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logged out' });
}

export function meHandler(_req: Request, res: Response) {
  res.json(publicUser(res.locals.user as User));
}

export async function requireAuthHandler(
  req: Request,
  res: Response,
  next: () => void,
) {
  const header = req.headers.authorization ?? '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : '';
  const cookieToken = req.cookies?.[COOKIE_NAME] ?? '';
  const token = headerToken || cookieToken;

  const userId = parseToken(token);
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized — please sign in again.' });
    return;
  }

  const user = await findUserById(userId);
  if (!user) {
    res.status(401).json({ message: 'Unauthorized — please sign in again.' });
    return;
  }

  res.locals.user = user;
  next();
}
