/**
 * Push Notification subscription service (frontend)
 *
 * Handles:
 * - Requesting permission
 * - Subscribing / unsubscribing via the Push API
 * - Syncing the subscription with the backend
 * - React hook for easy consumption
 */

import { useState, useEffect, useCallback } from "react";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

// The VAPID public key is served from the backend so we don't hard-code it.
// It is also safe to expose (it is a public key by design).
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidKey) return cachedVapidKey;
  const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
  const data = await res.json();
  cachedVapidKey = data.publicKey as string;
  return cachedVapidKey;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// ── Subscribe ─────────────────────────────────────────────────────────────────

export async function subscribeToPush(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { success: false, error: "Push notification permission denied." };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const vapidKey = await getVapidPublicKey();

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const res = await fetch(`${API_BASE}/api/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    });

    if (!res.ok) throw new Error("Failed to save subscription");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ── Unsubscribe ───────────────────────────────────────────────────────────────

export async function unsubscribeFromPush(
  userId: string
): Promise<{ success: boolean }> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, endpoint: sub.endpoint }),
      });
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ── Update alert preferences ──────────────────────────────────────────────────

export interface AlertPreferences {
  jobAlerts: boolean;
  marketUpdates: boolean;
  interviewReminders: boolean;
  weeklyDigest: boolean;
  scholarshipAlerts: boolean;
}

export async function updateAlertPreferences(
  userId: string,
  prefs: Partial<AlertPreferences>
): Promise<void> {
  await fetch(`${API_BASE}/api/push/preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, preferences: prefs }),
  });
}

export async function getAlertPreferences(
  userId: string
): Promise<AlertPreferences | null> {
  try {
    const res = await fetch(`${API_BASE}/api/push/preferences/${userId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data as AlertPreferences;
  } catch {
    return null;
  }
}

// ── React hook ────────────────────────────────────────────────────────────────

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  preferences: AlertPreferences;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  updatePreferences: (prefs: Partial<AlertPreferences>) => Promise<void>;
}

const DEFAULT_PREFS: AlertPreferences = {
  jobAlerts: true,
  marketUpdates: false,
  interviewReminders: true,
  weeklyDigest: false,
  scholarshipAlerts: true,
};

export function usePushNotifications(userId: string | undefined): PushNotificationState {
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    isSupported ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<AlertPreferences>(DEFAULT_PREFS);

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported || !userId) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setIsSubscribed(!!sub))
    );
    getAlertPreferences(userId).then((p) => { if (p) setPreferences(p); });
  }, [isSupported, userId]);

  const subscribe = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    const result = await subscribeToPush(userId);
    if (result.success) {
      setIsSubscribed(true);
      setPermission("granted");
    } else {
      setError(result.error ?? "Failed to subscribe");
    }
    setIsLoading(false);
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    await unsubscribeFromPush(userId);
    setIsSubscribed(false);
    setIsLoading(false);
  }, [userId]);

  const updatePrefs = useCallback(
    async (prefs: Partial<AlertPreferences>) => {
      if (!userId) return;
      const updated = { ...preferences, ...prefs };
      setPreferences(updated);
      await updateAlertPreferences(userId, updated);
    },
    [userId, preferences]
  );

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences: updatePrefs,
  };
}
