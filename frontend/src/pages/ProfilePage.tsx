import { useState, useEffect, useId, cloneElement, isValidElement, type ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ShieldCheck, ShieldAlert, Trash2, Puzzle, Copy, Check } from 'lucide-react'
import { userApi, type UpdateProfileRequest } from '@/api/user'
import { extensionApi } from '@/api/extension'
import { useAuth } from '@/context/AuthContext'
import { formatDate, timeAgo, initials } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import Modal from '@/components/ui/Modal'
import { useIsMobile } from '@/hooks/useMediaQuery'
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
  borderRadius: 9, padding: '9px 12px',
  boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: ReactElement }) {
  const id = useId()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</label>
      {isValidElement(children) ? cloneElement(children, { id } as object) : children}
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
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
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
    <Modal title="Delete account" titleColor="var(--error)" onClose={onClose} width={420}>
        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
          This permanently deletes your account, resumes, tracked applications, and email scan history.
          This cannot be undone. Type <strong>{userEmail}</strong> to confirm.
        </p>

        <input
          aria-label={`Type ${userEmail} to confirm account deletion`}
          style={inputStyle}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={userEmail}
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
              background: 'var(--error)', border: 'none', color: '#fff',
              cursor: canDelete && !loading ? 'pointer' : 'default',
              opacity: canDelete && !loading ? 1 : 0.5,
            }}
          >
            {loading ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
    </Modal>
  )
}

// ── Browser extension tokens ──────────────────────────────────────────────────
function NewTokenReveal({ token, label, onDone }: { token: string; label: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div style={{
      borderRadius: 14, border: '1px solid color-mix(in srgb, var(--accent-brand) 30%, var(--border))',
      background: 'color-mix(in srgb, var(--accent-brand) 6%, transparent)', padding: '14px 16px', marginBottom: 12,
    }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}>
        Token generated: "{label}"
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <code style={{
          flex: 1, fontSize: 12, padding: '8px 10px', borderRadius: 8,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          overflowX: 'auto', whiteSpace: 'nowrap', fontFamily: 'monospace',
        }}>
          {token}
        </code>
        <span role="status" aria-live="polite" style={{ display: 'contents' }}>
          <button
            onClick={copy}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
              padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8, lineHeight: 1.5 }}>
        Paste this into the Cammino extension popup. It won't be shown again — generate a new one if you lose it.
      </div>
      <button
        onClick={onDone}
        style={{
          fontSize: 11, fontWeight: 600, color: 'var(--accent-brand)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 10,
        }}
      >
        Done
      </button>
    </div>
  )
}

function ExtensionCard() {
  const queryClient = useQueryClient()
  const [labelInput, setLabelInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [revealed, setRevealed] = useState<{ token: string; label: string } | null>(null)

  const { data: tokensRes, isLoading } = useQuery({
    queryKey: ['extension-tokens'],
    queryFn: () => extensionApi.listTokens(),
    staleTime: 15_000,
  })
  const tokens = tokensRes?.data?.data ?? []

  const generate = useMutation({
    mutationFn: (label: string) => extensionApi.generateToken(label),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['extension-tokens'] })
      if (res.data.data) setRevealed({ token: res.data.data.token, label: res.data.data.label })
      setLabelInput('')
      setShowForm(false)
    },
  })

  const revoke = useMutation({
    mutationFn: (id: string) => extensionApi.revokeToken(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['extension-tokens'] }),
  })

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!labelInput.trim()) return
    generate.mutate(labelInput.trim())
  }

  return (
    <Card title="Browser extension">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
        <Puzzle size={16} style={{ color: 'var(--text-3)', marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          Generate a personal access token to connect the Cammino Chrome extension and save jobs
          straight from any job listing page.
        </p>
      </div>

      {revealed && (
        <NewTokenReveal token={revealed.token} label={revealed.label} onDone={() => setRevealed(null)} />
      )}

      {(generate.isError || revoke.isError) && (
        <div style={{ marginBottom: 12 }}>
          <ErrorBanner message="That didn't work — please try again." />
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="animate-pulse" style={{ height: 40, borderRadius: 9, background: 'var(--panel)' }} />
        </div>
      ) : tokens.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {tokens.map((t) => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  Created {formatDate(t.createdAt)}
                  {t.lastUsedAt ? ` · last used ${timeAgo(t.lastUsedAt)}` : ' · never used'}
                  {t.expiresAt ? ` · expires ${formatDate(t.expiresAt)}` : ''}
                </div>
              </div>
              <button
                onClick={() => revoke.mutate(t.id)}
                disabled={revoke.isPending}
                aria-label={`Revoke token "${t.label}"`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, flexShrink: 0, width: 24, height: 24 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            aria-label="Token label"
            style={{ ...inputStyle, flex: 1 }}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="e.g. Work laptop"
            maxLength={100}
          />
          <button
            type="submit"
            disabled={!labelInput.trim() || generate.isPending}
            style={{
              padding: '0 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
              background: 'var(--accent-brand)', border: 'none', color: '#fff',
              cursor: labelInput.trim() ? 'pointer' : 'default', opacity: labelInput.trim() ? 1 : 0.6, flexShrink: 0,
            }}
          >
            {generate.isPending ? 'Generating…' : 'Generate'}
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(false); setLabelInput('') }}
            style={{
              padding: '0 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
              background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          style={{
            fontSize: 12.5, fontWeight: 600, padding: '8px 14px', borderRadius: 9,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          + Generate new token
        </button>
      )}
    </Card>
  )
}

// ── Profile page ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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
              color: user.emailVerified ? 'var(--success)' : 'var(--warning)',
              background: user.emailVerified ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--warning) 12%, transparent)',
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
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 13 }}>
              <Field label="First name">
                <input style={inputStyle} value={form.firstName ?? ''} onChange={set('firstName')} />
              </Field>
              <Field label="Last name">
                <input style={inputStyle} value={form.lastName ?? ''} onChange={set('lastName')} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 13 }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }} role="status" aria-live="polite">
              <button
                type="submit"
                disabled={save.isPending}
                style={{
                  padding: '9px 20px', borderRadius: 980, fontSize: 13, fontWeight: 600,
                  background: 'var(--accent-brand)', border: 'none', color: '#fff',
                  cursor: save.isPending ? 'default' : 'pointer', opacity: save.isPending ? 0.6 : 1,
                }}
              >
                {save.isPending ? 'Saving…' : 'Save changes'}
              </button>
              {showSaved && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
                  <CheckCircle2 size={13} /> Saved
                </span>
              )}
              {save.isError && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--error)' }}>
                  Couldn't save — try again
                </span>
              )}
            </div>
          </form>
        </Card>

        {/* Browser extension */}
        <ExtensionCard />

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
                background: 'color-mix(in srgb, var(--error) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)',
                color: 'var(--error)', cursor: 'pointer',
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
