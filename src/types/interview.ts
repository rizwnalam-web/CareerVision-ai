export enum QuestionTier {
  BEHAVIORAL = "Behavioral",
  ROLE_SPECIFIC = "Role-Specific",
  COMPANY_SPECIFIC = "Company-Specific"
}

export interface InterviewQuestion {
  id: string;
  text: string;
  tier: QuestionTier;
  category: string;
  company?: string;
  tips?: string[];
  targetKeywords?: string[];
}

export interface STARScore {
  situation: number; // 0-10
  task: number; // 0-10
  action: number; // 0-10
  result: number; // 0-10
  overall: number; // 0-100
  feedback: string;
}

export interface InterviewFeedback {
  questionId: string;
  answerText: string;
  starScore: STARScore;
  confidenceScore: number; // 0-100
  fillerWords: string[];
  sentiment: "Positive" | "Neutral" | "Needs Improvement";
  suggestedAnswer?: string;
  matchedKeywords: string[];
}

export interface InterviewSession {
  id: string;
  role: string;
  company?: string;
  timestamp: number;
  feedbacks: InterviewFeedback[];
  totalScore: number;
}

export interface InterviewStats {
  fieldReadiness: number; // 0-100
  streakCount: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    earnedAt: number;
  }>;
  questionsAnswered: number;
}

export interface EtiquetteInsight {
  category: string;
  insight: string;
  importance: "High" | "Medium" | "Low";
}
