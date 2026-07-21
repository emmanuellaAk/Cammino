import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useIsTablet } from '@/hooks/useMediaQuery'

export default function AppLayout() {
  const isTablet = useIsTablet()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Belt-and-braces: also close the drawer on any route change (covers
  // programmatic navigate() calls that don't go through Sidebar's NavLinks).
  useEffect(() => setSidebarOpen(false), [location.pathname])

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Inter','SF Pro Text',-apple-system,sans-serif", background: 'var(--bg)', color: 'var(--text)' }}
    >
      <Sidebar isTablet={isTablet} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header onMenuClick={isTablet ? () => setSidebarOpen((v) => !v) : undefined} />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: isTablet ? '18px 16px 40px' : '26px 28px 60px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
