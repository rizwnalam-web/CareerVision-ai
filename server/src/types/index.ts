export interface CareerPath {
  id: string;
  title: string;
  description: string;
  growth: "high" | "medium" | "stable";
  category: string;
  subCategory: string;
  workType: "Remote" | "On-site" | "Hybrid" | "Mobile";
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Milestone {
  id?: string;
  careerId: string;
  ageRange: string;
  title: string;
  description: string;
  requirements: string[];
  sequenceOrder: number;
  createdAt?: Date;
}

export interface Institution {
  id: string;
  name: string;
  location: string;
  city: string;
  country: string;
  type: "University" | "Vocational" | "Polytechnic" | "Medical School" | "Business School";
  avgCost: number;
  programs: string[];
  ranking?: number;
  image: string;
  applicationDeadline: string;
  website: string;
  allowsInternationalStudents: boolean;
  visaSupport: "Full" | "Partial" | "None";
  latitude: number;
  longitude: number;
  costOfLivingIndex: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: "video" | "audio" | "course" | "article";
  provider: string;
  url: string;
  careerId: string;
  duration: string;
  thumbnail: string;
  region: "Global" | "NA" | "EU" | "ASIA" | "UK";
  language: string;
  rating: number;
  skillLevel: "Beginner" | "Intermediate" | "Advanced";
  tags?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FundingOpportunity {
  id: string;
  name: string;
  provider: string;
  amount: number;
  deadline: string;
  eligibilityCriteria: string;
  description: string;
  category: "Merit" | "Need" | "Interest" | "Geographic";
  type: "Scholarship" | "Grant" | "Loan";
  terms?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  id: string;
  firebaseUid?: string;
  email: string;
  name: string;
  age?: number;
  education?: string;
  interests?: string;
  budget?: number;
  country?: string;
  targetLocation?: string;
  targetCareerId?: string;
  gpa?: number;
  achievements?: string;
  annualIncome?: number;
  currentSavings?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterviewQuestion {
  id: string;
  text: string;
  tier: "Behavioral" | "Role-Specific" | "Company-Specific";
  category: string;
  company?: string;
  tips?: string;
  targetKeywords?: string;
  createdAt?: Date;
}

export interface InterviewSession {
  id: string;
  userId: string;
  role: string;
  company?: string;
  totalScore: number;
  sessionData: Record<string, any>;
  createdAt: Date;
}

export interface InterviewFeedback {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string;
  starScore: number;
  confidenceScore: number;
  sentiment: "Positive" | "Neutral" | "Needs Improvement";
  createdAt?: Date;
}
