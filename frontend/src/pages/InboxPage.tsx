import { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Mail, RefreshCw, Unlink, CheckCircle2, ExternalLink, Sparkles, ShieldCheck,
} from 'lucide-react'
import { emailApi } from '@/api/email'
import { jobsApi } from '@/api/jobs'
import { STATUS_META, timeAgo, companyColor, companyInitial } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { EmailScanResult, ScanConfidence } from '@/types'

function apiErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message
  return message ?? fallback
}

const CONFIDENCE_META: Record<ScanConfidence, { label: string; color: string }> = {
  HIGH:   { label: 'High confidence',   color: '#12936a' },
  MEDIUM: { label: 'Medium confidence', color: '#c98a00' },
  LOW:    { label: 'Low confidence',    color: '#8a8a8e' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: 'var(--panel)', flexShrink: 0 }}
    />
  )
}

// ── Scan result row ───────────────────────────────────────────────────────────
function ScanResultRow({ result, job }: {
  result: EmailScanResult
  job?: { id: string; jobTitle: string; company: string }
}) {
  const statusMeta = STATUS_META[result.inferredStatus]
  const confMeta = CONFIDENCE_META[result.confidence]
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px', borderRadius: 12,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: job ? companyColor(job.company) : 'var(--panel)',
        color: '#fff', fontSize: 12, fontWeight: 700,
      }}>
        {job ? companyInitial(job.company) : <Mail size={14} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {result.subject || '(no subject)'}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 980,
            background: `color-mix(in srgb, ${statusMeta.dot} 12%, transparent)`, color: statusMeta.dot,
          }}>
            {statusMeta.label}
          </span>
          {result.statusApplied && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#12936a' }}>
              <CheckCircle2 size={11} /> Auto-applied
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {result.fromAddress}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: confMeta.color, fontWeight: 600 }}>{confMeta.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(result.receivedAt)}</span>
          {job && (
            <button
              onClick={() => navigate(`/tracker/${job.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600,
                color: 'var(--accent-brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              {job.jobTitle} @ {job.company} <ExternalLink size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Inbox page ────────────────────────────────────────────────────────────────
export default function InboxPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('gmail') === 'connected') {
      queryClient.invalidateQueries({ queryKey: ['gmail-connection'] })
      searchParams.delete('gmail')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: connRes, isLoading: connLoading } = useQuery({
    queryKey: ['gmail-connection'],
    queryFn: () => emailApi.getConnection(),
    staleTime: 30_000,
  })
  const connection = connRes?.data?.data

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['gmail-scan-history'],
    queryFn: () => emailApi.history(0, 50),
    enabled: !!connection?.connected,
    staleTime: 15_000,
  })
  const results = historyRes?.data?.data ?? []

  const { data: jobsRes } = useQuery({
    queryKey: ['jobs', 'for-inbox'],
    queryFn: () => jobsApi.list({ size: 200 }),
    enabled: !!connection?.connected,
    staleTime: 30_000,
  })
  const jobsById = useMemo(() => {
    const map = new Map<string, { id: string; jobTitle: string; company: string }>()
    for (const j of jobsRes?.data?.data?.content ?? []) map.set(j.id, j)
    return map
  }, [jobsRes])

  const connect = useMutation({
    mutationFn: () => emailApi.getAuthUrl(),
    onSuccess: (res) => {
      const url = res.data.data?.authorizationUrl
      if (url) window.location.href = url
    },
  })

  const disconnect = useMutation({
    mutationFn: () => emailApi.disconnect(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gmail-connection'] }),
  })

  const scan = useMutation({
    mutationFn: () => emailApi.scan(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmail-scan-history'] })
      queryClient.invalidateQueries({ queryKey: ['gmail-connection'] })
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Connection card */}
        <div style={{
          background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
          padding: '20px 22px', boxShadow: 'var(--shadow)',
        }}>
          {connLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Skel w={40} h={40} r={10} />
              <div style={{ flex: 1 }}><Skel h={14} w={180} /><div style={{ marginTop: 8 }}><Skel h={11} w={120} /></div></div>
            </div>
          ) : connection?.connected ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'color-mix(in srgb, #12936a 12%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ShieldCheck size={19} style={{ color: '#12936a' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{connection.gmailAddress}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                  {connection.lastSyncAt ? `Last scanned ${timeAgo(connection.lastSyncAt)}` : 'Not scanned yet'}
                </div>
              </div>
              <button
                onClick={() => scan.mutate()}
                disabled={scan.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
                  padding: '8px 14px', borderRadius: 9, border: 'none',
                  background: 'var(--accent-brand)', color: '#fff',
                  cursor: scan.isPending ? 'default' : 'pointer', opacity: scan.isPending ? 0.6 : 1,
                }}
              >
                <RefreshCw size={13} style={scan.isPending ? { animation: 'spin 0.8s linear infinite' } : undefined} />
                {scan.isPending ? 'Scanning…' : 'Scan now'}
              </button>
              <button
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
                title="Disconnect Gmail"
                aria-label="Disconnect Gmail"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)',
                  background: 'var(--surface-2)', color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Unlink size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'color-mix(in srgb, var(--accent-brand) 10%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={19} style={{ color: 'var(--accent-brand)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Connect Gmail</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2, lineHeight: 1.5 }}>
                  Scan your inbox for recruiter replies and auto-update application statuses.
                </div>
              </div>
              <button
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '9px 16px', borderRadius: 9, border: 'none',
                  background: 'var(--accent-brand)', color: '#fff',
                  cursor: connect.isPending ? 'default' : 'pointer', opacity: connect.isPending ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {connect.isPending ? 'Redirecting…' : 'Connect Gmail'}
              </button>
            </div>
          )}
          {(connect.isError || disconnect.isError || scan.isError) && (
            <div style={{ marginTop: 14 }}>
              <ErrorBanner message={apiErrorMessage(
                connect.error ?? disconnect.error ?? scan.error,
                "That didn't work — please try again."
              )} />
            </div>
          )}
        </div>

        {/* Results */}
        {connection?.connected && (
          <div style={{
            background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)',
            padding: '18px 18px 16px', boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: '-0.01em' }}>
              Detected updates
            </div>

            {historyLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[0, 1, 2].map((i) => <Skel key={i} h={64} r={12} />)}
              </div>
            ) : results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results.map((r) => (
                  <ScanResultRow key={r.id} result={r} job={r.jobId ? jobsById.get(r.jobId) : undefined} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                <Sparkles size={22} style={{ color: 'var(--text-3)', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>No updates yet</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  Click "Scan now" to check your inbox for recruiter replies, interview invites, and status changes.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
