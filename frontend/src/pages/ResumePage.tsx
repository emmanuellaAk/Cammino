import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Trash2, CheckCircle, Zap, RefreshCw } from 'lucide-react'
import { resumeApi } from '@/api/resume'
import type { Resume, ResumeAnalysis } from '@/types'

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_RESUMES: Resume[] = [
  {
    id: 'r-1', filename: 'Amara_Okafor_CV_2026.pdf',
    fileSize: 127_488, active: true, uploadedAt: '2026-06-15T09:00:00Z',
  },
]

const MOCK_ANALYSIS: ResumeAnalysis = {
  id: 'a-1', resumeId: 'r-1', overallScore: 78,
  summary: 'Strong foundation with relevant technical experience. Your resume clearly demonstrates backend engineering skills and academic rigour. Quantifying impact and tightening keyword alignment would meaningfully boost application success across your target roles.',
  skills: ['Java', 'Spring Boot', 'Python', 'TypeScript', 'React', 'PostgreSQL', 'REST APIs', 'Git', 'Docker', 'AWS'],
  strengths: [
    'Concise, well-structured project descriptions',
    'Strong academic background with relevant coursework clearly listed',
    'Good breadth of technical skills across frontend and backend',
    'Internship experience scoped and quantified with tech stack',
  ],
  improvements: [
    'Quantify impact — add numbers to project outcomes (users, latency improvements, scale)',
    'Align keywords more closely with job descriptions in your target sector',
    'Add a two-line professional summary at the top to set context fast',
    'Expand personal projects or open-source contributions to show initiative',
  ],
  analysisDate: '2026-06-15T09:30:00Z',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtSize(bytes: number) {
  return bytes >= 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 80 ? '#12936a' : score >= 65 ? '#c98a00' : '#8a8a8e'
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : 'Needs work'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
      <svg width={120} height={120} viewBox="0 0 120 120">
        <circle cx={60} cy={60} r={r} fill="none" stroke="var(--panel)" strokeWidth={9} />
        <circle
          cx={60} cy={60} r={r} fill="none"
          stroke={color} strokeWidth={9}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x={60} y={64} textAnchor="middle" style={{ fontSize: 26, fontWeight: 700, fill: color, fontFamily: 'Inter' }}>
          {score}
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.03em' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Overall resume score</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
          <Zap size={13} style={{ color: 'var(--accent-brand)' }} />
          <span style={{ fontSize: 12, color: 'var(--accent-brand)', fontWeight: 500 }}>AI analysis</span>
        </div>
      </div>
    </div>
  )
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') onFile(file)
  }, [onFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--accent-brand)' : 'var(--border)'}`,
        borderRadius: 12, padding: '28px 20px', textAlign: 'center',
        cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
        background: dragging ? 'color-mix(in srgb, var(--accent-brand) 5%, transparent)' : 'var(--surface-2)',
      }}
    >
      <input
        ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
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
          {resume.filename}
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
  const [localResumes, setLocalResumes] = useState<Resume[]>(MOCK_RESUMES)
  const [analyzing, setAnalyzing] = useState(false)

  const { data: resumesRes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => { try { return await resumeApi.list() } catch { return null } },
    staleTime: 60_000,
  })

  const activeId = (resumesRes?.data?.data ?? localResumes).find((r) => r.active)?.id

  const { data: analysisRes } = useQuery({
    queryKey: ['resume-analysis', activeId],
    queryFn: async () => { try { return await resumeApi.getAnalysis() } catch { return null } },
    enabled: !!activeId,
    staleTime: 300_000,
  })

  const resumes = resumesRes?.data?.data ?? localResumes
  const analysis = analysisRes?.data?.data ?? (activeId ? MOCK_ANALYSIS : null)

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

  function handleFile(file: File) {
    if (resumesRes) {
      upload.mutate(file)
    } else {
      const mock: Resume = {
        id: `r-local-${Date.now()}`,
        filename: file.name,
        fileSize: file.size,
        active: localResumes.length === 0,
        uploadedAt: new Date().toISOString(),
      }
      setLocalResumes((prev) => [...prev, mock])
    }
  }

  function handleActivate(id: string) {
    if (resumesRes) {
      activate.mutate(id)
    } else {
      setLocalResumes((prev) => prev.map((r) => ({ ...r, active: r.id === id })))
    }
  }

  function handleDelete(id: string) {
    if (resumesRes) {
      remove.mutate(id)
    } else {
      setLocalResumes((prev) => prev.filter((r) => r.id !== id))
    }
  }

  async function handleAnalyze() {
    if (!activeId) return
    setAnalyzing(true)
    try {
      await resumeApi.analyze()
      queryClient.invalidateQueries({ queryKey: ['resume-analysis', activeId] })
    } catch {
      // mock: just show existing analysis
    } finally {
      setTimeout(() => setAnalyzing(false), 1200)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>

        {/* ── Left: Analysis ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {analysis ? (
            <>
              {/* Score + summary */}
              <div style={{
                background: 'var(--surface)', borderRadius: 14,
                border: '1px solid var(--border)', padding: '24px 24px 20px',
                boxShadow: 'var(--shadow)',
              }}>
                <ScoreRing score={analysis.overallScore} />
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65, margin: '18px 0 0' }}>
                  {analysis.summary}
                </p>
              </div>

              {/* Skills */}
              <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>Detected skills</div>
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

              {/* Strengths + improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Strengths */}
                <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>Strengths</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {analysis.strengths.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        <span style={{ color: '#12936a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, letterSpacing: '-0.01em' }}>To improve</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {analysis.improvements.map((s, i) => (
                      <li key={i} style={{ display: 'flex', gap: 9, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                        <span style={{ color: '#c98a00', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
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
          {/* Resume list */}
          {resumes.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '18px 18px 14px', boxShadow: 'var(--shadow)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>
                Your resumes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {resumes.map((r) => (
                  <ResumeRow key={r.id} resume={r} onActivate={handleActivate} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {/* Upload */}
          <div style={{ background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)', padding: '18px', boxShadow: 'var(--shadow)' }}>
            {resumes.length === 0 && (
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>Upload resume</div>
            )}
            <UploadZone onFile={handleFile} />
            {upload.isPending && (
              <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>Uploading…</div>
            )}
          </div>

          {/* Analyse button */}
          {activeId && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                width: '100%', padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600,
                background: 'var(--accent-brand)', color: '#fff', border: 'none',
                cursor: analyzing ? 'default' : 'pointer', opacity: analyzing ? 0.75 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              {analyzing
                ? <><RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Analysing…</>
                : <><Zap size={14} /> Analyse resume</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
