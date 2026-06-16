import axios from "axios";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Provider Registry — tried in order; first healthy one wins and is locked in
// for all subsequent calls in this process lifetime.
// ─────────────────────────────────────────────────────────────────────────────
export interface LLMProvider {
  name: string;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string | undefined;
}

const PROVIDERS: LLMProvider[] = [
  {
    name: "groq",
    label: "Groq (Llama 3.3 70B)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    apiKey: process.env.GROQ_API_KEY,
  },
  {
    name: "gemini",
    label: "Gemini 2.0 Flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: process.env.LLM_MODEL && process.env.LLM_GATEWAY_URL?.includes("generativelanguage")
      ? process.env.LLM_MODEL
      : "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY,
  },
  {
    name: "openai",
    label: "GPT-3.5 Turbo",
    baseUrl: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL || "gpt-3.5-turbo-16k",
    apiKey: process.env.OPENAI_API_KEY,
  },
  {
    name: "deepseek",
    label: "DeepSeek Chat",
    baseUrl: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
];

// Runtime state — locked after first successful call
let activeProviderIndex: number | null = null;
let activeProviderInfo: LLMProvider | null = null;

export function getActiveProvider(): LLMProvider | null {
  return activeProviderInfo;
}

export function getAllProviders(): LLMProvider[] {
  return PROVIDERS.map(p => ({ ...p, apiKey: p.apiKey ? "***" : undefined }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_SECONDS = Number(process.env.LLM_CACHE_TTL_SECONDS || "86400");
const MAX_CONCURRENCY = Number(process.env.LLM_MAX_CONCURRENCY || "3");
const COST_PER_TOKEN_USD = Number(process.env.LLM_COST_PER_TOKEN_USD || "0.000002");
const OFF_PEAK_HOURS = process.env.OFF_PEAK_HOURS || "23-7";

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache<T> {
  private store = new Map<string, CacheItem<T>>();
  constructor(private stdTTL: number = 0, checkPeriod: number = 600) {
    if (this.stdTTL > 0) {
      setInterval(() => this.cleanup(), checkPeriod * 1000).unref();
    }
  }
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) { this.store.delete(key); return undefined; }
    return entry.value;
  }
  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.stdTTL;
    this.store.set(key, { value, expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : 0 });
  }
  flushAll(): void { this.store.clear(); }
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt > 0 && entry.expiresAt <= now) this.store.delete(key);
    }
  }
}

function pLimit(maxConcurrency: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];
  const next = () => {
    if (queue.length === 0 || activeCount >= maxConcurrency) return;
    activeCount += 1;
    queue.shift()!();
  };
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      const run = () => fn().then(resolve).catch(reject).finally(() => { activeCount -= 1; next(); });
      activeCount < maxConcurrency ? (activeCount += 1, run()) : queue.push(run);
    });
}

const cache = new SimpleCache<DeepSeekResult>(CACHE_TTL_SECONDS, 600);
const limiter = pLimit(MAX_CONCURRENCY);

interface DeepSeekRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

export interface DeepSeekResult {
  prompt: string;
  text: string | null;
  source: "cache" | "api" | "fallback" | "error";
  provider?: string;
  error?: string;
  tokens?: number;
  costUsd?: number;
}

const costState = { totalRequests: 0, totalTokens: 0, totalCostUsd: 0, lastUpdated: new Date().toISOString() };

function createCacheKey(prompt: string, options: DeepSeekRequestOptions) {
  return crypto.createHash("sha256").update(JSON.stringify({ prompt, ...options })).digest("hex");
}

function parseHourRange(range: string) {
  const parts = range.split("-").map(v => parseInt(v, 10));
  if (parts.length !== 2 || parts.some(v => Number.isNaN(v))) return null;
  return { start: parts[0] % 24, end: parts[1] % 24 };
}

function isOffPeak(): boolean {
  const range = parseHourRange(OFF_PEAK_HOURS);
  if (!range) return false;
  const hour = new Date().getHours();
  return range.start <= range.end ? hour >= range.start && hour < range.end : hour >= range.start || hour < range.end;
}

function buildMessages(prompt: string, systemInstruction: string) {
  const sys = systemInstruction.trim() ||
    "You are a cost-aware CareerVision AI assistant. Answer clearly and concisely.";
  return [{ role: "system", content: sys }, { role: "user", content: prompt }];
}

function extractTextFromResponse(response: any): string {
  const choice = response?.choices?.[0];
  if (choice?.message?.content) return String(choice.message.content).trim();
  if (typeof choice?.text === "string") return choice.text.trim();
  return "";
}

function extractUsage(response: any) {
  const usage = response?.usage || {};
  const totalTokens = Number(usage.total_tokens ?? 0);
  return { tokens: totalTokens, costUsd: Number(usage.total_cost_usd ?? totalTokens * COST_PER_TOKEN_USD) };
}

function updateCostState(tokens: number, costUsd: number) {
  costState.totalRequests += 1;
  costState.totalTokens += tokens;
  costState.totalCostUsd += costUsd;
  costState.lastUpdated = new Date().toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: try a specific provider
// ─────────────────────────────────────────────────────────────────────────────
async function callProvider(
  provider: LLMProvider,
  prompt: string,
  options: Required<DeepSeekRequestOptions>
): Promise<{ text: string; tokens: number; costUsd: number }> {
  if (!provider.apiKey) throw new Error(`No API key configured for provider: ${provider.name}`);

  const url = `${provider.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const body = {
    model: provider.model,
    messages: buildMessages(prompt, options.systemInstruction),
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  };

  const response = await axios.post(url, body, {
    headers: { Authorization: `Bearer ${provider.apiKey}`, "Content-Type": "application/json" },
    timeout: 30000,
  });

  const text = extractTextFromResponse(response.data);
  const usage = extractUsage(response.data);
  updateCostState(usage.tokens, usage.costUsd);
  return { text, tokens: usage.tokens, costUsd: usage.costUsd };
}

// ─────────────────────────────────────────────────────────────────────────────
// Probe: find the first reachable provider (used at startup / health-check)
// ─────────────────────────────────────────────────────────────────────────────
export async function probeProviders(): Promise<LLMProvider | null> {
  const testPrompt = "Say OK";
  const testOptions: Required<DeepSeekRequestOptions> = {
    model: "",
    temperature: 0.1,
    maxTokens: 8,
    systemInstruction: "Reply with just the word OK.",
  };

  for (let i = 0; i < PROVIDERS.length; i++) {
    const provider = PROVIDERS[i];
    if (!provider.apiKey) continue;
    try {
      testOptions.model = provider.model;
      await callProvider(provider, testPrompt, testOptions);
      activeProviderIndex = i;
      activeProviderInfo = provider;
      console.log(`[LLM] Active provider locked: ${provider.label} (${provider.name})`);
      return provider;
    } catch (err) {
      console.warn(`[LLM] Provider ${provider.label} unavailable: ${err instanceof Error ? err.message.slice(0, 120) : err}`);
    }
  }

  console.error("[LLM] All providers failed. No LLM available.");
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-provider rate-limit cooldown tracking
// ─────────────────────────────────────────────────────────────────────────────
const providerCooldowns = new Map<string, number>(); // name → timestamp when usable again

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /status code 429|rate.?limit|too many requests/i.test(msg);
}

function isForbiddenError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /status code 403|status code 401|unauthorized|forbidden/i.test(msg);
}

function markCooldown(providerName: string, ms: number) {
  providerCooldowns.set(providerName, Date.now() + ms);
  console.warn(`[LLM] ${providerName} on cooldown for ${Math.round(ms / 1000)}s`);
}

function isCoolingDown(providerName: string): boolean {
  const until = providerCooldowns.get(providerName) ?? 0;
  return Date.now() < until;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main generation with full fallback chain + rate-limit retry
// ─────────────────────────────────────────────────────────────────────────────
async function generateResponse(prompt: string, options: DeepSeekRequestOptions = {}): Promise<DeepSeekResult> {
  const isOffPeakWindow = isOffPeak();
  const normalizedOptions: Required<DeepSeekRequestOptions> = {
    model: options.model || "",
    temperature: options.temperature ?? 0.4,
    maxTokens: options.maxTokens ?? (isOffPeakWindow ? 1024 : 512),
    systemInstruction: options.systemInstruction || "",
  };

  const cacheKey = createCacheKey(prompt, normalizedOptions);
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, source: "cache" };

  // Determine starting provider index
  const startIdx = activeProviderIndex ?? 0;
  const orderedProviders = [
    ...PROVIDERS.slice(startIdx),
    ...PROVIDERS.slice(0, startIdx),
  ];

  const errors: string[] = [];
  // Track providers that hit 429 so we can retry them after a backoff
  const rateLimitedProviders: Array<{ provider: typeof PROVIDERS[0]; retryAfterMs: number }> = [];

  for (let i = 0; i < orderedProviders.length; i++) {
    const provider = orderedProviders[i];
    if (!provider.apiKey) continue;
    if (isCoolingDown(provider.name)) {
      errors.push(`${provider.label}: cooling down (rate-limited)`);
      continue;
    }

    try {
      const opts = { ...normalizedOptions, model: provider.model };
      const result = await callProvider(provider, prompt, opts);

      if (activeProviderInfo?.name !== provider.name) {
        const globalIdx = PROVIDERS.findIndex(p => p.name === provider.name);
        activeProviderIndex = globalIdx;
        activeProviderInfo = provider;
        console.log(`[LLM] Switched active provider to: ${provider.label}`);
      }

      const response: DeepSeekResult = {
        prompt,
        text: result.text,
        tokens: result.tokens,
        costUsd: result.costUsd,
        source: i === 0 ? "api" : "fallback",
        provider: provider.name,
      };
      cache.set(cacheKey, response, CACHE_TTL_SECONDS);
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${provider.label}: ${msg.slice(0, 200)}`);

      if (isRateLimitError(err)) {
        // Back off: 60s first hit, up to 5 min
        const existing = providerCooldowns.get(provider.name) ?? 0;
        const currentCooldown = Math.max(0, existing - Date.now());
        const backoff = currentCooldown > 0 ? Math.min(currentCooldown * 2, 300_000) : 60_000;
        markCooldown(provider.name, backoff);
        rateLimitedProviders.push({ provider, retryAfterMs: backoff });
        console.warn(`[LLM] ${provider.label} rate-limited, trying next...`);
      } else if (isForbiddenError(err)) {
        // Auth error — long cooldown so we don't keep hitting it
        markCooldown(provider.name, 600_000);
        console.warn(`[LLM] ${provider.label} auth error (403/401), skipping for 10 min`);
      } else {
        console.warn(`[LLM] ${provider.label} failed, trying next...`);
      }
    }
  }

  // All providers failed first pass. If some were rate-limited, wait for the
  // shortest cooldown and retry once.
  if (rateLimitedProviders.length > 0) {
    const shortest = rateLimitedProviders.reduce((a, b) => a.retryAfterMs < b.retryAfterMs ? a : b);
    const waitMs = Math.min(shortest.retryAfterMs, 30_000); // cap retry wait at 30s
    console.log(`[LLM] All providers rate-limited. Waiting ${Math.round(waitMs / 1000)}s then retrying ${shortest.provider.label}...`);
    await new Promise(r => setTimeout(r, waitMs));

    try {
      const opts = { ...normalizedOptions, model: shortest.provider.model };
      const result = await callProvider(shortest.provider, prompt, opts);
      providerCooldowns.delete(shortest.provider.name); // clear cooldown on success
      const response: DeepSeekResult = {
        prompt,
        text: result.text,
        tokens: result.tokens,
        costUsd: result.costUsd,
        source: "fallback",
        provider: shortest.provider.name,
      };
      cache.set(cacheKey, response, CACHE_TTL_SECONDS);
      return response;
    } catch (retryErr) {
      const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
      errors.push(`Retry ${shortest.provider.label}: ${retryMsg.slice(0, 200)}`);
    }
  }

  return { prompt, text: null, source: "error", error: errors.join(" | ") };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export async function generateDeepSeekBatch(prompts: string[], options: DeepSeekRequestOptions = {}): Promise<DeepSeekResult[]> {
  const buckets = chunkArray(prompts, Number(process.env.LLM_BATCH_SIZE || "5"));
  const results: DeepSeekResult[] = [];
  for (const bucket of buckets) {
    const bucketResults = await Promise.all(bucket.map(p => limiter(() => generateResponse(p, options))));
    results.push(...bucketResults);
  }
  return results;
}

export async function generateDeepSeekResponse(prompt: string, options: DeepSeekRequestOptions = {}): Promise<DeepSeekResult> {
  return generateResponse(prompt, options);
}

export function getDeepSeekCostSummary() {
  const provider = getActiveProvider();
  return {
    totalRequests: costState.totalRequests,
    totalTokens: costState.totalTokens,
    totalCostUsd: Number(costState.totalCostUsd.toFixed(8)),
    lastUpdated: costState.lastUpdated,
    cacheTTLSecs: CACHE_TTL_SECONDS,
    provider: provider?.name ?? "none",
    providerLabel: provider?.label ?? "None",
    model: provider?.model ?? "none",
  };
}

export function clearDeepSeekCache() { cache.flushAll(); }

