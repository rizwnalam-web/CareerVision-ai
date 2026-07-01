/**
 * CareerVision Copilot — Content Script
 *
 * Extracts job description data from LinkedIn, Indeed, and Glassdoor pages.
 * Injects a floating action button for one-click extraction.
 */

(() => {
  "use strict";

  // Avoid double-injection
  if (window.__careervision_injected) return;
  window.__careervision_injected = true;

  // ─── Site Detection ─────────────────────────────────────────────────────

  function detectSite() {
    const host = location.hostname;
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("indeed.com")) return "indeed";
    if (host.includes("glassdoor.com")) return "glassdoor";
    return "unknown";
  }

  // ─── Extractors ─────────────────────────────────────────────────────────

  const extractors = {
    linkedin() {
      const container =
        document.querySelector(".jobs-description") ||
        document.querySelector(".job-view-layout") ||
        document.querySelector('[class*="jobs-unified-top-card"]');

      const title =
        document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim() ||
        document.querySelector(".jobs-unified-top-card__job-title")?.textContent?.trim() ||
        document.querySelector("h1")?.textContent?.trim() ||
        "";

      const company =
        document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() ||
        document.querySelector(".jobs-unified-top-card__company-name")?.textContent?.trim() ||
        document.querySelector('[class*="company-name"]')?.textContent?.trim() ||
        "";

      const location =
        document.querySelector(".job-details-jobs-unified-top-card__bullet")?.textContent?.trim() ||
        document.querySelector(".jobs-unified-top-card__bullet")?.textContent?.trim() ||
        "";

      const description =
        document.querySelector(".jobs-description-content__text")?.textContent?.trim() ||
        document.querySelector(".jobs-box__html-content")?.textContent?.trim() ||
        container?.textContent?.trim() ||
        "";

      const salary =
        document.querySelector('[class*="salary"]')?.textContent?.trim() || "";

      const jobType =
        document.querySelector('[class*="workplace-type"]')?.textContent?.trim() || "";

      return { title, company, location, description, salary, jobType, url: location.href };
    },

    indeed() {
      const title =
        document.querySelector(".jobsearch-JobInfoHeader-title")?.textContent?.trim() ||
        document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]')?.textContent?.trim() ||
        document.querySelector("h1")?.textContent?.trim() ||
        "";

      const company =
        document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() ||
        document.querySelector(".jobsearch-InlineCompanyRating-companyHeader")?.textContent?.trim() ||
        "";

      const loc =
        document.querySelector('[data-testid="inlineHeader-companyLocation"]')?.textContent?.trim() ||
        document.querySelector('[data-testid="job-location"]')?.textContent?.trim() ||
        "";

      const description =
        document.querySelector("#jobDescriptionText")?.textContent?.trim() ||
        document.querySelector(".jobsearch-jobDescriptionText")?.textContent?.trim() ||
        "";

      const salary =
        document.querySelector("#salaryInfoAndJobType .attribute_snippet")?.textContent?.trim() ||
        document.querySelector('[class*="salary-snippet"]')?.textContent?.trim() ||
        "";

      const jobType =
        document.querySelector('[class*="job-type"]')?.textContent?.trim() || "";

      return { title, company, location: loc, description, salary, jobType, url: location.href };
    },

    glassdoor() {
      const title =
        document.querySelector('[data-test="job-title"]')?.textContent?.trim() ||
        document.querySelector("h1")?.textContent?.trim() ||
        "";

      const company =
        document.querySelector('[data-test="employer-name"]')?.textContent?.trim() || "";

      const loc =
        document.querySelector('[data-test="location"]')?.textContent?.trim() || "";

      const description =
        document.querySelector(".jobDescriptionContent")?.textContent?.trim() ||
        document.querySelector('[class*="JobDescription"]')?.textContent?.trim() ||
        "";

      return { title, company, location: loc, description, salary: "", jobType: "", url: location.href };
    },

    unknown() {
      // Generic fallback: grab h1 + body text
      const title = document.querySelector("h1")?.textContent?.trim() || document.title;
      const description = document.body?.innerText?.substring(0, 5000) || "";
      return { title, company: "", location: "", description, salary: "", jobType: "", url: location.href };
    },
  };

  // ─── Autofill Handler ───────────────────────────────────────────────────

  function autofillFields(fields) {
    const fieldMap = {
      name: ['[name*="name"]', '[id*="name"]', '[placeholder*="name"]'],
      email: ['[name*="email"]', '[id*="email"]', '[type="email"]'],
      phone: ['[name*="phone"]', '[id*="phone"]', '[type="tel"]'],
      location: ['[name*="location"]', '[id*="location"]', '[name*="city"]'],
      linkedin: ['[name*="linkedin"]', '[id*="linkedin"]', '[placeholder*="linkedin"]'],
      website: ['[name*="website"]', '[id*="website"]', '[name*="portfolio"]'],
      currentCompany: ['[name*="company"]', '[id*="company"]', '[name*="employer"]'],
      currentTitle: ['[name*="title"]', '[id*="title"]', '[name*="position"]'],
      coverLetter: ['[name*="cover"]', '[id*="cover"]', "textarea"],
    };

    let filled = 0;

    for (const [key, selectors] of Object.entries(fieldMap)) {
      if (!fields[key]) continue;

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && !el.value) {
          el.value = fields[key];
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          filled++;
          break;
        }
      }
    }

    return filled;
  }

  // ─── Message Listener (from background/popup) ──────────────────────────

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "DO_AUTOFILL") {
      const count = autofillFields(message.payload);
      sendResponse({ filled: count });
    }

    if (message.type === "TRIGGER_EXTRACT") {
      const site = detectSite();
      const data = extractors[site]();
      chrome.runtime.sendMessage({ type: "EXTRACT_JOB", payload: data });
      sendResponse({ success: true, data });
    }
  });

  // ─── Floating Action Button ─────────────────────────────────────────────

  function injectFAB() {
    const fab = document.createElement("div");
    fab.id = "careervision-fab";
    fab.innerHTML = `
      <button id="cv-extract-btn" title="CareerVision: Extract Job Details">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span>CV</span>
      </button>
    `;
    document.body.appendChild(fab);

    document.getElementById("cv-extract-btn").addEventListener("click", () => {
      const site = detectSite();
      const data = extractors[site]();
      data.url = window.location.href;

      chrome.runtime.sendMessage({ type: "EXTRACT_JOB", payload: data }, (response) => {
        if (response?.success) {
          showToast("Job extracted! Open CareerVision Copilot popup to review.");
        }
      });
    });
  }

  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "careervision-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ─── Initialize ─────────────────────────────────────────────────────────

  // Wait for page to be ready
  if (document.readyState === "complete") {
    injectFAB();
  } else {
    window.addEventListener("load", injectFAB);
  }
})();
