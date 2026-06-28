import axios from "axios";

export type JobBoardProvider =
  | "linkedin"
  | "indeed"
  | "greenhouse"
  | "lever"
  | "workday"
  | "generic";

export interface JobBoardSubmissionRequest {
  userId: string;
  job: {
    title: string;
    company: string;
    source?: string | null;
    sourceUrl?: string | null;
    externalJobId?: string | null;
    location?: string | null;
  };
  applicant: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  documents: {
    resumeJson?: unknown;
    coverLetter?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface JobBoardSubmissionResult {
  submitted: boolean;
  channel: "api" | "interface" | "none";
  provider: JobBoardProvider;
  externalSubmissionId?: string | null;
  status: "submitted" | "queued" | "failed";
  message: string;
  launchUrl?: string | null;
  responseMeta?: Record<string, unknown>;
}

interface ProviderApiConfig {
  provider: JobBoardProvider;
  endpoint: string | null;
  apiKey: string | null;
}

function toText(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  return value ? value : null;
}

function inferProvider(source: string | null | undefined, sourceUrl: string | null | undefined): JobBoardProvider {
  const src = (source || "").toLowerCase();
  if (src.includes("linkedin")) return "linkedin";
  if (src.includes("indeed")) return "indeed";
  if (src.includes("greenhouse")) return "greenhouse";
  if (src.includes("lever")) return "lever";
  if (src.includes("workday")) return "workday";

  const url = (sourceUrl || "").toLowerCase();
  if (url.includes("linkedin.com")) return "linkedin";
  if (url.includes("indeed.")) return "indeed";
  if (url.includes("greenhouse.io")) return "greenhouse";
  if (url.includes("lever.co")) return "lever";
  if (url.includes("myworkdayjobs.com") || url.includes("workday")) return "workday";

  return "generic";
}

function getProviderConfig(provider: JobBoardProvider): ProviderApiConfig {
  const endpointByProvider: Record<JobBoardProvider, string | null> = {
    linkedin: toText(process.env.JOB_APPLY_LINKEDIN_API_URL),
    indeed: toText(process.env.JOB_APPLY_INDEED_API_URL),
    greenhouse: toText(process.env.JOB_APPLY_GREENHOUSE_API_URL),
    lever: toText(process.env.JOB_APPLY_LEVER_API_URL),
    workday: toText(process.env.JOB_APPLY_WORKDAY_API_URL),
    generic: toText(process.env.JOB_APPLY_GENERIC_API_URL),
  };

  const keyByProvider: Record<JobBoardProvider, string | null> = {
    linkedin: toText(process.env.JOB_APPLY_LINKEDIN_API_KEY),
    indeed: toText(process.env.JOB_APPLY_INDEED_API_KEY),
    greenhouse: toText(process.env.JOB_APPLY_GREENHOUSE_API_KEY),
    lever: toText(process.env.JOB_APPLY_LEVER_API_KEY),
    workday: toText(process.env.JOB_APPLY_WORKDAY_API_KEY),
    generic: toText(process.env.JOB_APPLY_GENERIC_API_KEY),
  };

  return {
    provider,
    endpoint: endpointByProvider[provider],
    apiKey: keyByProvider[provider],
  };
}

async function trySubmitViaApi(
  provider: JobBoardProvider,
  request: JobBoardSubmissionRequest
): Promise<JobBoardSubmissionResult | null> {
  const config = getProviderConfig(provider);
  if (!config.endpoint) return null;

  try {
    const response = await axios.post(
      config.endpoint,
      {
        provider,
        mode: "api",
        application: request,
      },
      {
        timeout: 25000,
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        validateStatus: status => status >= 200 && status < 500,
      }
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Provider API returned HTTP ${response.status}`);
    }

    const data = (response.data || {}) as Record<string, unknown>;
    return {
      submitted: true,
      channel: "api",
      provider,
      externalSubmissionId: toText(data.externalSubmissionId) || toText(data.applicationId),
      status: "submitted",
      message: toText(data.message) || `Application submitted via ${provider} API gateway.`,
      launchUrl: toText(data.launchUrl) || request.job.sourceUrl || null,
      responseMeta: {
        httpStatus: response.status,
      },
    };
  } catch (err) {
    console.error(`[job-board-submission/${provider}] API submission failed`, err);
    return null;
  }
}

async function trySubmitViaInterfaceAutomation(
  provider: JobBoardProvider,
  request: JobBoardSubmissionRequest
): Promise<JobBoardSubmissionResult | null> {
  const automationUrl = toText(process.env.JOB_APPLY_INTERFACE_AUTOMATION_URL);
  if (!automationUrl) return null;

  try {
    const response = await axios.post(
      automationUrl,
      {
        provider,
        mode: "interface",
        application: request,
      },
      {
        timeout: 35000,
        headers: {
          "Content-Type": "application/json",
          ...(process.env.JOB_APPLY_INTERFACE_AUTOMATION_KEY
            ? { "x-automation-key": process.env.JOB_APPLY_INTERFACE_AUTOMATION_KEY }
            : {}),
        },
        validateStatus: status => status >= 200 && status < 500,
      }
    );

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Interface automation returned HTTP ${response.status}`);
    }

    const data = (response.data || {}) as Record<string, unknown>;
    const queued = Boolean(data.queued);
    return {
      submitted: true,
      channel: "interface",
      provider,
      externalSubmissionId: toText(data.externalSubmissionId) || toText(data.jobRunId),
      status: queued ? "queued" : "submitted",
      message: toText(data.message) || (queued
        ? `Application queued for interface automation (${provider}).`
        : `Application submitted via ${provider} interface automation.`),
      launchUrl: toText(data.launchUrl) || request.job.sourceUrl || null,
      responseMeta: {
        httpStatus: response.status,
        queued,
      },
    };
  } catch (err) {
    console.error(`[job-board-submission/${provider}] interface automation failed`, err);
    return null;
  }
}

export async function submitJobBoardApplication(
  request: JobBoardSubmissionRequest
): Promise<JobBoardSubmissionResult> {
  const provider = inferProvider(request.job.source, request.job.sourceUrl);

  const apiResult = await trySubmitViaApi(provider, request);
  if (apiResult) return apiResult;

  const interfaceResult = await trySubmitViaInterfaceAutomation(provider, request);
  if (interfaceResult) return interfaceResult;

  return {
    submitted: false,
    channel: "none",
    provider,
    status: "failed",
    message: "No job-board API or interface automation gateway is configured for this provider.",
    launchUrl: request.job.sourceUrl || null,
    responseMeta: {
      provider,
      configuredApi: Boolean(getProviderConfig(provider).endpoint),
      configuredInterface: Boolean(toText(process.env.JOB_APPLY_INTERFACE_AUTOMATION_URL)),
    },
  };
}
