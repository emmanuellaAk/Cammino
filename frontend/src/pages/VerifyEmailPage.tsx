import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, X, Target } from 'lucide-react'
import { authApi } from '@/api/auth'

function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message
  return message ?? fallback
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const ranOnce = useRef(false)

  useEffect(() => {
    if (ranOnce.current) return // StrictMode double-invokes effects; the token is single-use server-side
    ranOnce.current = true

    if (!token) {
      setStatus('error')
      setErrorMessage('This verification link is missing its token.')
      return
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMessage(apiErrorMessage(err, 'This verification link is invalid or has expired.'))
      })
  }, [token])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--accent-brand)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Target size={18} />
          </div>
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em' }}>Cammino</span>
        </div>

        <div style={{
          background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
          padding: '40px 32px', textAlign: 'center', boxShadow: 'var(--shadow)',
        }}>
          {status === 'verifying' && (
            <>
              <div className="animate-pulse" style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--panel)', margin: '0 auto 16px',
              }} />
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Verifying your email…</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: 0 }}>
                One moment.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--success) 14%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <Check size={22} style={{ color: 'var(--success)' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Email verified</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 24px' }}>
                Your account is active. You can sign in now.
              </p>
              <Link to="/login" style={{
                display: 'block', padding: '11px', borderRadius: 980, fontSize: 14, fontWeight: 600,
                background: 'var(--accent-brand)', color: '#fff', textDecoration: 'none', textAlign: 'center',
              }}>
                Go to sign in
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'color-mix(in srgb, var(--error) 14%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <X size={22} style={{ color: 'var(--error)' }} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Verification failed</div>
              <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 24px' }}>
                {errorMessage}
              </p>
              <Link to="/login" style={{
                display: 'block', padding: '11px', borderRadius: 980, fontSize: 14, fontWeight: 600,
                background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)',
                textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box',
              }}>
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
