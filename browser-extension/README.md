# Cammino — Job Capture (Chrome extension)

A Manifest V3 extension that saves job listings to your Cammino tracker in one click.

## Load it (development)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this `browser-extension/` folder
4. Pin the Cammino icon to your toolbar

## Connect it

1. In the Cammino web app, go to **Profile → Browser extension → Generate new token**
2. Copy the token (it's only shown once)
3. Click the Cammino toolbar icon, paste the token, and click **Connect**

## Use it

Open any job listing page and click the Cammino icon. It best-effort extracts the job
title, company, and location for LinkedIn, Indeed, Greenhouse, and Lever — always
editable before saving. Anything else falls back to the page's `<h1>` / title tag, and
you fill in the rest by hand.

If the current page's URL is already in your tracker, the popup shows its status
instead of a save form.

## How auth works

The extension uses a **personal access token** (PAT), not your login session — a
separate credential scoped to the extension, generated from Profile. Revoking it there
immediately cuts off the extension without touching your normal session. Tokens are
stored in `chrome.storage.local`, which is private to this extension and not
accessible from web pages.

## Configuring for a deployed backend

By default the extension points at `http://localhost:8080` (API) and
`http://localhost:5173` (web app), for local development. To point it at a deployed
instance:

1. Click the gear icon in the popup and update **API URL** / **Web app URL**
2. Add the API's origin to `host_permissions` in `manifest.json` — Chrome extensions
   must declare every origin they call `fetch()` against. Reload the extension after
   editing the manifest.

## What's not implemented

- No packaging/publishing to the Chrome Web Store — this is the unpacked dev build.
- No automated test suite for the extension itself (Manifest V3's `activeTab`
  permission model requires a real user gesture — a toolbar click — to grant page
  access, which headless test harnesses can't faithfully simulate). The connect
  flow and API calls were verified against the real backend; the on-page
  extraction was verified manually.
