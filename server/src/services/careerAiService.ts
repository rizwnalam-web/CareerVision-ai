import { generateDeepSeekResponse } from "./deepseekService.js";
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
let _llmQueueHead = Promise.resolve();
async function callLLM(prompt: string, systemInstruction: string, options: DeepSeekRequest = {}) {
  // Chain onto the current queue so requests run sequentially
  const result = await (_llmQueueHead = _llmQueueHead.then(async () => {
    return generateDeepSeekResponse(prompt, { ...options, systemInstruction });
  }).catch(async () => {
    return generateDeepSeekResponse(prompt, { ...options, systemInstruction });
  }));

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
  const systemInstruction = `You are Spark.E, a Global Career Academy Recruiter. 
  The user is searching for jobs. 
  1. Analyze the query: "${query}" in location: "${location}".
  2. Research and synthesize 3-4 REAL, high-quality job opportunities from major portals (LinkedIn, Indeed, Glassdoor, etc.).
  3. Ensure the "url" leads to a valid search page or job portal (e.g., https://www.linkedin.com/jobs/search/?keywords=...).
  4. Return the result in a valid JSON array of JobListing objects.
  
  JobListing Schema:
  {
    "id": "string",
    "title": "string",
    "company": "string",
    "location": "string",
    "salary": {
      "min": number,
      "max": number,
      "currency": "string",
      "period": "yearly" | "monthly"
    },
    "type": "Full-time" | "Part-time" | "Contract" | "Remote" | "Hybrid",
    "postedAt": "Just now" | "1d ago" | etc,
    "url": "string (Direct link to search or portal)",
    "careerId": "string (best fit from ID list)",
    "description": "string (catchy summary)",
    "logo": "string (high quality company logo or Unsplash: https://images.unsplash.com/photo-...)"
  }`;

  const prompt = `Find jobs for: ${query} in ${location}`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.7 });
    const results = parseAIJson<JobListing[]>(text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Job Search Failed:", error);
    return [];
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

  const prompt = `Find REAL, top-ranked institutions matching this search:
Query: "${query}"
User Profile:
- Current Country: ${profile.country}
- Target Career: ${profile.targetCareerId || profile.targetCareer || "Technology"}
- Budget: $${profile.budget || 50000}/year
- Interests: ${profile.interests?.slice(0, 5).join(", ") || "General"}
- Preferred Location: ${profile.targetLocation || "Global"}

Instructions:
1. Search semantically: "${query}" could mean specific regions, subjects, price ranges, or institution types
2. Return 4-6 REAL institutions from reputable global rankings (QS, Times Higher Ed, Academic Ranking)
3. Match the user's budget, interests, and career goals
4. Include mix of types (Universities, Vocational Schools, etc.) when relevant
5. Verify programs, costs, and websites are accurate
6. For India searches: Include IIT, NIT, Delhi University, Bombay University, BITS Pilani, etc.

Output: Valid JSON array ONLY. Start with [ and end with ].`;

  try {
    const cachedInstitutions = await getCachedInstitutionsByQuery(query);
    if (cachedInstitutions && cachedInstitutions.length > 0) {
      return cachedInstitutions as Institution[];
    }

    const text = await callLLM(prompt, systemInstruction, { temperature: 0.7, maxTokens: 2500 });
    const results = parseAIJson<Institution[]>(text);
    
    if (Array.isArray(results) && results.length > 0) {
      // Validate results have required fields
      const validResults = results.filter(r => 
        r.name && r.country && r.type && Array.isArray(r.programs) && r.programs.length > 0
      );
      
      if (validResults.length > 0) {
        await saveCachedInstitutions(validResults).catch((err) =>
          console.warn("Failed to cache AI institution search results:", err)
        );
        return validResults;
      }
    }

    // Fallback for common searches
    console.warn("AI Institution Search returned invalid results, using fallback");
    return getInstitutionSearchFallback(query, profile);
  } catch (error) {
    console.error("AI Institution Search Failed:", error);
    return getInstitutionSearchFallback(query, profile);
  }
}

function getInstitutionSearchFallback(query: string, profile: UserProfile): Institution[] {
  const queryLower = query.toLowerCase();
  
  // India-specific institutions
  if (queryLower.includes("india")) {
    return [
      {
        id: "iit-delhi",
        name: "Indian Institute of Technology (IIT) Delhi",
        location: "New Delhi, India",
        city: "New Delhi",
        country: "India",
        type: "University",
        programs: ["Computer Science", "Engineering", "Data Science", "AI/ML"],
        avgCost: 2500,
        ranking: 42,
        image: "https://images.unsplash.com/photo-1598634860635-cd7ded477e0e?w=800&q=80",
        applicationDeadline: "2026-12-15",
        website: "https://www.iitd.ac.in",
        allowsInternationalStudents: true,
        visaSupport: "Full",
        coordinates: { lat: 28.5921, lng: 77.1910 },
        costOfLivingIndex: 35
      },
      {
        id: "iit-bombay",
        name: "Indian Institute of Technology (IIT) Bombay",
        location: "Mumbai, India",
        city: "Mumbai",
        country: "India",
        type: "University",
        programs: ["Engineering", "Technology", "Management", "Research"],
        avgCost: 2500,
        ranking: 35,
        image: "https://images.unsplash.com/photo-1562883314-37d8b0106aab?w=800&q=80",
        applicationDeadline: "2026-12-15",
        website: "https://www.iitb.ac.in",
        allowsInternationalStudents: true,
        visaSupport: "Full",
        coordinates: { lat: 19.1136, lng: 72.9142 },
        costOfLivingIndex: 60
      },
      {
        id: "iit-bangalore",
        name: "Indian Institute of Technology (IIT) Bangalore",
        location: "Bangalore, India",
        city: "Bangalore",
        country: "India",
        type: "University",
        programs: ["Computer Science", "Electrical Engineering", "Biotechnology"],
        avgCost: 2500,
        ranking: 45,
        image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
        applicationDeadline: "2026-12-15",
        website: "https://www.iisc.ac.in",
        allowsInternationalStudents: true,
        visaSupport: "Full",
        coordinates: { lat: 13.0827, lng: 80.2707 },
        costOfLivingIndex: 50
      },
      {
        id: "nit-trichy",
        name: "National Institute of Technology (NIT) Trichy",
        location: "Tiruchirappalli, India",
        city: "Tiruchirappalli",
        country: "India",
        type: "University",
        programs: ["Engineering", "Civil Engineering", "Mechanical Engineering"],
        avgCost: 2000,
        ranking: 120,
        image: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80",
        applicationDeadline: "2026-12-10",
        website: "https://www.nitt.edu",
        allowsInternationalStudents: true,
        visaSupport: "Full",
        coordinates: { lat: 10.7905, lng: 78.8343 },
        costOfLivingIndex: 25
      },
      {
        id: "bits-pilani",
        name: "BITS Pilani",
        location: "Pilani, India",
        city: "Pilani",
        country: "India",
        type: "University",
        programs: ["Engineering", "Science", "Management", "Technology"],
        avgCost: 8000,
        ranking: 85,
        image: "https://images.unsplash.com/photo-1560264357-8d9766400b5f?w=800&q=80",
        applicationDeadline: "2026-12-20",
        website: "https://www.bits-pilani.ac.in",
        allowsInternationalStudents: true,
        visaSupport: "Full",
        coordinates: { lat: 27.9046, lng: 75.7621 },
        costOfLivingIndex: 30
      },
      {
        id: "du-delhi",
        name: "University of Delhi",
        location: "New Delhi, India",
        city: "New Delhi",
        country: "India",
        type: "University",
        programs: ["Arts", "Science", "Commerce", "Technology"],
        avgCost: 1500,
        ranking: 250,
        image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80",
        applicationDeadline: "2026-11-30",
        website: "https://www.du.ac.in",
        allowsInternationalStudents: true,
        visaSupport: "Partial",
        coordinates: { lat: 28.5244, lng: 77.1855 },
        costOfLivingIndex: 40
      }
    ];
  }

  // Generic fallback for other queries
  return [
    {
      id: "stanford",
      name: "Stanford University",
      location: "Stanford, USA",
      city: "Stanford",
      country: "USA",
      type: "University",
      programs: ["Computer Science", "Engineering", "Business", "Science"],
      avgCost: 60000,
      ranking: 3,
      image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      applicationDeadline: "2026-12-31",
      website: "https://www.stanford.edu",
      allowsInternationalStudents: true,
      visaSupport: "Full",
      coordinates: { lat: 37.4275, lng: -122.1697 },
      costOfLivingIndex: 95
    }
  ];
}

export async function getAiJobSuggestions(profile: UserProfile): Promise<JobListing[]> {
  const systemInstruction = `You are Spark.E, a Career Opportunity Analyst. Given the user's profile, generate 4-6 highly relevant job recommendations with realistic company names, locations, and job details. Return only valid JSON.`;
  const prompt = `Recommend jobs for this user profile:
${JSON.stringify(profile, null, 2)}`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.4, maxTokens: 1200 });
    const results = parseAIJson<JobListing[]>(text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Job Suggestions Failed:", error);
    return [];
  }
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
  const systemInstruction = `You are Spark.E, a global market insight analyst. Provide salary benchmarks, growth trends, in-demand skills, and top employers for the given career in the given country. Return only valid JSON.`;
  const prompt = `Career: ${careerId}
Country: ${country}`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 1200 });
    return parseAIJson<MarketInsights>(text) ?? null;
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
  const cached = await getCachedInstitutions(targetLocation);
  if (cached && cached.length > 0) {
    return cached as Institution[];
  }

  const systemInstruction = `You are an expert global education consultant.
Return ONLY valid JSON array. No markdown, no explanation, no extra text.
Recommend 8 REAL institutions matching the student's profile and career goals.
Use actual, existing institutions with real websites and valid locations.
Schema per object: {"id":"string","name":"string","location":"string","city":"string","country":"string","type":"University","programs":["string"],"avgCost":number,"ranking":number,"image":"","applicationDeadline":"string","website":"string","allowsInternationalStudents":true,"visaSupport":"Full","coordinates":{"lat":number,"lng":number},"costOfLivingIndex":1.0}`;

  const prompt = `Return a JSON array of exactly 8 real universities for:
Career: ${careerId}, Location: ${targetLocation}, Budget: $${profile.budget}/year, Country: ${profile.country}
Include universities from at least 4 different countries. Output ONLY the JSON array, nothing else.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.5, maxTokens: 2000 });
    const institutions = parseAIJson<Institution[]>(text);
    const result = Array.isArray(institutions) ? institutions.slice(0, 8) : [];

    if (result.length > 0) {
      await saveCachedInstitutions(result).catch((err) =>
        console.warn("Failed to cache institutions (non-blocking):", err)
      );
    }

    return result;
  } catch (error) {
    console.error("Get Dynamic Institutions Error:", error);
    return [];
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
Find real study materials from Coursera, edX, MIT OpenCourseWare, YouTube, Udemy.
Schema per object: {"id":"string","title":"string","type":"video","provider":"string","url":"string","careerId":"string","duration":"string","thumbnail":"","region":"Global","language":"English","rating":4.5,"skillLevel":"Beginner","description":"string","tags":[]}`;

  const prompt = `Return a JSON array of 8 real study materials for: Career=${careerId}, Level=${skillLevel}, Region=${region}. Output ONLY the JSON array.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.5, maxTokens: 2000 });
    const materials = parseAIJson<any[]>(text);
    const result = Array.isArray(materials) ? materials.slice(0, 8) : [];

    if (result.length > 0) {
      await saveCachedStudyMaterials(result, careerId).catch((err) =>
        console.warn("Failed to cache study materials (non-blocking):", err)
      );
    }

    return result;
  } catch (error) {
    console.error("Get Dynamic Materials Error:", error);
    return [];
  }
}

export async function getCareerHubIntelligence(city: string, country: string): Promise<any> {
  const cached = await getCachedCareerHub(city, country);
  if (cached) {
    console.log("✓ Using cached career hub data for:", city, country);
    return cached;
  }

  const systemInstruction = `You are Spark.E, a Global Career Market Intelligence Specialist for 2026. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Analyze the real 2026 job market for ${city}, ${country}. Return a JSON object with market analysis data.`;

  try {
    const text = await callLLM(prompt, systemInstruction, {
      temperature: 0.1,
      maxTokens: 1024,
    });
    const hubData = parseAIJson<any>(text);
    if (!hubData) {
      console.error("Career Hub Intelligence: failed to parse LLM response");
      return null;
    }
    const result = { ...hubData, city, country };

    await saveCachedCareerHub(result).catch((err) =>
      console.warn("Failed to cache career hub data (non-blocking):", err)
    );

    return result;
  } catch (error) {
    console.error("Career Hub Intelligence Error:", error);
    return null;
  }
}

export async function aiSearchCareerHubs(query: string): Promise<{ city: string; country: string }[]> {
  const systemInstruction = `You are a Global Career Intelligence Engine. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `The user is searching for career hubs with this query: "${query}".
Identify 4-6 real global cities that best match this query.
Return a JSON array: [{ "city": string, "country": string }]
Only use real cities with well-known job markets.`;

  try {
    const text = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 256 });
    const results = parseAIJson<{ city: string; country: string }[]>(text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Career Hub Search Error:", error);
    return [];
  }
}

export async function getDashboardIntelligence(
  profile: UserProfile,
  primaryCareerId: string
): Promise<DashboardIntelligence | null> {
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
  try {
    const opportunities = await db.manyOrNone<FundingOpportunity>(
      "SELECT * FROM funding_opportunities WHERE deadline > CURRENT_DATE ORDER BY deadline ASC"
    );

    if (!opportunities || opportunities.length === 0) {
      return [];
    }

    return opportunities.map((opp, index) => ({
      ...opp,
      matchScore: Math.max(55, 100 - index * 8),
      matchReasoning: `This ${opp.type.toLowerCase()} is a strong fit for your profile and international education goals.`,
    }));
  } catch (error) {
    console.error("Match Scholarships Error:", error);
    return [];
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
  targetCareer: string
): Promise<any> {
  const systemInstruction = `You are a visa guidance specialist. Provide a structured visa roadmap for the student based on their profile and the target country.`;
  const prompt = `Profile: ${profile.name || 'Student'}, education: ${profile.education || 'N/A'}, interests: ${profile.interests || 'N/A'}, budget: $${profile.budget || 0}, career: ${targetCareer}. Target country: ${targetCountry}.`;

  try {
    const raw = await callLLM(prompt, systemInstruction, { temperature: 0.2, maxTokens: 1200 });
    const parsed = parseAIJson<any>(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Non-JSON visa response');
    return parsed;
  } catch (error) {
    console.error("Visa Guidance Error:", error);
    return {
      recommendedVisaTypes: ["Student Visa", "Work Visa"],
      processingTimeline: { application: "4-6 weeks", approval: "6-8 weeks" },
      estimatedCost: { totalEstimate: 2500, currency: "USD" },
      requiredDocuments: ["Passport", "Transcript", "Financial guarantee letter"],
      languageAndAcademicTests: ["IELTS 6.5", "TOEFL 90"],
      financialRequirements: { minimumSavings: 15000, currency: "USD" },
      sponsorshipLikelihood: "Medium",
      embassyInfo: { officialPortalUrl: `https://www.${targetCountry.toLowerCase().replace(/\s+/g, '')}.gov` },
      nextSteps: ["Apply to program", "Submit visa application", "Prepare for interview"],
      postArrivalRequirements: ["Register locally", "Open a bank account"],
      importantDeadlines: `Apply at least 3 months before the program start date for ${targetCountry}.`,
      countrySpecificNotes: `Visa requirements for ${targetCountry} vary. Check the official embassy site before applying.`,
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
