import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '@/api/analytics'
import { jobsApi } from '@/api/jobs'
import { STATUS_META, formatDate, timeAgo, companyColor, companyInitial } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import { useIsTablet } from '@/hooks/useMediaQuery'
import type { ApplicationStatus } from '@/types'

const PIPELINE_STATUSES: ApplicationStatus[] = [
  'SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED',
]

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: 'var(--panel)', flexShrink: 0 }}
    />
  )
}

// ── Card shell ────────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, marginBottom: 16, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color = 'var(--accent-brand)', loading,
}: {
  label: string; value: string | number; sub?: string; color?: string; loading?: boolean
}) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      {loading ? (
        <>
          <Skel h={11} w={80} />
          <div style={{ marginTop: 10 }}><Skel h={28} w={60} /></div>
          <div style={{ marginTop: 6 }}><Skel h={11} w={100} /></div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.03em', marginTop: 6, lineHeight: 1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 5 }}>{sub}</div>
          )}
        </>
      )}
    </div>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, max }: { data: { period: string; count: number }[]; max: number }) {
  const BAR_H = 110
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: BAR_H + 32 }}>
      {data.map((d, i) => {
        const pct = max > 0 ? d.count / max : 0
        const barH = Math.max(pct * BAR_H, d.count > 0 ? 4 : 0)
        const label = d.period.length > 6 ? d.period.slice(-5) : d.period
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', minHeight: 14 }}>
              {d.count > 0 ? d.count : ''}
            </span>
            <div style={{ width: '100%', height: BAR_H, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%', height: barH,
                background: 'var(--accent-brand)', borderRadius: '4px 4px 0 0', opacity: 0.85,
                transition: 'height 0.45s var(--ease)',
              }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: 'var(--text-3)', fontSize: 13 }}>
      {text}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const isTablet = useIsTablet()

  const { data: overviewRes, isLoading: loadingOverview, isError: overviewError, refetch: refetchOverview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.overview(),
    staleTime: 60_000,
  })

  const { data: trendRes, isLoading: loadingTrend, isError: trendError } = useQuery({
    queryKey: ['analytics', 'trend', 'weekly'],
    queryFn: () => analyticsApi.trend('weekly'),
    staleTime: 60_000,
  })

  const { data: recentRes, isLoading: loadingRecent, isError: recentError } = useQuery({
    queryKey: ['jobs', 'recent-dashboard'],
    queryFn: () => jobsApi.list({ size: 6, sortBy: 'updatedAt', sortDir: 'desc' }),
    staleTime: 30_000,
  })

  const { data: deadlinesRes, isError: deadlinesError } = useQuery({
    queryKey: ['jobs', 'deadlines-dashboard'],
    queryFn: () => jobsApi.list({ size: 6, sortBy: 'deadline', sortDir: 'asc' }),
    staleTime: 60_000,
  })

  const ov = overviewRes?.data?.data
  const trend = trendRes?.data?.data ?? []
  const recent = recentRes?.data?.data?.content ?? []
  const deadlines = (deadlinesRes?.data?.data?.content ?? []).filter((j) => !!j.deadline).slice(0, 6)

  const maxTrend = Math.max(...trend.map((t) => t.count), 1)

  const pipelineCount: Record<ApplicationStatus, number> = {
    SAVED:      ov?.saved      ?? 0,
    APPLIED:    ov?.applied    ?? 0,
    ASSESSMENT: ov?.inAssessment ?? 0,
    INTERVIEW:  ov?.inInterview  ?? 0,
    OFFER:      ov?.offers       ?? 0,
    REJECTED:   ov?.rejected   ?? 0,
  }
  const maxPipeline = Math.max(...Object.values(pipelineCount), 1)

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }} className="animate-fade-up">

      {overviewError && (
        <div style={{ marginBottom: 14 }}>
          <ErrorBanner message="Couldn't load your overview stats." onRetry={() => refetchOverview()} />
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard
          loading={loadingOverview}
          label="Total applications"
          value={ov?.total ?? 0}
          sub={`${ov?.applied ?? 0} applied`}
        />
        <StatCard
          loading={loadingOverview}
          label="Active"
          value={ov ? ov.total - ov.saved - ov.rejected : 0}
          sub="In progress"
          color="var(--text)"
        />
        <StatCard
          loading={loadingOverview}
          label="Response rate"
          value={ov ? `${ov.responseRate}%` : '—'}
          sub={`${ov?.inInterview ?? 0} reached interview`}
        />
        <StatCard
          loading={loadingOverview}
          label="Offer rate"
          value={ov ? `${ov.offerRate}%` : '—'}
          sub={ov?.avgDaysToResponse ? `avg ${ov.avgDaysToResponse}d to response` : 'of applications'}
        />
      </div>

      {/* ── Pipeline + Weekly trend ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 20 }}>

        {/* Pipeline breakdown */}
        <Card title="Pipeline">
          {loadingOverview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {PIPELINE_STATUSES.map((s) => <Skel key={s} h={10} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {PIPELINE_STATUSES.map((s) => {
                const meta = STATUS_META[s]
                const count = pipelineCount[s]
                const pct = (count / maxPipeline) * 100
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', width: 86, flexShrink: 0 }}>
                      {meta.label}
                    </span>
                    <div style={{ flex: 1, height: 6, background: 'var(--panel)', borderRadius: 980, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: meta.dot, borderRadius: 980,
                        transition: 'width 0.5s var(--ease)',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', width: 20, textAlign: 'right', flexShrink: 0 }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Weekly trend */}
        <Card title="Applications over time">
          {loadingTrend ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 142 }}>
              {[40, 70, 55, 90, 30, 80, 60].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ height: 14 }} />
                  <div style={{ width: '100%', height: 110, display: 'flex', alignItems: 'flex-end' }}>
                    <Skel h={h} r={4} />
                  </div>
                  <Skel h={10} w={24} r={3} />
                </div>
              ))}
            </div>
          ) : trendError ? (
            <ErrorBanner message="Couldn't load trend data." />
          ) : trend.length === 0 ? (
            <Empty text="No trend data yet." />
          ) : (
            <BarChart data={trend} max={maxTrend} />
          )}
        </Card>
      </div>

      {/* ── Recent applications + Deadlines ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: 14 }}>

        {/* Recent applications */}
        <Card title="Recent activity">
          {loadingRecent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Skel w={34} h={34} r={9} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skel h={12} w="58%" />
                    <Skel h={10} w="38%" />
                  </div>
                  <Skel h={20} w={62} r={5} />
                </div>
              ))}
            </div>
          ) : recentError ? (
            <ErrorBanner message="Couldn't load recent activity." />
          ) : recent.length === 0 ? (
            <Empty text="No applications yet — add your first job." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recent.map((job) => {
                const meta = STATUS_META[job.status]
                return (
                  <div
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/tracker/${job.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/tracker/${job.id}`) } }}
                    className="hover:bg-[var(--border-2)] transition-colors"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 10, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: companyColor(job.company), color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {companyInitial(job.company)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.jobTitle}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{job.company}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px',
                        background: `color-mix(in srgb, ${meta.dot} 12%, transparent)`,
                        color: meta.dot,
                      }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{timeAgo(job.updatedAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming deadlines */}
        <Card title="Upcoming deadlines">
          {deadlinesError ? (
            <ErrorBanner message="Couldn't load upcoming deadlines." />
          ) : deadlines.length === 0 ? (
            <Empty text="No upcoming deadlines." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {deadlines.map((job) => {
                const daysLeft = Math.ceil((new Date(job.deadline!).getTime() - Date.now()) / 86_400_000)
                const urgentColor = daysLeft <= 3 ? 'var(--error)' : daysLeft <= 7 ? 'var(--warning)' : 'var(--text-2)'
                return (
                  <div
                    key={job.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/tracker/${job.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/tracker/${job.id}`) } }}
                    className="hover:bg-[var(--border-2)] transition-colors"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 10, cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: companyColor(job.company), color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {companyInitial(job.company)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {job.jobTitle}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{job.company}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: urgentColor }}>
                        {daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d left`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{formatDate(job.deadline!)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

    </div>
  )
}
