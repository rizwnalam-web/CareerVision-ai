import { CareerPath, Institution, StudyMaterial, FundingOpportunity, JobListing } from "../types/career";

export const CAREER_PATHS: CareerPath[] = [
  // 1. Technology & Digital
  {
    id: "ai-engineer",
    title: "AI & Machine Learning Engineer",
    description: "Design and implement AI models and scalable machine learning systems.",
    growth: "high",
    category: "Technology & Digital",
    subCategory: "Data & AI",
    workType: "Remote",
    tags: ["AI Integration", "Remote Economy"],
    milestones: [
      { ageRange: "10-12", title: "Logic Lab", description: "Scratch & foundational math", requirements: ["Scratch", "Basic Math"] },
      { ageRange: "13-15", title: "Applied Coding", description: "Intro to Python and problem solving", requirements: ["Python", "Computational Thinking"] },
      { ageRange: "16-17", title: "AI Prep", description: "Portfolio projects & advanced electives", requirements: ["Neural Networks", "Data Projects"] },
      { ageRange: "18-22", title: "CS Degree", description: "Bachelor's level AI systems", requirements: ["Algorithms", "Machine Learning"] }
    ]
  },
  {
    id: "fullstack-dev",
    title: "Full-stack Developer",
    description: "Building complete web applications from database to user interface.",
    growth: "high",
    category: "Technology & Digital",
    subCategory: "Software Development",
    workType: "Remote",
    tags: ["Remote Economy"],
    milestones: [{ ageRange: "15-22", title: "Web Mastery", description: "JS/TS Frameworks", requirements: ["React", "Node.js"] }]
  },
  {
    id: "ethical-hacker",
    title: "Ethical Hacker",
    description: "Identifying security vulnerabilities in systems to prevent cyber attacks.",
    growth: "high",
    category: "Technology & Digital",
    subCategory: "Cybersecurity",
    workType: "Hybrid",
    tags: ["AI Integration"],
    milestones: [{ ageRange: "18-24", title: "Certifications", description: "OSCP/CEH", requirements: ["Networking", "Kali Linux"] }]
  },
  {
    id: "ux-designer",
    title: "UX/UI Designer",
    description: "Creating intuitive digital experiences for global platforms.",
    growth: "high",
    category: "Technology & Digital",
    subCategory: "Design",
    workType: "Remote",
    tags: ["Remote Economy", "AI Integration"],
    milestones: [{ ageRange: "13-20", title: "Visual Design", description: "Figma and UX principles", requirements: ["Figma", "User Research"] }]
  },

  // 2. Healthcare & Life Sciences
  {
    id: "surgeon",
    title: "Surgeon",
    description: "Performing complex operations to treat injuries and diseases.",
    growth: "high",
    category: "Healthcare & Life Sciences",
    subCategory: "Clinical Practice",
    workType: "On-site",
    tags: ["AI Integration"],
    milestones: [{ ageRange: "18-30", title: "Medical Residency", description: "Advanced surgical training", requirements: ["MD Degree", "Residency"] }]
  },
  {
    id: "nursing",
    title: "Registered Nursing",
    description: "Providing high-quality patient care in various medical settings.",
    growth: "high",
    category: "Healthcare & Life Sciences",
    subCategory: "Clinical Practice",
    workType: "On-site",
    tags: ["Global Demand"],
    milestones: [{ ageRange: "18-22", title: "Nursing Degree", description: "RN Certification", requirements: ["Bio/Chem", "Clinical Practice"] }]
  },
  {
    id: "bioinformatician",
    title: "Bioinformatician",
    description: "Combining biology, computer science, and statistics to analyze genomic data.",
    growth: "high",
    category: "Healthcare & Life Sciences",
    subCategory: "Biotech",
    workType: "Hybrid",
    tags: ["AI Integration"],
    milestones: [{ ageRange: "18-26", title: "Biotech Specialization", description: "Genomic analysis", requirements: ["R/Python", "Genetics"] }]
  },

  // 3. Business, Finance & Management
  {
    id: "financial-analyst",
    title: "Financial Analyst",
    description: "Guiding businesses on investment decisions and market trends.",
    growth: "high",
    category: "Business, Finance & Management",
    subCategory: "Analysis",
    workType: "Hybrid",
    tags: ["AI Integration", "Remote Economy"],
    milestones: [{ ageRange: "18-22", title: "Finance Base", description: "Economic modeling", requirements: ["Excel", "Economics"] }]
  },
  {
    id: "project-manager",
    title: "Project Manager",
    description: "Leading teams to deliver complex business initiatives on time.",
    growth: "medium",
    category: "Business, Finance & Management",
    subCategory: "Management",
    workType: "Hybrid",
    tags: ["Remote Economy"],
    milestones: [{ ageRange: "22-26", title: "Certification", description: "PMP/Agile", requirements: ["Agile", "Stakeholder Management"] }]
  },

  // 4. Engineering, Science & Environment
  {
    id: "renewable-energy",
    title: "Wind Turbine Engineer",
    description: "Developing and maintaining sustainable energy infrastructure.",
    growth: "high",
    category: "Engineering, Science & Environment",
    subCategory: "Green Energy",
    workType: "Mobile",
    tags: ["Green Transition"],
    milestones: [{ ageRange: "18-24", title: "Engineering Degree", description: "Specialization in Renewables", requirements: ["Mechanical Eng", "Sustainability"] }]
  },
  {
    id: "civil-engineer",
    title: "Civil Engineer",
    description: "Designing and overseeing the construction of critical infrastructure.",
    growth: "stable",
    category: "Engineering, Science & Environment",
    subCategory: "Traditional Engineering",
    workType: "On-site",
    tags: ["Green Transition"],
    milestones: [{ ageRange: "18-22", title: "PE License", description: "Structural engineering", requirements: ["CAD", "Physics"] }]
  },

  // 5. Arts, Design & Media
  {
    id: "animator",
    title: "Animator",
    description: "Bringing stories to life through digital motion and 3D modeling.",
    growth: "high",
    category: "Arts, Design & Media",
    subCategory: "Visual Arts",
    workType: "Remote",
    tags: ["Remote Economy", "AI Integration"],
    milestones: [{ ageRange: "15-22", title: "Animation Portfolio", description: "3D/2D production", requirements: ["Blender/Maya", "Storyboarding"] }]
  },
  {
    id: "video-editor",
    title: "Video Editor",
    description: "Crating compelling narratives from raw footage for global platforms.",
    growth: "high",
    category: "Arts, Design & Media",
    subCategory: "Content Creation",
    workType: "Remote",
    tags: ["Remote Economy", "AI Integration"],
    milestones: [{ ageRange: "16-24", title: "Production Flow", description: "Non-linear editing", requirements: ["Premiere Pro", "After Effects"] }]
  },

  // 6. Education, Law & Public Service
  {
    id: "instructional-designer",
    title: "Instructional Designer",
    description: "Designing digital learning experiences and curricula for the AI age.",
    growth: "high",
    category: "Education, Law & Public Service",
    subCategory: "Education",
    workType: "Remote",
    tags: ["Remote Economy", "AI Integration"],
    milestones: [{ ageRange: "22-26", title: "Mastery", description: "EdTech integration", requirements: ["LMS", "Pedagogy"] }]
  },
  {
    id: "corporate-lawyer",
    title: "Corporate Lawyer",
    description: "Handling legal matters for businesses, from mergers to IP protection.",
    growth: "stable",
    category: "Education, Law & Public Service",
    subCategory: "Law",
    workType: "Hybrid",
    tags: ["AI Integration"],
    milestones: [{ ageRange: "18-26", title: "Bar Certification", description: "Law degree and exam", requirements: ["JD Degree", "Analytical Law"] }]
  },

  // 7. Skilled Trades & Technical Services
  {
    id: "aircraft-mechanic",
    title: "Aircraft Mechanic",
    description: "Ensuring the safety and performance of global aviation fleets.",
    growth: "high",
    category: "Skilled Trades & Technical Services",
    subCategory: "Electrical & Mechanical",
    workType: "On-site",
    tags: ["Global Mobility"],
    milestones: [{ ageRange: "18-22", title: "A&P License", description: "FAA/EASA certification", requirements: ["Avionics", "Engine Systems"] }]
  },
  {
    id: "chef",
    title: "Chef",
    description: "Leading culinary teams and designing high-end dining experiences.",
    growth: "stable",
    category: "Skilled Trades & Technical Services",
    subCategory: "Culinary",
    workType: "On-site",
    tags: ["Global Hubs"],
    milestones: [{ ageRange: "16-24", title: "Culinary Arts", description: "Kitchen management", requirements: ["Gastronomy", "Leadership"] }]
  },
  {
    id: "mistral-ai",
    title: "Mistral AI Developer",
    description: "Develop and integrate AI solutions using Mistral models like Mistral-7B, Mixtral 8x7B, and Mistral Small.",
    growth: "medium",
    category: "Technology & Digital",
    subCategory: "Data & AI",
    workType: "Hybrid",
    tags: ["Mistral Models", "AI Development"],
    milestones: [
      { ageRange: "15-18", title: "AI Basics", description: "Learn AI fundamentals and Mistral model usage.", requirements: ["Python", "AI Basics"] },
      { ageRange: "22-25", title: "Advanced AI", description: "Master Mistral models and deployment.", requirements: ["Mistral-7B", "Mixtral 8x7B"] }
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
  },
  {
    id: "johns-hopkins",
    name: "Johns Hopkins School of Medicine",
    location: "USA",
    type: "Medical School",
    avgCost: 65000,
    programs: ["MD Degree", "Surgery Residency", "Biomedical Engineering"],
    ranking: 3,
    image: "https://picsum.photos/seed/hopkins/800/600",
    applicationDeadline: "2026-10-15",
    website: "https://www.hopkinsmedicine.org",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 39.2974, lng: -76.5923 },
    city: "Baltimore",
    country: "USA",
    costOfLivingIndex: 1.1
  },
  {
    id: "oxford-med",
    name: "University of Oxford Medical School",
    location: "UK",
    type: "University",
    avgCost: 45000,
    programs: ["MD Degree", "Clinical Medicine", "Residency"],
    ranking: 5,
    image: "https://picsum.photos/seed/oxford/800/600",
    applicationDeadline: "2026-10-15",
    website: "https://www.medsci.ox.ac.uk",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 51.7611, lng: -1.2530 },
    city: "Oxford",
    country: "UK",
    costOfLivingIndex: 1.3
  },
  {
    id: "harvard-med",
    name: "Harvard Medical School",
    location: "USA",
    type: "Medical School",
    avgCost: 75000,
    programs: ["MD Degree", "Health Sciences", "Surgery"],
    ranking: 1,
    image: "https://picsum.photos/seed/harvard/800/600",
    applicationDeadline: "2026-11-01",
    website: "https://hms.harvard.edu",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 42.3359, lng: -71.1031 },
    city: "Boston",
    country: "USA",
    costOfLivingIndex: 1.5
  },
  {
    id: "mayo-clinic",
    name: "Mayo Clinic Alix School of Medicine",
    location: "USA",
    type: "Medical School",
    avgCost: 60000,
    programs: ["MD Degree", "Medical Residency", "Specialized Surgery"],
    ranking: 15,
    image: "https://picsum.photos/seed/mayo/800/600",
    applicationDeadline: "2026-12-15",
    website: "https://college.mayo.edu",
    allowsInternationalStudents: true,
    visaSupport: "Full",
    coordinates: { lat: 44.0225, lng: -92.4666 },
    city: "Rochester",
    country: "USA",
    costOfLivingIndex: 1.0
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
  // AI Engineering
  {
    id: "ai-course-1",
    careerId: "ai-engineer",
    title: "Introduction to Artificial Intelligence",
    type: "video",
    provider: "Stanford Online",
    url: "https://www.youtube.com/results?search_query=intro+to+ai",
    duration: "45 mins",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.8,
    skillLevel: "Beginner",
    description: "A foundational dive into early heuristics and modern neural networks.",
    tags: ["AI", "Algorithms", "Python"]
  },
  {
    id: "ai-art-1",
    careerId: "ai-engineer",
    title: "The Architecture of Transformer Models",
    type: "article",
    provider: "DeepMind Blog",
    url: "https://deepmind.google/discover/blog/",
    duration: "15 min read",
    thumbnail: "https://images.unsplash.com/photo-1620712943543-bcc4628c9757?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 5.0,
    skillLevel: "Advanced",
    description: "Detailed breakdown of attention mechanisms and self-supervised learning.",
    tags: ["Transformers", "Deep Learning", "LLMs"]
  },
  {
    id: "ai-audio-1",
    careerId: "ai-engineer",
    title: "The Ethics of AI in 2026",
    type: "audio",
    provider: "MIT News",
    url: "https://www.youtube.com/results?search_query=ai+ethics+podcast",
    duration: "15 mins",
    thumbnail: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.9,
    skillLevel: "Intermediate",
    description: "Discussing bias mitigation and global regulations on autonomous agents."
  },
  {
    id: "ai-course-2",
    careerId: "ai-engineer",
    title: "Practical MLOps Workflows",
    type: "course",
    provider: "Coursera",
    url: "https://www.coursera.org",
    duration: "10 hours",
    thumbnail: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.7,
    skillLevel: "Intermediate",
    description: "Deploy and monitor machine learning models at scale with best practices.",
    tags: ["MLOps", "Deployment", "Python"]
  },
  {
    id: "ai-art-2",
    careerId: "ai-engineer",
    title: "AI Safety and Alignment Reports",
    type: "article",
    provider: "Arxiv Insights",
    url: "https://arxiv.org",
    duration: "20 min read",
    thumbnail: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.6,
    skillLevel: "Advanced",
    description: "Surveying current safety research for responsible AI deployment.",
    tags: ["AI Safety", "Research", "Governance"]
  },

  // UX Design
  {
    id: "ux-course-1",
    careerId: "ux-designer",
    title: "Mastering Figma for Global Teams",
    type: "course",
    provider: "Coursera",
    url: "https://www.coursera.org",
    duration: "12 hours",
    thumbnail: "https://images.unsplash.com/photo-1581291518655-952d4334336c?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.7,
    skillLevel: "Advanced",
    description: "Collaborative design workflows for cross-border engineering teams.",
    tags: ["Figma", "Design Systems", "UX"]
  },
  {
    id: "ux-art-1",
    careerId: "ux-designer",
    title: "Design for the Silver Economy",
    type: "article",
    provider: "UX Collective",
    url: "https://uxdesign.cc",
    duration: "10 min read",
    thumbnail: "https://images.unsplash.com/photo-1573164713988-86659c46522c?auto=format&fit=crop&q=80&w=800",
    region: "EU",
    language: "German",
    rating: 4.5,
    skillLevel: "Intermediate",
    description: "Adjusting interfaces for the growing percentage of elderly digital users."
  },
  {
    id: "ux-course-2",
    careerId: "ux-designer",
    title: "Accessibility Patterns for Global Products",
    type: "course",
    provider: "Udemy",
    url: "https://www.udemy.com",
    duration: "6 hours",
    thumbnail: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.7,
    skillLevel: "Beginner",
    description: "Practical accessibility guidelines for inclusive product design.",
    tags: ["Accessibility", "UX", "Inclusive Design"]
  },

  // Green Energy
  {
    id: "green-energy-video-1",
    careerId: "renewable-energy",
    title: "The Future of Solar Infrastructure",
    type: "video",
    provider: "National Geographic",
    url: "https://www.youtube.com/results?search_query=solar+infrastructure",
    duration: "28 mins",
    thumbnail: "https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.6,
    skillLevel: "Beginner",
    description: "How next-gen photovoltaic cells are reaching 40% efficiency levels."
  },
  {
    id: "green-art-1",
    careerId: "renewable-energy",
    title: "Grid Modernization in Southeast Asia",
    type: "article",
    provider: "The Guardian",
    url: "https://www.theguardian.com",
    duration: "12 min read",
    thumbnail: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
    region: "ASIA",
    language: "English",
    rating: 4.4,
    skillLevel: "Intermediate",
    description: "A look at Indonesia's shift from coal to floating solar farms."
  },

  // Finance
  {
    id: "finance-audio-1",
    careerId: "financial-analyst",
    title: "Managing Risk in Volatile Markets",
    type: "audio",
    provider: "Bloomberg Technology",
    url: "https://www.bloomberg.com/podcasts",
    duration: "35 mins",
    thumbnail: "https://images.unsplash.com/photo-1611974714024-462ba99bb36a?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.8,
    skillLevel: "Intermediate"
  },
  {
    id: "finance-course-1",
    careerId: "financial-analyst",
    title: "Crypto-Asset Analysis in 2026",
    type: "course",
    provider: "Binance Academy",
    url: "https://academy.binance.com",
    duration: "6 hours",
    thumbnail: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.6,
    skillLevel: "Beginner",
    description: "Professional grade valuation models for decentralized finance tokens."
  },

  // Healthcare
  {
    id: "health-video-1",
    careerId: "surgeon",
    title: "Robotic-Assisted Neurosurgery",
    type: "video",
    provider: "Intuitive Surgical",
    url: "https://www.intuitive.com",
    duration: "18 mins",
    thumbnail: "https://images.unsplash.com/photo-1576091160550-2173599211d0?auto=format&fit=crop&q=80&w=800",
    region: "Global",
    language: "English",
    rating: 4.9,
    skillLevel: "Advanced",
    description: "Precision mapping and real-time haptic feedback in brain tumor removal."
  }
];

export const JOB_LISTINGS: JobListing[] = [
  {
    id: "job-1",
    title: "Senior AI Researcher",
    company: "Spark.Net",
    location: "Zurich, Switzerland",
    salary: { min: 140000, max: 180000, currency: "CHF", period: "yearly" },
    type: "Full-time",
    postedAt: "2026-04-20",
    url: "https://example.com/jobs/1",
    careerId: "ai-engineer",
    description: "Leading R&D on next-gen multi-modal agents for autonomous navigation.",
    logo: "https://images.unsplash.com/photo-1599305090746-3ef462943717?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "job-2",
    title: "Full-stack Developer (Remote)",
    company: "GitSync",
    location: "Global / Remote",
    salary: { min: 90000, max: 130000, currency: "USD", period: "yearly" },
    type: "Remote",
    postedAt: "2026-04-25",
    url: "https://example.com/jobs/2",
    careerId: "fullstack-dev",
    description: "Build scalable React + Node.js applications for a distributed team.",
    logo: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "job-3",
    title: "Nursing Supervisor",
    company: "Unity Health",
    location: "Toronto, Canada",
    salary: { min: 85000, max: 105000, currency: "CAD", period: "yearly" },
    type: "Full-time",
    postedAt: "2026-04-18",
    url: "https://example.com/jobs/3",
    careerId: "nursing",
    description: "Manage nursing staff in our high-acuity surgical unit.",
    logo: "https://images.unsplash.com/photo-1505751172157-c72859554829?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "job-4",
    title: "UX Designer",
    company: "Vivid UI",
    location: "London, UK",
    salary: { min: 55000, max: 75000, currency: "GBP", period: "yearly" },
    type: "Hybrid",
    postedAt: "2026-04-22",
    url: "https://example.com/jobs/4",
    careerId: "ux-designer",
    description: "Focus on accessibility and high-conversion landing pages for EMEA clients.",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200"
  }
];
