import { aggregateJobsFromProviders, type AggregateSyncSummary, type AggregationProvider } from "./jobAggregationService.js";

interface RunOptions {
  providers?: AggregationProvider[];
  query?: string;
  location?: string;
  limitPerProvider?: number;
}

export interface JobAggregationSchedulerMetrics {
  enabled: boolean;
  running: boolean;
  baseIntervalMs: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  lastDurationMs: number | null;
  consecutiveFailures: number;
  retries: number;
  nextRunAt: string | null;
  lastSummary: AggregateSyncSummary | null;
}

let timer: NodeJS.Timeout | null = null;

const metrics: JobAggregationSchedulerMetrics = {
  enabled: false,
  running: false,
  baseIntervalMs: 30 * 60 * 1000,
  lastRunAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  lastDurationMs: null,
  consecutiveFailures: 0,
  retries: 0,
  nextRunAt: null,
  lastSummary: null,
};

function getBaseIntervalMs(): number {
  const env = Number.parseInt(process.env.JOB_AGGREGATION_INTERVAL_MINUTES || "30", 10);
  const mins = Number.isFinite(env) ? Math.min(Math.max(env, 5), 120) : 30;
  return mins * 60 * 1000;
}

function jitter(ms: number): number {
  const spread = Math.round(ms * 0.15);
  return ms + Math.round((Math.random() * spread * 2) - spread);
}

function computeBackoffMs(baseInterval: number, failures: number): number {
  const maxBackoff = 60 * 60 * 1000;
  const expo = Math.min(maxBackoff, baseInterval * Math.pow(2, Math.min(failures, 5)));
  return Math.max(60_000, jitter(expo));
}

function scheduleNext(delayMs: number, options: RunOptions) {
  if (timer) clearTimeout(timer);
  metrics.nextRunAt = new Date(Date.now() + delayMs).toISOString();
  timer = setTimeout(() => {
    void runCycle(options);
  }, delayMs);
}

async function runCycle(options: RunOptions) {
  const startedAt = Date.now();
  metrics.running = true;
  metrics.lastRunAt = new Date().toISOString();

  try {
    const summary = await aggregateJobsFromProviders(options);
    metrics.lastSummary = summary;
    metrics.lastSuccessAt = new Date().toISOString();
    metrics.lastErrorMessage = null;
    metrics.consecutiveFailures = 0;
    metrics.retries = 0;

    const nextMs = metrics.baseIntervalMs;
    metrics.lastDurationMs = Date.now() - startedAt;
    metrics.running = false;
    scheduleNext(nextMs, options);
  } catch (err: any) {
    metrics.lastErrorAt = new Date().toISOString();
    metrics.lastErrorMessage = err?.message || "Unknown aggregation scheduler error";
    metrics.consecutiveFailures += 1;
    metrics.retries += 1;

    const nextMs = computeBackoffMs(metrics.baseIntervalMs, metrics.consecutiveFailures);
    metrics.lastDurationMs = Date.now() - startedAt;
    metrics.running = false;
    scheduleNext(nextMs, options);
  }
}

export function startJobAggregationScheduler(options: RunOptions = {}) {
  const enabled = process.env.JOB_AGGREGATION_SCHEDULE_ENABLED !== "false";
  metrics.enabled = enabled;
  metrics.baseIntervalMs = getBaseIntervalMs();

  if (!enabled || timer) return;

  const initialDelayMs = Number.parseInt(process.env.JOB_AGGREGATION_INITIAL_DELAY_MS || "15000", 10);
  scheduleNext(Math.max(1000, initialDelayMs), options);
}

export function stopJobAggregationScheduler() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  metrics.running = false;
  metrics.nextRunAt = null;
}

export function getJobAggregationSchedulerMetrics(): JobAggregationSchedulerMetrics {
  return { ...metrics };
}

export async function runJobAggregationNow(options: RunOptions = {}): Promise<AggregateSyncSummary> {
  const startedAt = Date.now();
  metrics.running = true;
  metrics.lastRunAt = new Date().toISOString();
  try {
    const summary = await aggregateJobsFromProviders(options);
    metrics.lastSummary = summary;
    metrics.lastSuccessAt = new Date().toISOString();
    metrics.lastErrorMessage = null;
    metrics.consecutiveFailures = 0;
    metrics.retries = 0;
    metrics.lastDurationMs = Date.now() - startedAt;
    return summary;
  } catch (err: any) {
    metrics.lastErrorAt = new Date().toISOString();
    metrics.lastErrorMessage = err?.message || "Unknown aggregation run-now error";
    metrics.consecutiveFailures += 1;
    metrics.retries += 1;
    metrics.lastDurationMs = Date.now() - startedAt;
    throw err;
  } finally {
    metrics.running = false;
  }
}
