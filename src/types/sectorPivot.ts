// ─────────────────────────────────────────────────────────────────────────────
// Sector Pivot Certification Types
// ─────────────────────────────────────────────────────────────────────────────

export type PivotPhase = "select" | "project" | "submit" | "review" | "certificate";

export type MilestoneStatus = "locked" | "active" | "submitted" | "reviewed" | "passed" | "failed";

export interface SectorOption {
  id: string;
  title: string;
  category: string;
  description: string;
  demandLevel: "high" | "medium" | "emerging";
  avgSalary: string;
  transitionDifficulty: "low" | "moderate" | "high";
  topSkills: string[];
}

export interface ProjectMilestone {
  id: string;
  order: number;
  title: string;
  description: string;
  deliverable: string;
  rubricCriteria: RubricItem[];
  status: MilestoneStatus;
  submission?: MilestoneSubmission;
  review?: MilestoneReview;
}

export interface RubricItem {
  criterion: string;
  weight: number;       // 0–100, all criteria sum to 100
  description: string;
}

export interface MilestoneSubmission {
  text: string;
  files?: string[];     // file names (upload stubs)
  submittedAt: string;
}

export interface MilestoneReview {
  score: number;        // 0–100
  passed: boolean;
  feedback: ReviewFeedback[];
  overallComment: string;
  reviewedAt: string;
}

export interface ReviewFeedback {
  criterion: string;
  score: number;        // 0–100
  comment: string;
  suggestion: string;
}

export interface ScopedProject {
  id: string;
  targetSector: string;
  originBackground: string;
  title: string;
  scenario: string;
  milestones: ProjectMilestone[];
  estimatedHours: number;
  skills: string[];
}

export interface PivotCertificate {
  id: string;
  verificationId: string;
  holderName: string;
  originField: string;
  targetSector: string;
  projectTitle: string;
  overallScore: number;
  issuedAt: string;
  milestoneScores: { title: string; score: number }[];
}

export interface ResumeProjectSnippet {
  title: string;
  bullets: string[];
  technologies: string[];
  certification: string;
}
