import api from '@/lib/axios'
import type { ApiResponse, AnalyticsOverview, Funnel, ApplicationTrend, SourcePerformance } from '@/types'

export const analyticsApi = {
  overview: () =>
    api.get<ApiResponse<AnalyticsOverview>>('/api/analytics/overview'),

  funnel: () =>
    api.get<ApiResponse<Funnel>>('/api/analytics/funnel'),

  trend: (period: 'weekly' | 'monthly' = 'weekly') =>
    api.get<ApiResponse<ApplicationTrend[]>>('/api/analytics/trend', { params: { period } }),

  sourcePerformance: () =>
    api.get<ApiResponse<SourcePerformance[]>>('/api/analytics/source-performance'),
}
