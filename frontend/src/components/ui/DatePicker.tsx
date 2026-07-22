import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fromIso(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtDisplay(s: string) {
  const d = fromIso(s)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Self-contained popover calendar — no date library. Value/onChange contract matches
 * a native `<input type="date">` (ISO yyyy-mm-dd string) so it's a drop-in replacement. */
export default function DatePicker({ id, value, onChange, placeholder = 'Select date' }: {
  id?: string
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? fromIso(value) : null
  const [viewDate, setViewDate] = useState(selected ?? new Date())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function pick(day: number) {
    const d = new Date(year, month, day)
    onChange(toIso(d))
    setOpen(false)
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        id={id}
        type="button"
        onClick={() => { setOpen((v) => !v); if (selected) setViewDate(selected) }}
        aria-haspopup="dialog"
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          font: "400 13px 'Inter'", color: value ? 'var(--text)' : 'var(--text-3)',
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 9, padding: '9px 12px', boxSizing: 'border-box', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <Calendar size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
        {value ? fmtDisplay(value) : placeholder}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 60,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 12, boxShadow: 'var(--shadow)', width: 260,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{MONTH_LABELS[month]} {year}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {DAY_LABELS.map((d, i) => (
              <div key={i} style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />
              const cellDate = new Date(year, month, day)
              const isSelected = selected && isSameDay(cellDate, selected)
              const isToday = isSameDay(cellDate, today)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(day)}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 12.5, fontWeight: isToday ? 700 : 500,
                    background: isSelected ? 'var(--accent-brand)' : 'transparent',
                    color: isSelected ? '#fff' : isToday ? 'var(--accent-brand)' : 'var(--text)',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--border-2)' }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              style={{
                marginTop: 10, width: '100%', padding: '6px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'none', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer',
              }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  )
}
