const API_BASE = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$|\/api$/, "");

async function post<T>(endpoint: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}/api/innovative${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  const data = await res.json();
  return data.data as T;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage { role: "user" | "coach"; content: string; timestamp: Date }

export interface SimScenario {
  title: string; context: string; challenge: string;
  options: { id: string; text: string }[];
  bestOption: string; skills: string[]; industry: string; role: string;
}
export interface SimEvaluation {
  correct: boolean; score: number; feedback: string; insight: string; skillsUsed: string[];
}

export interface SoftSkillQuestion {
  id: number; skill: string; question: string; type: string;
  options: { id: string; text: string; traits: string[] }[];
}
export interface SoftSkillAnalysis {
  overallScore: number; personality: string;
  strengths: { skill: string; score: number; description: string }[];
  improvements: { skill: string; score: number; tip: string }[];
  workStyle: string; communicationStyle: string;
  topTraits: string[]; careerFit: string[];
}

export interface SalaryScenario {
  employerName: string; role: string; initialOffer: number;
  marketMin: number; marketMedian: number; marketMax: number; negotiationRoom: number;
  employerOpeningLine: string; tips: string[]; commonMistakes: string[];
}
export interface NegotiationResponse {
  hrReply: string; newOffer: number | null; negotiationScore: number;
  feedback: string; tactic: string; dealClosed: boolean; finalOffer: number | null;
}

export interface SideHustle {
  title: string; category: string; description: string;
  monthlyEarning: { min: number; max: number }; startupCost: number;
  hoursPerWeek: number; difficulty: "Easy" | "Medium" | "Hard";
  skills: string[]; gettingStarted: string[]; platforms: string[]; fitScore: number;
}

export interface BurnoutAssessment {
  burnoutRisk: "Low" | "Moderate" | "High" | "Critical"; riskScore: number;
  dimensions: { exhaustion: number; cynicism: number; efficacy: number; workload: number; autonomy: number; social: number };
  summary: string; redFlags: string[];
  recommendations: { category: string; action: string; impact: "High" | "Medium" | "Low" }[];
  weeklyPlan: { day: string; action: string }[];
  professionalHelp: boolean;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const careerCoachChat = (message: string, history: ChatMessage[], profile?: any) =>
  post<{ reply: string }>("/career-coach/chat", { message, history, profile });

export const getSimScenario = (industry: string, role: string, difficulty?: string) =>
  post<SimScenario>("/industry-sim/scenario", { industry, role, difficulty });

export const evaluateSimAnswer = (scenario: SimScenario, chosenOption: string, role: string) =>
  post<SimEvaluation>("/industry-sim/evaluate", { scenario, chosenOption, role });

export const getSoftSkillQuestions = (targetRole?: string) =>
  post<SoftSkillQuestion[]>("/soft-skills/questions", { targetRole });

export const analyzeSoftSkills = (answers: any[], targetRole?: string) =>
  post<SoftSkillAnalysis>("/soft-skills/analyze", { answers, targetRole });

export const getSalaryScenario = (role: string, experience?: string, location?: string, currentOffer?: number) =>
  post<SalaryScenario>("/salary-coach/scenario", { role, experience, location, currentOffer });

export const submitNegotiationResponse = (scenario: SalaryScenario, userResponse: string, round: number) =>
  post<NegotiationResponse>("/salary-coach/respond", { scenario, userResponse, round });

export const getSideHustles = (skills: string[], interests: string[], currentRole?: string, weeklyHours?: number, incomeGoal?: number) =>
  post<SideHustle[]>("/side-hustle/suggest", { skills, interests, currentRole, weeklyHours, incomeGoal });

export const assessBurnout = (responses: any[], role?: string, workHoursPerWeek?: number) =>
  post<BurnoutAssessment>("/burnout/assess", { responses, role, workHoursPerWeek });
