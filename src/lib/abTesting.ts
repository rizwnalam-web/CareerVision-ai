/**
 * A/B Testing hook & utilities for CareerVision.
 *
 * Usage:
 *   const variant = useAbVariant('dashboard_layout_v2', userId);
 *   if (variant === 'grid_v2') { ... }
 */

import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

// ── In-memory cache so identical calls within a session don't hit the network

const variantCache = new Map<string, string>();

async function fetchVariant(
  testKey: string,
  userIdentifier: string
): Promise<string> {
  const cacheKey = `${testKey}:${userIdentifier}`;
  if (variantCache.has(cacheKey)) return variantCache.get(cacheKey)!;

  try {
    const response = await fetch(`${API_BASE}/api/analytics/ab/variant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testKey, userIdentifier }),
    });
    if (!response.ok) throw new Error("AB API error");
    const data = await response.json();
    const variant: string = data?.data?.variant ?? "control";
    variantCache.set(cacheKey, variant);
    return variant;
  } catch {
    // Default to "control" on failure – never break the app
    variantCache.set(cacheKey, "control");
    return "control";
  }
}

/**
 * Fetch all active A/B variants for a user in one request and warm the local
 * cache.  Call this once after login.
 */
export async function prefetchVariants(userIdentifier: string): Promise<void> {
  try {
    const response = await fetch(
      `${API_BASE}/api/analytics/ab/variants/${encodeURIComponent(userIdentifier)}`,
      { method: "GET" }
    );
    if (!response.ok) return;
    const data = await response.json();
    const variants: { testKey: string; variant: string }[] = data?.data ?? [];
    for (const { testKey, variant } of variants) {
      variantCache.set(`${testKey}:${userIdentifier}`, variant);
    }
  } catch {
    // Silently ignore
  }
}

// ── React hook ───────────────────────────────────────────────────────────────

/**
 * Returns the assigned variant string for a given test.
 * Returns "control" while loading or on error.
 */
export function useAbVariant(
  testKey: string,
  userIdentifier: string | undefined
): string {
  const [variant, setVariant] = useState<string>(() => {
    if (!userIdentifier) return "control";
    return variantCache.get(`${testKey}:${userIdentifier}`) ?? "control";
  });

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!userIdentifier || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchVariant(testKey, userIdentifier).then(setVariant);
  }, [testKey, userIdentifier]);

  return variant;
}

// ── Imperative helper ─────────────────────────────────────────────────────────

/**
 * Non-hook version: resolves immediately from cache or fetches once.
 */
export async function getVariant(
  testKey: string,
  userIdentifier: string
): Promise<string> {
  return fetchVariant(testKey, userIdentifier);
}

// ── AbTest gate component helper ─────────────────────────────────────────────

/**
 * Tiny utility to render content conditionally based on variant.
 * Returns true when the user is in the given variant.
 */
export function isVariant(
  testKey: string,
  targetVariant: string,
  userIdentifier: string | undefined
): boolean {
  if (!userIdentifier) return targetVariant === "control";
  return (
    (variantCache.get(`${testKey}:${userIdentifier}`) ?? "control") ===
    targetVariant
  );
}

// ── Hook: useAbVariantCallback ────────────────────────────────────────────────

/**
 * Returns a stable callback that fetches/caches a variant on demand.
 * Useful when you need to defer the fetch until a user action.
 */
export function useAbVariantCallback(
  userIdentifier: string | undefined
): (testKey: string) => Promise<string> {
  return useCallback(
    (testKey: string) => {
      if (!userIdentifier) return Promise.resolve("control");
      return fetchVariant(testKey, userIdentifier);
    },
    [userIdentifier]
  );
}
