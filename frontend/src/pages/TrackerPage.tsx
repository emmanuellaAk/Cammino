import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MoreHorizontal, Calendar, X } from 'lucide-react'
import { jobsApi, type CreateJobRequest } from '@/api/jobs'
import { STATUS_META, timeAgo, companyColor, companyInitial } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { ApplicationStatus, Job } from '@/types'

const COLUMNS: ApplicationStatus[] = ['SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED']

function groupByStatus(jobs: Job[]) {
  const map = Object.fromEntries(COLUMNS.map((s) => [s, [] as Job[]])) as Record<ApplicationStatus, Job[]>
  for (const job of jobs) map[job.status]?.push(job)
  return map
}

// ── Input ─────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', font: "400 13px 'Inter'", color: 'var(--text)',
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 9, padding: '9px 12px',
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

// ── Status move menu ──────────────────────────────────────────────────────────
function StatusMenu({ job, onMove, onClose }: {
  job: Job
  onMove: (id: string, status: ApplicationStatus) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 60,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '4px 0',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 148,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', padding: '6px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Move to
      </div>
      {COLUMNS.filter((s) => s !== job.status).map((s) => {
        const meta = STATUS_META[s]
        return (
          <button
            key={s}
            onClick={(e) => { e.stopPropagation(); onMove(job.id, s); onClose() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              width: '100%', padding: '8px 12px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, color: 'var(--text)', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Job card ──────────────────────────────────────────────────────────────────
function JobCard({ job, onMove }: { job: Job; onMove: (id: string, status: ApplicationStatus) => void }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const daysUntilDeadline = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <div
      onClick={() => navigate(`/tracker/${job.id}`)}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '13px 14px',
        cursor: 'pointer', position: 'relative',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)')}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'none')}
    >
      {/* Top row: avatar + three-dot */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: companyColor(job.company), color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700,
        }}>
          {companyInitial(job.company)}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            aria-label="Move to another status"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text-3)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && <StatusMenu job={job} onMove={onMove} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* Title + company */}
      <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 3 }}>{job.jobTitle}</div>
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10 }}>{job.company}</div>

      {/* Footer: deadline + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {daysUntilDeadline !== null ? (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600,
            color: daysUntilDeadline <= 3 ? '#e5484d' : daysUntilDeadline <= 7 ? '#c98a00' : 'var(--text-3)',
          }}>
            <Calendar size={11} />
            {daysUntilDeadline <= 0 ? 'Today' : `${daysUntilDeadline}d`}
          </span>
        ) : <span />}
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(job.updatedAt)}</span>
      </div>
    </div>
  )
}

// ── Add job modal ─────────────────────────────────────────────────────────────
function AddJobModal({ defaultStatus, onClose, onSubmit, loading, error }: {
  defaultStatus: ApplicationStatus
  onClose: () => void
  onSubmit: (data: CreateJobRequest) => void
  loading: boolean
  error?: string
}) {
  const [form, setForm] = useState<CreateJobRequest>({ jobTitle: '', company: '', status: defaultStatus })

  const set = (key: keyof CreateJobRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value || undefined, ...(key === 'jobTitle' || key === 'company' ? { [key]: e.target.value } : {}) }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.jobTitle.trim() || !form.company.trim()) return
    onSubmit(form)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 16,
          border: '1px solid var(--border)', padding: '26px 26px 22px',
          width: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>Add job</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            <Field label="Job title *">
              <input required style={inputStyle} value={form.jobTitle} onChange={set('jobTitle')} placeholder="Software Engineer" />
            </Field>
            <Field label="Company *">
              <input required style={inputStyle} value={form.company} onChange={set('company')} placeholder="Acme Inc." />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={set('status')}>
                {COLUMNS.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <input style={inputStyle} value={form.location ?? ''} onChange={set('location')} placeholder="London, UK" />
            </Field>
          </div>

          <Field label="Job URL">
            <input style={inputStyle} type="url" value={form.jobUrl ?? ''} onChange={set('jobUrl')} placeholder="https://..." />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            <Field label="Deadline">
              <input style={inputStyle} type="date" value={form.deadline ?? ''} onChange={set('deadline')} />
            </Field>
            <Field label="Salary">
              <input style={inputStyle} value={form.salary ?? ''} onChange={set('salary')} placeholder="£60k – £80k" />
            </Field>
          </div>

          <Field label="Source">
            <input style={inputStyle} value={form.source ?? ''} onChange={set('source')} placeholder="LinkedIn, Referral…" />
          </Field>

          {error && <ErrorBanner message={error} />}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 9, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: 980, fontSize: 13, fontWeight: 500,
              background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '9px 18px', borderRadius: 980, fontSize: 13, fontWeight: 600,
              background: 'var(--accent-brand)', border: 'none', color: '#fff', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Adding…' : 'Add job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────
function BoardColumn({ status, jobs, onAdd, onMove }: {
  status: ApplicationStatus
  jobs: Job[]
  onAdd: (status: ApplicationStatus) => void
  onMove: (id: string, status: ApplicationStatus) => void
}) {
  const meta = STATUS_META[status]

  return (
    <div style={{ width: 256, minWidth: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Column header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 4px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{meta.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 980,
          background: `color-mix(in srgb, ${meta.dot} 12%, transparent)`, color: meta.dot,
        }}>
          {jobs.length}
        </span>
        <button
          onClick={() => onAdd(status)}
          aria-label={`Add job to ${meta.label}`}
          style={{
            width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text-3)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', paddingRight: 2, paddingBottom: 8 }}>
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onMove={onMove} />
        ))}
        {jobs.length === 0 && (
          <div
            onClick={() => onAdd(status)}
            style={{
              border: '1.5px dashed var(--border)', borderRadius: 12,
              padding: '20px 14px', textAlign: 'center',
              color: 'var(--text-3)', fontSize: 12, cursor: 'pointer',
            }}
          >
            + Add job
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tracker page ──────────────────────────────────────────────────────────────
export default function TrackerPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<ApplicationStatus | null>(null)

  const { data: res, isLoading, isError, refetch } = useQuery({
    queryKey: ['jobs', 'board'],
    queryFn: () => jobsApi.list({ size: 200, sortBy: 'updatedAt', sortDir: 'desc' }),
    staleTime: 30_000,
  })

  const jobs = res?.data?.data?.content ?? []
  const board = groupByStatus(jobs)

  const moveJob = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      jobsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs', 'board'] })
      const prev = queryClient.getQueryData(['jobs', 'board'])
      queryClient.setQueryData(['jobs', 'board'], (old: typeof res) => {
        if (!old?.data?.data?.content) return old
        return {
          ...old,
          data: { ...old.data, data: { ...old.data.data, content: old.data.data.content.map((j) => j.id === id ? { ...j, status } : j) } },
        }
      })
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['jobs', 'board'], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'board'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
  })

  const addJob = useMutation({
    mutationFn: (data: CreateJobRequest) => jobsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', 'board'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
      setModal(null)
    },
  })
  const addJobError = addJob.isError
    ? ((addJob.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Couldn't add this job — please try again.")
    : undefined

  const handleMove = useCallback((id: string, status: ApplicationStatus) => {
    moveJob.mutate({ id, status })
  }, [moveJob])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto' }}>
        {COLUMNS.map((s) => (
          <div key={s} style={{ width: 256, minWidth: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '2px 4px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_META[s].dot }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{STATUS_META[s].label}</span>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, height: 100,
              }} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {isError ? (
        <ErrorBanner message="Couldn't load your job tracker." onRetry={() => refetch()} />
      ) : (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8, minHeight: 0 }}>
          {COLUMNS.map((s) => (
            <BoardColumn
              key={s}
              status={s}
              jobs={board[s]}
              onAdd={setModal}
              onMove={handleMove}
            />
          ))}
        </div>
      )}

      {modal && (
        <AddJobModal
          defaultStatus={modal}
          onClose={() => setModal(null)}
          onSubmit={(data) => addJob.mutate(data)}
          loading={addJob.isPending}
          error={addJobError}
        />
      )}
    </>
  )
}
