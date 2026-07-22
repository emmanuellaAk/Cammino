import api from '@/lib/axios'
import type { ApiResponse, Job, ApplicationNote, ApplicationStatus, PageResponse } from '@/types'

export interface CreateJobRequest {
  jobTitle: string
  company: string
  location?: string
  jobUrl?: string
  description?: string
  salary?: string
  status?: ApplicationStatus
  deadline?: string
  appliedAt?: string
  source?: string
}

export interface JobExtraction {
  jobTitle: string
  company: string
  location: string
}

export interface ListJobsParams {
  status?: ApplicationStatus
  company?: string
  search?: string
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export const jobsApi = {
  list: (params?: ListJobsParams) =>
    api.get<ApiResponse<PageResponse<Job>>>('/api/jobs', { params }),

  get: (id: string) =>
    api.get<ApiResponse<Job>>(`/api/jobs/${id}`),

  create: (data: CreateJobRequest) =>
    api.post<ApiResponse<Job>>('/api/jobs', data),

  extractFromUrl: (url: string) =>
    api.post<ApiResponse<JobExtraction>>('/api/jobs/extract-from-url', { url }),

  update: (id: string, data: Partial<CreateJobRequest>) =>
    api.put<ApiResponse<Job>>(`/api/jobs/${id}`, data),

  updateStatus: (id: string, status: ApplicationStatus) =>
    api.patch<ApiResponse<Job>>(`/api/jobs/${id}/status`, { status }),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/jobs/${id}`),

  addNote: (id: string, content: string) =>
    api.post<ApiResponse<ApplicationNote>>(`/api/jobs/${id}/notes`, { content }),

  listNotes: (id: string) =>
    api.get<ApiResponse<ApplicationNote[]>>(`/api/jobs/${id}/notes`),

  deleteNote: (jobId: string, noteId: string) =>
    api.delete<ApiResponse<void>>(`/api/jobs/${jobId}/notes/${noteId}`),
}
