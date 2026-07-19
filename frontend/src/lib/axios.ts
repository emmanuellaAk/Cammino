import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send HttpOnly cookies
  headers: { 'Content-Type': 'application/json' },
})

// A separate, interceptor-free client for the refresh call itself. The refresh
// endpoint MUST NOT go through api's response interceptor below — if it did, a
// 401 on the refresh call (e.g. no valid session at all) would re-enter that
// same interceptor while isRefreshing is still true, get queued, and hang
// forever, since nothing would ever resolve/reject that queued promise.
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// Refresh token on 401 — one refresh in flight at a time; concurrent 401s queue
// behind it and are resolved/rejected together once the refresh settles.
let isRefreshing = false
let queue: Array<{ resolve: () => void; reject: (err: unknown) => void }> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve: () => resolve(api(original)), reject })
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        await refreshClient.post('/api/auth/refresh')
        queue.forEach((p) => p.resolve())
        queue = []
        return api(original)
      } catch (refreshError) {
        queue.forEach((p) => p.reject(refreshError))
        queue = []
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api
