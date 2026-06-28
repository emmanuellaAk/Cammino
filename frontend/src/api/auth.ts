import api from '@/lib/axios'
import type { ApiResponse, User } from '@/types'

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<User>>('/api/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<User>>('/api/auth/login', data),

  logout: () => api.post<ApiResponse<void>>('/api/auth/logout'),

  refresh: () => api.post<ApiResponse<void>>('/api/auth/refresh'),

  verifyEmail: (token: string) =>
    api.get<ApiResponse<void>>(`/api/auth/verify-email?token=${token}`),

  resendVerification: (email: string) =>
    api.post<ApiResponse<void>>(`/api/auth/resend-verification?email=${encodeURIComponent(email)}`),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<void>>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<ApiResponse<void>>('/api/auth/reset-password', { token, newPassword }),
}
