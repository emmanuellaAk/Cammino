import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, CheckCircle, Zap, RefreshCw, GraduationCap, Briefcase, Sparkles, Plus } from 'lucide-react'
import { resumeApi } from '@/api/resume'
import { resumeDraftsApi } from '@/api/resumeDrafts'
import { timeAgo } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import { useIsTablet } from '@/hooks/useMediaQuery'
import type { Resume } from '@/types'

function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message
  return message ?? fallback
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

// ── Analysis header ───────────────────────────────────────────────────────────
function AnalysisHeader({ experienceYears, education }: { experienceYears?: number; education?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Zap size={13} style={{ color: 'var(--accent-brand)' }} />
        <span style={{ fontSize: 12, color: 'var(--accent-brand)', fontWeight: 600 }}>AI analysis</span>
      </div>
      {experienceYears != null && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500,
          color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 980, padding: '4px 10px',
        }}>
          <Briefcase size={12} /> {experienceYears} {experienceYears === 1 ? 'year' : 'years'} experience
        </span>
      )}
      {education && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500,
          color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 980, padding: '4px 10px',
        }}>
          <GraduationCap size={12} /> {education}
        </span>
      )}
    </div>
  )
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile, disabled }: { onFile: (f: File) => void; disabled?: boolean }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') onFile(file)
  }, [onFile, disabled])

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload resume, PDF, max 5 MB"
      aria-disabled={disabled}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => { if (!disabled) inputRef.current?.click() }}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() }
      }}
      style={{
        border: `2px dashed ${dragging ? 'var(--accent-brand)' : 'var(--border)'}`,
        borderRadius: 14, padding: '28px 20px', textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer', transition: 'border-color 0.15s, background 0.15s',
        background: dragging ? 'color-mix(in srgb, var(--accent-brand) 5%, transparent)' : 'var(--surface-2)',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }} disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      <Upload size={22} style={{ color: 'var(--accent-brand)', margin: '0 auto 10px' }} />
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
        {dragging ? 'Drop your PDF here' : 'Upload resume'}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>PDF · max 5 MB</div>
    </div>
  )
}

// ── Resume file row ───────────────────────────────────────────────────────────
function ResumeRow({ resume, onActivate, onDelete }: {
  resume: Resume
  onActivate: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 11,
      background: resume.active ? 'color-mix(in srgb, var(--accent-brand) 6%, transparent)' : 'var(--surface-2)',
      border: `1px solid ${resume.active ? 'color-mix(in srgb, var(--accent-brand) 22%, transparent)' : 'var(--border)'}`,
    }}>
      <FileText size={18} style={{ color: resume.active ? 'var(--accent-brand)' : 'var(--text-3)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {resume.originalFileName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{fmtSize(resume.fileSize)}</div>
      </div>
      {resume.active ? (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 980,
          background: 'color-mix(in srgb, var(--accent-brand) 14%, transparent)',
          color: 'var(--accent-brand)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
        }}>
          <CheckCircle size={11} /> Active
        </span>
      ) : (
        <button
          onClick={() => onActivate(resume.id)}
          style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 980,
            background: 'var(--panel)', border: '1px solid var(--border)',
            color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
          }}
        >
          Set active
        </button>
      )}
      <button
        onClick={() => onDelete(resume.id)}
        aria-label={`Delete ${resume.originalFileName}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 3, flexShrink: 0 }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Resume page ───────────────────────────────────────────────────────────────
export default function ResumePage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isTablet = useIsTablet()
  const { data: draftsRes, isError: draftsError } = useQuery({
    queryKey: ['resume-drafts'],
    queryFn: () => resumeDraftsApi.list(),
    staleTime: 30_000,
  })
  const drafts = draftsRes?.data?.data ?? []

  const createDraft = useMutation({
    mutationFn: (title: string) => resumeDraftsApi.create(title),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['resume-drafts'] })
      const id = res.data.data?.id
      if (id) navigate(`/resume/builder/${id}`)
    },
  })

  const { data: resumesRes, isLoading: loadingResumes, isError: resumesError, refetch: refetchResumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumeApi.list(),
    staleTime: 60_000,
  })

  const resumes = resumesRes?.data?.data ?? []
  const activeId = resumes.find((r) => r.active)?.id

  const { data: analysisRes, isError: analysisError } = useQuery({
    queryKey: ['resume-analysis', activeId],
    queryFn: () => resumeApi.getAnalysis(),
    enabled: !!activeId,
    staleTime: 300_000,
    retry: false, // a 404 here just means "no analysis yet" — don't retry, and don't confuse it with a real failure
  })

  const analysis = analysisRes?.data?.data ?? null

  const upload = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })

  const activate = useMutation({
    mutationFn: (id: string) => resumeApi.setActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })

  const analyze = useMutation({
    mutationFn: () => resumeApi.analyze(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resume-analysis', activeId] }),
  })
  const analyzeErrorMessage = analyze.isError
    ? apiErrorMessage(analyze.error, "Couldn't analyse this resume — please try again.")
    : null

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 300px', gap: 14, alignItems: 'start' }}>

        {/* ── Left: Analysis ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {analysisError ? (
            <ErrorBanner message="Couldn't load the resume analysis." />
          ) : analysis ? (
            <>
              {/* Score + summary */}
              <div style={{
                background: 'var(--surface)', borderRadius: 14,
                border: '1px solid var(--border)', padding: '20px 22px',
                boxShadow: 'var(--shadow)',
              }}>
                <AnalysisHeader experienceYears={analysis.experienceYears} education={analysis.education} />
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: '16px 0 0' }}>
                  {analysis.summary}
                </p>
              </div>

              {/* Skills */}
              <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>Detected skills</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {analysis.skills.map((s) => (
                    <span key={s} style={{
                      fontSize: 12, fontWeight: 500, padding: '5px 11px', borderRadius: 980,
                      background: 'color-mix(in srgb, var(--accent-brand) 10%, transparent)',
                      color: 'var(--accent-brand)',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>Strengths</h2>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {analysis.strengths.map((s, i) => (
                    <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div style={{
              background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
              padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow)',
            }}>
              <Zap size={28} style={{ color: 'var(--text-3)', margin: '0 auto 14px' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No analysis yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Upload a resume and click Analyse to get an AI breakdown of your CV.
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Files ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resumesError && (
            <ErrorBanner message="Couldn't load your resumes." onRetry={() => refetchResumes()} />
          )}

          {/* Resume list */}
          {resumes.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>
                Your resumes
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resumes.map((r) => (
                  <ResumeRow key={r.id} resume={r} onActivate={(id) => activate.mutate(id)} onDelete={(id) => remove.mutate(id)} />
                ))}
              </div>
              {(activate.isError || remove.isError) && (
                <div style={{ marginTop: 10 }}>
                  <ErrorBanner message={apiErrorMessage(activate.error ?? remove.error, "That didn't work — please try again.")} />
                </div>
              )}
            </div>
          )}

          {/* Upload */}
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
            {resumes.length === 0 && !loadingResumes && (
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>Upload resume</h2>
            )}
            <UploadZone onFile={(f) => upload.mutate(f)} disabled={upload.isPending} />
            {upload.isPending && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>Uploading…</div>
            )}
            {upload.isError && (
              <div style={{ marginTop: 10 }}>
                <ErrorBanner message={apiErrorMessage(upload.error, "Couldn't upload this resume — please try again.")} />
              </div>
            )}
          </div>

          {/* Analyse button */}
          {activeId && (
            <div>
              <span role="status" aria-live="polite" style={{ display: 'contents' }}>
                <button
                  onClick={() => analyze.mutate()}
                  disabled={analyze.isPending}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600,
                    background: 'var(--accent-brand)', color: '#fff', border: 'none',
                    cursor: analyze.isPending ? 'default' : 'pointer', opacity: analyze.isPending ? 0.6 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  }}
                >
                  {analyze.isPending
                    ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Analysing…</>
                    : <><Zap size={14} /> Analyse resume</>
                  }
                </button>
              </span>
              {analyzeErrorMessage && (
                <div style={{ marginTop: 10 }}>
                  <ErrorBanner message={analyzeErrorMessage} />
                </div>
              )}
            </div>
          )}

          {/* Resume builder */}
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <Sparkles size={14} style={{ color: 'var(--accent-brand)' }} />
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>Resume builder</h2>
            </div>

            {draftsError && (
              <div style={{ marginBottom: 12 }}>
                <ErrorBanner message="Couldn't load your saved drafts." />
              </div>
            )}

            {drafts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {drafts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/resume/builder/${d.id}`)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                      padding: '9px 11px', borderRadius: 9, background: 'var(--surface-2)',
                      border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', width: '100%',
                    }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: 600 }}>{d.title}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Edited {timeAgo(d.updatedAt)}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => createDraft.mutate(`Resume ${drafts.length + 1}`)}
              disabled={createDraft.isPending}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
                fontSize: 12.5, fontWeight: 600, padding: '9px', borderRadius: 9,
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                color: 'var(--text-2)', cursor: createDraft.isPending ? 'default' : 'pointer',
              }}
            >
              <Plus size={13} /> {createDraft.isPending ? 'Creating…' : 'New resume'}
            </button>
            {createDraft.isError && (
              <div style={{ marginTop: 10 }}>
                <ErrorBanner message={apiErrorMessage(createDraft.error, "Couldn't create a new draft — please try again.")} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
