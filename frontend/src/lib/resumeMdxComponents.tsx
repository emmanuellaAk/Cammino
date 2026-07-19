import type { ReactNode } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'

// ── Custom resume components, available inside MDX content ────────────────────

// Root wrapper is <span style={{display:'block'}}> rather than <div> on purpose: MDX may
// place a "loosely" formatted component (no blank line around its tag in the model's
// output) inside an auto-generated <p>, and a <div> there is invalid HTML (React logs a
// DOM-nesting warning); <span> is phrasing content and always legal inside <p>, so this
// stays robust no matter how the model formats its output.
function BlockSpan({ style, children }: { style?: React.CSSProperties; children?: ReactNode }) {
  return <span style={{ display: 'block', ...style }}>{children}</span>
}

function ResumeHeader({ name, title, email, phone, location }: {
  name?: string; title?: string; email?: string; phone?: string; location?: string
}) {
  return (
    <BlockSpan style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
      <BlockSpan style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
        {name || 'Your Name'}
      </BlockSpan>
      {title && (
        <BlockSpan style={{ fontSize: 14, color: 'var(--accent-brand)', fontWeight: 600, marginTop: 3 }}>
          {title}
        </BlockSpan>
      )}
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
        {email && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
            <Mail size={12} /> {email}
          </span>
        )}
        {phone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
            <Phone size={12} /> {phone}
          </span>
        )}
        {location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)' }}>
            <MapPin size={12} /> {location}
          </span>
        )}
      </span>
    </BlockSpan>
  )
}

function Job({ title, company, dates, children }: {
  title?: string; company?: string; dates?: string; children?: ReactNode
}) {
  return (
    <BlockSpan style={{ marginBottom: 16 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
        <span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{title}</span>
          {company && <span style={{ fontSize: 14, color: 'var(--text-2)' }}> · {company}</span>}
        </span>
        {dates && <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{dates}</span>}
      </span>
      <BlockSpan style={{ marginTop: 6 }}>{children}</BlockSpan>
    </BlockSpan>
  )
}

function EduItem({ degree, school, dates }: { degree?: string; school?: string; dates?: string }) {
  return (
    <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      <span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{degree}</span>
        {school && <span style={{ fontSize: 14, color: 'var(--text-2)' }}> · {school}</span>}
      </span>
      {dates && <span style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>{dates}</span>}
    </span>
  )
}

function SkillList({ items }: { items?: string[] }) {
  if (!items?.length) return null
  return (
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {items.map((s) => (
        <span key={s} style={{
          fontSize: 12, fontWeight: 500, padding: '4px 11px', borderRadius: 980,
          background: 'color-mix(in srgb, var(--accent-brand) 10%, transparent)',
          color: 'var(--accent-brand)',
        }}>
          {s}
        </span>
      ))}
    </span>
  )
}

// ── Standard markdown element styling (## headings, paragraphs, lists) ────────
function H2({ children }: { children?: ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase',
      letterSpacing: '0.06em', marginTop: 22, marginBottom: 12,
    }}>
      {children}
    </div>
  )
}
function P({ children }: { children?: ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 10px' }}>{children}</p>
}
function Ul({ children }: { children?: ReactNode }) {
  return <ul style={{ margin: '4px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</ul>
}
function Li({ children }: { children?: ReactNode }) {
  return <li style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{children}</li>
}

export const resumeMdxComponents = {
  ResumeHeader,
  Job,
  EduItem,
  SkillList,
  h2: H2,
  p: P,
  ul: Ul,
  li: Li,
}
