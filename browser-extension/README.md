# CareerVision Copilot — Browser Extension

A lightweight Chrome/Edge extension that reads job descriptions on external sites (LinkedIn, Indeed, Glassdoor) and pairs with your CareerVision dashboard.

## Features

- **One-Click Extraction** — Extracts job title, company, location, salary, and full description from job postings
- **Keyword Gap Analysis** — Checks extracted job description against your active CareerVision profile skills/interests
- **Form Autofill** — Populates application form fields (name, email, location, etc.) from your profile
- **Save to Dashboard** — Sends extracted job data to your CareerVision applications tracker

## Supported Sites

- LinkedIn (`linkedin.com/jobs/*`)
- Indeed (`indeed.com/*`)
- Glassdoor (`glassdoor.com/job-listing/*`)
- Any other page (generic fallback extractor)

## Installation (Developer Mode)

1. Open Chrome/Edge and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `browser-extension/` folder from this repository
5. The CareerVision Copilot icon will appear in your toolbar

## Setup

1. Click the extension icon to open the popup
2. Click the ⚙ settings gear
3. Enter your **Auth Token** (get it from your CareerVision dashboard → Profile → API Token)
4. Optionally set a custom API base URL (defaults to production)
5. Click **Connect**

## Usage

### Extract Job Details
1. Navigate to a job posting on LinkedIn/Indeed/Glassdoor
2. Click the floating **CV** button on the page, OR open the popup and click **Extract Current Page**
3. Job details appear in the popup

### Check Keyword Match
1. After extracting a job, click **Check Keywords**
2. View your match score and see which keywords are missing from your profile
3. Use this to update your resume or profile before applying

### Autofill Applications
1. Navigate to a job application form
2. Open the popup → Autofill tab
3. Select which fields to populate
4. Click **Autofill Selected Fields**

## File Structure

```
browser-extension/
├── manifest.json          # Extension manifest (V3)
├── background/
│   └── service-worker.js  # Background worker — API communication
├── content/
│   ├── extractor.js       # Content script — page extraction & autofill
│   └── overlay.css        # FAB & toast styles
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
└── icons/                 # Extension icons (16/48/128px)
```

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Save auth token and cached profile |
| `activeTab` | Access current tab for extraction |
| `scripting` | Inject content scripts on demand |
| Host permissions | LinkedIn, Indeed, Glassdoor domains |
