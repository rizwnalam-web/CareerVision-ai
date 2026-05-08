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

const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$|\/api$/, "");

export interface GlobalInsight {
  flag: string;
  city: string;
  country: string;
  stat: string;
  category: string;
  color: 'emerald' | 'indigo' | 'amber' | 'rose' | 'purple';
}

async function callBackend<T>(endpoint: string, method: "GET" | "POST" = "POST", body?: any): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}/api/careers-ai${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();
    return data.data as T;
  } catch (error) {
    console.error(`Backend call failed: ${endpoint}`, error);
    throw error;
  }
}

export async function aiSearchStudyMaterials(query: string): Promise<StudyMaterial[]> {
  return callBackend<StudyMaterial[]>("/search-study-materials", "POST", { query });
}

export async function aiSearchJobs(query: string, location: string): Promise<JobListing[]> {
  return callBackend<JobListing[]>("/search-jobs", "POST", { query, location });
}

export async function getAiJobSuggestions(profile: UserProfile): Promise<JobListing[]> {
  return callBackend<JobListing[]>('/job-suggestions', 'POST', { profile });
}

export async function aiSearchInstitutions(query: string, profile: UserProfile): Promise<Institution[]> {
  return callBackend<Institution[]>('/search-institutions', 'POST', { query, profile });
}

export async function getAiInstitutionRecommendations(
  profile: UserProfile,
  careerTitle: string
): Promise<{ institution: Institution; rationale: string }[]> {
  return callBackend<{ institution: Institution; rationale: string }[]>('/institution-recommendations', 'POST', {
    profile,
    careerTitle,
  });
}

export async function getTopGlobalCareers(): Promise<CareerPath[]> {
  return callBackend<CareerPath[]>("/top-careers", "GET");
}

export async function aiSearchCareerPaths(query: string): Promise<CareerPath[]> {
  return callBackend<CareerPath[]>("/search-career-paths", "POST", { query });
}

export async function getDynamicInstitutions(
  profile: UserProfile,
  careerId: string,
  targetLocation: string
): Promise<Institution[]> {
  return callBackend<Institution[]>("/dynamic-institutions", "POST", {
    profile,
    careerId,
    targetLocation,
  });
}

export async function getDynamicStudyMaterials(
  careerId: string,
  skillLevel: string,
  region: string
): Promise<StudyMaterial[]> {
  return callBackend<StudyMaterial[]>("/dynamic-study-materials", "POST", {
    careerId,
    skillLevel,
    region,
  });
}

export async function getCareerHubIntelligence(city: string, country: string): Promise<any> {
  return callBackend<any>(`/career-hub/${city}/${country}`, "GET");
}

export async function aiSearchCareerHubs(query: string): Promise<{ city: string; country: string }[]> {
  return callBackend<{ city: string; country: string }[]>("/search-career-hubs", "POST", { query });
}
export async function getAiProactiveJobRecommendations(profile: UserProfile, savedJobs: JobListing[]): Promise<JobListing[]> {
  return callBackend<JobListing[]>('/proactive-job-recommendations', 'POST', { profile, savedJobs });
}

export async function getMarketInsights(careerId: string, country: string): Promise<MarketInsights | null> {
  return callBackend<MarketInsights | null>('/market-insights', 'POST', { careerId, country });
}
export async function getDashboardIntelligence(
  profile: UserProfile,
  primaryCareerId: string
): Promise<DashboardIntelligence | null> {
  try {
    return await callBackend<DashboardIntelligence>("/dashboard-intelligence", "POST", {
      profile,
      primaryCareerId,
    });
  } catch (error) {
    console.error("Dashboard Intelligence Error:", error);
    return null;
  }
}

export async function getCareerSkillGap(profile: UserProfile, careerTitle: string): Promise<CareerSkillGap[]> {
  return callBackend<CareerSkillGap[]>("/skill-gap", "POST", { profile, careerTitle });
}
export async function getCareerAdvice(
  prompt: string,
  profile: UserProfile,
  additionalContext: { resume?: string; linkedIn?: string } = {}
): Promise<string> {
  return callBackend<string>('/career-advice', 'POST', { prompt, profile, additionalContext });
}

export async function matchScholarships(profile: UserProfile): Promise<any[]> {
  return callBackend<any[]>('/match-scholarships', 'POST', { profile });
}

export async function getRecommendedCourses(sector: string): Promise<any[]> {
  return callBackend<any[]>('/recommended-courses', 'POST', { sector });
}

export async function generateCoverLetter(institution: any, userProfile: UserProfile, highlights: string): Promise<string> {
  return callBackend<string>('/generate-cover-letter', 'POST', { institution, userProfile, highlights });
}

export async function getLatestCareerNews(preferredCountry?: string): Promise<{ career: string; country: string; aiTech: string }[]> {
  return callBackend<{ career: string; country: string; aiTech: string }[]>('/latest-career-news', 'POST', { preferredCountry });
}

export async function getVisaGuidance(profile: UserProfile, targetCountry: string, targetCareer: string): Promise<any> {
  return callBackend<any>('/visa-guidance', 'POST', { profile, targetCountry, targetCareer });
}

export async function getGlobalContextInsights(
  targetLocation: string,
  interests: string[],
  targetCareerId: string
): Promise<GlobalInsight[]> {
  return callBackend<GlobalInsight[]>('/global-context-insights', 'POST', {
    targetLocation,
    interests,
    targetCareerId,
  });
}
