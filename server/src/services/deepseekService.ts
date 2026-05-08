import axios from "axios";
import crypto from "crypto";

const API_KEY = process.env.DEESEEK_API_KEY;
const GATEWAY_URL = process.env.LLM_GATEWAY_URL || "https://api.deepseek.com/v1";
const DEFAULT_MODEL = process.env.LLM_MODEL || "deepseek-v4-flash";
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
  private checkPeriodMs: number;

  constructor(private stdTTL: number = 0, checkPeriod: number = 600) {
    this.checkPeriodMs = checkPeriod * 1000;
    if (this.stdTTL > 0) {
      setInterval(() => this.cleanup(), this.checkPeriodMs).unref();
    }
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.stdTTL;
    const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : 0;
    this.store.set(key, { value, expiresAt });
  }

  flushAll(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt > 0 && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

function pLimit(maxConcurrency: number) {
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (queue.length === 0 || activeCount >= maxConcurrency) return;
    activeCount += 1;
    const resolve = queue.shift();
    if (resolve) resolve();
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
      const run = () => {
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            activeCount -= 1;
            next();
          });
      };

      if (activeCount < maxConcurrency) {
        activeCount += 1;
        run();
      } else {
        queue.push(run);
      }
    });
  };
}

const cache = new SimpleCache<DeepSeekResult>(CACHE_TTL_SECONDS, 600);
const limiter = pLimit(MAX_CONCURRENCY);

interface DeepSeekRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface DeepSeekResult {
  prompt: string;
  text: string | null;
  source: "cache" | "api" | "error";
  error?: string;
  tokens?: number;
  costUsd?: number;
}

interface CostSummary {
  totalRequests: number;
  totalTokens: number;
  totalCostUsd: number;
  lastUpdated: string;
  cacheTTLSecs: number;
  provider: string;
  model: string;
}

const costState = {
  totalRequests: 0,
  totalTokens: 0,
  totalCostUsd: 0,
  lastUpdated: new Date().toISOString(),
};

function createCacheKey(prompt: string, options: DeepSeekRequestOptions) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify({ prompt, ...options }));
  return hash.digest("hex");
}

function parseHourRange(range: string) {
  const parts = range.split("-").map((value) => parseInt(value, 10));
  if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) {
    return null;
  }
  return { start: parts[0] % 24, end: parts[1] % 24 };
}

function isOffPeak(): boolean {
  const range = parseHourRange(OFF_PEAK_HOURS);
  if (!range) return false;

  const hour = new Date().getHours();
  if (range.start <= range.end) {
    return hour >= range.start && hour < range.end;
  }

  return hour >= range.start || hour < range.end;
}

function normalizeOptions(options: DeepSeekRequestOptions = {}): Required<DeepSeekRequestOptions> {
  const isOffPeakWindow = isOffPeak();
  return {
    model: options.model || DEFAULT_MODEL,
    temperature: options.temperature ?? 0.4,
    maxTokens: options.maxTokens ?? (isOffPeakWindow ? 1024 : 512),
  };
}

function buildRequestBody(prompt: string, options: Required<DeepSeekRequestOptions>) {
  return {
    model: options.model,
    messages: [
      {
        role: "system",
        content:
          "You are a cost-aware EasyCareer AI assistant. Answer clearly and concisely, and keep output sizes optimized when possible.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  };
}

function getRequestUrl() {
  return `${GATEWAY_URL.replace(/\/+$/u, "")}/chat/completions`;
}

function extractTextFromResponse(response: any): string {
  if (!response?.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
    return "";
  }

  const firstChoice = response.choices[0];

  if (firstChoice.message?.content) {
    return String(firstChoice.message.content).trim();
  }

  if (typeof firstChoice.text === "string") {
    return firstChoice.text.trim();
  }

  return "";
}

function extractUsage(response: any) {
  const usage = response?.usage || {};
  const totalTokens = Number(usage.total_tokens ?? 0);
  const costUsd = Number(usage.total_cost_usd ?? totalTokens * COST_PER_TOKEN_USD);
  return {
    tokens: totalTokens,
    costUsd,
  };
}

function updateCostState(tokens: number, costUsd: number) {
  costState.totalRequests += 1;
  costState.totalTokens += tokens;
  costState.totalCostUsd += costUsd;
  costState.lastUpdated = new Date().toISOString();
}

async function callDeepSeek(prompt: string, options: Required<DeepSeekRequestOptions>) {
  if (!API_KEY) {
    throw new Error("Missing DEESEEK_API_KEY environment variable");
  }

  const url = getRequestUrl();
  const body = buildRequestBody(prompt, options);

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    timeout: 30000,
  });

  const text = extractTextFromResponse(response.data);
  const usage = extractUsage(response.data);

  updateCostState(usage.tokens, usage.costUsd);

  return {
    text,
    tokens: usage.tokens,
    costUsd: usage.costUsd,
  };
}

async function generateResponse(prompt: string, options: DeepSeekRequestOptions = {}): Promise<DeepSeekResult> {
  const normalizedOptions = normalizeOptions(options);
  const cacheKey = createCacheKey(prompt, normalizedOptions);
  const cached = cache.get(cacheKey);

  if (cached) {
    return {
      ...cached,
      source: "cache",
    };
  }

  try {
    const result = await callDeepSeek(prompt, normalizedOptions);
    const response: DeepSeekResult = {
      prompt,
      text: result.text,
      tokens: result.tokens,
      costUsd: result.costUsd,
      source: "api",
    };

    cache.set(cacheKey, response, CACHE_TTL_SECONDS);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown DeepSeek error";
    const errorResponse: DeepSeekResult = {
      prompt,
      text: null,
      source: "error",
      error: message,
    };
    return errorResponse;
  }
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function generateDeepSeekBatch(
  prompts: string[],
  options: DeepSeekRequestOptions = {}
): Promise<DeepSeekResult[]> {
  const normalizedOptions = normalizeOptions(options);
  const buckets = chunkArray(prompts, Number(process.env.LLM_BATCH_SIZE || "5"));
  const results: DeepSeekResult[] = [];

  for (const bucket of buckets) {
    const bucketPromises = bucket.map((prompt) =>
      limiter(() => generateResponse(prompt, normalizedOptions))
    );
    const bucketResults = await Promise.all(bucketPromises);
    results.push(...bucketResults);
  }

  return results;
}

export async function generateDeepSeekResponse(
  prompt: string,
  options: DeepSeekRequestOptions = {}
): Promise<DeepSeekResult> {
  return generateResponse(prompt, options);
}

export function getDeepSeekCostSummary(): CostSummary {
  return {
    totalRequests: costState.totalRequests,
    totalTokens: costState.totalTokens,
    totalCostUsd: Number(costState.totalCostUsd.toFixed(8)),
    lastUpdated: costState.lastUpdated,
    cacheTTLSecs: CACHE_TTL_SECONDS,
    provider: process.env.LLM_PROVIDER || "deepseek",
    model: process.env.LLM_MODEL || DEFAULT_MODEL,
  };
}

export function clearDeepSeekCache() {
  cache.flushAll();
}
