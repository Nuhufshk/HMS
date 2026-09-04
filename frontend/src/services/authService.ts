import { apiClient } from './apiClient';
import type { User } from '@/types';

export interface AuthSession {
  token: string;
  user: User;
}

/**
 * Authentication service backed by the HMS API (POST /api/auth/login).
 */
export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    return apiClient.post<AuthSession>('/auth/login', { email, password });
  },

  /** Returns the current user for the stored token, or null when invalid. */
  async verifySession(): Promise<User | null> {
    return apiClient.get<User>('/auth/me');
  },
};
