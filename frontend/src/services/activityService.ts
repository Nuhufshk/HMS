import { apiClient } from './apiClient';
import type { ActivityItem } from '@/types';

export const activityService = {
  async getRecentActivity(limit = 10): Promise<ActivityItem[]> {
    return apiClient.get<ActivityItem[]>(`/activity?limit=${limit}`);
  },
};
