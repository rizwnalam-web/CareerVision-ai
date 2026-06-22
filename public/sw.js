/**
 * CareerVision Service Worker
 * Handles:
 *  1. App-shell pre-caching (static assets, fonts)
 *  2. Runtime caching strategies per resource type
 *  3. Offline fallback page
 *  4. Web Push Notifications (job alerts)
 *  5. Background Sync for buffered analytics events
 */

const SW_VERSION = "cv-sw-v1";

// ── Cache names ───────────────────────────────────────────────────────────────
const CACHE_SHELL    = `${SW_VERSION}-shell`;
const CACHE_API      = `${SW_VERSION}-api`;
const CACHE_IMAGES   = `${SW_VERSION}-images`;
const CACHE_FONTS    = `${SW_VERSION}-fonts`;
const ALL_CACHES     = [CACHE_SHELL, CACHE_API, CACHE_IMAGES, CACHE_FONTS];

// ── App-shell assets to pre-cache on install ──────────────────────────────────
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/logo.svg",
];

// ── API patterns to cache at runtime (stale-while-revalidate) ─────────────────
const API_CACHE_PATTERNS = [
  /\/api\/careers-ai\/top-careers/,
  /\/api\/careers-ai\/career-directories/,
  /\/api\/careers-ai\/dashboard-intelligence/,
  /\/api\/market\//,
  /\/api\/analytics\/market-trends/,
  /\/api\/analytics\/career-prediction/,
  /\/api\/analytics\/company-insights/,
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_SHELL).then((cache) =>
      cache.addAll(SHELL_ASSETS).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => !ALL_CACHES.includes(n))
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing strategies ─────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin non-API, chrome-extension
  if (request.method !== "GET") return;
  if (url.protocol === "chrome-extension:") return;

  // ─ Navigation requests: Network-first with offline fallback ─
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  // ─ Fonts: Cache-first (long-lived) ─
  if (url.hostname.includes("fonts.g") || url.pathname.match(/\.(woff2?|ttf|otf)$/i)) {
    event.respondWith(cacheFirst(request, CACHE_FONTS, 60 * 24 * 30));
    return;
  }

  // ─ API calls: Stale-while-revalidate for configured endpoints ─
  if (API_CACHE_PATTERNS.some((p) => p.test(request.url))) {
    event.respondWith(staleWhileRevalidate(request, CACHE_API, 60 * 60)); // 1h TTL
    return;
  }

  // ─ Static assets (.js, .css, .svg, .png, .jpg, .ico): Cache-first ─
  if (url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|ico|webp|woff2?)$/i)) {
    event.respondWith(cacheFirst(request, CACHE_SHELL));
    return;
  }

  // ─ Images from CDN / unsplash: Cache-first ─
  if (url.hostname.includes("unsplash") || url.hostname.includes("images.")) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES, 60 * 24 * 7));
    return;
  }

  // Default: network only
});

// ─────────────────────────────────────────────────────────────────────────────
// Caching helpers
// ─────────────────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-at");
    if (!maxAgeSeconds || !dateHeader || (Date.now() - parseInt(dateHeader)) / 1000 < maxAgeSeconds) {
      return cached;
    }
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const clone = new Response(await response.clone().blob(), { status: response.status, statusText: response.statusText, headers });
      cache.put(request, clone);
    }
    return response;
  } catch {
    return cached || new Response("Offline", { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName, maxAgeSeconds) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("sw-cached-at", Date.now().toString());
      const clone = new Response(response.clone().body, { status: response.status, statusText: response.statusText, headers });
      cache.put(request, clone);
    }
    return response;
  }).catch(() => null);

  if (cached) {
    const dateHeader = cached.headers.get("sw-cached-at");
    const isStale = dateHeader && (Date.now() - parseInt(dateHeader)) / 1000 > maxAgeSeconds;
    if (!isStale) return cached;
    // Stale: return cached immediately, refresh in background
    return cached;
  }

  return (await networkPromise) || new Response("Offline", { status: 503 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Push Notifications
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "CareerVision", body: event.data.text(), type: "general" };
  }

  const {
    title = "CareerVision AI",
    body = "You have a new update.",
    icon = "/logo.svg",
    badge = "/logo.svg",
    url = "/",
    tag = "cv-notification",
    type = "general",
    data = {},
  } = payload;

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    data: { url, type, ...data },
    vibrate: [100, 50, 100],
    requireInteraction: type === "job_alert",
    actions: getActionsForType(type),
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

function getActionsForType(type) {
  switch (type) {
    case "job_alert":
      return [
        { action: "view", title: "View Job" },
        { action: "dismiss", title: "Dismiss" },
      ];
    case "interview_reminder":
      return [
        { action: "practice", title: "Practice Now" },
        { action: "later", title: "Remind Later" },
      ];
    case "market_update":
      return [
        { action: "view", title: "See Trends" },
      ];
    default:
      return [{ action: "view", title: "Open App" }];
  }
}

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { action } = event;
  const { url } = event.notification.data || {};

  if (action === "dismiss" || action === "later") return;

  const targetUrl = action === "practice" ? "/?view=interview" : (url || "/");

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "NAVIGATE", url: targetUrl });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// ── Background Sync: flush analytics events ───────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "analytics-flush") {
    event.waitUntil(flushAnalyticsQueue());
  }
});

async function flushAnalyticsQueue() {
  try {
    const cache = await caches.open("cv-analytics-queue");
    const keys = await cache.keys();
    const items = await Promise.all(
      keys.map(async (k) => {
        const r = await cache.match(k);
        return r ? r.json() : null;
      })
    );
    const events = items.filter(Boolean).flat();
    if (!events.length) return;

    await fetch("/api/analytics/events/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });

    await Promise.all(keys.map((k) => cache.delete(k)));
  } catch {
    // Will retry on next sync
  }
}

// ── Periodic sync: refresh cached market data ─────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-market-data") {
    event.waitUntil(refreshCachedApiData());
  }
});

async function refreshCachedApiData() {
  const cache = await caches.open(CACHE_API);
  const keys = await cache.keys();
  await Promise.allSettled(
    keys.map((req) =>
      fetch(req).then((res) => {
        if (res.ok) cache.put(req, res);
      })
    )
  );
}
