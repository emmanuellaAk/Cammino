import api from '@/lib/axios'
import type { ApiResponse, AnalyticsOverview, ApplicationTrend, SourcePerformance } from '@/types'

export const analyticsApi = {
  overview: () =>
    api.get<ApiResponse<AnalyticsOverview>>('/api/analytics/overview'),

  trend: (period: 'weekly' | 'monthly' = 'weekly') =>
    api.get<ApiResponse<ApplicationTrend[]>>('/api/analytics/trend', { params: { period } }),

  sourcePerformance: () =>
    api.get<ApiResponse<SourcePerformance[]>>('/api/analytics/source-performance'),
}
