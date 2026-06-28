import api from '@/lib/axios'
import type { ApiResponse, GmailConnection, EmailScanResult } from '@/types'

export const emailApi = {
  getConnection: () =>
    api.get<ApiResponse<GmailConnection>>('/api/email/connection'),

  getAuthUrl: () =>
    api.get<ApiResponse<{ authorizationUrl: string }>>('/api/email/connect/google'),

  disconnect: () =>
    api.delete<ApiResponse<void>>('/api/email/connection'),

  scan: () =>
    api.post<ApiResponse<EmailScanResult[]>>('/api/email/scan'),

  history: (page = 0, size = 20) =>
    api.get<ApiResponse<EmailScanResult[]>>('/api/email/scan/history', {
      params: { page, size },
    }),
}
