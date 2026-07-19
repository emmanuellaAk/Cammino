import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Trash2, Plus, Zap, ChevronDown } from 'lucide-react'
import { jobsApi } from '@/api/jobs'
import { resumeApi } from '@/api/resume'
import { STATUS_META, formatDate, timeAgo, companyColor, companyInitial } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { ApplicationStatus } from '@/types'

const STATUSES: ApplicationStatus[] = ['SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED']

function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message
  return message ?? fallback
}

// ── Score circle ──────────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#12936a' : score >= 65 ? '#c98a00' : '#8a8a8e'
  const label = score >= 80 ? 'Strong match' : score >= 65 ? 'Good match' : 'Moderate match'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="var(--panel)" strokeWidth={8} />
        <circle
          cx={50} cy={50} r={r} fill="none"
          stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x={50} y={54} textAnchor="middle" style={{ fontSize: 20, fontWeight: 700, fill: color, fontFamily: 'Inter' }}>
          {score}
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: '-0.01em' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Resume–job fit score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
          <Zap size={12} style={{ color: 'var(--accent-brand)' }} />
          <span style={{ fontSize: 11, color: 'var(--accent-brand)', fontWeight: 500 }}>AI analysis</span>
        </div>
      </div>
    </div>
  )
}

// ── Skill chip ────────────────────────────────────────────────────────────────
function Chip({ label, type }: { label: string; type: 'match' | 'miss' }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 980,
      background: type === 'match' ? 'color-mix(in srgb, #12936a 12%, transparent)' : 'color-mix(in srgb, #c98a00 12%, transparent)',
      color: type === 'match' ? '#12936a' : '#c98a00',
    }}>
      {label}
    </span>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Status selector ───────────────────────────────────────────────────────────
function StatusSelector({ value, onChange }: { value: ApplicationStatus; onChange: (s: ApplicationStatus) => void }) {
  const [open, setOpen] = useState(false)
  const meta = STATUS_META[value]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 12px', borderRadius: 980, cursor: 'pointer',
          background: `color-mix(in srgb, ${meta.dot} 12%, transparent)`,
          border: `1.5px solid color-mix(in srgb, ${meta.dot} 30%, transparent)`,
          color: meta.dot, fontSize: 13, fontWeight: 600,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot }} />
        {meta.label}
        <ChevronDown size={13} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '4px 0',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 148,
        }}>
          {STATUSES.map((s) => {
            const m = STATUS_META[s]
            return (
              <button key={s} onClick={() => { onChange(s); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', padding: '8px 12px',
                background: s === value ? 'var(--border-2)' : 'none',
                border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)', textAlign: 'left',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = s === value ? 'var(--border-2)' : 'none')}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }} />
                {m.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Job Detail Page ───────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [noteInput, setNoteInput] = useState('')
  const [localStatus, setLocalStatus] = useState<ApplicationStatus | null>(null)

  const { data: jobRes, isLoading, isError: jobError } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobsApi.get(id!),
    enabled: !!id,
    retry: false,
  })

  const { data: notesRes, isError: notesError } = useQuery({
    queryKey: ['job', id, 'notes'],
    queryFn: () => jobsApi.listNotes(id!),
    enabled: !!id,
  })

  const { data: matchRes, isLoading: matchLoading, isError: matchLoadError } = useQuery({
    queryKey: ['job', id, 'match'],
    queryFn: () => resumeApi.getJobMatch(id!),
    enabled: !!id,
    retry: false, // a 404 here just means "no match yet" — not a real failure
  })

  const job = jobRes?.data?.data
  const notes = notesRes?.data?.data ?? []
  const matchData = matchRes?.data?.data ?? null
  const status = localStatus ?? job?.status ?? 'SAVED'

  const runMatch = useMutation({
    mutationFn: () => resumeApi.matchJob(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', id, 'match'] }),
  })

  const matchErrorMessage = apiErrorMessage(runMatch.error, 'Something went wrong — please try again.')

  const updateStatus = useMutation({
    mutationFn: (s: ApplicationStatus) => jobsApi.updateStatus(id!, s),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['jobs', 'board'] })
    },
  })

  const addNote = useMutation({
    mutationFn: (content: string) => jobsApi.addNote(id!, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', id, 'notes'] }),
  })

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => jobsApi.deleteNote(id!, noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job', id, 'notes'] }),
  })

  function handleStatusChange(s: ApplicationStatus) {
    const prevStatus = status
    setLocalStatus(s)
    updateStatus.mutate(s, { onError: () => setLocalStatus(prevStatus) })
  }

  function handleAddNote() {
    const content = noteInput.trim()
    if (!content || addNote.isPending) return
    addNote.mutate(content, { onSuccess: () => setNoteInput('') })
  }

  function handleDeleteNote(noteId: string) {
    deleteNote.mutate(noteId)
  }

  if (isLoading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: 130, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>
          <div className="animate-pulse" style={{ height: 320, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }} />
          <div className="animate-pulse" style={{ height: 320, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }} />
        </div>
      </div>
    )
  }

  if (jobError || !job) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: 'var(--text-3)' }}>
          {jobError ? "Couldn't load this job — please try again." : 'Job not found.'}
        </div>
        <button onClick={() => navigate('/tracker')} style={{ marginTop: 16, color: 'var(--accent-brand)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          ← Back to tracker
        </button>
      </div>
    )
  }

  const daysUntilDeadline = job.deadline
    ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }} className="animate-fade-up">

      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/tracker')}
        className="flex items-center gap-[6px]"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, marginBottom: 16, padding: 0 }}
      >
        <ArrowLeft size={14} />
        Job tracker
      </button>

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface)', borderRadius: 14,
        border: '1px solid var(--border)', padding: '22px 24px',
        boxShadow: 'var(--shadow)', marginBottom: 14,
        display: 'flex', alignItems: 'flex-start', gap: 18,
      }}>
        {/* Company avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 13, flexShrink: 0,
          background: companyColor(job.company), color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700,
        }}>
          {companyInitial(job.company)}
        </div>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>{job.jobTitle}</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>
            {job.company}{job.location ? ` · ${job.location}` : ''}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <StatusSelector value={status} onChange={handleStatusChange} />
            {job.salary && (
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 980, padding: '5px 11px' }}>
                {job.salary}
              </span>
            )}
            {daysUntilDeadline !== null && (
              <span style={{
                fontSize: 12, fontWeight: 600, borderRadius: 980, padding: '5px 11px',
                background: daysUntilDeadline <= 3 ? 'color-mix(in srgb, #e5484d 12%, transparent)' : 'color-mix(in srgb, #c98a00 12%, transparent)',
                color: daysUntilDeadline <= 3 ? '#e5484d' : '#c98a00',
              }}>
                Deadline: {daysUntilDeadline <= 0 ? 'today' : daysUntilDeadline === 1 ? 'tomorrow' : `in ${daysUntilDeadline}d`} · {formatDate(job.deadline!)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {job.jobUrl && (
            <a
              href={job.jobUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-[6px]"
              style={{
                padding: '8px 14px', borderRadius: 980, fontSize: 13, fontWeight: 500,
                background: 'var(--accent-brand)', color: '#fff', textDecoration: 'none', border: 'none',
              }}
            >
              <ExternalLink size={14} />
              View job
            </a>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, alignItems: 'start' }}>

        {/* Left: AI match ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card
            title="AI match analysis"
            action={matchData ? (
              <button
                onClick={() => runMatch.mutate()}
                disabled={runMatch.isPending}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 980,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-2)', cursor: runMatch.isPending ? 'default' : 'pointer',
                  opacity: runMatch.isPending ? 0.6 : 1,
                }}
              >
                {runMatch.isPending ? 'Analysing…' : 'Re-run'}
              </button>
            ) : undefined}
          >
            {matchLoadError && (
              <div style={{ marginBottom: 16 }}>
                <ErrorBanner message="Couldn't load the match analysis." />
              </div>
            )}
            {matchLoading ? (
              <div className="animate-pulse" style={{ height: 200, borderRadius: 10, background: 'var(--panel)' }} />
            ) : matchData ? (
              <>
                <ScoreCircle score={matchData.matchScore} />

                {matchData.summary && (
                  <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, margin: '16px 0 0' }}>
                    {matchData.summary}
                  </p>
                )}

                {/* Matching skills */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Matching skills
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {matchData.matchingSkills.map((s) => <Chip key={s} label={s} type="match" />)}
                  </div>
                </div>

                {/* Missing skills */}
                {matchData.missingSkills.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Gaps to address
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {matchData.missingSkills.map((s) => <Chip key={s} label={s} type="miss" />)}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {matchData.recommendations.length > 0 && (
                  <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Recommendations
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {matchData.recommendations.map((r, i) => (
                        <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                          <span style={{ color: 'var(--accent-brand)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Zap size={22} style={{ color: 'var(--text-3)', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No match analysis yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 16 }}>
                  Run AI matching to score your active resume against this job's requirements.
                </div>
                <button
                  onClick={() => runMatch.mutate()}
                  disabled={runMatch.isPending}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '9px 18px', borderRadius: 980, fontSize: 13, fontWeight: 600,
                    background: 'var(--accent-brand)', color: '#fff', border: 'none',
                    cursor: runMatch.isPending ? 'default' : 'pointer', opacity: runMatch.isPending ? 0.6 : 1,
                  }}
                >
                  <Zap size={14} />
                  {runMatch.isPending ? 'Analysing…' : 'Run AI match'}
                </button>
              </div>
            )}
            {runMatch.isError && (
              <div style={{ marginTop: 16 }}>
                <ErrorBanner message={matchErrorMessage} />
              </div>
            )}
          </Card>
        </div>

        {/* Right: Notes + Details ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Notes */}
          <Card title={`Notes${notes.length > 0 ? ` (${notes.length})` : ''}`}>
            {/* Add note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: notes.length > 0 ? 16 : 0 }}>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote() }}
                placeholder="Add a note… (⌘ + Enter to save)"
                rows={3}
                style={{
                  width: '100%', font: "400 13px 'Inter'", color: 'var(--text)',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 9, padding: '9px 12px',
                  resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-brand)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteInput.trim() || addNote.isPending}
                className="flex items-center gap-[5px] self-end"
                style={{
                  padding: '7px 14px', borderRadius: 980, fontSize: 12, fontWeight: 600,
                  background: noteInput.trim() ? 'var(--accent-brand)' : 'var(--panel)',
                  color: noteInput.trim() ? '#fff' : 'var(--text-3)',
                  border: 'none', cursor: noteInput.trim() && !addNote.isPending ? 'pointer' : 'default',
                  opacity: addNote.isPending ? 0.6 : 1,
                }}
              >
                <Plus size={13} /> {addNote.isPending ? 'Saving…' : 'Save note'}
              </button>
              {addNote.isError && (
                <ErrorBanner message={apiErrorMessage(addNote.error, "Couldn't save this note — please try again.")} />
              )}
            </div>

            {notesError && (
              <div style={{ marginBottom: 12 }}>
                <ErrorBanner message="Couldn't load notes for this job." />
              </div>
            )}

            {/* Note list */}
            {notes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notes.map((note) => (
                  <div key={note.id} style={{
                    padding: '11px 13px', borderRadius: 10,
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                        {note.content}
                      </p>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        aria-label="Delete note"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2, flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{timeAgo(note.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}

            {deleteNote.isError && (
              <div style={{ marginTop: 10 }}>
                <ErrorBanner message={apiErrorMessage(deleteNote.error, "Couldn't delete this note — please try again.")} />
              </div>
            )}

            {notes.length === 0 && !noteInput && !notesError && (
              <div style={{ textAlign: 'center', padding: '16px 0 4px', color: 'var(--text-3)', fontSize: 12 }}>
                No notes yet — add context, reminders, or interview feedback.
              </div>
            )}
          </Card>

          {/* Details */}
          <Card title="Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Source', value: job.source },
                { label: 'Applied', value: job.appliedAt ? formatDate(job.appliedAt) : undefined },
                { label: 'Deadline', value: job.deadline ? formatDate(job.deadline) : undefined },
                { label: 'Added', value: formatDate(job.createdAt) },
                { label: 'Last updated', value: timeAgo(job.updatedAt) },
              ].filter((r) => r.value).map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
              {job.jobUrl && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Job URL</span>
                  <a
                    href={job.jobUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent-brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    Open <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
