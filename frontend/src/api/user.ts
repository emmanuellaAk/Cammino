import api from '@/lib/axios'
import type { ApiResponse, User, CareerLevel } from '@/types'

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phone?: string
  university?: string
  careerLevel?: CareerLevel
  bio?: string
}

export const userApi = {
  me: () =>
    api.get<ApiResponse<User>>('/api/users/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    api.put<ApiResponse<User>>('/api/users/me', data),

  deleteAccount: () =>
    api.delete<ApiResponse<void>>('/api/users/me'),
}
