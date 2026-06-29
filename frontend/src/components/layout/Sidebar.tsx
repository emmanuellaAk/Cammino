import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Columns2, Target, Inbox,
  FileText, BarChart2, User, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn, initials } from '@/lib/utils'

const NAV = [
  { to: '/dashboard',  label: 'Overview',       Icon: LayoutGrid },
  { to: '/tracker',    label: 'Job tracker',     Icon: Columns2 },
  { to: '/tracker/match', label: 'Match analysis', Icon: Target },
  { to: '/inbox',      label: 'Inbox',           Icon: Inbox,    badge: 3 },
  { to: '/resume',     label: 'Resume',          Icon: FileText },
  { to: '/analytics',  label: 'Analytics',       Icon: BarChart2 },
  { to: '/profile',    label: 'Profile',         Icon: User },
]

export default function Sidebar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const accent = 'var(--accent-brand)'

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Amara Okafor'
  const userLevel = user?.careerLevel ?? 'Final-year student'

  return (
    <aside
      className="flex flex-col flex-none"
      style={{
        width: 236,
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--border)',
        padding: '18px 14px',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 18px' }}>
        <div
          style={{
            width: 30, height: 30, borderRadius: 9,
            background: accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Target size={18} />
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Cammino</span>
      </div>

      {/* Section label */}
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        padding: '8px 8px 6px',
      }}>
        Workspace
      </div>

      {/* Nav */}
      <nav className="flex flex-col" style={{ gap: 2 }}>
        {NAV.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-[11px] px-3 py-[10px] rounded-[10px] cursor-pointer transition-colors duration-150 no-underline',
                isActive
                  ? 'font-medium'
                  : 'text-[var(--text-2)] hover:bg-[var(--border-2)]',
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                    color: accent,
                  }
                : {}
            }
          >
            <Icon size={18} className="flex-none" />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{label}</span>
            {badge != null && (
              <span style={{
                background: '#e5484d', color: '#fff',
                fontSize: 11, fontWeight: 600,
                minWidth: 18, height: 18, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
              }}>
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-[10px] px-2 py-2 rounded-[10px] cursor-pointer hover:bg-[var(--border-2)] transition-colors"
          style={{ background: 'transparent', border: 'none' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: accent, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13, flexShrink: 0,
          }}>
            {initials(userName)}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userLevel}
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
        </button>
      </div>
    </aside>
  )
}
