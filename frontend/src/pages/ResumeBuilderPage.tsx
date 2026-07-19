import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Code2, Eye, Sparkles, AlertTriangle } from 'lucide-react'
import { resumeDraftsApi } from '@/api/resumeDrafts'
import { useMdxPreview } from '@/hooks/useMdxPreview'
import { resumeMdxComponents } from '@/lib/resumeMdxComponents'
import { timeAgo } from '@/lib/utils'
import type { ResumeDraftMessage } from '@/types'

function Skel({ h = 16, r = 6 }: { h?: number; r?: number }) {
  return <div className="animate-pulse" style={{ height: h, borderRadius: r, background: 'var(--panel)' }} />
}

// ── Live preview / raw editor ──────────────────────────────────────────────────
function DocumentPane({ mdxContent, mode }: { mdxContent: string; mode: 'preview' | 'raw' }) {
  const { Content, error, compiling } = useMdxPreview(mdxContent)

  if (mode === 'raw') return null

  return (
    <div style={{
      background: '#fff', borderRadius: 14, border: '1px solid var(--border)',
      padding: '32px 36px', boxShadow: 'var(--shadow)', minHeight: 400, position: 'relative',
    }}>
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 500,
          color: '#c98a00', background: 'color-mix(in srgb, #c98a00 10%, transparent)',
          border: '1px solid color-mix(in srgb, #c98a00 25%, transparent)',
          borderRadius: 9, padding: '9px 12px', marginBottom: 16,
        }}>
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          Showing the last valid version — current edit has a syntax issue: {error}
        </div>
      )}
      {Content ? (
        <div style={{ color: '#1a1a1a' }}>
          <Content components={resumeMdxComponents} />
        </div>
      ) : compiling ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skel h={30} r={6} /><Skel h={14} r={4} /><Skel h={14} r={4} />
        </div>
      ) : null}
    </div>
  )
}

// ── Chat message bubble ────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: ResumeDraftMessage }) {
  const isUser = message.role === 'USER'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '85%', padding: '9px 13px', borderRadius: 13,
        fontSize: 13, lineHeight: 1.5,
        background: isUser ? 'var(--accent-brand)' : 'var(--surface-2)',
        color: isUser ? '#fff' : 'var(--text)',
        border: isUser ? 'none' : '1px solid var(--border)',
      }}>
        {message.content}
      </div>
    </div>
  )
}

// ── Resume builder page ────────────────────────────────────────────────────────
export default function ResumeBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'preview' | 'raw'>('preview')
  const [rawContent, setRawContent] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: draftRes, isLoading } = useQuery({
    queryKey: ['resume-draft', id],
    queryFn: () => resumeDraftsApi.get(id!),
    enabled: !!id,
  })
  const draft = draftRes?.data?.data

  const { data: messagesRes } = useQuery({
    queryKey: ['resume-draft', id, 'messages'],
    queryFn: () => resumeDraftsApi.listMessages(id!),
    enabled: !!id,
  })
  const messages = messagesRes?.data?.data ?? []

  const displayedContent = rawContent ?? draft?.mdxContent ?? ''

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const saveRaw = useMutation({
    mutationFn: (mdxContent: string) => resumeDraftsApi.update(id!, { mdxContent }),
    onSuccess: (res) => {
      queryClient.setQueryData(['resume-draft', id], (old: typeof draftRes) =>
        old ? { ...old, data: { ...old.data, data: res.data.data } } : old)
      setRawContent(null)
    },
  })

  const chat = useMutation({
    mutationFn: (message: string) => resumeDraftsApi.chat(id!, message),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['resume-draft', id, 'messages'] })
      if (res.data.data) {
        queryClient.setQueryData(['resume-draft', id], (old: typeof draftRes) =>
          old ? { ...old, data: { ...old.data, data: res.data.data!.draft } } : old)
      }
      setChatInput('')
    },
  })

  function handleSend() {
    const msg = chatInput.trim()
    if (!msg || chat.isPending) return
    setChatInput('')
    chat.mutate(msg)
  }

  const chatErrorMessage = (chat.error as { response?: { data?: { message?: string } } } | null)
    ?.response?.data?.message

  if (isLoading) {
    return (
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div className="animate-pulse" style={{ height: 400, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }} />
      </div>
    )
  }

  if (!draft) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: 'var(--text-3)' }}>Draft not found.</div>
        <button onClick={() => navigate('/resume')} style={{ marginTop: 16, color: 'var(--accent-brand)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
          ← Back to Resume
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }} className="animate-fade-up">
      <button
        onClick={() => navigate('/resume')}
        className="flex items-center gap-[6px]"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, marginBottom: 14, padding: 0 }}
      >
        <ArrowLeft size={14} /> Resume
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14, alignItems: 'start' }}>

        {/* ── Left: document ────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>{draft.title}</div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 980, padding: 3 }}>
              <button
                onClick={() => setMode('preview')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 980, border: 'none',
                  background: mode === 'preview' ? 'var(--accent-brand)' : 'transparent',
                  color: mode === 'preview' ? '#fff' : 'var(--text-3)', cursor: 'pointer',
                }}
              >
                <Eye size={12} /> Preview
              </button>
              <button
                onClick={() => setMode('raw')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 980, border: 'none',
                  background: mode === 'raw' ? 'var(--accent-brand)' : 'transparent',
                  color: mode === 'raw' ? '#fff' : 'var(--text-3)', cursor: 'pointer',
                }}
              >
                <Code2 size={12} /> MDX
              </button>
            </div>
          </div>

          {mode === 'raw' ? (
            <div>
              <textarea
                value={displayedContent}
                onChange={(e) => setRawContent(e.target.value)}
                spellCheck={false}
                style={{
                  width: '100%', minHeight: 460, font: "400 12.5px 'SF Mono', Monaco, monospace",
                  color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '18px 20px', resize: 'vertical',
                  lineHeight: 1.6, boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <button
                  onClick={() => saveRaw.mutate(displayedContent)}
                  disabled={rawContent === null || saveRaw.isPending}
                  style={{
                    padding: '8px 16px', borderRadius: 980, fontSize: 12.5, fontWeight: 600,
                    background: 'var(--accent-brand)', border: 'none', color: '#fff',
                    cursor: rawContent === null ? 'default' : 'pointer', opacity: rawContent === null ? 0.5 : 1,
                  }}
                >
                  {saveRaw.isPending ? 'Saving…' : 'Save changes'}
                </button>
                {rawContent === null && !saveRaw.isPending && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No unsaved changes</span>
                )}
              </div>
            </div>
          ) : (
            <DocumentPane mdxContent={displayedContent} mode={mode} />
          )}
        </div>

        {/* ── Right: chat ───────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', height: 620,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Sparkles size={14} style={{ color: 'var(--accent-brand)' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Edit with AI</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', lineHeight: 1.6, textAlign: 'center', margin: 'auto 0' }}>
                Tell it what to change — "Add a job at Google as a PM, 2021–2023" or
                "Make the summary punchier." It edits the document directly.
              </div>
            )}
            {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
            {chat.isPending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '9px 13px', borderRadius: 13, background: 'var(--surface-2)',
                  border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-3)',
                }}>
                  Thinking…
                </div>
              </div>
            )}
            {chat.isError && (
              <div style={{ fontSize: 12, color: '#e5484d', textAlign: 'center', lineHeight: 1.5 }}>
                {chatErrorMessage ?? "Couldn't reach the AI service — try again."}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
              placeholder="Tell it what to change…"
              disabled={chat.isPending}
              style={{
                flex: 1, font: "400 13px 'Inter'", color: 'var(--text)',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 980, padding: '9px 14px',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim() || chat.isPending}
              aria-label="Send message"
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--accent-brand)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: chatInput.trim() ? 'pointer' : 'default', opacity: chatInput.trim() ? 1 : 0.6,
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
        Last updated {timeAgo(draft.updatedAt)}
      </div>
    </div>
  )
}
