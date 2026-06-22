import { generateDeepSeekResponse, type DeepSeekResult } from "./deepseekService.js";
import { DeepSeekCostCalculator, type DeepSeekCostCalculatorOptions, type MonthlyCostUsage, type MonthlyCostResult } from "./costCalculator.js";
import { db } from "../db/database.js";
import {
  getCachedCareerHub,
  saveCachedCareerHub,
  getCachedInstitutions,
  getCachedInstitutionsByQuery,
  saveCachedInstitutions,
  getCachedStudyMaterialsByCareer,
  saveCachedStudyMaterials,
  getCachedTopCareers,
  saveCachedTopCareers,
  getCachedCountryCareers,
  saveCountryCareersCache,
  invalidateCountryCareersCache,
  getCachedMilestones,
  saveMilestonesCache,
  getCachedHubSearch,
  saveHubSearchCache,
  getCachedDashboardIntel,
  saveDashboardIntelCache,
  getCachedSkillGap,
  saveSkillGapCache,
  getCachedScholarships,
  saveScholarshipsCache,
  getAiCache,
  setAiCache,
  type CountryCareerEntry,
  type CachedMilestone,
} from "../db/marketCache.js";
import type {
  FundingOpportunity,
  UserProfile,
  CareerPath,
  StudyMaterial,
  JobListing,
  Institution,
  MarketInsights,
  CareerHubIntelligence,
  DashboardIntelligence,
  CareerSkillGap,
} from "../types/career";

/** Strip markdown code fences (```json ... ``` or ``` ... ```) from LLM responses */
function extractJSON(raw: string | null | undefined): string {
  if (!raw) return "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return raw.trim();
}

const CAREER_PROFILES: Record<string, {
  required_skills: string[];
  certifications: string[];
  salary_range: {
    entry: number;
    senior: number;
    principal: number;
  };
  growth_rate: string;
  visa_sponsorship: string;
}> = {
  "AI Engineer": {
    required_skills: ["Python", "PyTorch", "LLM fine-tuning", "RAG"],
    certifications: ["AWS Certified AI Practitioner ($150)", "DeepLearning.AI TensorFlow Developer Professional Certificate ($49/mo)"],
    salary_range: { entry: 120000, senior: 220000, principal: 350000 },
    growth_rate: "+32% annually",
    visa_sponsorship: "High (85% for L1-A/H1-B)"
  },
  "Full-Stack Developer": {
    required_skills: ["JavaScript", "TypeScript", "React", "Node.js", "AWS"],
    certifications: ["AWS Certified Developer – Associate ($150)", "Google Professional Cloud Developer ($200)"],
    salary_range: { entry: 90000, senior: 140000, principal: 190000 },
    growth_rate: "+22% annually",
    visa_sponsorship: "Medium-High (70% for H1-B/TN)"
  },
  "Cybersecurity Analyst": {
    required_skills: ["Network Security", "SIEM", "Incident Response", "Cloud Security"],
    certifications: ["CompTIA Security+ ($376)", "Certified Information Systems Security Professional (CISSP) ($749)"] ,
    salary_range: { entry: 85000, senior: 130000, principal: 180000 },
    growth_rate: "+28% annually",
    visa_sponsorship: "Medium (65% for H1-B, limited for TN)"
  },
  "Biotech Researcher": {
    required_skills: ["Molecular Biology", "Data Analysis", "CRISPR", "Regulatory Compliance"],
    certifications: ["Certified Clinical Research Professional ($1000)", "GLP/GMP Training ($299)"],
    salary_range: { entry: 80000, senior: 130000, principal: 200000 },
    growth_rate: "+18% annually",
    visa_sponsorship: "Medium (70% for H1-B, dependent on research institution)"
  }
};

const CACHEABLE_SYSTEM_PREFIX = `
You are CareerVision AI, an expert career guidance system with the following fixed parameters:

[DATA_SOURCES]
- IPEDS (Integrated Postsecondary Education Data System) - real-time
- O*NET OnLine - occupational database
- Bureau of Labor Statistics - 2026 projections
- Global immigration pathways (L1-A, H1-B, TN, Global Talent Visa)

[CORE_RULES]
1. Always provide specific timelines in months (3, 6, 9, 12)
2. Include exact certification names and costs
3. Show salary progression in USD
4. Highlight visa sponsorship probability as percentage
5. Estimate skill gap closure hours
6. Provide ROI calculation (cost vs. expected salary increase)
7. Always end with 3 immediate action items

[OUTPUT_FORMAT]
### Executive Summary
[2 sentences]

### 3-Month Sprint
- Technical skills: [list]
- Certifications: [names + cost]
- Project portfolio: [specific projects]
- Expected outcome: [measurable result]

### 6-Month Sprint
- [same structure]

### 12-Month Sprint
- [same structure]

### Financial Projection
- Investment required: $X
- Expected salary (Year 1): $X
- Expected salary (Year 3): $X
- ROI period: X months

### Immigration Assessment (if target location specified)
- Visa type: [L1-A/H1-B/TN/etc]
- Sponsorship likelihood: X%
- Employer requirements: [list]

### Immediate Actions (next 7 days)
1. [action with estimated hours]
2. [action with estimated hours]
3. [action with estimated hours]
`;

interface DeepSeekRequest {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

function buildSkillGapFallback(profile: UserProfile, careerTitle: string): CareerSkillGap[] {
  const normalizedCareer = careerTitle.toLowerCase();
  const interestSet = new Set<string>((profile.interests || []).map((interest: string) => interest.toLowerCase()));
  const educationText = (profile.education || "").toLowerCase();
  const skillPool = normalizedCareer.includes("ai") || normalizedCareer.includes("machine")
    ? ["Python", "Data Analysis", "Machine Learning", "System Design"]
    : normalizedCareer.includes("data")
      ? ["SQL", "Data Visualization", "Statistics", "Python"]
      : normalizedCareer.includes("design")
        ? ["Portfolio Development", "User Research", "Figma", "Communication"]
        : ["Communication", "Problem Solving", "Digital Literacy", "Project Planning"];

  return skillPool.map((skill, index) => {
    const normalizedSkill = skill.toLowerCase();
    const owned = interestSet.has(normalizedSkill)
      || Array.from(interestSet).some((interest: string) => normalizedSkill.includes(interest) || interest.includes(normalizedSkill))
      || (index === 0 && /(computer|engineering|science|technology)/.test(educationText));

    return {
      skill,
      owned,
      demand: 90 - index * 7,
    };
  });
}

function buildSalaryTrajectoryFallback(primaryCareerId: string): { y: string; v: number }[] {
  const profile = CAREER_PROFILES[primaryCareerId];
  const start = profile?.salary_range.entry ?? 60000;
  const end = profile?.salary_range.principal ?? profile?.salary_range.senior ?? start + 40000;
  const step = Math.max(5000, Math.round((end - start) / 5));

  return [22, 23, 24, 25, 26, 27].map((year, index) => ({
    y: String(year),
    v: Math.round(start + step * index),
  }));
}

function parseAIJson<T>(text: string | null | undefined): T | null {
  if (!text) return null;
  let cleaned = text.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonMatch = cleaned.match(/(\[.*\]|\{.*\})/s);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.warn("parseAIJson failed:", error);
    return null;
  }
}

function isInsufficientBalanceError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return /status\s*402|insufficient balance|402/i.test(message);
}

// Simple concurrency limiter: allow at most 1 concurrent LLM call to avoid provider rate limits
let _llmQueueHead: Promise<void> = Promise.resolve();
async function callLLM(prompt: string, systemInstruction: string, options: DeepSeekRequest = {}) {
  // Chain onto the current queue so requests run sequentially
  let _result!: DeepSeekResult;
  _llmQueueHead = _llmQueueHead.then(async () => {
    _result = await generateDeepSeekResponse(prompt, { ...options, systemInstruction });
  }).catch(async () => {
    _result = await generateDeepSeekResponse(prompt, { ...options, systemInstruction });
  });
  await _llmQueueHead;
  const result = _result;

  if (result.source === "error") {
    const errorMessage = result.error || "LLM request failed";
    const error = new Error(errorMessage);
    if (isInsufficientBalanceError(error)) {
      error.name = "InsufficientBalanceError";
    }
    throw error;
  }

  return result.text ?? "";
}

export async function aiSearchStudyMaterials(query: string): Promise<StudyMaterial[]> {
  const systemInstruction = `You are Spark.E, a Global Career Academy Librarian. 
  The user is searching for study materials. 
  1. Analyze the query: "${query}".
  2. If the query matches existing local materials, suggest them.
  3. If not, synthesize 2-3 REAL, high-quality global resources (from YouTube, Coursera, MIT OpenCourseWare, etc.) that would help the user.
  4. Return the result in a valid JSON array of StudyMaterial objects.
  
  StudyMaterial Schema:
  {
    "id": "string",
    "title": "string",
    "type": "video" | "audio" | "course" | "article",
    "provider": "string",
    "url": "string (valid URL)",
    "careerId": "string (best fit)",
    "duration": "string",
    "thumbnail": "string (use high quality Unsplash URL: https://images.unsplash.com/photo-...)",
    "region": "Global",
    "language": "English",
    "rating": number (4.0 - 5.0),
    "skillLevel": "Beginner" | "Intermediate" | "Advanced",
    "description": "string",
    "tags": ["string"]
  }`;

  const prompt = `Search for materials matching: ${query}`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.7 });
    const results = parseAIJson<any[]>(text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Search Failed:", error);
    return [];
  }
}

export async function aiSearchJobs(query: string, location: string): Promise<JobListing[]> {
  const systemInstruction = `You are Spark.E, a Global Career Recruiter. Return ONLY a valid JSON array. No markdown, no explanation, no code fences.`;

  const prompt = `Find 6 current (2026) job listings for: "${query}" in "${location}".

Return a JSON array of 6 job objects matching this exact schema:
{
  "id": "<unique string like search-1>",
  "title": "<specific job title>",
  "company": "<real company name>",
  "location": "<City, Country>",
  "type": "<Full-time|Part-time|Contract|Remote|Hybrid>",
  "careerId": "${query}",
  "salary": { "min": <USD integer>, "max": <USD integer>, "currency": "USD", "period": "yearly" },
  "postedAt": "<ISO date within last 14 days from 2026-06-16>",
  "description": "<2 sentence job summary>",
  "url": "<LinkedIn or Indeed job search URL — e.g. https://www.linkedin.com/jobs/search/?keywords=TITLE&location=LOCATION with values URL-encoded>"
}
Output ONLY the JSON array.`;

  try {
    const llmResult = await generateDeepSeekResponse(prompt, {
      systemInstruction,
      temperature: 0.5,
      maxTokens: 2000,
    });

    if (llmResult.source === 'error' || !llmResult.text) {
      const cached = await getAiCache<JobListing[]>(`jobs:${query}:${location}`);
      return cached || [];
    }

    const results = parseAIJson<any[]>(llmResult.text);
    if (!Array.isArray(results) || results.length === 0) {
      const cached = await getAiCache<JobListing[]>(`jobs:${query}:${location}`);
      return cached || [];
    }

    const normalized = results.map((j, i) => ({
      ...j,
      id: j.id || `search-job-${i + 1}`,
      url: ensureJobPortalUrl(j.url || j.applyUrl, j.title, j.location),
      postedAt: j.postedAt || j.postedDate || new Date(Date.now() - Math.random() * 14 * 86400000).toISOString(),
      salary: {
        min: j.salary?.min || 60000,
        max: j.salary?.max || 100000,
        currency: j.salary?.currency || 'USD',
        period: j.salary?.period || 'yearly',
      },
    })) as JobListing[];

    // Persist to DB for future fallback (6h TTL — jobs go stale fast)
    setAiCache(`jobs:${query}:${location}`, normalized, 6).catch(() => {});
    return normalized;
  } catch (error) {
    console.error('AI Job Search Failed:', error);
    const cached = await getAiCache<JobListing[]>(`jobs:${query}:${location}`).catch(() => null);
    return cached || [];
  }
}

export async function aiSearchInstitutions(
  query: string,
  profile: UserProfile
): Promise<Institution[]> {
  const systemInstruction = `You are Spark.E, an elite Global Admissions Intelligence Engine.
CRITICAL: Output ONLY a valid JSON array. No markdown, no code fences, no explanations, no extra text.

Schema for each institution:
{
  "id": "unique-id",
  "name": "Institution Name",
  "location": "City, Country",
  "city": "City",
  "country": "Country",
  "type": "University" | "Vocational" | "Polytechnic" | "Medical School" | "Business School",
  "programs": ["Program 1", "Program 2"],
  "avgCost": 5000,
  "ranking": 150,
  "image": "https://images.unsplash.com/photo-xxxxx?w=800&q=80",
  "applicationDeadline": "2026-12-31",
  "website": "https://www.example.edu",
  "allowsInternationalStudents": true,
  "visaSupport": "Full",
  "coordinates": {"lat": 40.1, "lng": -74.2},
  "costOfLivingIndex": 75
}`;

  // Detect if the query contains a location/country keyword — used to skip cache hits from wrong regions
  const COUNTRY_KEYWORDS = [
    'china', 'chinese', 'uk', 'united kingdom', 'england', 'usa', 'united states', 'america',
    'canada', 'australia', 'germany', 'german', 'france', 'french', 'japan', 'japanese',
    'india', 'indian', 'singapore', 'dubai', 'uae', 'korea', 'korean', 'brazil', 'mexico',
    'netherlands', 'sweden', 'norway', 'switzerland', 'spain', 'italy', 'portugal', 'russia',
    'pakistan', 'bangladesh', 'malaysia', 'indonesia', 'thailand', 'turkey', 'egypt', 'nigeria',
  ];
  const queryLower = query.toLowerCase();
  const detectedLocationKeyword = COUNTRY_KEYWORDS.find(k => queryLower.includes(k));

  // Map common query words to the country name used in DB
  const KEYWORD_TO_COUNTRY: Record<string, string> = {
    china: 'China', chinese: 'China',
    'uk': 'United Kingdom', 'united kingdom': 'United Kingdom', england: 'United Kingdom',
    usa: 'United States', 'united states': 'United States', america: 'United States',
    canada: 'Canada', australia: 'Australia', germany: 'Germany', german: 'Germany',
    france: 'France', french: 'France', japan: 'Japan', japanese: 'Japan',
    india: 'India', indian: 'India', singapore: 'Singapore', dubai: 'UAE', uae: 'UAE',
    korea: 'South Korea', korean: 'South Korea',
  };
  const requiredCountry = detectedLocationKeyword ? KEYWORD_TO_COUNTRY[detectedLocationKeyword] : null;

  const prompt = `Find REAL, top-ranked institutions matching this search:
Query: "${query}"
User Profile:
- Current Country: ${profile.country}
- Target Career: ${profile.targetCareerId || profile.targetCareer || "Technology"}
- Budget: $${profile.budget || 50000}/year
- Interests: ${profile.interests?.slice(0, 5).join(", ") || "General"}
- Preferred Location: ${profile.targetLocation || "Global"}

CRITICAL GEOGRAPHIC RULE:
${requiredCountry
  ? `The query explicitly mentions "${requiredCountry}". ALL returned institutions MUST be physically located in ${requiredCountry}. Do NOT include any institution from another country. Returning a university outside ${requiredCountry} is incorrect.`
  : 'Match institutions to the query intent. If the query implies a specific country or city, return institutions from that location.'}

Instructions:
1. Return 6-8 REAL institutions from reputable global rankings (QS, Times Higher Ed, NIRF)
2. Match the user's budget, interests, and career goals — return institutions that OFFER programmes directly related to the query
3. Verify programmes, costs, coordinates, and websites are accurate for the correct country
4. For China: Include Peking University, Tsinghua, Fudan, Zhejiang, SJTU, Nanjing, HKUST, NUS (if Hong Kong/Singapore query)
5. For India (engineering/tech): Include IIT Delhi, IIT Bombay, IISc, Delhi University, BITS Pilani
   For India (pharmacy): Include Jamia Hamdard, BITS Pilani, JSS College of Pharmacy, NIPER Hyderabad/Mohali, ICT Mumbai, Manipal College of Pharmaceutical Sciences, SRM IST
   For India (medicine/MBBS): Include AIIMS Delhi, CMC Vellore, AFMC Pune, JIPMER, Maulana Azad Medical College
   For India (law): Include NLU Delhi, NLU Mumbai, Symbiosis Law School, Jindal Global Law School
   For India (business/MBA): Include IIM Ahmedabad, IIM Bangalore, IIM Calcutta, XLRI, ISB Hyderabad
6. For UK: Include Oxford, Cambridge, Imperial, UCL, Edinburgh
7. For USA: Include MIT, Stanford, Harvard, Caltech, Carnegie Mellon

Output: Valid JSON array ONLY. Start with [ and end with ].`;

  try {
    // Only use cache if it contains institutions from the required country
    const cachedInstitutions = await getCachedInstitutionsByQuery(requiredCountry || query);
    if (cachedInstitutions && cachedInstitutions.length > 0) {
      const countryFiltered = requiredCountry
        ? cachedInstitutions.filter((i: any) => i.country?.toLowerCase().includes(requiredCountry.toLowerCase()))
        : cachedInstitutions;
      if (countryFiltered.length > 0) {
        return countryFiltered as Institution[];
      }
      // Cache had wrong country — fall through to LLM
    }

    const text = await callLLM(prompt, systemInstruction, { temperature: 0.5, maxTokens: 2500 });
    const results = parseAIJson<Institution[]>(text);

    if (Array.isArray(results) && results.length > 0) {
      // Validate results have required fields
      let validResults = results.filter(r =>
        r.name && r.country && r.type && Array.isArray(r.programs) && r.programs.length > 0
      );

      // If a country was explicitly detected in the query, reject results from wrong countries
      if (requiredCountry && validResults.length > 0) {
        const countryMatched = validResults.filter(r =>
          r.country?.toLowerCase().includes(requiredCountry.toLowerCase()) ||
          r.location?.toLowerCase().includes(requiredCountry.toLowerCase())
        );
        if (countryMatched.length === 0) {
          console.warn(`aiSearchInstitutions: LLM ignored geographic constraint (wanted ${requiredCountry}, got ${validResults.map(r => r.country).join(', ')}). Trying DB stale cache.`);
          const stale = await getCachedInstitutionsByQuery(requiredCountry || query);
          return (stale as Institution[]) || [];
        }
        validResults = countryMatched;
      }

      if (validResults.length > 0) {
        await saveCachedInstitutions(validResults).catch((err) =>
          console.warn("Failed to cache AI institution search results:", err)
        );
        return validResults;
      }
    }

    // LLM returned empty — try any stale DB record for this query
    console.warn("AI Institution Search returned invalid results, checking DB stale cache");
    const staleDb = await getCachedInstitutionsByQuery(requiredCountry || query);
    return (staleDb as Institution[]) || [];
  } catch (error) {
    console.error("AI Institution Search Failed:", error);
    const staleDb = await getCachedInstitutionsByQuery(requiredCountry || query).catch(() => null);
    return (staleDb as Institution[]) || [];
  }
}

export async function getAiJobSuggestions(profile: UserProfile): Promise<JobListing[]> {
  const career = profile.targetCareerId || 'software engineer';
  const location = profile.targetLocation || profile.country || 'USA';

  const systemInstruction = `You are Spark.E, a Career Opportunity Analyst. Generate 10 highly relevant real-world job openings. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const prompt = `Generate 10 current (2026) job listings for:
- Career Target: ${career}
- Location: ${location}
- Education: ${profile.education || 'Bachelor\'s Degree'}
- Expected Salary: $${profile.budget || 60000}/yr

Return a JSON array of exactly 10 job objects matching this schema exactly:
{
  "id": "<unique string like job-1>",
  "title": "<specific job title>",
  "company": "<real company name e.g. Google, Amazon, Deloitte, KPMG, Shopify>",
  "location": "<City, Country>",
  "type": "<Full-time|Part-time|Contract|Remote|Hybrid>",
  "careerId": "${career}",
  "salary": { "min": <integer USD>, "max": <integer USD>, "currency": "USD", "period": "yearly" },
  "postedAt": "<ISO date string within the last 30 days from 2026-06-16>",
  "description": "<2-sentence job summary>",
  "url": "<LinkedIn or Indeed search URL — use https://www.linkedin.com/jobs/search/?keywords=JOBTITLE&location=LOCATION or https://www.indeed.com/jobs?q=JOBTITLE&l=LOCATION with real values URL-encoded>"
}

IMPORTANT for the url field: Use real job search portal URLs. Examples:
- LinkedIn: https://www.linkedin.com/jobs/search/?keywords=Software+Engineer&location=New+York
- Indeed: https://www.indeed.com/jobs?q=Data+Analyst&l=London
- Glassdoor: https://www.glassdoor.com/Job/jobs.htm?sc.keyword=Product+Manager&locT=C&locId=1

Output ONLY the JSON array. No extra text.`;

  try {
    // Bypass the serial queue so this call doesn't wait behind other concurrent LLM calls
    const llmResult = await generateDeepSeekResponse(prompt, {
      systemInstruction,
      temperature: 0.4,
      maxTokens: 3000,
    });

    if (llmResult.source === 'error' || !llmResult.text) {
      console.warn('getAiJobSuggestions: LLM failed:', llmResult.error);
console.warn('getAiJobSuggestions: LLM failed, checking DB cache:', llmResult.error);
    const cached = await getAiCache<JobListing[]>(`jobs:${career}:${location}`);
    return cached || [];
  }

  const results = parseAIJson<any[]>(llmResult.text);
  if (!Array.isArray(results) || results.length === 0) {
    const cached = await getAiCache<JobListing[]>(`jobs:${career}:${location}`);
    return cached || [];
    }

    // Normalize fields and ensure url is always a usable job portal link
    return results.map((j, i) => ({
      ...j,
      id: j.id || `ai-job-${i + 1}`,
      url: ensureJobPortalUrl(j.url || j.applyUrl, j.title, j.location),
      postedAt: j.postedAt || j.postedDate || new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
      salary: {
        min: j.salary?.min || 60000,
        max: j.salary?.max || 100000,
        currency: j.salary?.currency || 'USD',
        period: j.salary?.period || 'yearly',
      },
    })) as JobListing[];
  } catch (error) {
    console.error('AI Job Suggestions Failed:', error);
    const cached = await getAiCache<JobListing[]>(`jobs:${career}:${location}`).catch(() => null);
    return cached || [];
  }
}

/** Ensures the URL is a real job portal search link, not a made-up company URL */
function ensureJobPortalUrl(url: string | undefined, title: string, location: string): string {
  if (url && /linkedin\.com\/jobs|indeed\.com\/jobs|glassdoor\.com\/Job|reed\.co\.uk|seek\.com|monster\.com/i.test(url)) {
    return url;
  }
  // Build a LinkedIn search URL from the job title and location
  const encodedTitle = encodeURIComponent(title || 'Software Engineer');
  const encodedLocation = encodeURIComponent(location || 'Remote');
  return `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}&location=${encodedLocation}`;
}


export async function getAiInstitutionRecommendations(
  profile: UserProfile,
  careerTitle: string
): Promise<{ institution: Institution; rationale: string }[]> {
  const systemInstruction = `You are Spark.E, a Global Admissions Strategist.
Return ONLY valid JSON. No markdown, no explanation, no lists outside JSON.
Recommend 3 real institutions or training programs for the user based on the target career title.`;
  const prompt = `Provide 3 institution recommendations for a user targeting: ${careerTitle}
Profile:
- Country: ${profile.country}
- Target career: ${profile.targetCareer || profile.targetCareerId || "undecided"}
- Budget: $${profile.budget ?? 0}/year
- Interests: ${profile.interests?.join(", ") || "N/A"}
- Target location: ${profile.targetLocation || "Global"}

Return an array of 3 objects only.
Each object must include an "institution" field with valid Institution schema values, and a "rationale" field.
The output must be valid JSON with no markdown, no code fences, no explanation.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.4, maxTokens: 1200 });
    const results = parseAIJson<{ institution: Institution; rationale: string }[]>(text);
    if (!Array.isArray(results)) {
      console.warn("AI Institution Recommendations returned non-array or invalid JSON:", text);
      return [];
    }
    return results;
  } catch (error) {
    console.error("AI Institution Recommendations Failed:", error);
    return [];
  }
}

export async function getAiProactiveJobRecommendations(profile: UserProfile, savedJobs: JobListing[]): Promise<JobListing[]> {
  const systemInstruction = `You are Spark.E, a proactive career recommendations engine. Use the saved jobs list to identify 4 new roles that represent good next steps or growth opportunities for the user. Return valid JSON only.`;
  const prompt = `Saved jobs:
${JSON.stringify(savedJobs, null, 2)}
User profile:
${JSON.stringify(profile, null, 2)}`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.4, maxTokens: 1200 });
    const results = parseAIJson<JobListing[]>(text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Proactive Job Recommendations Failed:", error);
    return [];
  }
}

export async function getMarketInsights(careerId: string, country: string): Promise<MarketInsights | null> {
  // 24-hour cache keyed by career + country
  const cacheKey = `marketinsights:${careerId}:${country}`;
  const cached = await getCachedDashboardIntel(cacheKey);
  if (cached) {
    console.log("✓ Market Insights served from cache:", cacheKey);
    return cached as MarketInsights;
  }

  const systemInstruction = `You are Spark.E, a global market insight analyst. Provide salary benchmarks, growth trends, in-demand skills, and top employers for the given career in the given country. Return only valid JSON.`;
  const prompt = `Career: ${careerId}
Country: ${country}`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 1200 });
    const result = parseAIJson<MarketInsights>(text) ?? null;
    if (result) saveDashboardIntelCache(cacheKey, result).catch(() => {});
    return result;
  } catch (error) {
    console.error("Market Insights Failed:", error);
    return null;
  }
}

export async function getTopGlobalCareers(): Promise<CareerPath[]> {
  const cached = await getCachedTopCareers();
  if (cached && cached.length >= 10) {
    console.log(`[Careers] Serving ${cached.length} paths from DB cache`);
    return cached as CareerPath[];
  }

  const systemInstruction = `You are an AI Career Strategist for the 2026 global job market. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Generate exactly 10 of the highest-growth, most in-demand global career paths for 2026.

Return a JSON array of exactly 10 objects with career data including id, title, description, growth, category, subCategory, workType, tags, and milestones.

Rules:
- Exactly 10 careers, varied across sectors (min 4 different categories)
- All growth values must be "high"
- Each career must have exactly 4 milestones
- Use 2026 job market data — prioritize AI, Climate, Health, FinTech, Cybersecurity, Biotech roles
- Milestones must be age-appropriate and progressively build on each other`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 3000 });
    const careers: CareerPath[] = parseAIJson<CareerPath[]>(text) ?? [];

    if (!Array.isArray(careers) || careers.length === 0) return [];

    saveCachedTopCareers(careers).catch((err) =>
      console.warn("[Careers] Cache save failed (non-blocking):", err)
    );

    console.log(`[Careers] Fetched ${careers.length} paths from AI and queued DB cache save`);
    return careers;
  } catch (error: any) {
    if (error?.message?.includes("429")) {
      console.warn("[Careers] Quota hit — returning empty list");
    } else {
      console.error("[Careers] AI fetch failed:", error);
    }
    return [];
  }
}

export async function aiSearchCareerPaths(query: string): Promise<CareerPath[]> {
  const systemInstruction = `You are an AI Career Strategist for 2026. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `The user searched for: "${query}"

Generate exactly 10 highly relevant career paths for 2026 that match this search.

Return a JSON array of exactly 10 career objects with all required fields.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 3000 });
    const parsed = parseAIJson<CareerPath[]>(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    console.error("[CareerSearch] AI search failed:", error);
    throw error;
  }
}

export async function getDynamicInstitutions(
  profile: UserProfile,
  careerId: string,
  targetLocation: string
): Promise<Institution[]> {
  // Cache key uses both country + career category so pharmacy≠engineering
  const cacheLocation = targetLocation === 'Global' ? '' : targetLocation;
  const careerSlug = careerId.split(' ').slice(0, 2).join('-').toLowerCase();
  const cacheKey = cacheLocation ? `${cacheLocation}-${careerSlug}` : careerSlug;

  const cached = cacheLocation
    ? await getCachedInstitutions(cacheKey)
    : await getCachedInstitutionsByQuery(careerSlug);
  if (cached && cached.length > 0) {
    return cached as Institution[];
  }

  const locationDesc = targetLocation === 'Global' ? 'worldwide (mix of USA, UK, Germany, Singapore, Canada, Australia)' : targetLocation;

  // Determine which field of study the career belongs to for targeted recommendations
  const careerLower = careerId.toLowerCase();
  const fieldHint = /pharmac/i.test(careerLower) ? 'Pharmacy / Pharmaceutical Sciences' :
    /doctor|physician|medical|mbbs|medicine|surgeon/i.test(careerLower) ? 'Medicine / Medical Sciences' :
    /nurs/i.test(careerLower) ? 'Nursing / Healthcare' :
    /dent/i.test(careerLower) ? 'Dentistry' :
    /law|legal|advocate|barrister|solicitor/i.test(careerLower) ? 'Law / Legal Studies' :
    /mba|business|management|finance|account|econom/i.test(careerLower) ? 'Business / Management' :
    /architect/i.test(careerLower) ? 'Architecture' :
    /psych/i.test(careerLower) ? 'Psychology' :
    /education|teach/i.test(careerLower) ? 'Education / Teaching' :
    /journal|media|communication/i.test(careerLower) ? 'Journalism / Mass Communication' :
    /design|fashion|art|creative/i.test(careerLower) ? 'Design / Fine Arts' :
    'Science, Technology & Engineering';

  const systemInstruction = `You are an expert global education consultant.
Return ONLY valid JSON array. No markdown, no explanation, no extra text.
Recommend 10 REAL institutions that offer STRONG programmes in: ${fieldHint}.
Use actual, existing institutions with real websites, real rankings, and accurate coordinates.
Schema per object: {"id":"string","name":"string","location":"string","city":"string","country":"string","type":"University","programs":["string"],"avgCost":number,"ranking":number,"image":"","applicationDeadline":"string","website":"string","allowsInternationalStudents":true,"visaSupport":"Full","coordinates":{"lat":number,"lng":number},"costOfLivingIndex":1.0}`;

  const prompt = `Return a JSON array of exactly 10 REAL top-ranked institutions for the field of "${fieldHint}" (career: "${careerId}").
Location: ${locationDesc}
Budget: $${profile.budget || 30000}/year
Student origin: ${profile.country || 'any'}

${/india/i.test(targetLocation) ? `INDIA-SPECIFIC: For Pharmacy in India, prioritise: Jamia Hamdard, BITS Pilani (Pharmacy), JSS College of Pharmacy, NIPER (Hyderabad/Mohali/Ahmedabad), Manipal College of Pharmaceutical Sciences, ICT Mumbai, SRM IST, Panjab University, Amrita School of Pharmacy.
For Medicine in India: AIIMS Delhi, AFMC Pune, CMC Vellore, JIPMER, Maulana Azad Medical College.
For Engineering in India: IIT Delhi, IIT Bombay, IISc, BITS Pilani, NIT Trichy.` : ''}

Rules:
1. ALL institutions must offer programmes directly related to "${fieldHint}"
2. Include real programme names (e.g. "B.Pharm", "M.Pharm", "PharmD" for pharmacy)
3. avgCost must be realistic (Indian colleges: $1000-$8000/year; US: $20000-$70000)
4. All coordinates must be real lat/lng numbers for the institution's actual city
5. ranking must reflect QS/NIRF/THE ranking for that specific field
6. website must be the real official website URL

Output ONLY the JSON array. Start with [ and end with ].`;

  try {
    // Use generateDeepSeekResponse directly — bypasses slow shared queue
    const llmResult = await generateDeepSeekResponse(prompt, {
      systemInstruction,
      temperature: 0.3,
      maxTokens: 3000,
    });

    if (llmResult.source === 'error' || !llmResult.text) {
      console.warn('[DynamicInstitutions] LLM failed, checking DB stale cache for', careerId, targetLocation);
    const stale = await getCachedInstitutions(cacheKey).catch(() => null);
    return (stale as Institution[]) || [];
  }

  const institutions = parseAIJson<Institution[]>(llmResult.text);
  const result = Array.isArray(institutions) ? institutions.filter(i => i.name && i.country && i.coordinates).slice(0, 10) : [];

  if (result.length > 0) {
    await saveCachedInstitutions(result).catch((err) =>
      console.warn('Failed to cache institutions (non-blocking):', err)
    );
    return result;
  }

  // LLM returned empty / invalid — try DB stale cache
  console.warn('[DynamicInstitutions] LLM returned empty result, checking DB stale cache');
  const staleResult = await getCachedInstitutions(cacheKey).catch(() => null);
  return (staleResult as Institution[]) || [];
  } catch (error) {
  console.error('Get Dynamic Institutions Error:', error);
  const staleResult = await getCachedInstitutions(cacheKey).catch(() => null);
  return (staleResult as Institution[]) || [];
  }
}

export async function getDynamicStudyMaterials(
  careerId: string,
  skillLevel: string,
  region: string
): Promise<StudyMaterial[]> {
  const cached = await getCachedStudyMaterialsByCareer(careerId);
  if (cached && cached.length > 0) {
    return cached as StudyMaterial[];
  }

  const systemInstruction = `You are a learning curator. Return ONLY a valid JSON array. No markdown, no explanation.
Find REAL study materials from Coursera, edX, MIT OpenCourseWare, YouTube, Udemy, LinkedIn Learning, freeCodeCamp, Khan Academy.
Schema per object: {"id":"string","title":"string","type":"video|course|article","provider":"string","url":"string","careerId":"string","duration":"string","thumbnail":"","region":"Global","language":"English","rating":4.5,"skillLevel":"Beginner|Intermediate|Advanced","description":"string","tags":[]}`;

  const prompt = `Return a JSON array of 10 real, current (2024-2026) study materials for: Career=${careerId}, Level=${skillLevel}, Region=${region}.
Include a mix of free and paid resources. Use actual URLs from the named providers. Output ONLY the JSON array.`;

  try {
    // Use generateDeepSeekResponse directly to bypass the shared sequential queue
    // so this doesn't wait behind dashboard/jobs/market calls
    const llmResult = await generateDeepSeekResponse(prompt, {
      systemInstruction,
      temperature: 0.5,
      maxTokens: 3000,
    });

    if (llmResult.source === "error" || !llmResult.text) {
      console.warn("getDynamicStudyMaterials: LLM failed, checking DB stale cache. Error:", llmResult.error);
    const stale = await getAiCache<StudyMaterial[]>(`materials:${careerId}:${skillLevel}:${region}`);
    return stale || [];
  }

  const materials = parseAIJson<any[]>(llmResult.text);
  const result = Array.isArray(materials) ? materials.slice(0, 10) : [];

  if (result.length > 0) {
    // Save to both the DB materials table (career UUID FK) and generic AI cache (by career name)
    await saveCachedStudyMaterials(result, careerId).catch(() => {});
    await setAiCache(`materials:${careerId}:${skillLevel}:${region}`, result, 48).catch(() => {});
    return result;
  }

  // LLM returned empty — check DB stale cache
  console.warn("getDynamicStudyMaterials: LLM returned empty array, checking DB stale cache");
  const stale = await getAiCache<StudyMaterial[]>(`materials:${careerId}:${skillLevel}:${region}`);
  return stale || [];
  } catch (error) {
  console.error("Get Dynamic Materials Error:", error);
  const stale = await getAiCache<StudyMaterial[]>(`materials:${careerId}:${skillLevel}:${region}`).catch(() => null);
  return stale || [];
  }
}

export async function getCareerHubIntelligence(city: string, country: string): Promise<any> {
  const cached = await getCachedCareerHub(city, country);
  if (cached) {
    console.log("✓ Using cached career hub data for:", city, country);
    return cached;
  }

  const systemInstruction = `You are a global career market intelligence engine. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const prompt = `Analyze the 2026 job market for ${city}, ${country}.

Return EXACTLY this JSON object (no extra fields, no nulls):
{
  "city": "${city}",
  "country": "${country}",
  "intensity": <integer 0-100, market activity level>,
  "marketHealthScore": <integer 0-100>,
  "hiringTrends": "<1-2 sentence summary of current hiring trends>",
  "visaOpenness": "<exactly one of: High | Medium | Low>",
  "costOfLiving": <decimal e.g. 1.4 where 1.0 = global average>,
  "remoteWorkPercentage": <integer 0-100>,
  "internshipOpportunities": <integer count per year estimate>,
  "averageSalaryRange": { "min": <USD integer>, "max": <USD integer>, "currency": "USD" },
  "topEmployers": ["Company1", "Company2", "Company3", "Company4", "Company5"],
  "topCareers": [
    {
      "title": "<job title>",
      "demandScore": <integer 0-100>,
      "jobGrowth": <integer percentage>,
      "openings": <integer>,
      "avgSalary": { "entry": <USD integer>, "mid": <USD integer>, "senior": <USD integer>, "currency": "USD" }
    }
  ],
  "requiredSkills": [
    { "skill": "<skill name>", "demand": <integer 0-100> }
  ]
}

topCareers must have exactly 5 entries. requiredSkills must have exactly 6 entries. All salary values in USD integers.`;

  try {
    const text = await callLLM(prompt, systemInstruction, {
      temperature: 0.1,
      maxTokens: 1500,
    });
    const hubData = parseAIJson<any>(text);
    if (!hubData || typeof hubData !== 'object') {
      console.error("Career Hub Intelligence: failed to parse LLM response for", city, country);
      return null;
    }

    // Ensure required fields are present with sane defaults
    const result = {
      city: String(hubData.city || city),
      country: String(hubData.country || country),
      intensity: Math.min(100, Math.max(0, Number(hubData.intensity) || 60)),
      marketHealthScore: Math.min(100, Math.max(0, Number(hubData.marketHealthScore) || 60)),
      hiringTrends: String(hubData.hiringTrends || "Active hiring across tech and business sectors."),
      visaOpenness: ["High", "Medium", "Low"].includes(hubData.visaOpenness) ? hubData.visaOpenness : "Medium",
      costOfLiving: Number(hubData.costOfLiving) || 1.0,
      remoteWorkPercentage: Math.min(100, Math.max(0, Number(hubData.remoteWorkPercentage) || 40)),
      internshipOpportunities: Number(hubData.internshipOpportunities) || 500,
      averageSalaryRange: {
        min: Number(hubData.averageSalaryRange?.min) || 40000,
        max: Number(hubData.averageSalaryRange?.max) || 120000,
        currency: String(hubData.averageSalaryRange?.currency || "USD"),
      },
      topEmployers: Array.isArray(hubData.topEmployers) ? hubData.topEmployers.slice(0, 5).map(String) : [],
      topCareers: Array.isArray(hubData.topCareers) ? hubData.topCareers.slice(0, 5).map((c: any) => ({
        title: String(c.title || ""),
        demandScore: Math.min(100, Math.max(0, Number(c.demandScore) || 70)),
        jobGrowth: Number(c.jobGrowth) || 10,
        openings: Number(c.openings) || 1000,
        avgSalary: {
          entry: Number(c.avgSalary?.entry) || 50000,
          mid: Number(c.avgSalary?.mid) || 75000,
          senior: Number(c.avgSalary?.senior) || 110000,
          currency: "USD",
        },
      })) : [],
      requiredSkills: Array.isArray(hubData.requiredSkills) ? hubData.requiredSkills.slice(0, 8).map((s: any) => ({
        skill: String(s.skill || ""),
        demand: Math.min(100, Math.max(0, Number(s.demand) || 70)),
      })) : [],
    };

    saveCachedCareerHub(result).catch((err) =>
      console.warn("Failed to cache career hub data:", err)
    );

    return result;
  } catch (error) {
    console.error("Career Hub Intelligence Error:", error);
    return null;
  }
}

export async function aiSearchCareerHubs(query: string): Promise<{ city: string; country: string }[]> {
  const queryKey = query.trim().toLowerCase().replace(/\s+/g, '-');

  // Check cache first
  const cached = await getCachedHubSearch(queryKey);
  if (cached && cached.length > 0) {
    console.log(`[HubSearch] Serving "${query}" from cache`);
    return cached;
  }

  const systemInstruction = `You are a global career intelligence engine. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `The user is searching for career hubs: "${query}".
Return 5 real global cities that best match this query as a JSON array:
[{ "city": "string", "country": "string" }]
Use only real cities with well-known job markets. No explanations.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 300 });
    const results = parseAIJson<{ city: string; country: string }[]>(text);
    if (!Array.isArray(results) || results.length === 0) return [];
    const cleaned = results.filter(r => r.city && r.country).map(r => ({
      city: String(r.city),
      country: String(r.country),
    }));
    // Cache the search results
    saveHubSearchCache(queryKey, cleaned).catch(err =>
      console.warn("[HubSearch] Cache save failed:", err)
    );
    return cleaned;
  } catch (error) {
    console.error("AI Career Hub Search Error:", error);
    return [];
  }
}

export async function getDashboardIntelligence(
  profile: UserProfile,
  primaryCareerId: string
): Promise<DashboardIntelligence | null> {
  // Cache-first: 24-hour TTL keyed by career + country + target
  const cacheKey = `dashboard:${primaryCareerId}:${profile.country || 'global'}:${profile.targetLocation || ''}`;
  const cached = await getCachedDashboardIntel(cacheKey);
  if (cached) {
    console.log("✓ Dashboard Intelligence served from cache:", cacheKey);
    return cached as DashboardIntelligence;
  }

  const systemInstruction = `You are Spark.E, a precision career analytics engine. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const prompt = `Analyze this user profile and return a comprehensive dashboard intelligence object.

User profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Education: ${profile.education}
- Interests: ${profile.interests?.join(", ")}
- Country: ${profile.country}
- Target Location: ${profile.targetLocation || profile.country}
- Target Career: ${primaryCareerId}
- GPA: ${profile.academicPerformance?.gpa ?? "N/A"}

Return EXACTLY this JSON structure with the required fields:
{
  "readiness": {
    "overall": <integer 0-100>,
    "skills": <integer 0-100>,
    "education": <integer 0-100>,
    "experience": <integer 0-100>
  },
  "nextActions": [
    {
      "title": "<specific actionable task>",
      "impact": "<+X% readiness or descriptive outcome>",
      "type": "<learn|build|practice>",
      "urgent": <true|false>
    }
  ],
  "sectors": [
    {
      "name": "<sector>",
      "trend": "<+XX%>",
      "score": <integer 0-100>,
      "status": "<Hot|Rising|Stable|Emerging>",
      "color": "<hex color>",
      "spark": [{ "v": <int> }, { "v": <int> }, { "v": <int> }, { "v": <int> }, { "v": <int> }, { "v": <int> }],
      "news": ["<real 2026 market headline>", "<real 2026 market headline>"]
    }
  ],
  "salaryTrajectory": [
    { "y": "22", "v": <integer USD annual> },
    { "y": "23", "v": <integer USD annual> },
    { "y": "24", "v": <integer USD annual> },
    { "y": "25", "v": <integer USD annual> },
    { "y": "26", "v": <integer USD annual> },
    { "y": "27", "v": <integer USD annual> }
  ]
}

Rules:
- salaryTrajectory must include 6 objects covering 2022-2027.
- nextActions must contain exactly 3 recommendations.
- sectors must contain exactly 4 sector objects.
- Return valid JSON only, with no markdown, no text outside the JSON object.`;

  try {
    const text = await callLLM(prompt, systemInstruction, {
      temperature: 0.1,
      maxTokens: 1200,
    });

    const parsed = parseAIJson<DashboardIntelligence>(text);
    if (!parsed) {
      console.warn("Dashboard Intelligence parse failed, using fallback salary trajectory", text);
      return {
        readiness: {
          overall: 50,
          skills: 50,
          education: 50,
          experience: 50,
        },
        nextActions: [],
        sectors: [],
        salaryTrajectory: buildSalaryTrajectoryFallback(primaryCareerId),
      };
    }

    if (!Array.isArray(parsed.salaryTrajectory) || parsed.salaryTrajectory.length === 0) {
      console.warn("Dashboard Intelligence missing salaryTrajectory, applying fallback", text);
      parsed.salaryTrajectory = buildSalaryTrajectoryFallback(primaryCareerId);
    } else {
      parsed.salaryTrajectory = parsed.salaryTrajectory.map((item) => ({
        y: String(item?.y ?? ""),
        v: Number(item?.v ?? 0) || 0,
      }));
    }

    // Save to cache (non-blocking)
    saveDashboardIntelCache(cacheKey, parsed).catch(() => {});
    return parsed;
  } catch (error) {
    console.error("Dashboard Intelligence Error:", error);
    return null;
  }
}

export async function getCareerSkillGap(
  profile: UserProfile,
  careerTitle: string
): Promise<CareerSkillGap[]> {
  // Cache-first: 7-day TTL keyed by career + education level
  const cacheKey = `skillgap:${careerTitle}:${profile.education || 'any'}:${profile.country || 'global'}`;
  const cached = await getCachedSkillGap(cacheKey);
  if (cached && cached.length > 0) {
    console.log("✓ Skill Gap served from cache:", cacheKey);
    return cached as CareerSkillGap[];
  }

  const systemInstruction = `You are a career skills analyst. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Analyze the skill gap for this user targeting "${careerTitle}".

User profile:
- Education: ${profile.education}
- Interests: ${profile.interests?.join(", ")}

Return a JSON array of exactly 4 skill objects with: skill (string), owned (boolean), demand (integer 0-100).`;

  try {
    const text = await callLLM(prompt, systemInstruction, {
      temperature: 0.1,
      maxTokens: 400,
    });
    const parsed = parseAIJson<any>(text) ?? [];

    let result: any[] = Array.isArray(parsed) ? parsed : Object.values(parsed).find(Array.isArray) || [];

    const skills: CareerSkillGap[] = result
      .filter((s: any) => s && typeof s.skill === "string")
      .slice(0, 4)
      .map((s: any) => ({
        skill: s.skill,
        owned: Boolean(s.owned),
        demand: Math.min(100, Math.max(0, Number(s.demand) || 75)),
      }));

    if (skills.length === 0) throw new Error("Empty skill gap response");

    // Save to cache (non-blocking)
    saveSkillGapCache(cacheKey, skills).catch(() => {});
    return skills;
  } catch (error) {
    if (isInsufficientBalanceError(error)) {
      console.warn("Career Skill Gap LLM unavailable due to insufficient balance, using fallback skill gap.", error);
    } else {
      console.error("Career Skill Gap Error:", error);
    }
    return buildSkillGapFallback(profile, careerTitle);
  }
}

export async function getCareerAdvice(
  prompt: string,
  profile: UserProfile,
  additionalContext: { resume?: string; linkedIn?: string } = {}
): Promise<string> {

  const targetCareerKey = profile.targetCareer || profile.targetCareerId || "Unknown Career";
  const careerProfile = CAREER_PROFILES[targetCareerKey] || null;
  const cacheableCareerData = careerProfile ? JSON.stringify(careerProfile) : "null";

  const userSpecificPrompt = `
Now analyze for this specific user:

Current Role: ${profile.currentRole || 'N/A'}
Target Career: ${targetCareerKey}
Age: ${profile.age ?? 'N/A'}
Education: ${profile.education || 'N/A'}
Budget: $${profile.budget ?? 'N/A'}
Target Location: ${profile.targetLocation || 'N/A'}
Timeline: ${profile.timeline || 'N/A'}
Current Skills: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : profile.skills?.join(', ') || 'N/A'}
${additionalContext.resume ? `Resume: ${additionalContext.resume}` : ''}
${additionalContext.linkedIn ? `LinkedIn: ${additionalContext.linkedIn}` : ''}

User Request: ${prompt}

Generate personalized roadmap following the exact format above.
`;

  const fullPrompt = `
[CAREER_PROFILE]
${cacheableCareerData}

[USER_DATA]
${userSpecificPrompt}`;

  try {
    const result = await callLLM(fullPrompt, CACHEABLE_SYSTEM_PREFIX, {
      temperature: 0.7,
      maxTokens: 1200,
    });
    return result || "I'm sorry, I couldn't generate advice right now.";
  } catch (error) {
    console.error("Career Advice Error:", error);
    return "I'm sorry, I couldn't generate career advice right now.";
  }
}

export async function getCareerAdviceBatch(
  requests: Array<{ prompt: string; profile: UserProfile; additionalContext?: { resume?: string; linkedIn?: string } }>
): Promise<string[]> {
  const prompts = requests.map((request, index) => {
    const targetCareerKey = request.profile.targetCareer || request.profile.targetCareerId || "Unknown Career";
    const careerProfile = CAREER_PROFILES[targetCareerKey] || null;
    const cacheableCareerData = JSON.stringify(careerProfile);

    return `User ${index + 1}:\n[CAREER_PROFILE]\n${cacheableCareerData}\n\n[USER_DATA]\nCurrent Role: ${request.profile.currentRole || 'N/A'}\nTarget Career: ${targetCareerKey}\nAge: ${request.profile.age ?? 'N/A'}\nEducation: ${request.profile.education || 'N/A'}\nBudget: $${request.profile.budget ?? 'N/A'}\nTarget Location: ${request.profile.targetLocation || 'N/A'}\nTimeline: ${request.profile.timeline || 'N/A'}\nCurrent Skills: ${Array.isArray(request.profile.interests) ? request.profile.interests.join(', ') : request.profile.skills?.join(', ') || 'N/A'}\n${request.additionalContext?.resume ? `Resume: ${request.additionalContext.resume}` : ''}\n${request.additionalContext?.linkedIn ? `LinkedIn: ${request.additionalContext.linkedIn}` : ''}\n\nUser Request: ${request.prompt}`;
  });

  const fullPrompt = `\n${CACHEABLE_SYSTEM_PREFIX}\n\nAnalyze these ${requests.length} users together (batch processing):\n\n${prompts.join("\\n\\n---\\n\\n")}\n\nGenerate individual roadmaps for each user following the exact format above.\nReturn a JSON array of strings, one roadmap per user, in the same order as the users listed.\n`;

  try {
    const text = await callLLM(fullPrompt, CACHEABLE_SYSTEM_PREFIX, {
      temperature: 0.7,
      maxTokens: 10000,
    });
    const parsed = parseAIJson<string[]>(text);
    if (!Array.isArray(parsed)) {
      throw new Error("Batch response was not a JSON array");
    }
    return parsed.map((item) => String(item));
  } catch (error) {
    console.error("Career Advice Batch Error:", error);
    throw error;
  }
}

export function estimateDeepSeekCost(
  usage: MonthlyCostUsage,
  options: DeepSeekCostCalculatorOptions = {}
): MonthlyCostResult {
  const calculator = new DeepSeekCostCalculator(options);
  return calculator.calculateMonthlyCost(usage);
}

export async function matchScholarships(profile: UserProfile): Promise<any[]> {
  const cacheKey = `scholarships:${profile.country || 'global'}:${profile.targetCareerId || 'any'}:${profile.education || 'any'}`;

  // Cache-first: 24-hour TTL
  const cached = await getCachedScholarships(cacheKey);
  if (cached && cached.length > 0) {
    console.log("✓ Scholarships served from cache:", cacheKey);
    return cached;
  }

  const systemInstruction = `You are a global scholarship and funding expert. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Find 8 real scholarships, grants, and funding opportunities for this student in 2026:

Student profile:
- From: ${profile.country || 'any country'}
- Target Career: ${profile.targetCareerId || 'technology'}
- Education Level: ${profile.education || 'High School'}
- Target Location: ${profile.targetLocation || profile.country || 'global'}
- Budget: $${profile.budget || 30000}/year
- GPA: ${profile.academicPerformance?.gpa ?? 'N/A'}

Return a JSON array of exactly 8 real, current funding opportunities. Each object must follow this schema exactly:
{
  "id": "<unique-string>",
  "name": "<real scholarship/grant name>",
  "provider": "<real organization>",
  "type": "<Scholarship|Grant|Fellowship>",
  "category": "<stem|arts|merit|need-based|international|research>",
  "amount": <number in USD>,
  "deadline": "<ISO date string within next 12 months>",
  "matchScore": <integer 60-99>,
  "matchReasoning": "<2-sentence explanation of why this matches the student>",
  "terms": "<brief eligibility requirement>",
  "website": "<real URL>"
}

Include a mix of merit-based, need-based, and international opportunities. Use real 2026 deadlines and accurate award amounts.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.3, maxTokens: 2000 });
    const parsed = parseAIJson<any[]>(text);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.warn("matchScholarships: LLM returned no results");
      return [];
    }

    const result = parsed
      .filter(opp => opp && typeof opp.name === 'string')
      .slice(0, 8)
      .map((opp, i) => ({
        id: opp.id || `scholarship-${i}-${Date.now()}`,
        name: opp.name,
        provider: opp.provider || 'Unknown',
        type: ['Scholarship', 'Grant', 'Fellowship'].includes(opp.type) ? opp.type : 'Scholarship',
        category: opp.category || 'merit',
        amount: Number(opp.amount) || 5000,
        deadline: opp.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        matchScore: Math.min(99, Math.max(60, Number(opp.matchScore) || 75)),
        matchReasoning: opp.matchReasoning || `This ${(opp.type || 'scholarship').toLowerCase()} aligns with your profile and education goals.`,
        terms: opp.terms || '',
        website: opp.website || '',
      }));

    // Save to cache (non-blocking)
    saveScholarshipsCache(cacheKey, result).catch(() => {});
    return result;
  } catch (error) {
    console.error("Match Scholarships LLM Error:", error);
    throw error; // propagate so the route can return a 503 with retry-after header
  }
}

export async function getRecommendedCourses(sector: string): Promise<any[]> {
  const systemInstruction = `You are an AI Educational Curator. Recommend the top online and blended courses for the provided sector in 2026. Return ONLY valid JSON.`;
  const prompt = `Provide 8 high-quality course recommendations for the sector: ${sector}. Include title, provider, type, duration, reason, and institution details.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.3, maxTokens: 1200 });
    return parseAIJson<any[]>(text) ?? [];
  } catch (error) {
    console.error("Recommended Courses Error:", error);
    return [];
  }
}

export async function generateCoverLetter(
  institution: any,
  userProfile: UserProfile,
  highlights: string
): Promise<string> {
  const systemInstruction = `You are an AI Admissions Consultant. Write a personalized, professional cover letter based on the student's profile, target institution, and provided highlights.`;
  const prompt = `Institution: ${institution.name}, ${institution.city}, ${institution.country}
Programs: ${institution.programs?.join(", ") || 'N/A'}
User: ${userProfile.name}, ${userProfile.education || 'N/A'}, interests: ${userProfile.interests || 'N/A'}
Highlights: ${highlights}`;

  try {
    return await callLLM(prompt, systemInstruction, { temperature: 0.7, maxTokens: 1200 });
  } catch (error) {
    console.error("Cover Letter Error:", error);
    return "I could not generate a cover letter at this time. Please try again later.";
  }
}

export async function getLatestCareerNews(preferredCountry?: string): Promise<{ career: string; country: string; aiTech: string }[]> {
  const systemInstruction = `You are an AI News Curator for CareerVision 2026. Return ONLY valid JSON.`;
  const prompt = preferredCountry
    ? `Generate 5 short news flash items focused on career demand and AI technology for ${preferredCountry}.`
    : `Generate 5 short news flash items for career demand and AI technology worldwide.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 600 });
    return parseAIJson<any[]>(text) ?? [];
  } catch (error) {
    console.error("Latest Career News Error:", error);
    return [
      { career: "AI Systems Architect", country: "United States", aiTech: "Gemini 4.0 Ultra" },
      { career: "Renewable Energy Specialist", country: "Germany", aiTech: "Fusion-Core Logic" },
      { career: "Quantum Cryptographer", country: "Singapore", aiTech: "Neural-Link GPT-X" },
      { career: "Cyber-Physical Auditor", country: "South Korea", aiTech: "Blue-Sense V2" },
      { career: "Clean-Tech Engineer", country: "Norway", aiTech: "Solaris Prime" },
    ];
  }
}

export async function getVisaGuidance(
  profile: UserProfile,
  targetCountry: string,
  targetCareer: string,
  institution?: { name: string; city?: string; country?: string; type?: string; programs?: string[] }
): Promise<any> {
  const homeCountry = profile.citizenCountry || profile.country || 'Unknown';
  const institutionContext = institution
    ? `\nTarget institution: ${institution.name}${institution.city ? ` (${institution.city})` : ''}${institution.type ? `, type: ${institution.type}` : ''}${institution.programs?.length ? `, programs: ${institution.programs.slice(0, 3).join(', ')}` : ''}`
    : '';

  const systemInstruction = `You are an expert immigration advisor specialising in student and work visas. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const prompt = `Generate a detailed, real-time visa guidance package for the following person:

Applicant profile:
- Name: ${profile.name || 'Applicant'}
- Home/citizen country: ${homeCountry}
- Education level: ${profile.education || 'Not specified'}
- Career goal: ${targetCareer}
- Annual budget: USD ${profile.budget || 0}
- Target destination country: ${targetCountry}${institutionContext}

Return a single JSON object with EXACTLY this structure (all fields required):
{
  "recommendedVisaTypes": [
    {
      "name": "<official visa name, e.g. F-1 Student Visa>",
      "code": "<visa code if applicable, e.g. F-1>",
      "description": "<2-sentence description of what this visa allows>",
      "workRights": "<part-time/full-time/post-study work rights>",
      "maxDuration": "<maximum stay duration, e.g. Duration of Study + OPT>"
    }
  ],
  "requiredDocuments": [
    {
      "name": "<document name>",
      "issuedBy": "<issuing authority>",
      "description": "<what this document proves>",
      "mandatory": true
    }
  ],
  "languageAndAcademicTests": [
    {
      "name": "<test name, e.g. IELTS Academic>",
      "minimumScore": "<required score>",
      "alternatives": "<alternative tests accepted>",
      "validity": "<how long score is valid>"
    }
  ],
  "financialRequirements": {
    "minimumSavings": <number in USD>,
    "currency": "USD",
    "proofRequired": "<bank statement, sponsorship letter, etc.>",
    "monthlyLivingCost": <estimated monthly cost in USD>,
    "tuitionPerYear": <estimated annual tuition in USD if institution known>
  },
  "estimatedCost": {
    "totalEstimate": <total visa fees in USD>,
    "currency": "USD",
    "breakdown": [
      { "item": "<fee name>", "amount": <number>, "currency": "USD" }
    ]
  },
  "processingTimeline": {
    "application": "<time to prepare>",
    "approval": "<government processing time>",
    "total": "<total estimated time from start to visa in hand>"
  },
  "sponsorshipLikelihood": "<High | Medium | Low> — <1-sentence reason>",
  "embassyInfo": {
    "officialPortalUrl": "<real official government visa application URL>",
    "embassyName": "<full name of embassy/consulate for ${homeCountry} citizens in ${targetCountry}>",
    "appointmentRequired": <true|false>,
    "interviewRequired": <true|false>
  },
  "nextSteps": [
    "<actionable step 1>",
    "<actionable step 2>",
    "<actionable step 3>",
    "<actionable step 4>",
    "<actionable step 5>"
  ],
  "postArrivalRequirements": [
    "<requirement 1, e.g. Register with local authorities within 30 days>",
    "<requirement 2>",
    "<requirement 3>"
  ],
  "importantDeadlines": "<critical deadline note specific to ${targetCountry}, e.g. apply 3 months before program start>",
  "countrySpecificNotes": "<2-3 sentences of unique, real tips specific to ${homeCountry} citizens applying to ${targetCountry}>"
}

Use real, accurate data for ${targetCountry} visa rules in 2026. Be specific — include real visa codes, real official portal URLs (e.g. https://travel.state.gov for USA, https://www.gov.uk/student-visa for UK), real document names, and real fee amounts.`;

  try {
    const llmResult = await generateDeepSeekResponse(prompt, { systemInstruction, temperature: 0.1, maxTokens: 3000 });
    if (llmResult.source === 'error' || !llmResult.text) {
      throw new Error(llmResult.error || 'LLM returned empty response');
    }
    const parsed = parseAIJson<any>(llmResult.text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Non-object visa response');
    console.log(`[VisaGuidance] Generated for ${homeCountry}→${targetCountry} (${institution?.name ?? 'no institution'})`);
    return parsed;
  } catch (error) {
    console.error("Visa Guidance Error:", error);
    return {
      recommendedVisaTypes: [{ name: "Student Visa", code: "Student", description: `Standard student visa for ${targetCountry}.`, workRights: "Part-time during studies", maxDuration: "Duration of study" }],
      processingTimeline: { application: "4-6 weeks", approval: "6-8 weeks", total: "3-4 months" },
      estimatedCost: { totalEstimate: 2500, currency: "USD", breakdown: [{ item: "Visa application fee", amount: 2500, currency: "USD" }] },
      requiredDocuments: [
        { name: "Valid Passport", issuedBy: "Government", description: "Must be valid for entire stay", mandatory: true },
        { name: "Academic Transcripts", issuedBy: "Previous institution", description: "Proof of educational qualifications", mandatory: true },
        { name: "Financial Guarantee Letter", issuedBy: "Bank or sponsor", description: "Proof of sufficient funds", mandatory: true },
      ],
      languageAndAcademicTests: [{ name: "IELTS Academic", minimumScore: "6.5", alternatives: "TOEFL 90", validity: "2 years" }],
      financialRequirements: { minimumSavings: 15000, currency: "USD", proofRequired: "Bank statement (last 3 months)", monthlyLivingCost: 1200, tuitionPerYear: 15000 },
      sponsorshipLikelihood: "Medium — depends on employer",
      embassyInfo: { officialPortalUrl: `https://www.${targetCountry.toLowerCase().replace(/\s+/g, '')}.gov`, embassyName: `Embassy of ${targetCountry}`, appointmentRequired: true, interviewRequired: false },
      nextSteps: ["Obtain acceptance letter from institution", "Prepare financial documents", "Submit visa application online", "Attend embassy appointment if required", "Receive visa decision"],
      postArrivalRequirements: ["Register with local authorities within 30 days", "Open a local bank account", "Obtain health insurance"],
      importantDeadlines: `Apply at least 3 months before the program start date for ${targetCountry}.`,
      countrySpecificNotes: `Visa requirements for ${targetCountry} vary by nationality. Always verify current requirements at the official embassy website before applying.`,
    };
  }
}

export async function getGlobalContextInsights(
  targetLocation: string,
  interests: string[],
  targetCareerId: string
): Promise<any[]> {
  const systemInstruction = `You are a live global career market intelligence engine. Return ONLY valid JSON.`;
  const prompt = `Generate 6 global insight cards for someone targeting ${targetLocation} with interests ${interests.join(", ")} and career ${targetCareerId}. Return an array of objects with flag, city, country, stat, category, and color.`;

  try {
    const raw = await callLLM(prompt, systemInstruction, { temperature: 0.3, maxTokens: 800 });
    const parsed = JSON.parse(extractJSON(raw) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch (error) {
    if (isInsufficientBalanceError(error)) {
      console.warn("Global Context Insights fallback due to DeepSeek insufficient balance:", error);
    } else {
      console.error("Global Context Insights Error:", error);
    }
    return [
      { flag: '🇩🇪', city: 'BERLIN', country: 'Germany', stat: 'AI +24%', category: 'AI', color: 'emerald' },
      { flag: '🇸🇬', city: 'SINGAPORE', country: 'Singapore', stat: 'TECH +31%', category: 'Tech', color: 'indigo' },
      { flag: '🇬🇧', city: 'LONDON', country: 'UK', stat: 'FINTECH +18%', category: 'FinTech', color: 'amber' },
      { flag: '🇺🇸', city: 'NYC', country: 'USA', stat: 'AI ROLES +32%', category: 'AI', color: 'rose' },
      { flag: '🇦🇪', city: 'DUBAI', country: 'UAE', stat: 'CLOUD +28%', category: 'Cloud', color: 'purple' },
      { flag: '🇨🇦', city: 'TORONTO', country: 'Canada', stat: 'HIRING +21%', category: 'Tech', color: 'emerald' },
    ];
  }
}

// ─── Career Directories ───────────────────────────────────────────────────────

export interface CareerDirectoryEntry {
  id: string;
  title: string;
  category: string;
  sector: string;
  visibility: "public" | "private"; // public = global demand, private = local/niche
  country: string;
  demandScore: number;     // 0–100
  avgSalaryUSD: number;
  growth: "high" | "medium" | "stable";
  workType: "Remote" | "On-site" | "Hybrid" | "Mobile";
  tags: string[];
  topSkills: string[];
  topCompanies: string[];
  matchScore: number;      // 0–100, personalised match to user goal
  matchReason: string;
  visaFriendly: boolean;
}

export interface CareerDirectoryResult {
  homeCountry: CareerDirectoryEntry[];    // top roles in user's home country
  targetCountry: CareerDirectoryEntry[];  // top roles in user's target country
  top10: CareerDirectoryEntry[];          // top 10 globally matched to user goals
}

export async function getCareerDirectories(
  profile: UserProfile
): Promise<CareerDirectoryResult> {
  const homeCountry = profile.country || "Global";
  const targetCountry = profile.targetLocation || homeCountry;
  const interests = profile.interests?.join(", ") || "Technology";
  const targetCareer = profile.targetCareer || profile.targetCareerId || "any career";
  const education = profile.education || "any";
  const budget = profile.budget ?? 30000;

  const systemInstruction = `You are a global career intelligence engine. Return ONLY valid JSON. No markdown, no explanation.`;

  const prompt = `Build a career directory for the following user:
- Home country: ${homeCountry}
- Target country: ${targetCountry}
- Interests: ${interests}
- Target career goal: ${targetCareer}
- Education level: ${education}
- Budget: USD ${budget}

Return a JSON object with exactly this shape:
{
  "homeCountry": [ /* 8 CareerDirectoryEntry for ${homeCountry} */ ],
  "targetCountry": [ /* 8 CareerDirectoryEntry for ${targetCountry} */ ],
  "top10": [ /* exactly 10 CareerDirectoryEntry globally matched to user's goals */ ]
}

Each CareerDirectoryEntry must follow this schema:
{
  "id": "slug-string",
  "title": "Job title",
  "category": "e.g. Technology & Digital",
  "sector": "e.g. AI & Data",
  "visibility": "public" | "private",
  "country": "country name",
  "demandScore": 0-100,
  "avgSalaryUSD": number,
  "growth": "high" | "medium" | "stable",
  "workType": "Remote" | "On-site" | "Hybrid" | "Mobile",
  "tags": ["string"],
  "topSkills": ["string"],
  "topCompanies": ["string"],
  "matchScore": 0-100,
  "matchReason": "one-sentence explanation why it fits this user",
  "visaFriendly": true | false
}

Rules:
- visibility = "public" for globally recognized in-demand roles, "private" for local/niche/government roles
- matchScore must reflect alignment with user's interests, career goal and education
- top10 should be sorted by matchScore descending
- Use REAL company names relevant to each country
- Vary sectors across entries, avoid duplicates`;

  try {
    const raw = await callLLM(prompt, systemInstruction, { temperature: 0.3, maxTokens: 4000 });
    const parsed = parseAIJson<CareerDirectoryResult>(raw);
    if (!parsed) throw new Error("parse failed");

    const sanitize = (arr: any[]): CareerDirectoryEntry[] =>
      (Array.isArray(arr) ? arr : []).map((e: any) => ({
        id: String(e.id ?? ""),
        title: String(e.title ?? ""),
        category: String(e.category ?? ""),
        sector: String(e.sector ?? ""),
        visibility: e.visibility === "private" ? "private" : "public",
        country: String(e.country ?? ""),
        demandScore: Math.min(100, Math.max(0, Number(e.demandScore) || 50)),
        avgSalaryUSD: Number(e.avgSalaryUSD) || 0,
        growth: ["high", "medium", "stable"].includes(e.growth) ? e.growth : "stable",
        workType: ["Remote", "On-site", "Hybrid", "Mobile"].includes(e.workType) ? e.workType : "Hybrid",
        tags: Array.isArray(e.tags) ? e.tags : [],
        topSkills: Array.isArray(e.topSkills) ? e.topSkills.slice(0, 5) : [],
        topCompanies: Array.isArray(e.topCompanies) ? e.topCompanies.slice(0, 4) : [],
        matchScore: Math.min(100, Math.max(0, Number(e.matchScore) || 50)),
        matchReason: String(e.matchReason ?? ""),
        visaFriendly: Boolean(e.visaFriendly),
      }));

    return {
      homeCountry: sanitize(parsed.homeCountry),
      targetCountry: sanitize(parsed.targetCountry),
      top10: sanitize(parsed.top10).slice(0, 10),
    };
  } catch (error) {
    if (isInsufficientBalanceError(error)) {
      console.warn("Career Directories: LLM balance insufficient, returning fallback.");
    } else {
      console.error("Career Directories Error:", error);
    }
    // Minimal fallback so the UI doesn't crash
    const fallback: CareerDirectoryEntry[] = [
      { id: "ai-engineer", title: "AI & ML Engineer", category: "Technology & Digital", sector: "AI & Data", visibility: "public", country: homeCountry, demandScore: 95, avgSalaryUSD: 140000, growth: "high", workType: "Remote", tags: ["AI", "Remote"], topSkills: ["Python", "PyTorch", "MLOps"], topCompanies: ["Google", "Microsoft", "OpenAI"], matchScore: 90, matchReason: "Aligns with tech interests and high global demand.", visaFriendly: true },
      { id: "fullstack-dev", title: "Full-Stack Developer", category: "Technology & Digital", sector: "Software", visibility: "public", country: homeCountry, demandScore: 88, avgSalaryUSD: 110000, growth: "high", workType: "Hybrid", tags: ["Web", "Remote"], topSkills: ["React", "Node.js", "TypeScript"], topCompanies: ["Meta", "Shopify", "Stripe"], matchScore: 85, matchReason: "High hiring volume globally.", visaFriendly: true },
    ];
    return { homeCountry: fallback, targetCountry: fallback, top10: fallback };
  }
}

// ─── Country-specific Career Directory (with backend cache) ─────────────────

export { type CountryCareerEntry };

export async function getCareersByCountry(
  country: string,
  userProfile: { interests?: string[]; targetCareerId?: string; education?: string },
  forceRefresh = false
): Promise<CountryCareerEntry[]> {
  const cacheKey = country.trim().toLowerCase();

  // 1. Return from cache unless forced
  if (!forceRefresh) {
    const cached = await getCachedCountryCareers(cacheKey);
    if (cached && cached.length > 0) {
      console.log(`[CountryCareers] Serving ${country} from cache (${cached.length} entries)`);
      return cached;
    }
  } else {
    await invalidateCountryCareersCache(cacheKey);
  }

  const isGlobal = cacheKey === 'global' || cacheKey === '';
  const interests = userProfile.interests?.join(', ') || 'Technology, Business';
  const targetCareer = userProfile.targetCareerId || 'any career';
  const education = userProfile.education || 'any';

  const systemInstruction = `You are a global career intelligence engine. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = isGlobal
    ? `List the top 15 most in-demand careers globally in 2026.
       For each career include: id, title, description, growth, category, subCategory, workType, tags, visibility, demandScore, avgSalaryUSD, topSkills, topCompanies, country.
       
       User context: interests = ${interests}, target = ${targetCareer}, education = ${education}.
       
       visibility must be "public" for globally recognised internationally-sought roles, "private" for local/government/niche roles.
       Return a JSON array of CountryCareerEntry objects.`
    : `List the top 15 most in-demand careers in ${country} in 2026.
       For each career include: id, title, description, growth, category, subCategory, workType, tags, visibility, demandScore, avgSalaryUSD, topSkills, topCompanies, country.
       
       User context: interests = ${interests}, target = ${targetCareer}, education = ${education}.
       
       visibility must be "public" for internationally recognised, globally-transferable roles, "private" for local government, domestic-only, or niche-market roles in ${country}.
       country field must be "${country}".
       topCompanies must be real companies actively hiring in ${country}.
       Return a JSON array of CountryCareerEntry objects.`;

  try {
    const raw = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 3000 });
    const parsed = parseAIJson<CountryCareerEntry[]>(raw);
    if (!parsed || !Array.isArray(parsed)) throw new Error("parse failed");

    const sanitized: CountryCareerEntry[] = parsed.map((e: any, i: number) => ({
      id: String(e.id || `${cacheKey}-${i}`),
      title: String(e.title || ""),
      description: String(e.description || ""),
      growth: ["high", "medium", "stable"].includes(e.growth) ? e.growth : "stable",
      category: String(e.category || "General"),
      subCategory: String(e.subCategory || e.sub_category || ""),
      workType: ["Remote", "On-site", "Hybrid", "Mobile"].includes(e.workType) ? e.workType : "Hybrid",
      tags: Array.isArray(e.tags) ? e.tags : [],
      visibility: e.visibility === "private" ? "private" : "public",
      demandScore: Math.min(100, Math.max(0, Number(e.demandScore) || 70)),
      avgSalaryUSD: Number(e.avgSalaryUSD) || 0,
      topSkills: Array.isArray(e.topSkills) ? e.topSkills.slice(0, 5) : [],
      topCompanies: Array.isArray(e.topCompanies) ? e.topCompanies.slice(0, 4) : [],
      country: isGlobal ? (String(e.country || "Global")) : country,
    }));

    // Persist to DB cache
    await saveCountryCareersCache(cacheKey, sanitized);
    console.log(`[CountryCareers] Fetched & cached ${sanitized.length} careers for ${country}`);
    return sanitized;
  } catch (error) {
    if (isInsufficientBalanceError(error)) {
      console.warn(`[CountryCareers] LLM balance insufficient for ${country}, using fallback`);
    } else {
      console.error(`[CountryCareers] Error for ${country}:`, error);
    }
    // Return a basic fallback
    return [
      { id: "ai-engineer", title: "AI & ML Engineer", description: "Design and build AI systems.", growth: "high", category: "Technology & Digital", subCategory: "AI & Data", workType: "Remote", tags: ["AI", "Remote Economy"], visibility: "public", demandScore: 95, avgSalaryUSD: 130000, topSkills: ["Python", "PyTorch", "MLOps"], topCompanies: ["Google", "Microsoft", "Amazon"], country: isGlobal ? "Global" : country },
      { id: "fullstack-dev", title: "Full-Stack Developer", description: "Build complete web applications.", growth: "high", category: "Technology & Digital", subCategory: "Software", workType: "Hybrid", tags: ["Remote Economy"], visibility: "public", demandScore: 88, avgSalaryUSD: 105000, topSkills: ["React", "Node.js", "TypeScript"], topCompanies: ["Meta", "Shopify", "Stripe"], country: isGlobal ? "Global" : country },
      { id: "data-analyst", title: "Data Analyst", description: "Analyse data to drive business decisions.", growth: "high", category: "Business, Finance & Management", subCategory: "Data", workType: "Hybrid", tags: ["AI Integration"], visibility: "public", demandScore: 85, avgSalaryUSD: 85000, topSkills: ["SQL", "Python", "Power BI"], topCompanies: ["Deloitte", "KPMG", "IBM"], country: isGlobal ? "Global" : country },
    ];
  }
}

// ─── Career Milestones (with 7-day DB cache) ──────────────────────────────

export async function getCareerMilestones(
  careerTitle: string,
  userAge: number,
  userEducation: string,
  country: string
): Promise<CachedMilestone[]> {
  const cacheKey = `${careerTitle.toLowerCase().replace(/\s+/g, "-")}|age${Math.floor(userAge / 5) * 5}|${country.toLowerCase()}`;

  // 1. Try cache first
  const cached = await getCachedMilestones(cacheKey);
  if (cached && cached.length > 0) {
    console.log(`[Milestones] Serving "${careerTitle}" from cache`);
    return cached;
  }

  const systemInstruction = `You are a career roadmap strategist. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Generate a detailed career roadmap for: "${careerTitle}"

User profile:
- Current age: ${userAge}
- Education level: ${userEducation || "unspecified"}
- Country: ${country || "Global"}

Return a JSON array of exactly 6 milestone objects. Each milestone must have:
- ageRange: e.g. "Age 22–24" (realistic, starting from age ${userAge})
- title: short action-oriented title (max 8 words)
- description: 2-sentence practical description of what to do and why
- requirements: array of 3–5 specific skills, certifications, or actions needed

Make milestones progressive, realistic, and specific to "${careerTitle}" in ${country || "the global market"} for 2026.
Respond with ONLY the JSON array.`;

  try {
    // Race the LLM call against a timeout — if all providers are cooling down the
    // call will fail fast (< 1 s) but guard with 10 s just in case the queue is long.
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('LLM timeout for milestones')), 10_000)
    );
    const raw = await Promise.race([
      callLLM(prompt, systemInstruction, { temperature: 0.3, maxTokens: 2000 }),
      timeoutPromise,
    ]);
    const parsed = parseAIJson<CachedMilestone[]>(raw);
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Invalid milestone response");
    }

    const sanitized: CachedMilestone[] = parsed.map((m: any) => ({
      ageRange: String(m.ageRange || ""),
      title: String(m.title || ""),
      description: String(m.description || ""),
      requirements: Array.isArray(m.requirements) ? m.requirements.map(String) : [],
    }));

    // Save to DB cache (non-blocking)
    saveMilestonesCache(cacheKey, sanitized).catch(err =>
      console.warn("[Milestones] Cache save failed:", err)
    );

    console.log(`[Milestones] Generated & cached ${sanitized.length} milestones for "${careerTitle}"`);
    return sanitized;
  } catch (error) {
    console.error(`[Milestones] Failed for "${careerTitle}":`, error);
    // Sensible fallback
    const startAge = userAge;
    return [
      { ageRange: `Age ${startAge}–${startAge + 1}`, title: "Foundation & Skill Assessment", description: `Assess your current skill gaps for ${careerTitle}. Complete a relevant online certification to build foundational knowledge.`, requirements: ["Self-assessment quiz", "LinkedIn profile update", "1 foundational course"] },
      { ageRange: `Age ${startAge + 1}–${startAge + 2}`, title: "First Role or Internship", description: `Land an entry-level position or internship in ${careerTitle}. Focus on building a portfolio and real-world experience.`, requirements: ["Updated CV", "3 portfolio projects", "Apply to 20+ roles"] },
      { ageRange: `Age ${startAge + 2}–${startAge + 4}`, title: "Specialise & Build Expertise", description: "Choose a niche within your field and go deep. Earn an advanced certification or complete a specialist project.", requirements: ["Advanced certification", "Mentorship", "Conference attendance"] },
      { ageRange: `Age ${startAge + 4}–${startAge + 6}`, title: "Mid-Level Promotion", description: "Take on more responsibility and lead small projects or a team. Demonstrate measurable impact in your role.", requirements: ["Lead a project", "Performance review", "Salary negotiation"] },
      { ageRange: `Age ${startAge + 6}–${startAge + 9}`, title: "Senior / Specialist Position", description: "Become a recognised expert. Publish work, speak at events, or mentor junior colleagues.", requirements: ["Published article or talk", "Mentor 1–2 juniors", "Industry recognition"] },
      { ageRange: `Age ${startAge + 9}+`, title: "Leadership or Entrepreneurship", description: "Step into a leadership role, director position, or start your own venture in this space.", requirements: ["Executive presence", "Strategic vision", "Network of 500+ professionals"] },
    ];
  }
}

// ─── Job Directory: government + private sector by country ────────────────

export interface JobDirectoryCategory {
  category: string;          // e.g. "Civil Services & Administration"
  jobs: string[];            // list of specific job titles
}

export interface JobDirectorySector {
  sector: 'Government' | 'Private';
  icon: string;              // emoji
  categories: JobDirectoryCategory[];
}

export interface JobDirectory {
  country: string;
  sectors: JobDirectorySector[];
  generatedAt: string;
}

const JOB_DIRECTORY_CACHE = new Map<string, { data: JobDirectory; expiresAt: number }>();

export interface JobDirectoryProfile {
  interests?: string[];
  targetCareerId?: string;
  targetCareer?: string;
  education?: string;
}

export async function getJobDirectory(country: string, profile?: JobDirectoryProfile): Promise<JobDirectory> {
  // v3 in cache key busts entries with hardcoded India-specific titles
  const key = `v3:${country.trim().toLowerCase()}`;
  const cached = JOB_DIRECTORY_CACHE.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    console.log(`[JobDirectory] Serving ${country} from in-memory cache`);
    return cached.data;
  }

  // Check DB cache first — avoids LLM call on warm visits
  const dbCached = await getAiCache<JobDirectory>(`jobdir:${key}`);
  if (dbCached && Array.isArray(dbCached.sectors) && dbCached.sectors.length > 0) {
    JOB_DIRECTORY_CACHE.set(key, { data: dbCached, expiresAt: Date.now() + 86_400_000 });
    console.log(`[JobDirectory] Serving ${country} from DB cache`);
    return dbCached;
  }

  const systemInstruction = `You are a comprehensive career intelligence engine. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  // Profile context hints for the AI to prioritise relevant roles
  const profileHint = profile
    ? `User interests: ${profile.interests?.join(', ') || 'general'}. Target career: ${profile.targetCareer || profile.targetCareerId || 'any'}. Education: ${profile.education || 'any'}. Ensure this person's target career appears across relevant categories.`
    : '';

  const prompt = `List government and private sector jobs available in ${country} (2026). ${profileHint}

CRITICAL: Every single job title listed MUST be a real, actual job title used in ${country}. Do NOT use job titles from any other country. Do NOT include country-specific civil service titles (e.g. IAS Officer, District Collector) unless they literally exist in ${country}.

Return JSON:
{
  "country": "${country}",
  "sectors": [
    { "sector": "Government", "icon": "🏛️", "categories": [
      { "category": "Civil Services & Administration", "jobs": ["<8 real ${country} government administration/civil service job titles — e.g. for USA: City Manager, County Administrator, Federal Program Officer, Policy Analyst, Government Affairs Director, Public Administrator, Budget Analyst, Administrative Judge>"] },
      { "category": "Defence & Security", "jobs": ["<8 real ${country} defence/security job titles>"] },
      { "category": "Public Finance & Banking", "jobs": ["<8 real ${country} public finance/central bank job titles>"] },
      { "category": "Public Health & Medicine", "jobs": ["<8 real ${country} government public health/medicine job titles>"] },
      { "category": "Nursing & Allied Health (Govt)", "jobs": ["<8 real ${country} government nursing and allied-health job titles>"] },
      { "category": "Education & Research", "jobs": ["<8 real ${country} government education/research job titles>"] },
      { "category": "Judiciary & Legal Services", "jobs": ["<8 real ${country} judiciary/legal job titles>"] },
      { "category": "Infrastructure & Environment", "jobs": ["<8 real ${country} infrastructure/environment/utilities job titles>"] }
    ]},
    { "sector": "Private", "icon": "🏢", "categories": [
      { "category": "Information Technology", "jobs": ["<8 real ${country} private IT job titles>"] },
      { "category": "Banking & Finance", "jobs": ["<8 real ${country} private banking/finance job titles>"] },
      { "category": "Clinical Medicine & Specialists", "jobs": ["<8 real ${country} private clinical/specialist physician titles>"] },
      { "category": "Healthcare & Pharmaceuticals", "jobs": ["<8 real ${country} private healthcare/pharma job titles>"] },
      { "category": "Engineering & Manufacturing", "jobs": ["<8 real ${country} engineering/manufacturing job titles>"] },
      { "category": "Consulting & Strategy", "jobs": ["<8 real ${country} consulting/strategy job titles>"] },
      { "category": "Media, Creative & Design", "jobs": ["<8 real ${country} media/creative/design job titles>"] },
      { "category": "Legal & Compliance", "jobs": ["<8 real ${country} legal/compliance job titles>"] },
      { "category": "Sales, Marketing & Business", "jobs": ["<8 real ${country} sales/marketing job titles>"] },
      { "category": "Startups & Entrepreneurship", "jobs": ["<8 real ${country} startup/entrepreneurship/VC job titles>"] }
    ]}
  ],
  "generatedAt": "${new Date().toISOString()}"
}

Rules:
- Replace EVERY placeholder with exactly 8 REAL job titles actually used in ${country}. Not in any other country — only ${country}.
- Output ONLY valid JSON.`;

  const tryLLM = async (maxTokens: number): Promise<JobDirectory | null> => {
    const llmResult = await generateDeepSeekResponse(prompt, { systemInstruction, temperature: 0.3, maxTokens });
    if (llmResult.source === 'error' || !llmResult.text) return null;
    const parsed = parseAIJson<JobDirectory>(llmResult.text);
    if (!parsed || !Array.isArray(parsed.sectors) || parsed.sectors.length === 0) return null;
    return { country, sectors: parsed.sectors, generatedAt: new Date().toISOString() };
  };

  try {
    // Expanded prompt needs more tokens (3500 first, 2000 fallback)
    let result = await tryLLM(3500);

    // Second attempt with reduced tokens if first failed
    if (!result) {
      console.warn(`[JobDirectory] First LLM attempt failed for ${country}, retrying with 2000 tokens`);
      result = await tryLLM(2000);
    }

    if (!result) {
      console.warn(`[JobDirectory] Both LLM attempts failed for ${country}`);
      // Return stale DB cache (any TTL) as last resort before empty
      const anyStale = await getAiCache<JobDirectory>(`jobdir:${key}`).catch(() => null);
      return anyStale ?? { country, sectors: [], generatedAt: new Date().toISOString() };
    }

    // Persist to in-memory (24h) AND DB (7 days)
    JOB_DIRECTORY_CACHE.set(key, { data: result, expiresAt: Date.now() + 86_400_000 });
    setAiCache(`jobdir:${key}`, result, 168).catch(() => {});
    console.log(`[JobDirectory] Generated & cached directory for ${country} with ${result.sectors.length} sectors`);
    return result;
  } catch (error) {
    console.error(`[JobDirectory] Error for ${country}:`, error);
    const anyStale = await getAiCache<JobDirectory>(`jobdir:${key}`).catch(() => null);
    return anyStale ?? { country, sectors: [], generatedAt: new Date().toISOString() };
  }
}

// ─── Career Requirements & Competition Artifacts ──────────────────────────────

export interface EligibilityCriterion {
  label: string;
  value: string;
  type: 'education' | 'age' | 'nationality' | 'physical' | 'exam' | 'experience' | 'other';
  mandatory: boolean;
}

export interface SelectionStage {
  stage: number;
  title: string;
  description: string;
  type: 'written' | 'interview' | 'physical' | 'medical' | 'document' | 'online' | 'skill-test';
  duration?: string;
  tips?: string;
}

export interface KeyExam {
  name: string;
  conductedBy: string;
  frequency: string;
  syllabusHighlights: string[];
  examPattern: string;
  officialUrl?: string;
}

export interface ArtifactItem {
  name: string;
  description: string;
  priority: 'Essential' | 'Important' | 'Optional';
  whenNeeded: string;
  format?: string;
}

export interface ArtifactCategory {
  category: string;
  icon: string;
  items: ArtifactItem[];
}

export interface PreparationPhase {
  phase: string;
  duration: string;
  icon: string;
  focusAreas: string[];
  keyAction: string;
}

export interface CareerRequirements {
  careerTitle: string;
  country: string;
  sector: 'government' | 'private' | 'both';
  overview: string;
  eligibility: EligibilityCriterion[];
  selectionProcess: SelectionStage[];
  keyExams: KeyExam[];
  artifacts: ArtifactCategory[];
  preparationTimeline: PreparationPhase[];
  proTips: string[];
  officialLinks: { label: string; url: string }[];
}

const REQ_CACHE = new Map<string, { data: CareerRequirements; expiresAt: number }>();

export async function getCareerRequirements(
  careerTitle: string,
  country: string
): Promise<CareerRequirements> {
  const key = `${careerTitle.toLowerCase().replace(/\s+/g, '-')}|${country.toLowerCase()}`;
  // 1. Check in-memory cache
  const memCached = REQ_CACHE.get(key);
  if (memCached && Date.now() < memCached.expiresAt) return memCached.data;

  // 2. Check DB cache
  const dbCached = await getAiCache<CareerRequirements>(`careereq:${key}`);
  if (dbCached) {
    REQ_CACHE.set(key, { data: dbCached, expiresAt: Date.now() + 86_400_000 });
    return dbCached;
  }

  const systemInstruction = `You are a career guidance expert and competitive exam specialist. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const prompt = `Generate a comprehensive career requirements and competition preparation guide for:
Career: "${careerTitle}"
Country: "${country}"

Return a JSON object with this EXACT structure:
{
  "careerTitle": "${careerTitle}",
  "country": "${country}",
  "sector": "<government | private | both>",
  "overview": "<3-sentence overview of this career in ${country} covering scope, demand, and competition level>",
  "eligibility": [
    {
      "label": "<criterion name>",
      "value": "<specific requirement, e.g. Bachelor's degree in any discipline>",
      "type": "<education | age | nationality | physical | exam | experience | other>",
      "mandatory": <true|false>
    }
  ],
  "selectionProcess": [
    {
      "stage": <1, 2, 3...>,
      "title": "<stage name>",
      "description": "<what happens in this stage>",
      "type": "<written | interview | physical | medical | document | online | skill-test>",
      "duration": "<time duration if applicable>",
      "tips": "<1 specific preparation tip for this stage>"
    }
  ],
  "keyExams": [
    {
      "name": "<official exam name>",
      "conductedBy": "<organising body>",
      "frequency": "<Annual | Twice yearly | On-demand | etc.>",
      "syllabusHighlights": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>"],
      "examPattern": "<brief description of sections, marks, time>",
      "officialUrl": "<real official exam URL>"
    }
  ],
  "artifacts": [
    {
      "category": "<category name e.g. Identity Documents | Educational Certificates | Professional Portfolio | Application Forms | Competitive Exam Results>",
      "icon": "<single emoji>",
      "items": [
        {
          "name": "<document/artifact name>",
          "description": "<why it is needed>",
          "priority": "<Essential | Important | Optional>",
          "whenNeeded": "<at application | during exam | at interview | post-selection>",
          "format": "<PDF | Original | Notarized | etc. if relevant>"
        }
      ]
    }
  ],
  "preparationTimeline": [
    {
      "phase": "<phase name e.g. Foundation Phase>",
      "duration": "<e.g. Months 1–3>",
      "icon": "<single emoji>",
      "focusAreas": ["<focus area 1>", "<focus area 2>", "<focus area 3>"],
      "keyAction": "<single most important action in this phase>"
    }
  ],
  "proTips": [
    "<specific pro tip 1 for succeeding in ${country} for this career>",
    "<specific pro tip 2>",
    "<specific pro tip 3>",
    "<specific pro tip 4>"
  ],
  "officialLinks": [
    { "label": "<link description>", "url": "<real official URL>" }
  ]
}

IMPORTANT:
- eligibility must have at least 4 criteria specific to "${careerTitle}" in "${country}"
- selectionProcess must have all real stages (e.g. for UPSC: Prelims → Mains → Interview; for corporate: Resume → Technical → HR)
- keyExams must list real exams if any (e.g. UPSC CSE for IAS, GATE for engineering PSUs, IBPS for banking, CAT for MBA)
- artifacts must have 4-5 categories with 3-6 items each — cover everything a candidate must prepare
- preparationTimeline must have exactly 4 phases covering the full preparation journey
- proTips must be country-and-career-specific practical advice
- officialLinks must use real government or authoritative URLs
- Be highly specific to "${careerTitle}" in "${country}" — not generic
- For government careers, focus on competitive exams, age limits, attempts, reservation criteria
- For private careers, focus on portfolio, technical assessments, certifications, networking
Output ONLY the JSON object.`;

  try {
    const llmResult = await generateDeepSeekResponse(prompt, { systemInstruction, temperature: 0.15, maxTokens: 4000 });
    if (llmResult.source === 'error' || !llmResult.text) throw new Error(llmResult.error || 'empty');
    const parsed = parseAIJson<CareerRequirements>(llmResult.text);
    if (!parsed || !parsed.eligibility) throw new Error('parse failed');

    // Save to in-memory (24h) AND DB (7 days)
    REQ_CACHE.set(key, { data: parsed, expiresAt: Date.now() + 86_400_000 });
    setAiCache(`careereq:${key}`, parsed, 168).catch(() => {});
    console.log(`[CareerReq] Generated requirements for "${careerTitle}" in ${country}`);
    return parsed;
  } catch (error) {
    console.error(`[CareerReq] Failed for "${careerTitle}" in ${country}:`, error);
    // Try DB stale cache before giving up
    const stale = await getAiCache<CareerRequirements>(`careereq:${key}`).catch(() => null);
    if (stale) return stale;
    // Return a minimal shell so the UI doesn't break
    return {
      careerTitle,
      country,
      sector: 'both',
      overview: `Loading requirements for ${careerTitle} in ${country}. Please try again shortly.`,
      eligibility: [],
      selectionProcess: [],
      keyExams: [],
      artifacts: [],
      preparationTimeline: [],
      proTips: [],
      officialLinks: [],
    };
  }
}

// ─── Network & Community LLM Functions ───────────────────────────────────────

export async function getNetworkCommunities(profile: UserProfile): Promise<any[]> {
  const cacheKey = `network:communities:${profile.country || 'global'}:${profile.targetCareerId || 'any'}`;
  const cached = await getAiCache<any[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const systemInstruction = `You are a professional network community curator. Return ONLY valid JSON — no markdown, no explanation.`;
  const prompt = `Generate 5 realistic professional online communities for a ${new Date().getFullYear()} user:
- Career: ${profile.targetCareerId || profile.interests?.[0] || 'Technology'}
- Country: ${profile.country || 'Global'}

Return a JSON array of exactly 5 community objects with this schema:
{"id":"slug","name":"Name","industry":"Industry","members":12000,"description":"One sentence.","color":"indigo","icon":"🤖","joined":false,"private":false,"posts":[{"id":"p1","author":"Full Name","avatar":"FN","role":"Title @ Company","content":"One sentence post.","timestamp":"2h ago","likes":45,"replies":12,"tags":["tag1"],"liked":false,"bookmarked":false}]}
Rules: first community matches user's career; 1 community is private; each community has exactly 1 post; color must be one of: indigo|emerald|amber|pink|slate|orange|violet|teal.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.7, maxTokens: 4000 });
    const result = parseAIJson<any[]>(text);
    if (Array.isArray(result) && result.length > 0) {
      setAiCache(cacheKey, result, 12).catch(() => {});
      return result;
    }
    return [];
  } catch (error) {
    console.error('[Network] getNetworkCommunities failed:', error);
    return [];
  }
}

export async function getNetworkMentors(profile: UserProfile): Promise<any[]> {
  const cacheKey = `network:mentors:${profile.country || 'global'}:${profile.targetCareerId || 'any'}`;
  const cached = await getAiCache<any[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const systemInstruction = `You are a professional mentorship network engine. Return ONLY valid JSON — no markdown, no explanation.`;
  const prompt = `Generate 6 realistic senior professional mentors for a ${new Date().getFullYear()} user targeting: ${profile.targetCareerId || 'Technology'} in ${profile.country || 'Global'}.

Return a JSON array of exactly 6 mentor objects with this schema:
{"id":"slug","name":"Full Name","avatar":"FN","title":"Senior Title","company":"Company","industry":"Industry","expertise":["skill1","skill2","skill3"],"mentees":15,"rating":4.7,"reviews":52,"responseTime":"< 24 hours","availability":"available","bio":"One sentence bio.","country":"Country","yearsExp":10,"requested":false,"linkedin":"#"}
Rules: availability values are available|limited|full; mix all three; at least 2 mentors aligned with ${profile.targetCareerId || 'Technology'}; diverse names and countries.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.6, maxTokens: 3000 });
    const result = parseAIJson<any[]>(text);
    if (Array.isArray(result) && result.length > 0) {
      setAiCache(cacheKey, result, 24).catch(() => {});
      return result;
    }
    return [];
  } catch (error) {
    console.error('[Network] getNetworkMentors failed:', error);
    return [];
  }
}

export async function getNetworkResumeReviews(profile: UserProfile): Promise<any[]> {
  const cacheKey = `network:reviews:${profile.targetCareerId || 'any'}`;
  const cached = await getAiCache<any[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const systemInstruction = `You are a professional peer resume review coordinator. Return ONLY valid JSON — no markdown, no explanation.`;
  const prompt = `Generate 5 peer resume review requests for a professional network in ${new Date().getFullYear()}. User's career interest: ${profile.targetCareerId || 'Technology'}.

Return a JSON array of exactly 5 objects with this schema:
{"id":"rr-1","author":"Full Name","avatar":"FN","role":"3 YOE Engineer","targetRole":"Senior Engineer @ BigCo","submittedAt":"2h ago","reviewsReceived":1,"reviewsNeeded":3,"tags":["SWE","Backend"],"status":"open","reviewed":false}
Rules: 1 object has status "completed" and reviewed true; at least 2 relate to ${profile.targetCareerId || 'Technology'}; vary career stages.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.6, maxTokens: 1500 });
    const result = parseAIJson<any[]>(text);
    if (Array.isArray(result) && result.length > 0) {
      setAiCache(cacheKey, result, 6).catch(() => {});
      return result;
    }
    return [];
  } catch (error) {
    console.error('[Network] getNetworkResumeReviews failed:', error);
    return [];
  }
}

export async function getNetworkReferrals(profile: UserProfile): Promise<any[]> {
  const cacheKey = `network:referrals:${profile.country || 'global'}:${profile.targetCareerId || 'any'}`;
  const cached = await getAiCache<any[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const systemInstruction = `You are a professional job referral network engine. Return ONLY valid JSON — no markdown, no explanation.`;
  const prompt = `Generate 6 professional referral connections for someone targeting: ${profile.targetCareerId || 'Technology'} in ${profile.targetLocation || profile.country || 'Global'}.

Return a JSON array of exactly 6 objects with this schema:
{"id":"ref-1","name":"Full Name","avatar":"FN","title":"Job Title","company":"Company","companyLogo":"CO","connectionStrength":"strong","mutualConnections":5,"openRoles":["Role A","Role B"],"connected":false,"requestSent":false}
Rules: connectionStrength values are strong|medium|weak; 2 are connected true; 1 has requestSent true; use real companies relevant to ${profile.targetCareerId || 'Technology'}.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.6, maxTokens: 2500 });
    const result = parseAIJson<any[]>(text);
    if (Array.isArray(result) && result.length > 0) {
      setAiCache(cacheKey, result, 12).catch(() => {});
      return result;
    }
    return [];
  } catch (error) {
    console.error('[Network] getNetworkReferrals failed:', error);
    return [];
  }
}

export async function getNetworkCompanies(profile: UserProfile): Promise<any[]> {
  const cacheKey = `network:companies:${profile.targetCareerId || 'any'}:${profile.country || 'global'}`;
  const cached = await getAiCache<any[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const systemInstruction = `You are a company research and alumni network intelligence engine. Return ONLY valid JSON — no markdown, no explanation.`;
  const prompt = `Generate 5 real company profiles with alumni network data for someone targeting: ${profile.targetCareerId || 'Technology'} in ${profile.targetLocation || profile.country || 'Global'}.

Return a JSON array of exactly 5 objects with this schema:
{"id":"slug","name":"Company","logo":"CO","industry":"Industry","size":"10,000+","rating":4.2,"reviews":5200,"alumniCount":320,"openRoles":85,"hq":"City, Country","culture":["trait1","trait2","trait3"],"alumni":[{"name":"Full Name","role":"Job Title","avatar":"FN","gradYear":2021},{"name":"Full Name 2","role":"Job Title","avatar":"FN","gradYear":2022}],"followed":false}
Rules: 2 companies have followed true; each company has exactly 2 alumni; use top companies for ${profile.targetCareerId || 'Technology'}.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.5, maxTokens: 2500 });
    const result = parseAIJson<any[]>(text);
    if (Array.isArray(result) && result.length > 0) {
      setAiCache(cacheKey, result, 24).catch(() => {});
      return result;
    }
    return [];
  } catch (error) {
    console.error('[Network] getNetworkCompanies failed:', error);
    return [];
  }
}
