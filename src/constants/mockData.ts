import { CareerPath, Institution, StudyMaterial } from "../types/career";

export const CAREER_PATHS: CareerPath[] = [
  {
    id: "ai-engineer",
    title: "AI & Machine Learning Engineer",
    description: "Design and implement AI models and scalable machine learning systems.",
    growth: "high",
    category: "Technology",
    milestones: [
      {
        ageRange: "10-14",
        title: "Exploratory Phase",
        description: "Introduction to logical thinking and block-based coding.",
        requirements: ["Scratch", "Basic Math", "Logic puzzles"]
      },
      {
        ageRange: "15-18",
        title: "Foundational Phase",
        description: "Mastering core languages and advanced mathematics.",
        requirements: ["Python", "Calculus", "Linear Algebra", "Data Structures"]
      },
      {
        ageRange: "18-22",
        title: "Specialization Phase",
        description: "Deep dive into neural networks and big data.",
        requirements: ["Bachelor's in CS", "PyTorch/TensorFlow", "Statistics"]
      }
    ]
  },
  {
    id: "renewable-energy",
    title: "Renewable Energy Specialist",
    description: "Developing sustainable energy solutions for a greener future.",
    growth: "high",
    category: "Engineering",
    milestones: [
      {
        ageRange: "10-14",
        title: "Environmental Awareness",
        description: "Understanding climate change and energy types.",
        requirements: ["Science projects", "Eco-clubs"]
      }
    ]
  },
  {
    id: "nursing",
    title: "Registered Nursing",
    description: "Providing high-quality patient care in various medical settings.",
    growth: "high",
    category: "Healthcare",
    milestones: [
      {
        ageRange: "15-18",
        title: "Pre-Med Awareness",
        description: "Focusing on biology and chemistry.",
        requirements: ["Biology", "Chemistry", "First-Aid Certification"]
      }
    ]
  }
];

export const INSTITUTIONS: Institution[] = [
  {
    id: "mit",
    name: "Massachusetts Institute of Technology (MIT)",
    location: "USA",
    type: "University",
    avgCost: 80000,
    programs: ["Computer Science", "Artificial Intelligence", "Mechanical Engineering"],
    ranking: 1,
    image: "https://picsum.photos/seed/mit/800/600"
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "USA",
    type: "University",
    avgCost: 82000,
    programs: ["Machine Learning", "Energy Systems", "Human Biology"],
    ranking: 2,
    image: "https://picsum.photos/seed/stanford/800/600"
  },
  {
    id: "eth-zurich",
    name: "ETH Zurich",
    location: "Switzerland",
    type: "University",
    avgCost: 5000,
    programs: ["Robotics", "Physics", "Environmental Sciences"],
    ranking: 10,
    image: "https://picsum.photos/seed/eth/800/600"
  },
  {
    id: "nait",
    name: "Northern Alberta Institute of Technology",
    location: "Canada",
    type: "Polytechnic",
    avgCost: 15000,
    programs: ["Instrumentation Engineering", "Power Engineering"],
    image: "https://picsum.photos/seed/nait/800/600"
  }
];

export const STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: "ai-course-1",
    careerId: "ai-engineer",
    title: "Introduction to Artificial Intelligence",
    type: "video",
    provider: "Stanford Online / YouTube",
    url: "https://www.youtube.com/results?search_query=intro+to+ai",
    duration: "45 mins",
    thumbnail: "https://picsum.photos/seed/ai1/400/225"
  },
  {
    id: "ai-audio-1",
    careerId: "ai-engineer",
    title: "The Ethics of AI in 2026",
    type: "audio",
    provider: "MIT News",
    url: "https://www.youtube.com/results?search_query=ai+ethics+podcast",
    duration: "15 mins",
    thumbnail: "https://picsum.photos/seed/ai2/400/225"
  }
];
