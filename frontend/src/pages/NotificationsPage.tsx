import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell, Calendar, Clock, RefreshCw, Zap, Info, Trash2, CheckCheck, Circle,
} from 'lucide-react'
import { notificationsApi, type UpdateNotificationPreferenceRequest } from '@/api/notifications'
import { timeAgo } from '@/lib/utils'
import ErrorBanner from '@/components/ui/ErrorBanner'
import type { Notification, NotificationType } from '@/types'

const TYPE_META: Record<NotificationType, { label: string; color: string; Icon: typeof Bell }> = {
  DEADLINE_REMINDER:  { label: 'Deadline',    color: '#c98a00', Icon: Calendar },
  FOLLOW_UP_REMINDER: { label: 'Follow-up',   color: '#0071e3', Icon: Clock },
  STATUS_CHANGE:      { label: 'Status',      color: '#7c5cff', Icon: RefreshCw },
  AI_ANALYSIS_READY:  { label: 'AI analysis', color: '#12936a', Icon: Zap },
  SYSTEM:             { label: 'System',      color: '#8a8a8e', Icon: Info },
}

function Skel({ h = 64, r = 12 }: { h?: number; r?: number }) {
  return <div className="animate-pulse" style={{ height: h, borderRadius: r, background: 'var(--panel)' }} />
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 14,
      border: '1px solid var(--border)', padding: '18px 18px 16px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotificationRow({ n, onRead, onDelete }: {
  n: Notification
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const meta = TYPE_META[n.type]
  const navigate = useNavigate()
  const Icon = meta.Icon

  function activate() {
    if (!n.read) onRead(n.id)
    if (n.relatedJobId) navigate(`/tracker/${n.relatedJobId}`)
  }

  return (
    <div
      onClick={activate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate() } }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '13px 14px', borderRadius: 12, cursor: 'pointer',
        background: n.read ? 'var(--surface-2)' : 'color-mix(in srgb, var(--accent-brand) 5%, var(--surface-2))',
        border: `1px solid ${n.read ? 'var(--border)' : 'color-mix(in srgb, var(--accent-brand) 25%, var(--border))'}`,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} style={{ color: meta.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {!n.read && <Circle size={7} fill="var(--accent-brand)" style={{ color: 'var(--accent-brand)', flexShrink: 0 }} />}
          <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text)' }}>{n.title}</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: '4px 0 0' }}>{n.message}</p>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{timeAgo(n.createdAt)}</div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDelete(n.id) }}
        aria-label="Delete notification"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 3, flexShrink: 0, width: 24, height: 24 }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── Preference toggle row ─────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      style={{
        width: 36, height: 21, borderRadius: 980, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: checked ? 'var(--accent-brand)' : 'var(--panel)', position: 'relative', transition: 'background 0.15s',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 17 : 2,
        width: 17, height: 17, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  )
}

function PrefRow({ label, sub, checked, onChange }: {
  label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0' }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

// ── Notifications page ────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const { data: listRes, isLoading } = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () => notificationsApi.list(showUnreadOnly, 0, 50),
    staleTime: 15_000,
  })
  const notifications = listRes?.data?.data ?? []

  const { data: prefsRes } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
    staleTime: 30_000,
  })
  const prefs = prefsRes?.data?.data

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
  }

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidateAll,
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidateAll,
  })

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: invalidateAll,
  })

  const updatePrefs = useMutation({
    mutationFn: (data: UpdateNotificationPreferenceRequest) => notificationsApi.updatePreferences(data),
    onSuccess: (res) => {
      queryClient.setQueryData(['notification-preferences'], (old: typeof prefsRes) =>
        old ? { ...old, data: { ...old.data, data: res.data.data } } : old)
    },
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }} className="animate-fade-up">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>

        {/* Left: notification list */}
        <Card
          title="Notifications"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setShowUnreadOnly((v) => !v)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 980,
                  background: showUnreadOnly ? 'color-mix(in srgb, var(--accent-brand) 14%, transparent)' : 'var(--surface-2)',
                  color: showUnreadOnly ? 'var(--accent-brand)' : 'var(--text-3)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                }}
              >
                Unread only
              </button>
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending || unreadCount === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 980,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: unreadCount === 0 ? 'var(--text-3)' : 'var(--text-2)',
                  cursor: unreadCount === 0 ? 'default' : 'pointer', opacity: unreadCount === 0 ? 0.6 : 1,
                }}
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            </div>
          }
        >
          {(markRead.isError || remove.isError || markAllRead.isError) && (
            <div style={{ marginBottom: 10 }}>
              <ErrorBanner message="That didn't work — please try again." />
            </div>
          )}
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2, 3].map((i) => <Skel key={i} />)}
            </div>
          ) : notifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notifications.map((n) => (
                <NotificationRow key={n.id} n={n} onRead={(id) => markRead.mutate(id)} onDelete={(id) => remove.mutate(id)} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Bell size={22} style={{ color: 'var(--text-3)', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {showUnreadOnly ? 'No unread notifications' : 'No notifications yet'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Deadline reminders, status changes, and AI analysis alerts will show up here.
              </div>
            </div>
          )}
        </Card>

        {/* Right: preferences */}
        <Card title="Preferences">
          {updatePrefs.isError && (
            <div style={{ marginBottom: 10 }}>
              <ErrorBanner message="Couldn't save that preference — please try again." />
            </div>
          )}
          {!prefs ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2, 3].map((i) => <Skel key={i} h={20} r={6} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <PrefRow
                label="Deadline reminders"
                sub={`${prefs.deadlineReminderDaysBefore} day(s) before`}
                checked={prefs.deadlineRemindersEnabled}
                onChange={(v) => updatePrefs.mutate({ deadlineRemindersEnabled: v })}
              />
              <PrefRow
                label="Follow-up reminders"
                sub={`${prefs.followUpReminderDaysAfterApply} day(s) after applying`}
                checked={prefs.followUpRemindersEnabled}
                onChange={(v) => updatePrefs.mutate({ followUpRemindersEnabled: v })}
              />
              <PrefRow
                label="Status change alerts"
                sub="When email scanning updates a status"
                checked={prefs.statusChangeAlertsEnabled}
                onChange={(v) => updatePrefs.mutate({ statusChangeAlertsEnabled: v })}
              />
              <PrefRow
                label="AI analysis alerts"
                sub="When a resume or match analysis finishes"
                checked={prefs.aiAnalysisAlertsEnabled}
                onChange={(v) => updatePrefs.mutate({ aiAnalysisAlertsEnabled: v })}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
