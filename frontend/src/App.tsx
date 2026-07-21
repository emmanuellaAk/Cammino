import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { userApi } from '@/api/user'
import AppLayout from '@/components/layout/AppLayout'
import DashboardPage from '@/pages/DashboardPage'
import TrackerPage from '@/pages/TrackerPage'
import JobDetailPage from '@/pages/JobDetailPage'
import ResumePage from '@/pages/ResumePage'
import ResumeBuilderPage from '@/pages/ResumeBuilderPage'
import InboxPage from '@/pages/InboxPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import ProfilePage from '@/pages/ProfilePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { setUser, isAuthenticated } = useAuth()

  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await userApi.me()
      if (res.data.data) setUser(res.data.data)
      return res.data.data
    },
    retry: false,
    enabled: !isAuthenticated,
  })

  return <>{children}</>
}

export default function App() {
  useEffect(() => {
    document.title = 'Cammino'
  }, [])

  return (
    <AuthGate>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tracker" element={<TrackerPage />} />
          <Route path="tracker/:id" element={<JobDetailPage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="resume/builder/:id" element={<ResumeBuilderPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthGate>
  )
}
