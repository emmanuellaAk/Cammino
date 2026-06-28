import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppLayout() {
  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ fontFamily: "'Inter','SF Pro Text',-apple-system,sans-serif", background: 'var(--bg)', color: 'var(--text)' }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main
          className="flex-1 overflow-y-auto"
          style={{ padding: '26px 28px 60px' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
