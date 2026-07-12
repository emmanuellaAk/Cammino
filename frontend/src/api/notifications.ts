import api from '@/lib/axios'
import type { ApiResponse, Notification, NotificationPreference } from '@/types'

export interface UpdateNotificationPreferenceRequest {
  deadlineRemindersEnabled?: boolean
  deadlineReminderDaysBefore?: number
  followUpRemindersEnabled?: boolean
  followUpReminderDaysAfterApply?: number
  statusChangeAlertsEnabled?: boolean
  aiAnalysisAlertsEnabled?: boolean
}

export const notificationsApi = {
  list: (unreadOnly = false, page = 0, size = 20) =>
    api.get<ApiResponse<Notification[]>>('/api/notifications', { params: { unreadOnly, page, size } }),

  unreadCount: () =>
    api.get<ApiResponse<number>>('/api/notifications/unread-count'),

  markRead: (id: string) =>
    api.patch<ApiResponse<Notification>>(`/api/notifications/${id}/read`),

  markAllRead: () =>
    api.patch<ApiResponse<void>>('/api/notifications/read-all'),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/notifications/${id}`),

  getPreferences: () =>
    api.get<ApiResponse<NotificationPreference>>('/api/notifications/preferences'),

  updatePreferences: (data: UpdateNotificationPreferenceRequest) =>
    api.put<ApiResponse<NotificationPreference>>('/api/notifications/preferences', data),
}
