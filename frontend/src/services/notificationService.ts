import { apiClient } from './apiClient';
import type { AppNotification } from '@/types';

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    return apiClient.get<AppNotification[]>('/notifications');
  },

  async markAsRead(id: string): Promise<AppNotification> {
    return apiClient.post<AppNotification>(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    return apiClient.post<void>('/notifications/read-all');
  },
};
