import type {
  PrepQuestion, AnswerScore, SessionFeedback,
  VideoAnalysis, PeerSession, PrepSession, SessionType,
} from "../types/interviewPrep";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$|\/api$/, "");

const BASE = `${API_BASE}/api/interview-prep`;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || `POST ${path} failed`);
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `GET ${path} failed`);
  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Questions
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchQuestions(opts: {
  type?: string; difficulty?: string; industry?: string;
  role?: string; limit?: number;
}): Promise<{ questions: PrepQuestion[]; generated: boolean }> {
  const p = new URLSearchParams();
  if (opts.type) p.set("type", opts.type);
  if (opts.difficulty) p.set("difficulty", opts.difficulty);
  if (opts.industry) p.set("industry", opts.industry);
  if (opts.role) p.set("role", opts.role);
  if (opts.limit) p.set("limit", String(opts.limit));
  return get<{ success: boolean; questions: PrepQuestion[]; generated: boolean }>(`/questions?${p}`);
}

export async function generateQuestions(opts: {
  industry: string; role: string; type: string; count?: number;
}): Promise<PrepQuestion[]> {
  const data = await post<{ questions: PrepQuestion[] }>("/questions/generate", opts);
  return data.questions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

export async function createSession(opts: {
  userId: string; sessionType: SessionType; industry: string;
  role: string; company?: string; questionIds?: string[];
}): Promise<{ sessionId: string; createdAt: string }> {
  const data = await post<{ sessionId: string; createdAt: string }>("/sessions", opts);
  return data;
}

export async function getUserSessions(userId: string): Promise<PrepSession[]> {
  const data = await get<{ sessions: PrepSession[] }>(`/sessions/${userId}`);
  return data.sessions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateAnswer(
  question: PrepQuestion,
  transcript: string,
  durationSeconds: number
): Promise<AnswerScore> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${BASE}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, transcript, durationSeconds }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Evaluation failed");
    return data.score as AnswerScore;
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Evaluation timed out — please try again");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export async function completeSession(opts: {
  sessionId: string; answers: AnswerScore[]; durationSeconds: number;
  role: string; industry: string;
}): Promise<SessionFeedback> {
  const data = await post<{ feedback: SessionFeedback }>("/complete", opts);
  return data.feedback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Video analysis
// ─────────────────────────────────────────────────────────────────────────────

export async function analyseVideoTranscript(
  transcript: string, durationSeconds: number, role: string
): Promise<VideoAnalysis> {
  const data = await post<{ analysis: VideoAnalysis }>("/video-analysis", { transcript, durationSeconds, role });
  return data.analysis;
}

// ─────────────────────────────────────────────────────────────────────────────
// Peer sessions
// ─────────────────────────────────────────────────────────────────────────────

export async function createPeerSession(opts: {
  userId: string; role: string; industry: string;
  sessionType: string; questionIds?: string[];
}): Promise<PeerSession> {
  const data = await post<{ session: PeerSession }>("/peer/create", opts);
  return data.session;
}

export async function getPeerSession(roomCode: string): Promise<PeerSession> {
  const data = await get<{ session: PeerSession }>(`/peer/${roomCode}`);
  return data.session;
}

export async function submitPeerReview(
  roomCode: string, userId: string, review: object
): Promise<void> {
  await fetch(`${BASE}/peer/${roomCode}/review`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, review }),
  });
}

export async function getMyPeerSessions(userId: string): Promise<PeerSession[]> {
  const data = await get<{ sessions: PeerSession[] }>(`/peer/my/${userId}`);
  return data.sessions;
}

// ─────────────────────────────────────────────────────────────────────────────
// JD-Targeted Mock Interview
// ─────────────────────────────────────────────────────────────────────────────

export interface MockInterviewQuestion {
  id: string;
  text: string;
  type: "behavioral" | "technical" | "situational" | "architectural";
  difficulty: "medium" | "hard";
  context: string;
  expectedTopics: string[];
  followUp: string;
}

export interface STARFeedback {
  overall: number;
  situation: { score: number; present: boolean; feedback: string };
  task: { score: number; present: boolean; feedback: string };
  action: { score: number; present: boolean; feedback: string };
  result: { score: number; present: boolean; feedback: string };
  metrics: { hasQuantification: boolean; suggestions: string[] };
  vagueLanguage: string[];
  strengths: string[];
  improvements: string[];
  rewrittenAnswer: string;
}

export async function generateMockQuestions(opts: {
  jobDescription: string;
  role: string;
  company?: string;
  count?: number;
  focus?: "behavioral" | "technical" | "mixed";
}): Promise<MockInterviewQuestion[]> {
  const data = await post<{ questions: MockInterviewQuestion[] }>("/mock/generate", opts);
  return data.questions;
}

export async function evaluateSTAR(opts: {
  question: string;
  transcript: string;
  role: string;
  durationSeconds: number;
}): Promise<STARFeedback> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(`${BASE}/mock/evaluate-star`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "STAR evaluation failed");
    return data.feedback as STARFeedback;
  } catch (e: any) {
    if (e.name === "AbortError") throw new Error("Evaluation timed out");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
