import axios from "axios";
import pLimit from "p-limit";
import { db } from "../db/database.js";

export type AggregationProvider = "linkedin" | "indeed" | "greenhouse" | "lever" | "remoteok";

export interface AggregatedJob {
  source: AggregationProvider;
  externalJobId: string | null;
  title: string;
  company: string;
  location: string | null;
  workType: "remote" | "hybrid" | "onsite";
  description: string | null;
  requirements: string | null;
  skillsRequired: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  companyCulture: string | null;
  industry: string | null;
  experienceLevel: string | null;
  sourceUrl: string | null;
  postedAt: string;
}

export interface AggregateSyncSummary {
  totalFetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  providerStats: Record<AggregationProvider, { fetched: number; inserted: number; updated: number; skipped: number }>;
}

interface AggregateOptions {
  providers?: AggregationProvider[];
  query?: string;
  location?: string;
  limitPerProvider?: number;
}

const PROVIDER_FEED_ENV: Record<AggregationProvider, string> = {
  linkedin: "JOB_AGGREGATOR_LINKEDIN_URL",
  indeed: "JOB_AGGREGATOR_INDEED_URL",
  greenhouse: "JOB_AGGREGATOR_GREENHOUSE_URL",
  lever: "JOB_AGGREGATOR_LEVER_URL",
  remoteok: "JOB_AGGREGATOR_REMOTEOK_URL",
};

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t ? t : null;
}

function toNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}

function inferWorkType(text: string): "remote" | "hybrid" | "onsite" {
  const t = text.toLowerCase();
  if (/(remote|work from home|wfh|distributed)/.test(t)) return "remote";
  if (/(hybrid|2 days onsite|3 days onsite|partly remote)/.test(t)) return "hybrid";
  return "onsite";
}

function inferSkillsFromText(text: string): string[] {
  const knownSkills = [
    "react", "typescript", "javascript", "node", "python", "java", "go", "rust",
    "aws", "azure", "gcp", "docker", "kubernetes", "sql", "postgres", "mongodb",
    "graphql", "rest", "next.js", "vue", "angular", "tensorflow", "pytorch", "nlp",
  ];
  const lower = text.toLowerCase();
  return knownSkills.filter(skill => lower.includes(skill));
}

function parseRssItems(xml: string): Array<Record<string, string>> {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return items.map(item => {
    const getTag = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? stripHtml(m[1]).trim() : "";
    };
    return {
      title: getTag("title"),
      link: getTag("link"),
      description: getTag("description"),
      pubDate: getTag("pubDate"),
      guid: getTag("guid"),
      company: getTag("author"),
      location: getTag("location"),
    };
  });
}

function safeArray<T = any>(input: any): T[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input?.jobs)) return input.jobs;
  if (Array.isArray(input?.results)) return input.results;
  if (Array.isArray(input?.data)) return input.data;
  if (Array.isArray(input?.positions)) return input.positions;
  return [];
}

function normalizeJsonJob(raw: any, source: AggregationProvider): AggregatedJob | null {
  const title = toText(raw.title || raw.job_title || raw.position || raw.name);
  const company = toText(raw.company || raw.company_name || raw.organization || raw.department) || "Unknown Company";
  if (!title) return null;

  const location = toText(raw.location || raw.city || raw.country || raw.region);
  const desc = toText(raw.description || raw.summary || raw.body || raw.content);
  const req = toText(raw.requirements || raw.qualifications || raw.responsibilities);
  const mergedText = `${title} ${desc || ""} ${req || ""}`;

  const skillsProvided = Array.isArray(raw.skills_required)
    ? raw.skills_required
    : Array.isArray(raw.skills)
      ? raw.skills
      : [];
  const parsedSkills = skillsProvided.map((s: any) => String(s).toLowerCase().trim()).filter(Boolean);
  const inferredSkills = inferSkillsFromText(mergedText);
  const skillsRequired = Array.from(new Set([...parsedSkills, ...inferredSkills])).slice(0, 25);

  const sourceUrl = toText(raw.url || raw.apply_url || raw.link || raw.job_url);
  const externalJobId = toText(raw.id || raw.job_id || raw.external_id || raw.guid);
  const postedAt = toText(raw.posted_at || raw.published_at || raw.created_at || raw.date) || new Date().toISOString();
  const salaryCurrency = toText(raw.salary_currency || raw.currency) || "USD";

  return {
    source,
    externalJobId,
    title,
    company,
    location,
    workType: inferWorkType(`${toText(raw.work_type) || ""} ${location || ""} ${mergedText}`),
    description: desc,
    requirements: req,
    skillsRequired,
    salaryMin: toNum(raw.salary_min || raw.min_salary || raw.compensation_min),
    salaryMax: toNum(raw.salary_max || raw.max_salary || raw.compensation_max),
    salaryCurrency,
    companyCulture: toText(raw.company_culture || raw.culture),
    industry: toText(raw.industry || raw.category),
    experienceLevel: toText(raw.experience_level || raw.seniority || raw.level),
    sourceUrl,
    postedAt,
  };
}

async function fetchProviderJobs(
  provider: AggregationProvider,
  query: string,
  location: string,
  limit: number
): Promise<AggregatedJob[]> {
  const url = process.env[PROVIDER_FEED_ENV[provider]]?.trim();
  if (!url) return [];

  const response = await axios.get(url, {
    params: { q: query, location, limit },
    timeout: 15000,
    validateStatus: status => status >= 200 && status < 400,
  });

  const contentType = String(response.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("xml") || typeof response.data === "string") {
    const xml = typeof response.data === "string" ? response.data : String(response.data);
    const items = parseRssItems(xml).slice(0, limit);
    return items.map(item => normalizeJsonJob(item, provider)).filter(Boolean) as AggregatedJob[];
  }

  const arr = safeArray(response.data).slice(0, limit);
  return arr.map(item => normalizeJsonJob(item, provider)).filter(Boolean) as AggregatedJob[];
}

export async function aggregateJobsFromProviders(options: AggregateOptions = {}): Promise<AggregateSyncSummary> {
  const providers = (options.providers?.length ? options.providers : Object.keys(PROVIDER_FEED_ENV) as AggregationProvider[])
    .filter(Boolean);

  const query = (options.query || "software engineer").trim();
  const location = (options.location || "").trim();
  const limitPerProvider = Math.min(Math.max(options.limitPerProvider || 50, 1), 200);

  const providerStats = Object.fromEntries(
    providers.map(provider => [provider, { fetched: 0, inserted: 0, updated: 0, skipped: 0 }])
  ) as AggregateSyncSummary["providerStats"];

  const limit = pLimit(4);
  const fetchedByProvider = await Promise.all(
    providers.map(provider =>
      limit(async () => {
        try {
          const rows = await fetchProviderJobs(provider, query, location, limitPerProvider);
          providerStats[provider].fetched = rows.length;
          return rows;
        } catch (err) {
          console.error(`[job-aggregation/${provider}] fetch failed`, err);
          return [] as AggregatedJob[];
        }
      })
    )
  );

  const allJobs = fetchedByProvider.flat();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  await db.tx(async t => {
    for (const job of allJobs) {
      const stat = providerStats[job.source];

      if (!job.title || !job.company || (!job.sourceUrl && !job.externalJobId)) {
        skipped += 1;
        stat.skipped += 1;
        continue;
      }

      const existing = job.externalJobId
        ? await t.oneOrNone(
            `SELECT id FROM job_listings WHERE source = $1 AND external_job_id = $2 LIMIT 1`,
            [job.source, job.externalJobId]
          )
        : await t.oneOrNone(
            `SELECT id FROM job_listings WHERE source = $1 AND source_url = $2 LIMIT 1`,
            [job.source, job.sourceUrl]
          );

      if (existing) {
        await t.none(
          `UPDATE job_listings
           SET title = $2,
               company = $3,
               location = $4,
               work_type = $5,
               description = $6,
               requirements = $7,
               skills_required = $8,
               salary_min = $9,
               salary_max = $10,
               salary_currency = $11,
               company_culture = $12,
               industry = $13,
               experience_level = $14,
               source_url = $15,
               external_job_id = $16,
               posted_at = $17,
               is_active = TRUE
           WHERE id = $1`,
          [
            existing.id,
            job.title,
            job.company,
            job.location,
            job.workType,
            job.description,
            job.requirements,
            job.skillsRequired,
            job.salaryMin,
            job.salaryMax,
            job.salaryCurrency,
            job.companyCulture,
            job.industry,
            job.experienceLevel,
            job.sourceUrl,
            job.externalJobId,
            job.postedAt,
          ]
        );
        updated += 1;
        stat.updated += 1;
      } else {
        await t.none(
          `INSERT INTO job_listings
            (title, company, location, work_type, description, requirements,
             skills_required, salary_min, salary_max, salary_currency, company_culture,
             industry, experience_level, source_url, source, external_job_id, posted_at, is_active)
           VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,TRUE)`,
          [
            job.title,
            job.company,
            job.location,
            job.workType,
            job.description,
            job.requirements,
            job.skillsRequired,
            job.salaryMin,
            job.salaryMax,
            job.salaryCurrency,
            job.companyCulture,
            job.industry,
            job.experienceLevel,
            job.sourceUrl,
            job.source,
            job.externalJobId,
            job.postedAt,
          ]
        );
        inserted += 1;
        stat.inserted += 1;
      }
    }
  });

  return {
    totalFetched: allJobs.length,
    inserted,
    updated,
    skipped,
    providerStats,
  };
}
