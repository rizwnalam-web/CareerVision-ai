// ─────────────────────────────────────────────────────────────────────────────
// Resume & Portfolio Types (frontend)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumePersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  summary: string;
}

export interface ResumeExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  description: string;
  achievements: string[];
}

export interface ResumeEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa: string;
  achievements: string[];
}

export interface ResumeSkills {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  url: string;
}

export interface ResumeContent {
  personalInfo: ResumePersonalInfo;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: ResumeSkills;
  projects: ResumeProjectItem[];
  awards: string[];
}

export interface ATSSuggestion {
  category: "keywords" | "formatting" | "content" | "structure";
  priority: "critical" | "high" | "medium" | "low";
  issue: string;
  fix: string;
}

export interface ATSReport {
  score: number;
  sections: {
    keywords: { score: number; found: string[]; missing: string[] };
    formatting: { score: number; issues: string[] };
    content: { score: number; suggestions: string[] };
    structure: { score: number; issues: string[] };
  };
  suggestions: ATSSuggestion[];
  summary: string;
}

export interface ResumeVersion {
  id: string;
  versionNumber: number;
  fileName?: string;
  fileFormat?: string;
  atsScore?: number;
  changeSummary?: string;
  createdAt: string;
}

export interface ResumeRecord {
  id: string;
  title: string;
  currentVersionId?: string;
  versionNumber?: number;
  fileName?: string;
  content?: ResumeContent;
  atsScore?: number;
  atsReport?: ATSReport;
  updatedAt?: string;
}

export interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  description?: string;
  techStack: string[];
  role?: string;
  startDate?: string;
  endDate?: string;
  isOngoing: boolean;
  projectUrl?: string;
  repoUrl?: string;
  imageUrl?: string;
  tags: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PortfolioProjectInput = Omit<PortfolioProject, "id" | "userId" | "createdAt" | "updatedAt">;
