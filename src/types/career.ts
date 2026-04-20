export interface CareerPath {
  id: string;
  title: string;
  description: string;
  growth: "high" | "medium" | "stable";
  category: string;
  milestones: Milestone[];
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
  type: "University" | "Vocational" | "Polytechnic";
  avgCost: number;
  programs: string[];
  ranking?: number;
  image: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: "video" | "audio" | "course";
  provider: string;
  url: string;
  careerId: string;
  duration: string;
  thumbnail: string;
}

export interface UserProfile {
  name: string;
  age: number;
  education: string;
  interests: string[];
  budget: number;
  targetCareerId?: string;
  completedMilestones: string[]; // Stores composite IDs like "careerId-milestoneIndex"
}
