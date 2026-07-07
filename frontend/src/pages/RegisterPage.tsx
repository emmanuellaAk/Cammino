import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Target, Check } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

const inputStyle: React.CSSProperties = {
  width: '100%', font: "400 14px 'Inter'", color: 'var(--text)',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '11px 14px', outline: 'none', boxSizing: 'border-box',
}

function passwordStrength(pw: string) {
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length
  return { checks, score }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const { checks, score } = passwordStrength(form.password)
  const strengthColor = score <= 1 ? '#e5484d' : score === 2 ? '#c98a00' : score === 3 ? '#0071e3' : '#12936a'
  const strengthLabel = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'

  const register = useMutation({
    mutationFn: () => authApi.register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
    }),
    onSuccess: () => {
      setDone(true)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message
      setError(msg ?? 'Something went wrong. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    register.mutate()
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '24px',
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)',
          padding: '40px 32px', maxWidth: 380, width: '100%', textAlign: 'center',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'color-mix(in srgb, #12936a 14%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Check size={22} style={{ color: '#12936a' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Check your inbox</div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, margin: '0 0 24px' }}>
            We sent a verification link to <strong style={{ color: 'var(--text)' }}>{form.email}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <Link to="/login" style={{
            display: 'block', padding: '11px', borderRadius: 980, fontSize: 14, fontWeight: 600,
            background: 'var(--accent-brand)', color: '#fff', textDecoration: 'none', textAlign: 'center',
          }}>
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
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

        {/* Card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', padding: '32px 30px 28px',
          boxShadow: 'var(--shadow)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            Create account
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 26px' }}>
            Start tracking your job search for free.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>First name</label>
                <input
                  required autoFocus value={form.firstName} onChange={set('firstName')}
                  placeholder="Amara" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Last name</label>
                <input
                  required value={form.lastName} onChange={set('lastName')}
                  placeholder="Okafor" style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email</label>
              <input
                type="email" required value={form.email} onChange={set('email')}
                placeholder="you@example.com" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Password</label>
              <input
                type="password" required value={form.password} onChange={set('password')}
                placeholder="Min. 8 characters" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              {form.password.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {/* Strength bar */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: i <= score ? strengthColor : 'var(--panel)',
                        transition: 'background 0.2s',
                      }} />
                    ))}
                  </div>
                  {/* Checks */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                    {[
                      { ok: checks.length, label: '8+ chars' },
                      { ok: checks.upper, label: 'Uppercase' },
                      { ok: checks.number, label: 'Number' },
                      { ok: checks.special, label: 'Special char' },
                    ].map(({ ok, label }) => (
                      <span key={label} style={{ fontSize: 11, color: ok ? '#12936a' : 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontWeight: 700 }}>{ok ? '✓' : '○'}</span> {label}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: strengthColor, marginTop: 4 }}>{strengthLabel}</div>
                </div>
              )}
            </div>

            {error && (
              <div style={{
                fontSize: 12, color: '#e5484d', padding: '9px 12px',
                background: 'color-mix(in srgb, #e5484d 10%, transparent)',
                border: '1px solid color-mix(in srgb, #e5484d 25%, transparent)',
                borderRadius: 8,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={register.isPending || score < 4}
              style={{
                marginTop: 4, width: '100%', padding: '12px',
                borderRadius: 980, fontSize: 14, fontWeight: 600,
                background: 'var(--accent-brand)', color: '#fff', border: 'none',
                cursor: register.isPending || score < 4 ? 'default' : 'pointer',
                opacity: register.isPending || score < 4 ? 0.6 : 1,
              }}
            >
              {register.isPending ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-brand)', fontWeight: 500, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
