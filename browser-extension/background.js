// Cammino — background service worker. Keeps the toolbar badge in sync with
// unread notification count so users notice status updates without opening the popup.

const ALARM_NAME = 'cammino-badge-refresh'
const DEFAULT_API_BASE = 'http://localhost:8080'

async function refreshBadge() {
  const { token, apiBase = DEFAULT_API_BASE } = await chrome.storage.local.get(['token', 'apiBase'])
  if (!token) {
    chrome.action.setBadgeText({ text: '' })
    return
  }

  try {
    const res = await fetch(`${apiBase}/api/extension/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) chrome.action.setBadgeText({ text: '' })
      return
    }
    const body = await res.json()
    const unread = body?.data?.unreadNotifications ?? 0
    chrome.action.setBadgeBackgroundColor({ color: '#12936a' })
    chrome.action.setBadgeText({ text: unread > 0 ? String(Math.min(unread, 99)) : '' })
  } catch {
    // offline/unreachable — leave the existing badge as-is rather than flicker it away
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 15 })
  refreshBadge()
})

chrome.runtime.onStartup.addListener(refreshBadge)

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshBadge()
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'refresh-badge') refreshBadge()
})
