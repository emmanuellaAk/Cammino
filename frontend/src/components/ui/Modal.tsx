import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])'

/** Shared modal chrome: dialog semantics, a trapped Tab cycle, Escape-to-close,
 * and focus restored to whatever triggered the modal on close — none of which
 * the app's hand-rolled overlay divs had before. */
export default function Modal({ title, titleColor, onClose, width = 440, children }: {
  title: string
  titleColor?: string
  onClose: () => void
  width?: number
  children: ReactNode
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? dialog)?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      trigger?.focus?.()
    }
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', padding: '26px 26px 22px',
          width: `min(${width}px, calc(100vw - 32px))`,
          maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h2 id={titleId} style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: titleColor ?? 'var(--text)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
