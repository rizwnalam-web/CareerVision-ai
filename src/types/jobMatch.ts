// ─────────────────────────────────────────────────────────────────────────────
// AI Job Matching – Frontend Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LearningResource {
  title: string;
  type: "course" | "book" | "certification" | "project" | "tutorial";
  platform: string;
  url: string;
  estimatedHours: number;
  priority: "critical" | "high" | "medium" | "low";
}

export interface SkillGap {
  skill: string;
  currentLevel: "none" | "beginner" | "intermediate" | "advanced";
  requiredLevel: "beginner" | "intermediate" | "advanced" | "expert";
  importance: "critical" | "high" | "medium" | "low";
  learningPath: LearningResource[];
}

export interface SalaryPrediction {
  currency: string;
  min: number;
  median: number;
  max: number;
  percentile25: number;
  percentile75: number;
  marketTrend: "rising" | "stable" | "declining";
  confidenceLevel: "high" | "medium" | "low";
  factors: string[];
  comparison: string;
}

export interface CultureDimensions {
  workLifeBalance: number;
  innovationFocus: number;
  collaboration: number;
  autonomy: number;
  growthOpportunity: number;
}

export interface CultureAnalysis {
  overallFitScore: number;
  dimensions: CultureDimensions;
  strengths: string[];
  watchouts: string[];
  summary: string;
}

export interface JobMatchAnalysis {
  matchScore: number;
  skillMatchScore: number;
  cultureFitScore: number;
  salaryFitScore: number;
  matchReasons: string[];
  skillGaps: SkillGap[];
  salaryPrediction: SalaryPrediction;
  cultureAnalysis: CultureAnalysis;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string | null;
  workType: "remote" | "hybrid" | "onsite";
  skillsRequired: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  industry: string | null;
  experienceLevel: string | null;
  sourceUrl: string | null;
  postedAt: string;
  description?: string;
  requirements?: string;
  companyCulture?: string;
}

export interface JobMatchResult extends JobMatchAnalysis {
  jobId: string;
}

export interface CachedMatch extends JobMatchAnalysis {
  id: string;
  jobId: string;
  computedAt: string;
  // Joined job fields
  title: string;
  company: string;
  location: string | null;
  workType: "remote" | "hybrid" | "onsite";
  skillsRequired: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  industry: string | null;
  experienceLevel: string | null;
  sourceUrl: string | null;
  postedAt: string;
}

export interface WorkPreferences {
  workTypePreference: "remote" | "hybrid" | "onsite" | "any";
  minSalary: number | null;
  maxSalary: number | null;
  salaryCurrency: string;
  preferredLocations: string[];
  preferredIndustries: string[];
  targetRole: string | null;
  setupCompletedAt?: string;
  updatedAt?: string;
}

export interface SemanticMatchBreakdown {
  semantic: number;
  title: number;
  skills: number;
  salary: number;
  preference: number;
}

export interface SemanticMatchedJob {
  job: JobListing;
  score: number;
  breakdown: SemanticMatchBreakdown;
  reasons: string[];
  missingSkills: string[];
}
