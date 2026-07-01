/**
 * CareerVision Copilot — Popup Script
 *
 * Handles UI interactions for the extension popup.
 */

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupTabs();
  setupSettings();
  setupExtract();
  setupAutofill();
  await checkConnection();
  await loadLastJob();
}

// ─── Tab Navigation ─────────────────────────────────────────────────────────

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.getElementById(`tab-${target}`).classList.add("active");

      // Hide settings when switching tabs
      document.getElementById("settings-panel").classList.add("hidden");
    });
  });
}

// ─── Settings / Connection ──────────────────────────────────────────────────

function setupSettings() {
  const settingsBtn = document.getElementById("settings-btn");
  const panel = document.getElementById("settings-panel");
  const connectBtn = document.getElementById("connect-btn");
  const disconnectBtn = document.getElementById("disconnect-btn");

  settingsBtn.addEventListener("click", () => {
    panel.classList.toggle("hidden");
  });

  connectBtn.addEventListener("click", async () => {
    const apiBase = document.getElementById("api-base").value.trim();
    const authToken = document.getElementById("auth-token").value.trim();

    if (!authToken) {
      showStatus("Please enter your auth token", "error");
      return;
    }

    const data = { authToken };
    if (apiBase) data.apiBase = apiBase;

    await chrome.storage.sync.set(data);
    await checkConnection();
    panel.classList.add("hidden");
  });

  disconnectBtn.addEventListener("click", async () => {
    await chrome.storage.sync.remove(["authToken", "apiBase"]);
    await chrome.storage.session.remove(["profile"]);
    updateConnectionUI(false);
  });
}

async function checkConnection() {
  const { authToken } = await chrome.storage.sync.get("authToken");
  if (authToken) {
    // Try fetching profile
    chrome.runtime.sendMessage({ type: "GET_PROFILE" }, (response) => {
      if (response?.success) {
        updateConnectionUI(true, response.data.name || response.data.email);
      } else {
        updateConnectionUI(false);
      }
    });
  } else {
    updateConnectionUI(false);
  }
}

function updateConnectionUI(connected, userName) {
  const bar = document.getElementById("connection-bar");
  const text = document.getElementById("connection-text");
  const connectBtn = document.getElementById("connect-btn");
  const disconnectBtn = document.getElementById("disconnect-btn");

  if (connected) {
    bar.className = "connection-bar connected";
    text.textContent = `Connected${userName ? `: ${userName}` : ""}`;
    connectBtn.classList.add("hidden");
    disconnectBtn.classList.remove("hidden");
  } else {
    bar.className = "connection-bar disconnected";
    text.textContent = "Not connected — click ⚙ to link account";
    connectBtn.classList.remove("hidden");
    disconnectBtn.classList.add("hidden");
  }
}

// ─── Extract ────────────────────────────────────────────────────────────────

function setupExtract() {
  document.getElementById("extract-now-btn").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: "TRIGGER_EXTRACT" }, (response) => {
        if (response?.data) {
          displayJob(response.data);
        }
      });
    });
  });

  document.getElementById("save-job-btn")?.addEventListener("click", async () => {
    const { lastExtractedJob } = await chrome.storage.session.get("lastExtractedJob");
    if (!lastExtractedJob) return;

    chrome.runtime.sendMessage({ type: "SAVE_JOB", payload: lastExtractedJob }, (response) => {
      if (response?.success) {
        showStatus("Job saved to your dashboard!", "success");
      } else {
        showStatus(response?.error || "Save failed", "error");
      }
    });
  });

  document.getElementById("check-keywords-btn")?.addEventListener("click", async () => {
    const { lastExtractedJob } = await chrome.storage.session.get("lastExtractedJob");
    if (!lastExtractedJob) return;

    // Switch to keywords tab
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    document.querySelector('[data-tab="keywords"]').classList.add("active");
    document.getElementById("tab-keywords").classList.add("active");

    chrome.runtime.sendMessage(
      { type: "CHECK_KEYWORDS", payload: { description: lastExtractedJob.description } },
      (response) => {
        if (response?.success) {
          displayKeywords(response.data);
        } else {
          showStatus(response?.error || "Keyword check failed", "error");
        }
      }
    );
  });
}

async function loadLastJob() {
  const { lastExtractedJob } = await chrome.storage.session.get("lastExtractedJob");
  if (lastExtractedJob && lastExtractedJob.title) {
    displayJob(lastExtractedJob);
  }
}

function displayJob(data) {
  document.getElementById("no-job").classList.add("hidden");
  const card = document.getElementById("job-card");
  card.classList.remove("hidden");

  document.getElementById("job-title").textContent = data.title || "Untitled Position";
  document.getElementById("job-company").textContent = data.company || "Unknown Company";

  const locEl = document.getElementById("job-location");
  const typeEl = document.getElementById("job-type");
  const salaryEl = document.getElementById("job-salary");

  locEl.textContent = data.location || "";
  locEl.classList.toggle("hidden", !data.location);

  typeEl.textContent = data.jobType || "";
  typeEl.classList.toggle("hidden", !data.jobType);

  salaryEl.textContent = data.salary || "";
  salaryEl.classList.toggle("hidden", !data.salary);
}

// ─── Keywords ───────────────────────────────────────────────────────────────

function displayKeywords(data) {
  document.getElementById("no-keywords").classList.add("hidden");
  const results = document.getElementById("keyword-results");
  results.classList.remove("hidden");

  // Score ring
  const score = data.score || 0;
  const path = document.getElementById("score-path");
  const circumference = 100;
  path.style.strokeDasharray = `${score}, ${circumference}`;
  document.getElementById("score-value").textContent = `${score}%`;

  // Color based on score
  if (score >= 70) path.classList.add("high");
  else if (score >= 40) path.classList.add("medium");
  else path.classList.add("low");

  // Matched
  const matchedContainer = document.getElementById("matched-keywords");
  matchedContainer.innerHTML = "";
  (data.matched || []).forEach((kw) => {
    const chip = document.createElement("span");
    chip.className = "keyword-chip matched";
    chip.textContent = kw;
    matchedContainer.appendChild(chip);
  });

  // Missing
  const missingContainer = document.getElementById("missing-keywords");
  missingContainer.innerHTML = "";
  (data.missing || []).forEach((kw) => {
    const chip = document.createElement("span");
    chip.className = "keyword-chip missing";
    chip.textContent = kw;
    missingContainer.appendChild(chip);
  });
}

// ─── Autofill ───────────────────────────────────────────────────────────────

function setupAutofill() {
  document.getElementById("autofill-btn").addEventListener("click", async () => {
    const { profile } = await chrome.storage.session.get("profile");
    if (!profile) {
      showStatus("Connect your account first to autofill", "error");
      return;
    }

    const checkboxes = document.querySelectorAll('.autofill-fields input[type="checkbox"]:checked');
    const fields = {};

    checkboxes.forEach((cb) => {
      const field = cb.dataset.field;
      switch (field) {
        case "name": fields.name = profile.name; break;
        case "email": fields.email = profile.email; break;
        case "phone": fields.phone = profile.phone || ""; break;
        case "location": fields.location = `${profile.country || ""}`; break;
        case "linkedin": fields.linkedin = profile.linkedinUrl || ""; break;
        case "website": fields.website = profile.website || ""; break;
        case "currentCompany": fields.currentCompany = profile.currentCompany || ""; break;
        case "currentTitle": fields.currentTitle = profile.currentRole || profile.targetCareer || ""; break;
      }
    });

    chrome.runtime.sendMessage({ type: "AUTOFILL_FIELDS", payload: fields }, (response) => {
      if (response?.success) {
        showStatus("Fields autofilled!", "success");
      } else {
        showStatus(response?.error || "Autofill failed", "error");
      }
    });
  });
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function showStatus(message, type) {
  const existing = document.querySelector(".status-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `status-toast ${type}`;
  toast.textContent = message;
  document.getElementById("app").appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
