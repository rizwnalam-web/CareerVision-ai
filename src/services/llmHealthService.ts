const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$|\/api$/, "");

export interface LLMProviderInfo {
  name: string;
  label: string;
  model: string;
  isActive: boolean;
  hasKey: boolean;
}

export interface LLMHealthStatus {
  available: boolean;
  activeProvider: {
    name: string;
    label: string;
    model: string;
  } | null;
  allProviders: LLMProviderInfo[];
}

export async function fetchLLMHealth(): Promise<LLMHealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/llm/health`, { method: "GET" });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { available: false, activeProvider: null, allProviders: data.allProviders || [] };
    }
    return {
      available: true,
      activeProvider: data.activeProvider,
      allProviders: data.allProviders || [],
    };
  } catch {
    return { available: false, activeProvider: null, allProviders: [] };
  }
}

export async function reprobeLLM(): Promise<LLMHealthStatus> {
  try {
    await fetch(`${API_BASE}/api/llm/probe`, { method: "POST" });
    return fetchLLMHealth();
  } catch {
    return { available: false, activeProvider: null, allProviders: [] };
  }
}
