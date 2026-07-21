import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import { STATUS_META } from '@/lib/utils'
import { useIsTablet } from '@/hooks/useMediaQuery'

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 16, r = 6 }: { w?: string | number; h?: number; r?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: r, background: 'var(--panel)', flexShrink: 0 }}
    />
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 12 }}>
      {text}
    </div>
  )
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, loading }: {
  label: string; value: string | number; sub?: string; loading?: boolean
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
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{sub}</div>}
        </>
      )}
    </div>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, max }: { data: { period: string; count: number }[]; max: number }) {
  const BAR_H = 130
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: BAR_H + 32 }}>
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

// ── Funnel ────────────────────────────────────────────────────────────────────
function FunnelBar({ label, count, pct, max, color }: {
  label: string; count: number; pct?: number; max: number; color: string
}) {
  const width = max > 0 ? Math.min(Math.max((count / max) * 100, count > 0 ? 4 : 0), 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {count}{pct != null ? ` · ${pct}%` : ''}
        </span>
      </div>
      <div style={{ height: 10, borderRadius: 980, background: 'var(--panel)', overflow: 'hidden' }}>
        <div style={{
          width: `${width}%`, height: '100%', borderRadius: 980,
          background: color, transition: 'width 0.5s var(--ease)',
        }} />
      </div>
    </div>
  )
}

// ── Analytics page ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const isTablet = useIsTablet()

  const { data: overviewRes, isLoading: loadingOverview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.overview(),
    staleTime: 30_000,
  })
  const ov = overviewRes?.data?.data

  const { data: funnelRes, isLoading: loadingFunnel } = useQuery({
    queryKey: ['analytics', 'funnel'],
    queryFn: () => analyticsApi.funnel(),
    staleTime: 30_000,
  })
  const funnel = funnelRes?.data?.data

  const { data: trendRes, isLoading: loadingTrend } = useQuery({
    queryKey: ['analytics', 'trend', period],
    queryFn: () => analyticsApi.trend(period),
    staleTime: 30_000,
  })
  const trend = trendRes?.data?.data ?? []
  const maxTrend = Math.max(...trend.map((t) => t.count), 1)

  const { data: sourceRes, isLoading: loadingSource } = useQuery({
    queryKey: ['analytics', 'source-performance'],
    queryFn: () => analyticsApi.sourcePerformance(),
    staleTime: 30_000,
  })
  const sources = sourceRes?.data?.data ?? []

  const maxFunnel = funnel
    ? Math.max(funnel.saved, funnel.submitted, funnel.inAssessment, funnel.inInterview, funnel.offers, 1)
    : 1

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }} className="animate-fade-up">

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <StatCard loading={loadingOverview} label="Total applications" value={ov?.total ?? 0} sub={`${ov?.applied ?? 0} applied`} />
        <StatCard loading={loadingOverview} label="Response rate" value={ov ? `${ov.responseRate}%` : '—'} sub={`${ov?.inInterview ?? 0} reached interview`} />
        <StatCard loading={loadingOverview} label="Offer rate" value={ov ? `${ov.offerRate}%` : '—'} sub={`${ov?.offers ?? 0} offer(s)`} />
        <StatCard
          loading={loadingOverview}
          label="Avg. response time"
          value={ov?.avgDaysToResponse != null ? `${ov.avgDaysToResponse}d` : '—'}
          sub={ov?.topSource ? `Top source: ${ov.topSource}` : 'From detected emails'}
        />
      </div>

      {/* ── Funnel + Trend ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Funnel */}
        <Card title="Conversion funnel">
          {loadingFunnel ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0, 1, 2, 3, 4].map((i) => <Skel key={i} h={22} />)}
            </div>
          ) : !funnel || funnel.saved === 0 ? (
            <Empty text="Add applications to see your conversion funnel." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FunnelBar label="Saved" count={funnel.saved} max={maxFunnel} color={STATUS_META.SAVED.dot} />
              <FunnelBar label="Submitted" count={funnel.submitted} max={maxFunnel} color={STATUS_META.APPLIED.dot} />
              <FunnelBar label="Assessment" count={funnel.inAssessment} pct={funnel.assessmentRate} max={maxFunnel} color={STATUS_META.ASSESSMENT.dot} />
              <FunnelBar label="Interview" count={funnel.inInterview} pct={funnel.interviewRate} max={maxFunnel} color={STATUS_META.INTERVIEW.dot} />
              <FunnelBar label="Offer" count={funnel.offers} pct={funnel.offerRate} max={maxFunnel} color={STATUS_META.OFFER.dot} />
            </div>
          )}
        </Card>

        {/* Trend */}
        <Card
          title="Applications over time"
          action={
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 980, padding: 3 }}>
              {(['weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 980, border: 'none',
                    background: period === p ? 'var(--accent-brand)' : 'transparent',
                    color: period === p ? '#fff' : 'var(--text-3)', cursor: 'pointer', textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          }
        >
          {loadingTrend ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 162 }}>
              {[40, 70, 55, 90, 30, 80, 60].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <div style={{ height: 14 }} />
                  <div style={{ width: '100%', height: 130, display: 'flex', alignItems: 'flex-end' }}>
                    <Skel h={h} r={4} />
                  </div>
                  <Skel h={10} w={24} r={3} />
                </div>
              ))}
            </div>
          ) : trend.length === 0 ? (
            <Empty text="No trend data yet." />
          ) : (
            <BarChart data={trend} max={maxTrend} />
          )}
        </Card>
      </div>

      {/* ── Source performance ────────────────────────────────────────────── */}
      <Card title="Source performance">
        {loadingSource ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[0, 1, 2].map((i) => <Skel key={i} h={36} r={9} />)}
          </div>
        ) : sources.length === 0 ? (
          <Empty text="No sourced applications yet — add a source when you save a job." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 480 }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 10,
              padding: '0 10px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4,
            }}>
              {['Source', 'Applications', 'Interviews', 'Offers', 'Interview rate'].map((h, i) => (
                <span key={h} style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase',
                  letterSpacing: '0.04em', textAlign: i === 0 ? 'left' : 'right',
                }}>
                  {h}
                </span>
              ))}
            </div>
            {sources.map((s) => (
              <div key={s.source} style={{
                display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 10,
                padding: '10px 10px', borderRadius: 12, alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Briefcase size={13} style={{ color: 'var(--text-3)' }} /> {s.source}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'right' }}>{s.total}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'right' }}>{s.interviews}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'right' }}>{s.offers}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600, textAlign: 'right',
                  color: s.interviewRate >= 25 ? 'var(--success)' : 'var(--text-2)',
                }}>
                  {s.interviewRate}%
                </span>
              </div>
            ))}
          </div>
          </div>
        )}
      </Card>
    </div>
  )
}
