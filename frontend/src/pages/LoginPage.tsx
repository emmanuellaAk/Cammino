import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'

const inputStyle: React.CSSProperties = {
  width: '100%', font: "400 14px 'Inter'", color: 'var(--text)',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '11px 14px', boxSizing: 'border-box',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (res) => {
      if (res.data.data) {
        setUser(res.data.data)
        navigate('/dashboard', { replace: true })
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? err?.response?.data?.message
      setError(msg ?? 'Invalid email or password.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    login.mutate()
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 36 }}>
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
            Sign in
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '0 0 26px' }}>
            Welcome back — pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label htmlFor="login-email" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Email</label>
              <input
                id="login-email"
                type="email" required autoFocus
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label htmlFor="login-password" style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent-brand)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {error && (
              <div style={{
                fontSize: 12, color: 'var(--error)', padding: '9px 12px',
                background: 'color-mix(in srgb, var(--error) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
                borderRadius: 8,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              style={{
                marginTop: 4, width: '100%', padding: '12px',
                borderRadius: 980, fontSize: 14, fontWeight: 600,
                background: 'var(--accent-brand)', color: '#fff',
                border: 'none', cursor: login.isPending ? 'default' : 'pointer',
                opacity: login.isPending ? 0.6 : 1,
              }}
            >
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-3)', marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-brand)', fontWeight: 500, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
