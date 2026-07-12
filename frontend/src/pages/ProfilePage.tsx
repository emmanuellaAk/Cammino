import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ShieldCheck, ShieldAlert, Trash2, X } from 'lucide-react'
import { userApi, type UpdateProfileRequest } from '@/api/user'
import { useAuth } from '@/context/AuthContext'
import { formatDate, initials } from '@/lib/utils'
import type { CareerLevel } from '@/types'

const CAREER_LEVELS: { value: CareerLevel; label: string }[] = [
  { value: 'STUDENT',       label: 'Student' },
  { value: 'NSS_APPLICANT', label: 'NSS applicant' },
  { value: 'GRADUATE',      label: 'Graduate' },
  { value: 'PROFESSIONAL',  label: 'Professional' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', font: "400 13px 'Inter'", color: 'var(--text)',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 9, padding: '9px 12px', outline: 'none',
  boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      {children}
    </div>
  )
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.01em' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Delete account confirm modal ─────────────────────────────────────────────
function DeleteAccountModal({ userEmail, onClose, onConfirm, loading }: {
  userEmail: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText.trim().toLowerCase() === userEmail.toLowerCase()

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', padding: '26px 26px 22px',
          width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#e5484d' }}>Delete account</span>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
          This permanently deletes your account, resumes, tracked applications, and email scan history.
          This cannot be undone. Type <strong>{userEmail}</strong> to confirm.
        </p>

        <input
          style={inputStyle}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={userEmail}
          autoFocus
        />

        <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{
            padding: '9px 18px', borderRadius: 980, fontSize: 13, fontWeight: 500,
            background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDelete || loading}
            onClick={onConfirm}
            style={{
              padding: '9px 18px', borderRadius: 980, fontSize: 13, fontWeight: 600,
              background: '#e5484d', border: 'none', color: '#fff',
              cursor: canDelete && !loading ? 'pointer' : 'default',
              opacity: canDelete && !loading ? 1 : 0.5,
            }}
          >
            {loading ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [form, setForm] = useState<UpdateProfileRequest>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    university: user?.university ?? '',
    careerLevel: user?.careerLevel,
    bio: user?.bio ?? '',
  })
  const [showSaved, setShowSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    if (!user) return
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phone: user.phone ?? '',
      university: user.university ?? '',
      careerLevel: user.careerLevel,
      bio: user.bio ?? '',
    })
  }, [user])

  const set = (key: keyof UpdateProfileRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const save = useMutation({
    mutationFn: () => userApi.updateProfile(form),
    onSuccess: (res) => {
      if (res.data.data) setUser(res.data.data)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 2500)
    },
  })

  const del = useMutation({
    mutationFn: () => userApi.deleteAccount(),
    onSuccess: () => {
      logout()
      navigate('/login', { replace: true })
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save.mutate()
  }

  if (!user) return null

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Identity header */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent-brand)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
            }}>
              {initials(`${user.firstName} ${user.lastName}`)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user.email}</div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 980, flexShrink: 0,
              color: user.emailVerified ? '#12936a' : '#c98a00',
              background: user.emailVerified ? 'color-mix(in srgb, #12936a 12%, transparent)' : 'color-mix(in srgb, #c98a00 12%, transparent)',
            }}>
              {user.emailVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              {user.emailVerified ? 'Verified' : 'Unverified'}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>
            Member since {formatDate(user.createdAt)}
          </div>
        </Card>

        {/* Edit form */}
        <Card title="Personal details">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <Field label="First name">
                <input style={inputStyle} value={form.firstName ?? ''} onChange={set('firstName')} />
              </Field>
              <Field label="Last name">
                <input style={inputStyle} value={form.lastName ?? ''} onChange={set('lastName')} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
              <Field label="Phone">
                <input style={inputStyle} value={form.phone ?? ''} onChange={set('phone')} placeholder="+233 20 000 0000" />
              </Field>
              <Field label="Career level">
                <select style={inputStyle} value={form.careerLevel ?? ''} onChange={set('careerLevel')}>
                  <option value="">Not set</option>
                  {CAREER_LEVELS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="University">
              <input style={inputStyle} value={form.university ?? ''} onChange={set('university')} placeholder="University of Ghana" />
            </Field>

            <Field label="Bio">
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 76, font: "400 13px 'Inter'" }}
                value={form.bio ?? ''}
                onChange={set('bio')}
                placeholder="A couple of lines about you…"
                maxLength={1000}
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <button
                type="submit"
                disabled={save.isPending}
                style={{
                  padding: '9px 20px', borderRadius: 980, fontSize: 13, fontWeight: 600,
                  background: 'var(--accent-brand)', border: 'none', color: '#fff',
                  cursor: save.isPending ? 'default' : 'pointer', opacity: save.isPending ? 0.7 : 1,
                }}
              >
                {save.isPending ? 'Saving…' : 'Save changes'}
              </button>
              {showSaved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#12936a' }}>
                  <CheckCircle2 size={13} /> Saved
                </span>
              )}
              {save.isError && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#e5484d' }}>
                  Couldn't save — try again
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Danger zone */}
        <Card title="Danger zone">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Delete account</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                Permanently remove your account and all associated data.
              </div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 9,
                background: 'color-mix(in srgb, #e5484d 8%, transparent)',
                border: '1px solid color-mix(in srgb, #e5484d 25%, transparent)',
                color: '#e5484d', cursor: 'pointer',
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </Card>
      </div>

      {showDelete && (
        <DeleteAccountModal
          userEmail={user.email}
          loading={del.isPending}
          onClose={() => setShowDelete(false)}
          onConfirm={() => del.mutate()}
        />
      )}
    </div>
  )
}
