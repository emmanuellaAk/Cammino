import { AlertTriangle, RefreshCw } from 'lucide-react'

/** Shared inline error state for failed data fetches — used instead of the old
 * pattern of silently swallowing fetch errors and falling back to mock data. */
export default function ErrorBanner({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px', borderRadius: 11,
      background: 'color-mix(in srgb, #e5484d 8%, transparent)',
      border: '1px solid color-mix(in srgb, #e5484d 25%, transparent)',
    }}>
      <AlertTriangle size={15} style={{ color: '#e5484d', flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text)', lineHeight: 1.5 }}>
        {message ?? "Couldn't load this — please try again."}
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
    </div>
  )
}
