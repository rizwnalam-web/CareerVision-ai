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

export async function getCareerAdviceBatch(
  requests: Array<{ prompt: string; profile: UserProfile; additionalContext?: { resume?: string; linkedIn?: string } }>
): Promise<string[]> {
  return callBackend<string[]>('/career-advice/batch', 'POST', { requests });
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

export async function getVisaGuidance(
  profile: UserProfile,
  targetCountry: string,
  targetCareer: string,
  institution?: { name: string; city?: string; country?: string; type?: string; programs?: string[] }
): Promise<any> {
  return callBackend<any>('/visa-guidance', 'POST', { profile, targetCountry, targetCareer, institution });
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

export interface CareerDirectoryEntry {
  id: string;
  title: string;
  category: string;
  sector: string;
  visibility: "public" | "private";
  country: string;
  demandScore: number;
  avgSalaryUSD: number;
  growth: "high" | "medium" | "stable";
  workType: "Remote" | "On-site" | "Hybrid" | "Mobile";
  tags: string[];
  topSkills: string[];
  topCompanies: string[];
  matchScore: number;
  matchReason: string;
  visaFriendly: boolean;
}

export interface CareerDirectoryResult {
  homeCountry: CareerDirectoryEntry[];
  targetCountry: CareerDirectoryEntry[];
  top10: CareerDirectoryEntry[];
}

export async function getCareerDirectories(profile: UserProfile): Promise<CareerDirectoryResult> {
  return callBackend<CareerDirectoryResult>('/career-directories', 'POST', { profile });
}

export interface CountryCareerEntry {
  id: string;
  title: string;
  description: string;
  growth: "high" | "medium" | "stable";
  category: string;
  subCategory: string;
  workType: "Remote" | "On-site" | "Hybrid" | "Mobile";
  tags: string[];
  visibility: "public" | "private";
  demandScore: number;
  avgSalaryUSD: number;
  topSkills: string[];
  topCompanies: string[];
  country: string;
}

export async function getCareersByCountry(
  country: string,
  profile: Partial<UserProfile>,
  forceRefresh = false
): Promise<CountryCareerEntry[]> {
  return callBackend<CountryCareerEntry[]>('/careers-by-country', 'POST', { country, profile, forceRefresh });
}

export interface JobDirectoryCategory {
  category: string;
  jobs: string[];
}

export interface JobDirectorySector {
  sector: 'Government' | 'Private';
  icon: string;
  categories: JobDirectoryCategory[];
}

export interface JobDirectory {
  country: string;
  sectors: JobDirectorySector[];
  generatedAt: string;
}

export async function getJobDirectory(
  country: string,
  profile?: { interests?: string[]; targetCareerId?: string; targetCareer?: string; education?: string }
): Promise<JobDirectory> {
  return callBackend<JobDirectory>('/job-directory', 'POST', { country, profile });
}

// ─── Career Requirements & Artifacts ─────────────────────────────────────────

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

export async function getCareerRequirements(
  careerTitle: string,
  country: string
): Promise<CareerRequirements> {
  const result = await callBackend<{ data: CareerRequirements }>('/career-requirements', 'POST', {
    careerTitle,
    country,
  });
  // callBackend returns the parsed JSON; the route wraps in { success, data }
  return (result as unknown as { data: CareerRequirements }).data ?? (result as unknown as CareerRequirements);
}

export interface CareerMilestone {
  ageRange: string;
  title: string;
  description: string;
  requirements: string[];
}

export async function getCareerMilestones(
  careerTitle: string,
  userAge: number,
  userEducation: string,
  country: string
): Promise<CareerMilestone[]> {
  return callBackend<CareerMilestone[]>('/milestones', 'POST', {
    careerTitle,
    userAge,
    userEducation,
    country,
  });
}

// ─── Network & Community ──────────────────────────────────────────────────────

export async function getNetworkCommunities(profile: UserProfile): Promise<any[]> {
  return callBackend<any[]>('/network-communities', 'POST', { profile });
}

export async function getNetworkMentors(profile: UserProfile): Promise<any[]> {
  return callBackend<any[]>('/network-mentors', 'POST', { profile });
}

export async function getNetworkResumeReviews(profile: UserProfile): Promise<any[]> {
  return callBackend<any[]>('/network-resume-reviews', 'POST', { profile });
}

export async function getNetworkReferrals(profile: UserProfile): Promise<any[]> {
  return callBackend<any[]>('/network-referrals', 'POST', { profile });
}

export async function getNetworkCompanies(profile: UserProfile, query?: string): Promise<any[]> {
  return callBackend<any[]>('/network-companies', 'POST', { profile, query });
}
