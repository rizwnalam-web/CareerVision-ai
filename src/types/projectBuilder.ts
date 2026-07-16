// ─────────────────────────────────────────────────────────────────────────────
// Project Builder Lab Types
// ─────────────────────────────────────────────────────────────────────────────

export type BuilderPhase = "intent" | "stack" | "architecture" | "milestones" | "review";

export interface IntentConfig {
  targetRole: string;
  domain: string;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  timeCommitment: "2-weeks" | "1-month" | "2-months";
}

export interface TechStackRecommendation {
  category: string;
  tool: string;
  reason: string;
  alternatives: string[];
}

export interface TechStackPlan {
  id: string;
  projectTitle: string;
  projectDescription: string;
  targetRole: string;
  domain: string;
  stack: TechStackRecommendation[];
  whyThisStack: string;
}

export interface FolderNode {
  name: string;
  type: "file" | "folder";
  description?: string;
  children?: FolderNode[];
}

export interface ERDEntity {
  name: string;
  fields: { name: string; type: string; constraints?: string }[];
  relationships: { target: string; type: "one-to-one" | "one-to-many" | "many-to-many"; label?: string }[];
}

export interface ArchitecturePlan {
  folderStructure: FolderNode[];
  erdEntities: ERDEntity[];
  flowDescription: string;
  systemComponents: { name: string; role: string; connections: string[] }[];
  diagramMermaid?: string;
}

export type SprintStatus = "not-started" | "in-progress" | "completed";
export type TaskStatus = "todo" | "in-progress" | "done";

export interface SprintTask {
  id: string;
  title: string;
  description: string;
  guideline: string;
  estimatedHours: number;
  status: TaskStatus;
  labels: string[];
}

export interface Sprint {
  id: string;
  order: number;
  title: string;
  goal: string;
  durationDays: number;
  status: SprintStatus;
  tasks: SprintTask[];
}

export interface MilestonePlan {
  sprints: Sprint[];
  totalEstimatedHours: number;
  setupInstructions: {
    github: string[];
    hosting: string[];
    localDev: string[];
  };
}

export interface ProjectBuilderState {
  intent: IntentConfig | null;
  stackPlan: TechStackPlan | null;
  architecture: ArchitecturePlan | null;
  milestones: MilestonePlan | null;
}
