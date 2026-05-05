/**
 * Cached API Service - Handles data persistence and retrieval
 * Strategy: Cache-first, then LLM fallback, then save to cache
 */

// Use relative URL so it works both in dev (port 3000 proxied) and when
// the backend is on 3001. Falls back gracefully if backend is not running.
const API_BASE = "http://localhost:3001/api/market";
const CAREERS_BASE = "http://localhost:3001/api/careers";

interface CacheResponse {
  source: "cache" | "not-cached";
  data: any;
}

/**
 * Save Career Hub Intelligence to database cache
 */
export async function saveCachedCareerHub(hubData: any): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/career-hub`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hubData),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[Cache] Failed to save career hub (${response.status}):`, text);
      return false;
    }

    const result = await response.json();
    console.log(`[Cache] ✓ Career hub saved: ${hubData.city}, ${hubData.country} →`, result.hubId);
    return true;
  } catch (error: any) {
    if (error?.message?.includes("fetch") || error?.cause?.code === "ECONNREFUSED") {
      console.warn("[Cache] Backend API not reachable (port 3001). Data not persisted.");
    } else {
      console.error("[Cache] Save failed:", error);
    }
    return false;
  }
}

/**
 * Get Career Hub Intelligence from cache if available
 */
export async function getCachedCareerHub(
  city: string,
  country: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `${API_BASE}/career-hub/${encodeURIComponent(city)}/${encodeURIComponent(country)}`
    );

    if (!response.ok) return null;

    const result: CacheResponse = await response.json();

    if (result.source === "cache" && result.data) {
      console.log(`✓ Career hub retrieved from cache: ${city}, ${country}`);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("Cache fetch failed:", error);
    return null;
  }
}

/**
 * Save Job Market Insights to database cache
 */
export async function saveCachedJobInsights(
  careerId: string,
  country: string,
  insights: any
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/job-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careerId, country, insights }),
    });

    if (!response.ok) {
      console.warn("Failed to cache job insights");
      return false;
    }

    const result = await response.json();
    console.log("✓ Job insights cached:", result.message);
    return true;
  } catch (error) {
    console.error("Cache save failed:", error);
    return false;
  }
}

/**
 * Get Job Market Insights from cache if available
 */
export async function getCachedJobInsights(
  careerId: string,
  country: string
): Promise<any | null> {
  try {
    const response = await fetch(
      `${API_BASE}/job-insights/${encodeURIComponent(careerId)}/${encodeURIComponent(country)}`
    );

    if (!response.ok) return null;

    const result: CacheResponse = await response.json();

    if (result.source === "cache" && result.data) {
      console.log(`✓ Job insights retrieved from cache: ${country}`);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("Cache fetch failed:", error);
    return null;
  }
}

/**
 * Bulk save institutions to database
 */
export async function saveCachedInstitutions(
  institutions: any[]
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/save-institutions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutions }),
    });

    if (!response.ok) {
      console.warn("Failed to cache institutions");
      return false;
    }

    const result = await response.json();
    console.log(`✓ ${result.count} institutions cached`);
    return true;
  } catch (error) {
    console.error("Institution cache save failed:", error);
    return false;
  }
}

/**
 * Bulk save study materials to database
 */
export async function saveCachedStudyMaterials(
  materials: any[],
  careerId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/save-study-materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materials, careerId }),
    });

    if (!response.ok) {
      console.warn("Failed to cache study materials");
      return false;
    }

    const result = await response.json();
    console.log(`✓ ${result.count} study materials cached`);
    return true;
  } catch (error) {
    console.error("Study materials cache save failed:", error);
    return false;
  }
}
/**
 * Get study materials from database for a specific career
 */
export async function getCachedStudyMaterialsByCareer(
  careerId: string
): Promise<any[] | null> {
  try {
    const response = await fetch(
      `${API_BASE}/study-materials/${encodeURIComponent(careerId)}`
    );

    if (!response.ok) return null;

    const result: any = await response.json();

    if (result.source === "cache" && Array.isArray(result.data)) {
      console.log(`✓ Study materials retrieved from cache for career: ${careerId}`);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("Study materials cache fetch failed:", error);
    return null;
  }
}

/**
 * Get institutions from database for a specific location
 */
export async function getCachedInstitutions(
  country: string,
  city?: string
): Promise<any[] | null> {
  try {
    const params = new URLSearchParams({ country });
    if (city) params.append("city", city);

    const response = await fetch(`${API_BASE}/institutions?${params.toString()}`);

    if (!response.ok) return null;

    const result: any = await response.json();

    if (result.source === "cache" && Array.isArray(result.data)) {
      console.log(`✓ Institutions retrieved from cache for: ${country}`);
      return result.data;
    }

    return null;
  } catch (error) {
    console.error("Institutions cache fetch failed:", error);
    return null;
  }
}

/**
 * Get top global careers from DB cache.
 * Returns null if cache is empty or stale (< 10 items).
 */
export async function getCachedTopCareers(): Promise<any[] | null> {
  try {
    const response = await fetch(`${CAREERS_BASE}/top`);
    if (!response.ok) return null;

    const result: CacheResponse = await response.json();
    if (result.source === "cache" && Array.isArray(result.data) && result.data.length >= 10) {
      console.log(`✓ Top careers retrieved from DB cache (${result.data.length} paths)`);
      return result.data;
    }
    return null;
  } catch (error: any) {
    if (error?.cause?.code === "ECONNREFUSED") {
      console.warn("[Cache] Backend not reachable — skipping top careers cache read.");
    } else {
      console.error("Top careers cache fetch failed:", error);
    }
    return null;
  }
}

/**
 * Save AI-generated top global careers to DB (with milestones).
 * Non-blocking — failure here does not affect the UI.
 */
export async function saveCachedTopCareers(careers: any[]): Promise<boolean> {
  try {
    const response = await fetch(`${CAREERS_BASE}/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careers }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[Cache] Failed to save top careers (${response.status}):`, text);
      return false;
    }

    const result = await response.json();
    console.log(`[Cache] ✓ ${result.saved} top global careers cached in DB`);
    return true;
  } catch (error: any) {
    if (error?.cause?.code === "ECONNREFUSED") {
      console.warn("[Cache] Backend not reachable — top careers not persisted.");
    } else {
      console.error("[Cache] Save top careers failed:", error);
    }
    return false;
  }
}
