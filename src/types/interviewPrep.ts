// ─────────────────────────────────────────────────────────────────────────────
// Interview Preparation – Frontend Types
// ─────────────────────────────────────────────────────────────────────────────

export type SessionType = "behavioral" | "technical" | "mixed" | "situational";
export type QuestionType = "behavioral" | "technical" | "situational" | "culture";
export type Difficulty = "easy" | "medium" | "hard";
export type ReadinessLevel = "not_ready" | "developing" | "ready" | "exceptional";

export interface PrepQuestion {
  id: string;
  text: string;
  type: QuestionType;
  difficulty: Difficulty;
  industry: string;
  category: string;
  subCategory?: string;
  hints: string[];
  expectedKeywords: string[];
  sampleAnswer?: string;
  followUps: string[];
}

export interface STARBreakdown {
  situation: number;
  task: number;
  action: number;
  result: number;
}

export interface AnswerScore {
  overall: number;
  clarity: number;
  relevance: number;
  structure: number;
  keywords: number;
  confidence: number;
  fillerWords: string[];
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  starBreakdown?: STARBreakdown;
}

export interface PrepAnswer {
  questionId: string;
  questionText: string;
  transcript: string;
  durationSeconds: number;
  score?: AnswerScore;
  recordedAt: string;
}

export interface SessionFeedback {
  overallScore: number;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  readinessLevel: ReadinessLevel;
  nextSteps: string[];
}

export interface PrepSession {
  id: string;
  sessionType: SessionType;
  industry: string;
  role: string;
  company?: string;
  overallScore?: number;
  status: "active" | "completed" | "abandoned";
  durationSeconds?: number;
  createdAt: string;
  completedAt?: string;
  sessionFeedback?: SessionFeedback;
}

export interface VideoAnalysis {
  transcript: string;
  fillerWordCount: number;
  speakingPaceWpm: number;
  estimatedConfidence: number;
  keyThemes: string[];
  suggestions: string[];
}

export interface PeerSession {
  id: string;
  roomCode: string;
  creatorId: string;
  participantId?: string;
  role: string;
  industry: string;
  sessionType: SessionType;
  questionIds: string[];
  creatorReview?: object;
  participantReview?: object;
  status: "open" | "active" | "completed" | "expired";
  expiresAt: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI state types
// ─────────────────────────────────────────────────────────────────────────────

export type PrepTab = "mock-sandbox" | "simulator" | "questions" | "video" | "peer" | "history";

export interface SimulatorConfig {
  sessionType: SessionType;
  industry: string;
  role: string;
  company: string;
  questionCount: number;
}

export const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Education", "Retail",
  "Manufacturing", "Consulting", "Marketing", "Legal", "Government",
  "Non-profit", "Startups", "E-commerce", "Cybersecurity", "AI/ML",
] as const;

export type Industry = typeof INDUSTRIES[number] | "general";

export const READINESS_CONFIG: Record<ReadinessLevel, { label: string; color: string; bg: string; description: string }> = {
  not_ready:   { label: "Not Ready",   color: "text-rose-600",    bg: "bg-rose-50 border-rose-200",    description: "Keep practising — significant improvement needed" },
  developing:  { label: "Developing",  color: "text-amber-600",   bg: "bg-amber-50 border-amber-200",   description: "Making progress — focus on structure and examples" },
  ready:       { label: "Interview Ready", color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200", description: "Strong performance — fine-tune the details" },
  exceptional: { label: "Exceptional", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", description: "Outstanding — you're well prepared" },
};
