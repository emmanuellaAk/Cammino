import api from '@/lib/axios'
import type { ApiResponse, ResumeDraft, ResumeDraftMessage, ResumeDraftChatResult } from '@/types'

export const resumeDraftsApi = {
  list: () =>
    api.get<ApiResponse<ResumeDraft[]>>('/api/resume-drafts'),

  create: (title: string) =>
    api.post<ApiResponse<ResumeDraft>>('/api/resume-drafts', { title }),

  get: (id: string) =>
    api.get<ApiResponse<ResumeDraft>>(`/api/resume-drafts/${id}`),

  update: (id: string, data: { title?: string; mdxContent?: string }) =>
    api.put<ApiResponse<ResumeDraft>>(`/api/resume-drafts/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/resume-drafts/${id}`),

  listMessages: (id: string) =>
    api.get<ApiResponse<ResumeDraftMessage[]>>(`/api/resume-drafts/${id}/messages`),

  chat: (id: string, message: string) =>
    api.post<ApiResponse<ResumeDraftChatResult>>(`/api/resume-drafts/${id}/chat`, { message }),
}
