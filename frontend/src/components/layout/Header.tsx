import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, Plus } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const PAGE_META: Record<string, [string, string]> = {
  '/dashboard':  ['Overview',        'Welcome back. Here is your job search at a glance.'],
  '/tracker':    ['Job tracker',     'Every application in one place — drag through your pipeline.'],
  '/inbox':      ['Inbox',           'Job emails detected and auto-sorted from your connected inbox.'],
  '/resume':     ['Resume',          'AI breakdown of your resume, skills, and how to improve.'],
  '/analytics':  ['Analytics',       'Insights into how your job search is performing.'],
  '/profile':    ['Profile',         'Your details, preferences, and connected services.'],
}

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const path = '/' + location.pathname.split('/')[1]
  const isJobDetail = location.pathname.startsWith('/tracker/') && location.pathname !== '/tracker'
  const [title, sub] = isJobDetail
    ? ['Match analysis', 'AI-powered job fit breakdown']
    : PAGE_META[path] ?? ['CareerOS', '']

  return (
    <header
      className="flex-none flex items-center gap-4"
      style={{
        height: 62,
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        background: 'var(--bg)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {sub}
        </div>
      </div>

      {/* Search */}
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 pointer-events-none" style={{ color: 'var(--text-3)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs, companies…"
          style={{
            width: 236, font: "400 13px 'Inter'", color: 'var(--text)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 980, padding: '9px 14px 9px 36px', outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title="Toggle theme"
        style={{
          width: 38, height: 38, borderRadius: 10,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-2)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Add job */}
      <button
        onClick={() => navigate('/tracker')}
        className="flex items-center gap-[6px] whitespace-nowrap"
        style={{
          background: 'var(--accent-brand)', color: '#fff',
          border: 'none', borderRadius: 980,
          padding: '9px 16px', font: "600 13px 'Inter'",
          cursor: 'pointer',
        }}
      >
        <Plus size={16} />
        Add job
      </button>
    </header>
  )
}
