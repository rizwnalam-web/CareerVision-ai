import { CareerPath, Institution, StudyMaterial, FundingOpportunity } from "../types/career";

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
    description: "Providing high-quality patient care in various medical settings with global mobility.",
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
  },
  {
    id: "ux-designer",
    title: "UX/UI Designer",
    description: "Creating intuitive digital experiences for global platforms. High potential for remote work.",
    growth: "high",
    category: "Creative",
    milestones: [
      {
        ageRange: "13-17",
        title: "Visual Design Basics",
        description: "Learning color theory, typography, and basic design tools.",
        requirements: ["Figma Basics", "Art classes", "Digital Photography"]
      }
    ]
  },
  {
    id: "sustainability-analyst",
    title: "Climate Risk Analyst",
    description: "Evaluating financial and social risks emerging from climate change for major organizations.",
    growth: "high",
    category: "Sustainability",
    milestones: [
      {
        ageRange: "16-20",
        title: "Interdisciplinary Foundation",
        description: "Combining environmental science with data analytics.",
        requirements: ["Data Science basics", "Environmental Studies", "GIS Systems"]
      }
    ]
  },
  {
    id: "financial-analyst",
    title: "Financial Analyst",
    description: "Guiding businesses on investment decisions, market trends, and fiscal strategy.",
    growth: "high",
    category: "Business",
    milestones: [
      {
        ageRange: "16-19",
        title: "Quantitative Preparation",
        description: "Developing advanced skill in mathematics and economics.",
        requirements: ["Advanced Math", "Microeconomics", "Excel Proficiency"]
      }
    ]
  },
  {
    id: "intl-teacher",
    title: "International School Teacher",
    description: "Educating students in international settings with standardized global curricula.",
    growth: "medium",
    category: "Education",
    milestones: [
      {
        ageRange: "18-22",
        title: "Pedagogical Certification",
        description: "Earning teaching degrees and cross-cultural certifications.",
        requirements: ["B.Ed", "TEFL/TESOL", "IB Training"]
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
    image: "https://picsum.photos/seed/mit/800/600",
    applicationDeadline: "2026-11-15",
    website: "https://www.mit.edu",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 42.3601, lng: -71.0942 },
    city: "Cambridge",
    country: "USA",
    costOfLivingIndex: 1.45
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "USA",
    type: "University",
    avgCost: 82000,
    programs: ["Machine Learning", "Energy Systems", "Human Biology"],
    ranking: 2,
    image: "https://picsum.photos/seed/stanford/800/600",
    applicationDeadline: "2026-12-01",
    website: "https://www.stanford.edu",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 37.4275, lng: -122.1697 },
    city: "Stanford",
    country: "USA",
    costOfLivingIndex: 1.6
  },
  {
    id: "eth-zurich",
    name: "ETH Zurich",
    location: "Switzerland",
    type: "University",
    avgCost: 5000,
    programs: ["Robotics", "Physics", "Environmental Sciences"],
    ranking: 10,
    image: "https://picsum.photos/seed/eth/800/600",
    applicationDeadline: "2026-10-30",
    website: "https://ethz.ch",
    allowsInternationalStudents: true,
    visaSupport: "Partial",
    coordinates: { lat: 47.3769, lng: 8.5417 },
    city: "Zurich",
    country: "Switzerland",
    costOfLivingIndex: 1.8
  },
  {
    id: "ucl",
    name: "University College London",
    location: "UK",
    type: "University",
    avgCost: 35000,
    programs: ["Architecture", "Law", "Computer Science"],
    ranking: 8,
    image: "https://picsum.photos/seed/ucl/800/600",
    applicationDeadline: "2026-06-15",
    website: "https://www.ucl.ac.uk",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 51.5246, lng: -0.1340 },
    city: "London",
    country: "UK",
    costOfLivingIndex: 1.35
  },
  {
    id: "nait",
    name: "Northern Alberta Institute of Technology",
    location: "Canada",
    type: "Polytechnic",
    avgCost: 15000,
    programs: ["Instrumentation Engineering", "Power Engineering"],
    image: "https://picsum.photos/seed/nait/800/600",
    applicationDeadline: "2027-01-10",
    website: "https://www.nait.ca",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 53.5684, lng: -113.5015 },
    city: "Edmonton",
    country: "Canada",
    costOfLivingIndex: 1.15
  },
  {
    id: "iit-b",
    name: "IIT Bombay",
    location: "India",
    type: "University",
    avgCost: 5000,
    programs: ["Aerospace Engineering", "Computer Science"],
    ranking: 150,
    image: "https://picsum.photos/seed/iitb/800/600",
    applicationDeadline: "2026-04-15",
    website: "https://www.iitb.ac.in",
    allowsInternationalStudents: true,
    visaSupport: "Partial",
    coordinates: { lat: 19.1334, lng: 72.9133 },
    city: "Mumbai",
    country: "India",
    costOfLivingIndex: 0.8
  }
];

export const FUNDING_OPPORTUNITIES: FundingOpportunity[] = [
  {
    id: "sch-1",
    name: "Future Innovators Tech Grant",
    provider: "Global Tech Foundation",
    amount: 15000,
    deadline: "2026-08-15",
    category: "Merit",
    type: "Scholarship",
    description: "Supports outstanding students pursuing AI, Robotics, or Software Engineering.",
    eligibilityCriteria: ["GPA > 3.8", "Interest in Emerging Tech"]
  },
  {
    id: "sch-2",
    name: "Equity in Healthcare Scholarship",
    provider: "HealthCare Global",
    amount: 10000,
    deadline: "2026-09-01",
    category: "Need",
    type: "Scholarship",
    description: "Financial assistance for aspiring nurses and paramedics from underrepresented regions.",
    eligibilityCriteria: ["Annual Income < $30,000", "Enrolled in Healthcare Program"]
  },
  {
    id: "sch-3",
    name: "Green Earth Sustainability Award",
    provider: "RenewNow Org",
    amount: 12000,
    deadline: "2026-07-20",
    category: "Interest",
    type: "Grant",
    description: "For students dedicated to renewable energy and climate science.",
    eligibilityCriteria: ["Portfolio Project in Green Tech", "GPA > 3.2"]
  },
  {
    id: "loan-1",
    name: "STEM Voyager Loan",
    provider: "EduBank Financial",
    amount: 25000,
    deadline: "2026-12-31",
    category: "Geographic",
    type: "Loan",
    terms: "3.5% Fixed APR, 10-year term",
    description: "Low-interest loan specifically for STEM students studying cross-border.",
    eligibilityCriteria: ["Enrolled in STEM program", "Valid Global ID"]
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
    thumbnail: "https://picsum.photos/seed/ai1/400/225",
    region: "NA",
    language: "English"
  },
  {
    id: "ai-audio-1",
    careerId: "ai-engineer",
    title: "The Ethics of AI in 2026",
    type: "audio",
    provider: "MIT News",
    url: "https://www.youtube.com/results?search_query=ai+ethics+podcast",
    duration: "15 mins",
    thumbnail: "https://picsum.photos/seed/ai2/400/225",
    region: "Global",
    language: "English"
  },
  {
    id: "ux-course-1",
    careerId: "ux-designer",
    title: "Mastering Figma for Global Teams",
    type: "course",
    provider: "Coursera",
    url: "https://www.coursera.org",
    duration: "12 hours",
    thumbnail: "https://picsum.photos/seed/ux1/400/225",
    region: "Global",
    language: "English"
  },
  {
    id: "green-energy-video-1",
    careerId: "renewable-energy",
    title: "The Future of Solar Infrastructure",
    type: "video",
    provider: "National Geographic",
    url: "https://www.youtube.com/results?search_query=solar+infrastructure",
    duration: "28 mins",
    thumbnail: "https://picsum.photos/seed/green1/400/225",
    region: "Global",
    language: "English"
  },
  {
    id: "finance-audio-1",
    careerId: "financial-analyst",
    title: "Managing Risk in Volatile Markets",
    type: "audio",
    provider: "Bloomberg Technology",
    url: "https://www.bloomberg.com/podcasts",
    duration: "35 mins",
    thumbnail: "https://picsum.photos/seed/fin1/400/225",
    region: "Global",
    language: "English"
  }
];
