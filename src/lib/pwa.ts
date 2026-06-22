/**
 * PWA Service Worker registration + utilities
 */

/** Register the service worker; call once from main.tsx */
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    // Handle SW updates: prompt user when new version is available
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;
      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          // Dispatch custom event so the UI can show an update toast
          window.dispatchEvent(new CustomEvent("sw-update-available"));
        }
      });
    });

    // Listen for navigation messages from the SW (notification clicks)
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "NAVIGATE" && event.data.url) {
        // Extract view from the URL query param and dispatch a navigation event
        const url = new URL(event.data.url, window.location.origin);
        const view = url.searchParams.get("view");
        if (view) {
          window.dispatchEvent(new CustomEvent("sw-navigate", { detail: { view } }));
        }
      }
    });

    console.info("[SW] Registered:", reg.scope);
    return reg;
  } catch (err) {
    console.warn("[SW] Registration failed:", err);
    return null;
  }
}

/** Tell the waiting SW to activate immediately */
export function applySwUpdate(): void {
  navigator.serviceWorker?.getRegistration().then((reg) => {
    reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}

/** True when running as an installed PWA */
export function isRunningAsPwa(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

/** True on a touch device (mobile / tablet) */
export function isMobileDevice(): boolean {
  return (
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
    window.matchMedia("(pointer: coarse)").matches
  );
}
