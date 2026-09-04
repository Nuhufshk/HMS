import jwt from 'jsonwebtoken';
import type { JwtPayload, PublicUser } from './auth.types';
import { JWT_SECRET, JWT_EXPIRES_IN_DAYS } from './auth.types';
import type { User } from '../../types';
import { comparePassword, hashPassword } from '../../utils/password';

export function issueToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN_DAYS * 24 * 60 * 60,
  });
}

export function parseToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return typeof payload.id === 'string' ? payload.id : null;
  } catch {
    return null;
  }
}

export function publicUser(user: User): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return comparePassword(password, user.password);
}

export { hashPassword };
