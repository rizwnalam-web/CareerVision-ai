// ─────────────────────────────────────────────────────────────────────────────
// Code Review / Project Audit Types
// ─────────────────────────────────────────────────────────────────────────────

export type AuditPhase = "input" | "auditing" | "report" | "certificate";

export type InputType = "github" | "url";

export interface AuditInput {
  type: InputType;
  value: string;               // repo URL or live URL
  description?: string;        // optional project context
  techStack?: string[];        // optional hint
}

export interface ArchitectureReview {
  score: number;               // 0–100
  findings: AuditFinding[];
}

export interface PerformanceReview {
  score: number;
  findings: AuditFinding[];
}

export interface SecurityReview {
  score: number;
  findings: AuditFinding[];
  vulnerabilities: SecurityVulnerability[];
}

export interface AuditFinding {
  category: string;
  severity: "critical" | "warning" | "info" | "good";
  title: string;
  description: string;
  recommendation: string;
}

export interface SecurityVulnerability {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  location?: string;
  fix: string;
}

export interface PRRecommendation {
  id: string;
  title: string;
  description: string;
  category: "architecture" | "performance" | "security" | "code-quality" | "documentation";
  priority: "critical" | "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
  impact: string;
}

export interface CodeAuditReport {
  id: string;
  inputType: InputType;
  inputValue: string;
  overallScore: number;        // 0–100
  grade: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  architecture: ArchitectureReview;
  performance: PerformanceReview;
  security: SecurityReview;
  prRecommendations: PRRecommendation[];
  summary: string;
  strengths: string[];
  techStackDetected: string[];
  auditedAt: string;
}

export interface CodeAuditCertificate {
  id: string;
  verificationId: string;
  holderName: string;
  projectName: string;
  projectUrl: string;
  overallScore: number;
  grade: string;
  techStack: string[];
  issuedAt: string;
}

export interface CodeAuditResumeSnippet {
  title: string;
  bullets: string[];
  technologies: string[];
  certification: string;
}
