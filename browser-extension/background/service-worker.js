/**
 * CareerVision Copilot — Background Service Worker
 *
 * Handles communication between content scripts, popup, and the CareerVision API.
 */

const API_BASE = self.__API_BASE || "https://easycareer-ai.decodflow.com";

// ─── Message Router ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "EXTRACT_JOB":
      handleExtractJob(message.payload, sendResponse);
      return true; // async response

    case "GET_PROFILE":
      handleGetProfile(sendResponse);
      return true;

    case "CHECK_KEYWORDS":
      handleKeywordCheck(message.payload, sendResponse);
      return true;

    case "AUTOFILL_FIELDS":
      handleAutofill(message.payload, sender.tab?.id, sendResponse);
      return true;

    case "SAVE_JOB":
      handleSaveJob(message.payload, sendResponse);
      return true;

    default:
      sendResponse({ error: "Unknown message type" });
  }
});

// ─── Handlers ───────────────────────────────────────────────────────────────

async function handleExtractJob(payload, sendResponse) {
  try {
    // Store extracted job data in session
    await chrome.storage.session.set({ lastExtractedJob: payload });
    sendResponse({ success: true, data: payload });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

async function handleGetProfile(sendResponse) {
  try {
    const { authToken, apiBase } = await chrome.storage.sync.get([
      "authToken",
      "apiBase",
    ]);
    const base = apiBase || API_BASE;

    if (!authToken) {
      sendResponse({ error: "Not connected. Please link your CareerVision account." });
      return;
    }

    const res = await fetch(`${base}/api/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
    const profile = await res.json();
    await chrome.storage.session.set({ profile });
    sendResponse({ success: true, data: profile });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

async function handleKeywordCheck(payload, sendResponse) {
  try {
    const { profile } = await chrome.storage.session.get("profile");
    if (!profile) {
      sendResponse({ error: "Profile not loaded" });
      return;
    }

    const jobKeywords = extractKeywords(payload.description || "");
    const profileKeywords = new Set([
      ...(profile.skills || []).map((s) => s.toLowerCase()),
      ...(profile.interests || []).map((i) => i.toLowerCase()),
      (profile.targetCareer || "").toLowerCase(),
      (profile.currentRole || "").toLowerCase(),
    ]);

    const matched = jobKeywords.filter((k) => profileKeywords.has(k.toLowerCase()));
    const missing = jobKeywords.filter((k) => !profileKeywords.has(k.toLowerCase()));
    const score = jobKeywords.length > 0
      ? Math.round((matched.length / jobKeywords.length) * 100)
      : 0;

    sendResponse({
      success: true,
      data: { score, matched, missing, total: jobKeywords.length },
    });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

async function handleAutofill(payload, tabId, sendResponse) {
  try {
    if (!tabId) {
      sendResponse({ error: "No active tab" });
      return;
    }

    await chrome.tabs.sendMessage(tabId, {
      type: "DO_AUTOFILL",
      payload,
    });
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

async function handleSaveJob(payload, sendResponse) {
  try {
    const { authToken, apiBase } = await chrome.storage.sync.get([
      "authToken",
      "apiBase",
    ]);
    const base = apiBase || API_BASE;

    if (!authToken) {
      sendResponse({ error: "Not connected" });
      return;
    }

    const res = await fetch(`${base}/api/applications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobTitle: payload.title,
        company: payload.company,
        location: payload.location,
        sourceUrl: payload.url,
        status: "saved",
        extractedData: payload,
      }),
    });

    if (!res.ok) throw new Error(`Save failed: ${res.status}`);
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

// ─── Keyword Extraction ─────────────────────────────────────────────────────

function extractKeywords(text) {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "this", "that", "these", "those", "i", "me", "my", "myself",
    "we", "our", "you", "your", "he", "him", "his", "she", "her", "it",
    "its", "they", "them", "their", "what", "which", "who", "whom",
    "where", "when", "why", "how", "all", "each", "every", "both",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not",
    "only", "own", "same", "so", "than", "too", "very", "just", "about",
    "above", "after", "again", "also", "as", "because", "before",
    "between", "during", "from", "if", "into", "through", "under",
    "until", "up", "while", "work", "working", "experience", "years",
    "role", "team", "ability", "strong", "including", "well", "must",
    "required", "preferred", "plus", "etc", "using", "new", "based",
  ]);

  // Common tech/business skill patterns
  const skillPatterns = [
    /\b(react|angular|vue|svelte|next\.?js|nuxt)\b/gi,
    /\b(python|java|javascript|typescript|go|rust|c\+\+|ruby|php|swift|kotlin)\b/gi,
    /\b(aws|azure|gcp|docker|kubernetes|terraform|ci\/cd)\b/gi,
    /\b(sql|nosql|mongodb|postgresql|redis|elasticsearch)\b/gi,
    /\b(machine learning|deep learning|nlp|computer vision|ai)\b/gi,
    /\b(agile|scrum|kanban|devops|microservices)\b/gi,
    /\b(figma|sketch|adobe|photoshop|illustrator)\b/gi,
    /\b(data analysis|data science|analytics|tableau|power bi)\b/gi,
    /\b(project management|product management|leadership)\b/gi,
    /\b(communication|problem.solving|critical thinking)\b/gi,
  ];

  const found = new Set();

  // Extract pattern-matched skills
  for (const pattern of skillPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((m) => found.add(m.toLowerCase().trim()));
    }
  }

  // Extract capitalized multi-word terms (likely proper nouns/tools)
  const capitalizedTerms = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
  if (capitalizedTerms) {
    capitalizedTerms.forEach((term) => {
      if (term.split(" ").length <= 3) found.add(term.toLowerCase());
    });
  }

  // Extract individual meaningful words (3+ chars, not stop words)
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const wordFreq = {};
  words.forEach((w) => {
    if (!stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  // Top frequent words as potential keywords
  Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([word]) => found.add(word));

  return [...found].slice(0, 30);
}
