import api from '@/lib/axios'
import type { ApiResponse } from '@/types'

export interface ExtensionToken {
  id: string
  label: string
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
}

export interface GeneratedToken {
  tokenId: string
  token: string
  label: string
  createdAt: string
  warning: string
}

export const extensionApi = {
  listTokens: () =>
    api.get<ApiResponse<ExtensionToken[]>>('/api/extension/tokens'),

  generateToken: (label: string) =>
    api.post<ApiResponse<GeneratedToken>>('/api/extension/tokens', { label }),

  revokeToken: (id: string) =>
    api.delete<ApiResponse<void>>(`/api/extension/tokens/${id}`),
}
