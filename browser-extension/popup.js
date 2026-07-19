// Cammino — extension popup logic. Vanilla JS, no build step.

const DEFAULTS = {
  apiBase: 'http://localhost:8080',
  appBase: 'http://localhost:5173',
}

const STATUS_LABEL = {
  SAVED: 'Saved', APPLIED: 'Applied', ASSESSMENT: 'Assessment',
  INTERVIEW: 'Interview', OFFER: 'Offer', REJECTED: 'Rejected',
}

// ── Storage helpers ─────────────────────────────────────────────────────────
function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve))
}
function storageSet(obj) {
  return new Promise((resolve) => chrome.storage.local.set(obj, resolve))
}
function storageRemove(keys) {
  return new Promise((resolve) => chrome.storage.local.remove(keys, resolve))
}

// ── API helper ───────────────────────────────────────────────────────────────
async function apiFetch(path, { method = 'GET', body, token, apiBase } = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try { data = await res.json() } catch { /* no body */ }
  if (!res.ok) {
    const message = data?.message || data?.error?.message || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    throw err
  }
  return data
}

// ── Job-page extraction (injected into the active tab) ───────────────────────
function extractJobInfo() {
  function text(sel) {
    const el = document.querySelector(sel)
    return el ? el.textContent.trim().replace(/\s+/g, ' ') : ''
  }
  const host = location.hostname
  let jobTitle = '', company = '', jobLocation = ''

  if (host.includes('linkedin.com')) {
    jobTitle = text('h1.top-card-layout__title') || text('.job-details-jobs-unified-top-card__job-title h1') || text('h1')
    company = text('.topcard__org-name-link') || text('.job-details-jobs-unified-top-card__company-name a') || text('.job-details-jobs-unified-top-card__company-name')
    jobLocation = text('.topcard__flavor--bullet') || text('.job-details-jobs-unified-top-card__primary-description-container .tvm__text')
  } else if (host.includes('indeed.com')) {
    jobTitle = text('h1.jobsearch-JobInfoHeader-title') || text('h1')
    company = text('[data-testid="inline-company-name"]') || text('.jobsearch-InlineCompanyRating div')
    jobLocation = text('[data-testid="inline-job-location"]')
  } else if (host.includes('greenhouse.io')) {
    jobTitle = text('h1.app-title') || text('h1')
    company = text('.company-name')
  } else if (host.includes('lever.co')) {
    jobTitle = text('.posting-headline h2') || text('h2')
  }

  if (!jobTitle) jobTitle = text('h1') || document.title.split(/[-|]/)[0].trim()
  if (!company) {
    const og = document.querySelector('meta[property="og:site_name"]')
    company = (og && og.content) || document.title.split(/[-|]/)[1]?.trim() || ''
  }

  return {
    jobTitle: jobTitle.slice(0, 255),
    company: company.slice(0, 255),
    location: jobLocation.slice(0, 255),
  }
}

function sourceFromHost(host) {
  if (host.includes('linkedin.com')) return 'LinkedIn'
  if (host.includes('indeed.com')) return 'Indeed'
  if (host.includes('greenhouse.io')) return 'Greenhouse'
  if (host.includes('lever.co')) return 'Lever'
  return host.replace(/^www\./, '')
}

// ── DOM helpers ──────────────────────────────────────────────────────────────
const contentEl = document.getElementById('content')
const statsPill = document.getElementById('stats-pill')
const settingsBtn = document.getElementById('settings-btn')

function h(html) {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  return t.content.firstElementChild
}

function badgeClass(status) {
  return `badge badge-${(status || 'saved').toLowerCase()}`
}

// ── Views ────────────────────────────────────────────────────────────────────
async function renderConnectView(errorMsg) {
  statsPill.classList.add('hidden')
  contentEl.innerHTML = ''
  contentEl.appendChild(h(`
    <div class="card">
      <p class="title">Connect your account</p>
      <p class="subtitle">Generate a token in Cammino → Profile → Browser extension, then paste it below.</p>
      <div class="field">
        <label for="token-input">Personal access token</label>
        <input id="token-input" type="password" placeholder="Paste your token" autocomplete="off" />
      </div>
      <button id="connect-btn" class="btn btn-primary">Connect</button>
      ${errorMsg ? `<div class="error-text">${errorMsg}</div>` : ''}
    </div>
  `))

  document.getElementById('connect-btn').addEventListener('click', async () => {
    const btn = document.getElementById('connect-btn')
    const token = document.getElementById('token-input').value.trim()
    if (!token) return
    btn.disabled = true
    btn.innerHTML = '<span class="spinner"></span>'
    try {
      const { apiBase = DEFAULTS.apiBase } = await storageGet(['apiBase'])
      await apiFetch('/api/extension/stats', { token, apiBase }) // validates the token
      await storageSet({ token })
      await init()
    } catch (e) {
      renderConnectView(e.status === 401 || e.status === 403
        ? 'That token was rejected — check it was copied in full.'
        : `Couldn't reach Cammino: ${e.message}`)
    }
  })
}

async function renderSettingsView({ token, apiBase, appBase }) {
  contentEl.innerHTML = ''
  contentEl.appendChild(h(`
    <div class="card">
      <p class="title">Settings</p>
      <div class="field">
        <label for="api-base">API URL</label>
        <input id="api-base" value="${apiBase}" />
      </div>
      <div class="field">
        <label for="app-base">Web app URL</label>
        <input id="app-base" value="${appBase}" />
      </div>
      <div class="btn-row">
        <button id="save-settings" class="btn btn-primary">Save</button>
        <button id="back-btn" class="btn btn-secondary">Back</button>
      </div>
    </div>
  `))
  contentEl.appendChild(h(`
    <div class="card">
      <button id="disconnect-btn" class="btn btn-danger-outline">Disconnect account</button>
    </div>
  `))

  document.getElementById('save-settings').addEventListener('click', async () => {
    const apiBaseVal = document.getElementById('api-base').value.trim().replace(/\/$/, '')
    const appBaseVal = document.getElementById('app-base').value.trim().replace(/\/$/, '')
    await storageSet({ apiBase: apiBaseVal || DEFAULTS.apiBase, appBase: appBaseVal || DEFAULTS.appBase })
    await init()
  })
  document.getElementById('back-btn').addEventListener('click', () => init())
  document.getElementById('disconnect-btn').addEventListener('click', async () => {
    await storageRemove(['token'])
    chrome.runtime.sendMessage({ type: 'refresh-badge' })
    await init()
  })
}

async function renderMainView({ token, apiBase, appBase }) {
  contentEl.innerHTML = ''
  contentEl.appendChild(h(`<div class="card"><div class="empty"><span class="spinner" style="border-top-color: var(--accent); border-color: rgba(18,147,106,0.25);"></span></div></div>`))

  // Stats (also drives the header pill)
  try {
    const statsRes = await apiFetch('/api/extension/stats', { token, apiBase })
    const stats = statsRes.data
    statsPill.textContent = `${stats.totalJobs} tracked`
    statsPill.classList.remove('hidden')
  } catch {
    statsPill.classList.add('hidden')
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const isHttpTab = tab?.url && /^https?:\/\//.test(tab.url)

  contentEl.innerHTML = ''

  // ── Capture card ─────────────────────────────────────────────────────────
  if (!isHttpTab) {
    contentEl.appendChild(h(`
      <div class="card">
        <p class="title">No job page detected</p>
        <p class="subtitle">Open a job listing in this tab, then reopen the extension.</p>
      </div>
    `))
  } else {
    let existing = null
    try {
      const checkRes = await apiFetch(`/api/extension/jobs/check?url=${encodeURIComponent(tab.url)}`, { token, apiBase })
      existing = checkRes.data
    } catch { /* ignore — treat as not-existing */ }

    if (existing?.exists) {
      contentEl.appendChild(h(`
        <div class="card">
          <div class="success-row">✓ Already in your tracker</div>
          <p class="subtitle" style="margin-top:8px;">
            Status: <span class="${badgeClass(existing.status)}">${STATUS_LABEL[existing.status] ?? existing.status}</span>
          </p>
          <button id="open-app" class="btn btn-secondary">Open in Cammino</button>
        </div>
      `))
      document.getElementById('open-app').addEventListener('click', () => {
        chrome.tabs.create({ url: `${appBase}/tracker/${existing.jobId}` })
      })
    } else {
      let extracted = { jobTitle: '', company: '', location: '' }
      try {
        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractJobInfo,
        })
        if (result) extracted = result
      } catch { /* page may block injection (chrome:// pages, etc.) — leave blank */ }

      const source = sourceFromHost(new URL(tab.url).hostname)

      contentEl.appendChild(h(`
        <div class="card">
          <p class="title">Save this job</p>
          <div class="field">
            <label for="f-title">Job title</label>
            <input id="f-title" value="${escapeAttr(extracted.jobTitle)}" placeholder="Software Engineer" />
          </div>
          <div class="field">
            <label for="f-company">Company</label>
            <input id="f-company" value="${escapeAttr(extracted.company)}" placeholder="Acme Inc." />
          </div>
          <div class="field">
            <label for="f-location">Location</label>
            <input id="f-location" value="${escapeAttr(extracted.location)}" placeholder="Remote / London, UK" />
          </div>
          <button id="save-job" class="btn btn-primary">Save to tracker</button>
          <div id="save-error" class="error-text" style="display:none;"></div>
        </div>
      `))

      document.getElementById('save-job').addEventListener('click', async () => {
        const btn = document.getElementById('save-job')
        const errorEl = document.getElementById('save-error')
        const jobTitle = document.getElementById('f-title').value.trim()
        const company = document.getElementById('f-company').value.trim()
        const location_ = document.getElementById('f-location').value.trim()
        errorEl.style.display = 'none'
        if (!jobTitle || !company) {
          errorEl.textContent = 'Job title and company are required.'
          errorEl.style.display = 'block'
          return
        }
        btn.disabled = true
        btn.innerHTML = '<span class="spinner"></span>'
        try {
          await apiFetch('/api/extension/jobs/quick-save', {
            method: 'POST', token, apiBase,
            body: { jobTitle, company, location: location_ || undefined, jobUrl: tab.url, source },
          })
          chrome.runtime.sendMessage({ type: 'refresh-badge' })
          await renderMainView({ token, apiBase, appBase })
        } catch (e) {
          btn.disabled = false
          btn.textContent = 'Save to tracker'
          errorEl.textContent = e.message
          errorEl.style.display = 'block'
        }
      })
    }
  }

  // ── Recent jobs ──────────────────────────────────────────────────────────
  try {
    const recentRes = await apiFetch('/api/extension/jobs/recent', { token, apiBase })
    const recent = (recentRes.data || []).slice(0, 5)
    const card = h(`<div class="card"><div class="section-title">Recently saved</div><div id="recent-list"></div></div>`)
    const list = card.querySelector('#recent-list')
    if (recent.length === 0) {
      list.appendChild(h(`<div class="empty">Nothing saved yet.</div>`))
    } else {
      recent.forEach((job) => {
        list.appendChild(h(`
          <div class="recent-item">
            <div class="recent-avatar">${(job.company || '?')[0].toUpperCase()}</div>
            <div class="recent-info">
              <div class="recent-title">${escapeHtml(job.jobTitle)}</div>
              <div class="recent-company">${escapeHtml(job.company)}</div>
            </div>
            <span class="${badgeClass(job.status)}">${STATUS_LABEL[job.status] ?? job.status}</span>
          </div>
        `))
      })
    }
    contentEl.appendChild(card)
  } catch { /* non-fatal — just skip the recent list */ }
}

function escapeHtml(str) {
  return (str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
function escapeAttr(str) { return escapeHtml(str) }

// ── Entry point ──────────────────────────────────────────────────────────────
async function init() {
  const { token, apiBase = DEFAULTS.apiBase, appBase = DEFAULTS.appBase } = await storageGet(['token', 'apiBase', 'appBase'])

  if (!token) {
    renderConnectView()
    return
  }

  try {
    await apiFetch('/api/extension/stats', { token, apiBase }) // confirms token still valid
    await renderMainView({ token, apiBase, appBase })
  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      await storageRemove(['token'])
      renderConnectView('Your session expired — reconnect with a new token.')
    } else {
      contentEl.innerHTML = ''
      contentEl.appendChild(h(`
        <div class="card">
          <p class="title">Can't reach Cammino</p>
          <p class="subtitle">${escapeHtml(e.message)}</p>
          <button id="retry-btn" class="btn btn-secondary">Retry</button>
        </div>
      `))
      document.getElementById('retry-btn').addEventListener('click', init)
    }
  }
}

settingsBtn.addEventListener('click', async () => {
  const { token, apiBase = DEFAULTS.apiBase, appBase = DEFAULTS.appBase } = await storageGet(['token', 'apiBase', 'appBase'])
  renderSettingsView({ token, apiBase, appBase })
})

init()
