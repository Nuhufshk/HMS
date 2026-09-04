import type { User } from '../../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-in-production';
export const JWT_EXPIRES_IN_DAYS = 7;
export const COOKIE_NAME = 'hms_token';

export interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export type PublicUser = Omit<User, 'password'>;

export interface LoginInput {
  email: string;
  password: string;
}
