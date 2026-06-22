export interface CareerPath {
  id: string;
  title: string;
  description: string;
  growth: "high" | "medium" | "stable";
  category: string;
  subCategory: string;
  milestones: Milestone[];
  workType: "Remote" | "On-site" | "Hybrid" | "Mobile";
  tags: string[];
  // Inclusivity & diversity fields
  disabilityFriendly?: boolean;
  remoteAccessible?: boolean;
  culturalContext?: string[];
}

export interface Milestone {
  ageRange: string;
  title: string;
  description: string;
  requirements: string[];
}

export interface Institution {
  id: string;
  name: string;
  location: string;
  type: "University" | "Vocational" | "Polytechnic" | "Medical School" | "Business School";
  avgCost: number;
  programs: string[];
  ranking?: number;
  image: string;
  applicationDeadline: string;
  website: string;
  allowsInternationalStudents: boolean;
  visaSupport: "Full" | "Partial" | "None";
  coordinates: {
    lat: number;
    lng: number;
  };
  city: string;
  country: string;
  costOfLivingIndex: number; // 1.0 = average, >1.0 = expensive
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: "video" | "audio" | "course" | "article";
  provider: string;
  url: string;
  careerId: string; // Primary career ID
  secondaryCareerIds?: string[]; // Optional secondary careers
  duration: string;
  thumbnail: string;
  region: "Global" | "NA" | "EU" | "ASIA" | "UK";
  language: string;
  rating: number;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  tags?: string[];
  description?: string;
  lastUpdated?: string;
  reviewCount?: number;
  ratingSource?: string;
}

export interface FundingOpportunity {
  id: string;
  name: string;
  provider: string;
  amount: number;
  deadline: string;
  eligibilityCriteria: string[];
  description: string;
  category: "Merit" | "Need" | "Interest" | "Geographic";
  type: "Scholarship" | "Grant" | "Loan";
  terms?: string; // For loans: interest rate, etc.
  matchScore?: number; // AI calculated 0-100
  matchReasoning?: string; // AI explanation
  website?: string; // Direct application URL
}

export interface UserProfile {
  name: string;
  age: number;
  education: string;
  interests: string[];
  budget: number;
  country: string;
  targetLocation?: string;
  targetCareerId?: string;
  completedMilestones: string[]; // Stores composite IDs like "careerId-milestoneIndex"
  academicPerformance?: {
    gpa: number;
    achievements: string[];
  };
  financialProfile?: {
    annualIncome: number;
    currentSavings: number;
    monthlyExpenses: { category: string; amount: number }[];
    goals: { id: string; title: string; target: number; current: number; deadline: string }[];
    debt: { id: string; title: string; amount: number; interestRate: number }[];
  };
  // Visa & Immigration fields
  visaRequirements?: string[];
  visaSponsorshipNeeded?: boolean;
  targetVisaType?: string; // e.g., "F-1 Student Visa", "H-1B Work Visa", "Green Card"
  citizenCountry?: string; // Home country for visa matching
  preferredCurrency?: string; // Optional user currency preference, e.g. "USD" or "CHF"
  currentRole?: string;
  targetCareer?: string;
  timeline?: string;
  skills?: string[];
  // Auth and System fields
  uid?: string;
  email?: string;
  createdAt?: any; // Firestore serverTimestamp or Timestamp
  updatedAt?: any;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
    period: "yearly" | "monthly" | "hourly";
  };
  type: "Full-time" | "Part-time" | "Contract" | "Remote" | "Hybrid";
  postedAt: string;
  url: string;
  careerId: string;
  description: string;
  logo?: string;
}

export interface MarketInsights {
  careerId: string;
  salaryBenchmarks: {
    entry: number;
    mid: number;
    senior: number;
    currency: string;
  };
  growthForecast: {
    percentage: number;
    trend: "rising" | "stable" | "declining";
    description: string;
  };
  inDemandSkills: {
    name: string;
    importance: number; // 0-100
  }[];
  topHiringCompanies: string[];
}

export interface CareerHubIntelligence {
  city: string;
  country: string;
  intensity: number; // 0-100 market intensity score
  topCareers: {
    title: string;
    demandScore: number; // 0-100
    avgSalary: {
      entry: number;
      mid: number;
      senior: number;
      currency: string;
    };
    jobGrowth: number; // percentage
    openings: number; // approximate count
  }[];
  marketHealthScore: number; // 0-100
  averageSalaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  costOfLiving: number; // index (1.0 = average)
  requiredSkills: {
    skill: string;
    demand: number; // 0-100
  }[];
  visaOpenness: "High" | "Medium" | "Low";
  hiringTrends: string; // Market description
  topEmployers: string[];
  internshipOpportunities: number;
  remoteWorkPercentage: number; // % of jobs that are remote/hybrid
}

export interface DashboardIntelligence {
  readiness: {
    overall: number;
    skills: number;
    education: number;
    experience: number;
  };
  nextActions: {
    title: string;
    impact: string;
    type: 'learn' | 'build' | 'practice';
    urgent: boolean;
  }[];
  sectors: {
    name: string;
    trend: string;
    score: number;
    status: 'Hot' | 'Rising' | 'Stable' | 'Emerging';
    color: string;
    spark: { v: number }[];
    news: string[];
  }[];
  salaryTrajectory: { y: string; v: number }[];
}

export interface CareerSkillGap {
  skill: string;
  owned: boolean;
  demand: number;
}
