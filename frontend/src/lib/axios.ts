import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  withCredentials: true, // send HttpOnly cookies
  headers: { 'Content-Type': 'application/json' },
})

// Refresh token on 401 — one retry only
let isRefreshing = false
let queue: Array<() => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(api(original)))
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        await api.post('/api/auth/refresh')
        queue.forEach((cb) => cb())
        queue = []
        return api(original)
      } catch {
        queue = []
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default api
