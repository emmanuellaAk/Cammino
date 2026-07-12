import api from '@/lib/axios'
import type { ApiResponse, Resume, ResumeAnalysis, JobMatch } from '@/types'

export const resumeApi = {
  list: () =>
    api.get<ApiResponse<Resume[]>>('/api/resumes'),

  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ApiResponse<Resume>>('/api/resumes', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  setActive: (id: string) =>
    api.put<ApiResponse<Resume>>(`/api/resumes/${id}/set-active`),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/resumes/${id}`),

  analyze: () =>
    api.post<ApiResponse<ResumeAnalysis>>('/api/ai/resume/analyze'),

  getAnalysis: () =>
    api.get<ApiResponse<ResumeAnalysis>>('/api/ai/resume/analysis'),

  matchJob: (jobId: string) =>
    api.post<ApiResponse<JobMatch>>(`/api/ai/jobs/${jobId}/match`),

  getJobMatch: (jobId: string) =>
    api.get<ApiResponse<JobMatch>>(`/api/ai/jobs/${jobId}/match`),
}
