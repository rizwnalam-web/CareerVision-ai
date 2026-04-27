import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  School, 
  BookOpen, 
  CircleDollarSign, 
  MessageSquare, 
  ChevronRight,
  User,
  Settings,
  TrendingUp,
  Clock,
  ExternalLink,
  Target,
  Landmark,
  PiggyBank,
  Wallet,
  TrendingDown,
  BarChart3,
  PieChart as PieIcon,
  Search,
  Filter,
  PlayCircle,
  Headphones,
  Share2,
  Check,
  UserCheck,
  Activity,
  ArrowLeft,
  ShieldCheck,
  X,
  MapPin,
  Zap,
  Heart,
  Paperclip,
  Linkedin,
  FileText,
  Link,
  Star,
  Globe,
  RotateCcw,
  Trash2,
  Briefcase,
  Monitor,
  CheckCircle,
  UploadCloud,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { cn } from './lib/utils';
import { CAREER_PATHS, INSTITUTIONS, STUDY_MATERIALS, FUNDING_OPPORTUNITIES } from './constants/mockData';
import { CareerPath, UserProfile, Institution, FundingOpportunity } from './types/career';
import { getCareerAdvice, matchScholarships, getRecommendedCourses, getTopGlobalCareers, generateCoverLetter, getLatestCareerNews } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

import { LandingPage } from './components/LandingPage';

// --- Components ---

const NavItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-1 pb-1 transition-all duration-200 border-b-2 font-medium text-sm",
      active 
        ? "border-indigo-600 text-indigo-600" 
        : "border-transparent text-slate-600 hover:text-indigo-600"
    )}
  >
    {label}
  </button>
);

import { InstitutionComparator } from './components/InstitutionComparator';

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
    {subtitle && <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">{subtitle}</p>}
  </div>
);

const ShareButton = ({ title, type, id }: { title: string, type: string, id: string }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `Check out this ${type} on CareerVision AI: ${title}. Explore more at ${window.location.origin}?ref=${id}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
        copied 
          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" 
          : "bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100"
      )}
    >
      {copied ? <Check size={12} /> : <Share2 size={12} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
};

// --- Pages ---

const HeatmapView = () => {
  const hubs = [
    { city: "Silicon Valley", country: "USA", intensity: 100, careers: ["AI Engineer", "Software Dev", "UX Design"] },
    { city: "Zurich", country: "Switzerland", intensity: 85, careers: ["Robotics", "FinTech", "Biotech"] },
    { city: "London", country: "UK", intensity: 92, careers: ["Data Analytics", "Law", "Finance"] },
    { city: "Mumbai", country: "India", intensity: 78, careers: ["Cybersecurity", "Cloud Arch", "Mobile Dev"] },
    { city: "Bangalore", country: "India", intensity: 95, careers: ["AI Engineer", "Full Stack", "Data Science"] },
    { city: "Berlin", country: "Germany", intensity: 82, careers: ["Creative Tech", "SaaS", "E-commerce"] }
  ];

  return (
    <div className="space-y-8">
      <SectionTitle title="Career Hub Heatmap" subtitle="Active Geospatial Density: High" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubs.map((hub, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={hub.city} 
            className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
          >
            <div 
              className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
              style={{ background: `radial-gradient(circle, #6366f1 0%, transparent 70%)`, filter: "blur(20px)" }}
            />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight">{hub.city}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{hub.country}</p>
              </div>
              <div className="bg-indigo-50 px-2 py-1 rounded-lg">
                <span className="text-indigo-600 text-xs font-black">{hub.intensity}% Intensity</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {hub.careers.map(c => (
                  <span key={c} className="text-[9px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-slate-500 uppercase tracking-wider">
                    {c}
                  </span>
                ))}
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${hub.intensity}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const NewsFlash = ({ country }: { country: string }) => {
  const [news, setNews] = useState<{ career: string, country: string, aiTech: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      const data = await getLatestCareerNews(country);
      if (data && data.length > 0) {
        setNews(data);
      } else {
        // Local component fallback
        setNews([
          { career: `AI Ethics Specialist`, country: country, aiTech: "Gemini 3 Ultra" },
          { career: "Remote Cybersecurity Lead", country: "Global", aiTech: "Project Aether" },
          { career: "Data Sovereignty Architect", country: "EU-Hague", aiTech: "Logic-Mesh V1" }
        ]);
      }
    };
    fetchNews();
  }, [country]);

  useEffect(() => {
    if (news.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [news]);

  if (news.length === 0) return <div className="h-10 bg-slate-900 border-y border-slate-800 animate-pulse" />;

  return (
    <div className="bg-slate-900 border-y border-slate-800 p-2 overflow-hidden shadow-inner flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-4 px-4 overflow-hidden">
        <div className="flex items-center gap-2 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live News</span>
        </div>
        <div className="relative flex-1 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <Zap size={10} className="text-amber-400 shrink-0" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide truncate">
                <span className="text-indigo-400 font-black">Trending in {news[currentIndex].country}:</span> {news[currentIndex].career} 
                <span className="mx-2 opacity-30">|</span> 
                <span className="text-amber-400 font-black">Launch:</span> {news[currentIndex].aiTech}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Globe size={12} className="text-slate-600" />
          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Global Intelligence Center</span>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ profile, onSelectPath, careers, isLoading }: { profile: UserProfile, onSelectPath: (id: string) => void, careers: CareerPath[], isLoading: boolean }) => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeWorkType, setActiveWorkType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = ["All", ...Array.from(new Set(careers.filter(p => !p.category.includes('Custom')).map(p => p.category)))];
  const workTypes = ["All", "Remote", "On-site", "Hybrid", "Mobile"];
  
  const filteredPaths = careers.filter(p => {
    const categoryMatch = activeCategory === "All" || p.category === activeCategory;
    const workTypeMatch = activeWorkType === "All" || p.workType === activeWorkType;
    const searchMatch = searchQuery.trim() === "" || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && workTypeMatch && searchMatch;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="-mx-8 md:-mx-12 -mt-4 mb-4">
        <NewsFlash country={profile.country} />
      </div>
      
      <div className="max-w-4xl bg-indigo-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-3">Hello, {profile.name}! 👋</h2>
          <p className="text-indigo-100 text-base mb-6 opacity-90 max-w-2xl">
            Expert analysis identifies 2026's high-demand global fields. Based on your profile, explore these specialized trajectories.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => onSelectPath(careers[0]?.id || "")}
              disabled={isLoading || careers.length === 0}
              className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 text-sm shadow-sm disabled:opacity-50"
            >
              {isLoading ? "Syncing Careers..." : "Start Main Path"} <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      </div>

      <div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <SectionTitle title="Global Career Options" subtitle="Cross-Border Mobility & Tech-Centric Demand" />
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 lg:flex-none min-w-[200px] lg:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
              <input 
                type="text" 
                placeholder="Search careers..." 
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 placeholder:text-slate-400 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative flex-1 lg:flex-none min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={14} />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full lg:w-48 pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer shadow-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "Every Industry" : cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>

            {/* Work Type Filter */}
            <div className="relative flex-1 lg:flex-none min-w-[160px]">
              <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={14} />
              <select
                value={activeWorkType}
                onChange={(e) => setActiveWorkType(e.target.value)}
                className="w-full lg:w-48 pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer shadow-sm"
              >
                {workTypes.map(type => (
                  <option key={type} value={type}>
                    {type === "All" ? "Environment: Any" : `Work: ${type}`}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
                <ChevronRight size={14} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPaths.length > 0 ? (
              filteredPaths.map((path) => (
                <motion.div
                  key={path.id}
                  whileHover={{ y: -4, borderColor: '#818cf8' }}
                  onClick={() => onSelectPath(path.id)}
                  className="bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                        <TrendingUp size={20} />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex gap-1.5 flex-wrap justify-end">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            path.growth === "high" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                          )}>
                            {path.growth} Growth
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
                            {path.workType}
                          </span>
                        </div>
                        <ShareButton title={path.title} type="career path" id={path.id} />
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{path.category}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{path.subCategory}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 leading-tight">{path.title}</h3>
                    </div>
                    <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">{path.description}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {path.tags.map(tag => (
                        <span key={tag} className="text-[8px] font-black px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded-md text-slate-400 uppercase tracking-widest">
                          #{tag.replace(/\s+/g, '')}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-50 pt-4 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <Clock size={12} /> 2026 Focus
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={12} /> {path.milestones.length} Stages
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6 group border border-slate-100">
                  <Filter size={32} className="group-hover:rotate-12 transition-transform" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">No Matching Pathways</h3>
                <p className="text-sm text-slate-400 max-w-xs font-medium mb-8">Try adjusting your category, work environment, or search keywords to identify new trajectories.</p>
                <button 
                  onClick={() => { setActiveCategory("All"); setActiveWorkType("All"); setSearchQuery(""); }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const RoadmapView = ({ profile, pathId, careers, onNavigate }: { profile: UserProfile, pathId?: string, careers: CareerPath[], onNavigate: (view: 'landing' | 'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap', search?: string) => void }) => {
  const path = careers.find(p => p.id === pathId) || careers[0];
  
  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <SectionTitle 
        title={`${path.title} Roadmap`} 
        subtitle={`Adaptive Timeline for age ${profile.age}`} 
      />
      
      <div className="relative pl-8 border-l-2 border-indigo-100 space-y-10 ml-4">
        {path.milestones.map((ms, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={idx} 
            className="relative"
          >
            <div className={cn(
              "absolute -left-12 top-0 w-8 h-8 rounded-full border-4 border-slate-50 shadow-sm z-10 flex items-center justify-center text-xs font-bold",
              idx === 0 ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
            )}>
              {idx + 1}
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest">{ms.ageRange}</span>
                <span className="bg-slate-50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-md font-mono border border-slate-100">{ms.title}</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-3">{ms.description}</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {ms.requirements.map((req, i) => (
                  <span key={i} className="bg-indigo-50/50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 italic">
                    {req}
                  </span>
                ))}
              </div>

              {/* Global Institutions Preview */}
              <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                   <School size={12} className="text-indigo-600" />
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Training Centers</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {INSTITUTIONS.filter(inst => {
                      const query = (ms.requirements[0] || ms.title).toLowerCase();
                      return inst.programs.some(p => p.toLowerCase().includes(query)) || 
                             inst.name.toLowerCase().includes(query) ||
                             ms.requirements.some(r => inst.programs.some(p => p.toLowerCase().includes(r.toLowerCase())));
                   }).slice(0, 4).length > 0 ? (
                    INSTITUTIONS.filter(inst => {
                      const query = (ms.requirements[0] || ms.title).toLowerCase();
                      return inst.programs.some(p => p.toLowerCase().includes(query)) || 
                             inst.name.toLowerCase().includes(query) ||
                             ms.requirements.some(r => inst.programs.some(p => p.toLowerCase().includes(r.toLowerCase())));
                    }).slice(0, 4).map(inst => (
                      <div key={inst.id} className="flex items-center gap-2">
                         <div className="w-1 h-1 rounded-full bg-indigo-400" />
                         <span className="text-[10px] font-bold text-slate-600 truncate">{inst.name}</span>
                      </div>
                    ))
                   ) : (
                     <p className="text-[9px] font-medium text-slate-400 italic col-span-full text-center">Identifying niche academic hubs...</p>
                   )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <button 
                  onClick={() => onNavigate('institutions', ms.requirements[0] || ms.title)}
                  className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-all"
                >
                  Explore Related Institutions <ChevronRight size={12} />
                </button>
                <div className="flex items-center gap-1.5 opacity-40">
                   <Landmark size={12} className="text-slate-400" />
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Academic Hub Sync</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const InstitutionsView = ({ profile, initialSearch = "" }: { profile: UserProfile, initialSearch?: string }) => {
  const [search, setSearch] = useState(initialSearch);
  const [intlOnly, setIntlOnly] = useState(false);
  const [maxCost, setMaxCost] = useState(100000);
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [radius, setRadius] = useState<"Local" | "National" | "Global">("Global");
  const [visaFilter, setVisaFilter] = useState<Institution['visaSupport'] | 'All'>('All');
  const [showComparator, setShowComparator] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const budget = profile.budget;

  const toggleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter(i => i !== id));
    } else if (compareIds.length < 3) {
      setCompareIds([...compareIds, id]);
    }
  };

  // Mock user location for radius filtering simulation
  const userCountry = "USA"; 

  const programs = ["All Programs", ...Array.from(new Set(INSTITUTIONS.flatMap(inst => inst.programs)))].map(p => ({
    name: p,
    count: p === "All Programs" 
      ? INSTITUTIONS.length 
      : INSTITUTIONS.filter(i => i.programs.includes(p)).length
  }));

  const filtered = INSTITUTIONS.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(search.toLowerCase()) || 
                         inst.country.toLowerCase().includes(search.toLowerCase()) ||
                         inst.city.toLowerCase().includes(search.toLowerCase()) ||
                         inst.programs.some(p => p.toLowerCase().includes(search.toLowerCase()));
    const matchesIntl = !intlOnly || inst.allowsInternationalStudents;
    const matchesCost = inst.avgCost <= maxCost;
    const matchesProgram = selectedProgram === "All Programs" || inst.programs.includes(selectedProgram);
    const matchesVisa = visaFilter === "All" || inst.visaSupport === visaFilter;
    
    // Radius Filter Logic
    let matchesRadius = true;
    if (radius === "Local") {
       matchesRadius = inst.city === "Cambridge" || inst.city === "Stanford"; // Simulated local hub
    } else if (radius === "National") {
       matchesRadius = inst.country === userCountry;
    }

    return matchesSearch && matchesIntl && matchesCost && matchesProgram && matchesRadius && matchesVisa;
  });

  useEffect(() => {
    // Simulated IP Geolocation Sync
    const timer = setTimeout(() => {
      console.log("Geospatial Layer: User detected in London, UK region. Calibrating local hub radius.");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
             <MapPin size={18} className="animate-bounce" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Geospatial Intelligence</p>
            <p className="text-xs font-medium text-slate-300">Calibration Complete: High-density career hubs identified in <span className="text-white font-bold">your current region</span>.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10 hidden md:flex">
           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
           <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Teleport API Sync Active</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <SectionTitle title="Educational Ecosystem" subtitle="International Institution Dataset" />
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowComparator(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              <TrendingUp size={14} /> Compare Anywhere
            </button>
            <button 
              onClick={() => setIntlOnly(!intlOnly)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold border transition-all",
                intlOnly 
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300"
              )}
            >
              Int'l Student Only
            </button>
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search name, program, or location..." 
                className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showComparator && (
            <InstitutionComparator 
              onClose={() => setShowComparator(false)} 
              selectedIds={compareIds}
              onRemove={(id) => setCompareIds(compareIds.filter(i => i !== id))}
              onAddMore={() => setShowComparator(false)}
              profile={profile}
            />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="space-y-3">
             <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Geospatial Scope</label>
             </div>
             <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                {(["Local", "National", "Global"] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      radius === r ? "bg-white text-indigo-600 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {r}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Visa Support</label>
             <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  value={visaFilter}
                  onChange={(e) => setVisaFilter(e.target.value as any)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Support Levels</option>
                  <option value="Full">Full Support</option>
                  <option value="Partial">Partial Support</option>
                  <option value="None">No Support</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={14} />
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Max Annual Cost</label>
                <span className="text-sm font-bold text-indigo-600">${maxCost.toLocaleString()}</span>
             </div>
             <input 
               type="range" 
               min="0" 
               max="100000" 
               step="5000"
               value={maxCost}
               onChange={(e) => setMaxCost(parseInt(e.target.value))}
               className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
             />
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">Academic Program</label>
             <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                >
                  {programs.map(p => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.count})
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={14} />
             </div>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(inst => (
            <div key={inst.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-indigo-200 shadow-sm hover:shadow-md transition-all">
              <div className="h-40 relative">
                <img 
                  src={inst.image} 
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleCompare(inst.id); }}
                    className={cn(
                      "p-1.5 rounded-lg backdrop-blur-sm transition-all shadow-sm",
                      compareIds.includes(inst.id) 
                        ? "bg-indigo-600 text-white" 
                        : "bg-white/90 text-slate-400 hover:text-indigo-600"
                    )}
                    title={compareIds.includes(inst.id) ? "Remove from comparison" : "Add to comparison"}
                  >
                    <TrendingUp size={14} />
                  </button>
                  <div className="bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-black shadow-sm">
                    RANK #{inst.ranking}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-base font-bold text-slate-800 leading-tight">{inst.name}</h3>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-indigo-600 font-black text-sm">${(inst.avgCost/1000).toFixed(0)}K</span>
                    <ShareButton title={inst.name} type="institution" id={inst.id} />
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] font-medium mb-4 flex items-center gap-1">
                  <MapPin size={12} className="text-indigo-500" /> {inst.city}, {inst.country} • {inst.type}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded">
                    COL Index: {inst.costOfLivingIndex}x
                  </span>
                  {inst.programs.map((p, i) => (
                    <span key={i} className="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                      {p}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {inst.allowsInternationalStudents && (
                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
                      <UserCheck size={10} /> Int'l Students Accepted
                    </span>
                  )}
                  <span className={cn(
                    "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border",
                    inst.visaSupport === "Full" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    inst.visaSupport === "Partial" ? "bg-amber-50 text-amber-700 border-amber-100" :
                    "bg-slate-50 text-slate-700 border-slate-100"
                  )}>
                    Visa Support: {inst.visaSupport}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">DEADLINE</span>
                      <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <Clock size={10} /> {inst.applicationDeadline}
                      </span>
                  </div>
                  <a 
                    href={inst.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100"
                  >
                    Visit Official Site <ExternalLink size={10} />
                  </a>
                </div>

                {inst.avgCost > budget && (
                  <div className="mt-4 flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-100">
                    <div className="h-1 flex-1 bg-amber-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[70%]"></div>
                    </div>
                    <span className="text-amber-700 text-[9px] font-bold whitespace-nowrap">BUDGET EXCEEDED</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center"
        >
          <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Search size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Institutions Found</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            We couldn't find any institutions matching your current search parameters.
          </p>
          <button 
            onClick={() => {
              setSearch("");
              setIntlOnly(false);
              setMaxCost(100000);
              setSelectedProgram("All Programs");
            }}
            className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline"
          >
            Reset All Filters
          </button>
        </motion.div>
      )}

      {/* Floating Comparison Bar */}
      <AnimatePresence>
        {compareIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800 backdrop-blur-lg">
               <div className="flex -space-x-3 overflow-hidden">
                 {compareIds.map(id => {
                   const inst = INSTITUTIONS.find(i => i.id === id);
                   return (
                     <div key={id} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-800 overflow-hidden">
                       <img src={inst?.image} className="h-full w-full object-cover" />
                     </div>
                   );
                 })}
               </div>
               <div className="h-6 w-px bg-slate-700" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Comparison Hub</span>
                  <span className="text-xs font-bold">{compareIds.length} Institutions Selected</span>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={() => setShowComparator(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40"
                 >
                   Compare Side-by-Side
                 </button>
                 <button 
                   onClick={() => setCompareIds([])}
                   className="p-2 hover:bg-white/10 rounded-xl transition-all"
                 >
                   <X size={16} className="text-slate-500" />
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MaterialsView = () => {
  const [activeType, setActiveType] = useState<string>("All Types");
  const [activeProvider, setActiveProvider] = useState<string>("All Providers");
  const [activeRegion, setActiveRegion] = useState<string>("Global");
  const [activeLanguage, setActiveLanguage] = useState<string>("All Languages");
  const [activeRating, setActiveRating] = useState<number>(0);
  const [activeSkillLevel, setActiveSkillLevel] = useState<string>("All Levels");
  const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null);
  
  const [selectedSector, setSelectedSector] = useState<string>("Healthcare");
  const [aiCourses, setAiCourses] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const sectors = ["Healthcare & Life Sciences", "Technology & Digital", "Business, Finance & Management", "Education, Law & Public Service", "Arts, Design & Media", "Engineering, Science & Environment", "Skilled Trades & Technical Services"];
  const types = ["All Types", "video", "audio", "course"];
  const providers = ["All Providers", ...Array.from(new Set(STUDY_MATERIALS.map(m => m.provider)))];
  const regions = ["Global", "NA", "EU", "ASIA", "UK"];
  const languages = ["All Languages", ...Array.from(new Set(STUDY_MATERIALS.map(m => m.language)))];
  const ratings = [0, 4, 4.5];
  const skillLevels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

  const fetchAiCourses = async (sector: string) => {
    setIsAiLoading(true);
    const results = await getRecommendedCourses(sector);
    setAiCourses(results);
    setIsAiLoading(false);
  };

  useEffect(() => {
    fetchAiCourses(selectedSector);
  }, [selectedSector]);

  const filtered = STUDY_MATERIALS.filter(mat => {
    const matchesType = activeType === "All Types" || mat.type === activeType;
    const matchesProvider = activeProvider === "All Providers" || mat.provider === activeProvider;
    const matchesRegion = activeRegion === "Global" || mat.region === activeRegion || mat.region === "Global";
    const matchesLanguage = activeLanguage === "All Languages" || mat.language === activeLanguage;
    const matchesRating = mat.rating >= activeRating;
    const matchesSkill = activeSkillLevel === "All Levels" || mat.skillLevel === activeSkillLevel;
    return matchesType && matchesProvider && matchesRegion && matchesLanguage && matchesRating && matchesSkill;
  });

  return (
    <div className="space-y-12">
      {/* Sector Recommendations Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800">2026 Sector Intelligence</h3>
            <p className="text-slate-500 text-sm">AI-Curated Top 10 Learning Paths</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto max-w-full no-scrollbar">
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSector(s)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  selectedSector === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isAiLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 h-32 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {aiCourses.map((course, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={course.title + i}
                  onClick={() => setSelectedMaterial(course)}
                  className={cn(
                    "bg-slate-50 hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-100 rounded-2xl p-4 transition-all group cursor-pointer",
                    selectedMaterial?.title === course.title ? "ring-2 ring-indigo-500 bg-white shadow-lg" : ""
                  )}
                >
                  <div className="flex flex-col h-full justify-between gap-3">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{course.duration}</span>
                        <div className="bg-slate-900 text-white p-1 rounded-md">
                          <Zap size={8} />
                        </div>
                      </div>
                      <h5 className="text-[10px] font-bold text-slate-800 leading-tight mb-1 line-clamp-2">{course.title}</h5>
                      <p className="text-[9px] text-slate-400 font-medium mb-2">{course.provider}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-200/50">
                       <p className="text-[8px] text-slate-500 italic leading-tight line-clamp-2">"{course.reason}"</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Selected Course Intelligence Panel */}
        <AnimatePresence>
          {selectedMaterial && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-8 pt-8 border-t border-slate-100 overflow-hidden"
            >
              <div className="bg-indigo-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                 
                 <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-2">
                          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
                             <Landmark size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Collaborating Institution</p>
                             <h4 className="text-xl font-black">{selectedMaterial.institution?.name || selectedMaterial.provider}</h4>
                          </div>
                       </div>
                       
                       <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
                         {selectedMaterial.reason || "This module has been hand-selected for its high industry relevance and depth of coverage in your target domain."}
                       </p>

                       <div className="flex flex-wrap gap-4">
                          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                             <p className="text-[8px] font-black uppercase text-indigo-400 mb-0.5 tracking-wider">Global Position</p>
                             <p className="text-sm font-bold">{selectedMaterial.institution?.globalRanking || "Industry Standard"}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                             <p className="text-[8px] font-black uppercase text-indigo-400 mb-0.5 tracking-wider">Regional Hub</p>
                             <p className="text-sm font-bold">{selectedMaterial.institution?.location || selectedMaterial.region === "Global" ? "Global Access" : selectedMaterial.region || "Online"}</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                             <p className="text-[8px] font-black uppercase text-indigo-400 mb-0.5 tracking-wider">Course Duration</p>
                             <p className="text-sm font-bold">{selectedMaterial.duration}</p>
                          </div>
                       </div>
                    </div>

                    <div className="md:w-64 space-y-4">
                       <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Sync Options</p>
                          <div className="space-y-2">
                             <a 
                               href={selectedMaterial.url}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="block w-full py-2 bg-white text-indigo-900 rounded-xl font-black uppercase text-center text-[10px] tracking-widest hover:bg-slate-100 transition-colors"
                             >
                                Enroll via Spark.E
                             </a>
                             <button className="w-full py-2 bg-indigo-500/50 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-colors border border-indigo-400/30">
                                Send to Supervisor
                             </button>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSelectedMaterial(null)}
                         className="w-full py-2 text-indigo-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                        >
                          <X size={14} /> Deselect Path
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <SectionTitle title="Standard Learning Library" subtitle="Micro-learning Sync: Active" />
        <div className="flex flex-wrap gap-4 w-full md:w-auto items-center">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
             {regions.map(r => (
               <button
                 key={r}
                 onClick={() => setActiveRegion(r)}
                 className={cn(
                   "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all",
                   activeRegion === r ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                 )}
               >
                 {r}
               </button>
             ))}
          </div>
          <div className="w-[1px] h-6 bg-slate-200" />
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               value={activeType}
               onChange={(e) => setActiveType(e.target.value)}
               className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer"
             >
               {types.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
             </select>
             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={12} />
          </div>

          <div className="relative">
             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <BookOpen size={14} />
             </div>
             <select 
               value={activeProvider}
               onChange={(e) => setActiveProvider(e.target.value)}
               className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer min-w-[140px]"
             >
               {providers.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={12} />
          </div>

          <div className="relative">
             <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               value={activeLanguage}
               onChange={(e) => setActiveLanguage(e.target.value)}
               className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer min-w-[130px]"
             >
               {languages.map(l => <option key={l} value={l}>{l}</option>)}
             </select>
             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={12} />
          </div>

          <div className="relative">
             <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               value={activeRating}
               onChange={(e) => setActiveRating(Number(e.target.value))}
               className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer min-w-[110px]"
             >
               <option value={0}>All Ratings</option>
               <option value={4}>4.0+ Stars</option>
               <option value={4.5}>4.5+ Stars</option>
             </select>
             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={12} />
          </div>

          <div className="relative">
             <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             <select 
               value={activeSkillLevel}
               onChange={(e) => setActiveSkillLevel(e.target.value)}
               className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none appearance-none cursor-pointer min-w-[120px]"
             >
               {skillLevels.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={12} />
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(mat => (
            <motion.div 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={mat.id} 
              onClick={() => setSelectedMaterial(mat)}
              className={cn(
                "bg-white p-4 rounded-2xl border transition-all group cursor-pointer",
                selectedMaterial?.id === mat.id ? "border-indigo-600 shadow-lg ring-1 ring-indigo-100" : "border-slate-200 shadow-sm hover:border-indigo-100"
              )}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-4 bg-slate-100">
                <img src={mat.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                  <div className="bg-white p-2.5 rounded-full shadow-lg text-indigo-600 group-hover:scale-110 transition-transform">
                    {mat.type === 'video' ? <PlayCircle size={24} /> : mat.type === 'audio' ? <Headphones size={24} /> : <BookOpen size={24} />}
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                   <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{mat.type}</span>
                   <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{mat.duration}</span>
                </div>
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{mat.title}</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{mat.provider}</p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-500">
                  <Star size={8} className="text-amber-500 fill-amber-500" /> {mat.rating}
                </div>
                <div className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[8px] font-black uppercase text-indigo-600">
                  {mat.skillLevel}
                </div>
                <div className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-400">
                  {mat.language}
                </div>
              </div>

              <a 
                href={mat.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline pt-3 border-t border-slate-50"
              >
                Access Module <ExternalLink size={10} />
              </a>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
           <p className="text-slate-400 text-sm font-bold">No materials match your filter criteria.</p>
           <button 
             onClick={() => { 
                setActiveType("All Types"); 
                setActiveProvider("All Providers"); 
                setActiveRegion("Global");
                setActiveLanguage("All Languages");
                setActiveRating(0);
                setActiveSkillLevel("All Levels");
             }}
             className="mt-4 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline"
           >
             Clear Filters
           </button>
        </div>
      )}
    </div>
  );
};

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AIAdvisor = ({ profile }: { profile: UserProfile }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string>("");
  const [linkedinData, setLinkedinData] = useState<string | null>(null);
  const [showContextOptions, setShowContextOptions] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzingLinkedIn, setIsAnalyzingLinkedIn] = useState(false);
  const [analyzedSkills, setAnalyzedSkills] = useState<{name: string, strength: number}[]>([]);

  const clearContext = () => {
    if (window.confirm("Are you sure you want to purge all career context? This will remove your analyzed resume and LinkedIn data from Spark.E's focus.")) {
      setResumeText(null);
      setLinkedinUrl("");
      setLinkedinData(null);
      setAnalyzedSkills([]);
    }
  };

  const simulateSkillExtraction = (text: string) => {
    // Simulated skill extraction logic
    const commonSkills = ["React", "TypeScript", "Python", "Data Analysis", "Project Management", "AI/ML", "Cloud Systems", "UX Design"];
    const interests = profile.interests;
    
    // Mix interests with common skills to simulate personalized extraction
    const extracted = [...interests, ...commonSkills.slice(0, 3)]
      .map(skill => ({
        name: skill,
        strength: Math.floor(Math.random() * 40) + 60 // High strength 60-100%
      }))
      .slice(0, 5); // Pick top 5
    
    setAnalyzedSkills(extracted);
  };

  const handleLinkedinSync = async () => {
    if (!linkedinUrl) return;
    setIsAnalyzingLinkedIn(true);
    
    // Simulate LinkedIn Data Fetching & Analysis
    // In a real app, this would call a backend proxy/scraper
    setTimeout(() => {
      setLinkedinData(`[Spark.E Analysis: ${linkedinUrl}] Profile appears to be a professional in the ${profile.interests[0] || 'Technology'} sector. Career history suggests growth-oriented mindset with interests in ${profile.interests.join(", ")}.`);
      setIsAnalyzingLinkedIn(false);
      setShowContextOptions(false);
      alert("LinkedIn profile intelligence successfully synced to your session.");
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeText(text);
          simulateSkillExtraction(text);
          alert("Resume successfully synced to Spark.E context.");
          setIsParsing(false);
        };
        reader.readAsText(file);
      } else if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
        }
        
        setResumeText(fullText);
        simulateSkillExtraction(fullText);
        alert(`Spark.E has parsed ${pdf.numPages} pages from your resume.`);
        setIsParsing(false);
      } else {
        // Fallback for other formats
        setResumeText(`[SIMULATED PARSE: ${file.name}] Format not directly supported for full text extraction. Please use .txt or .pdf for best results.`);
        alert(`Spark.E has indexed your file: ${file.name}. Meta-data will be used.`);
        setIsParsing(false);
      }
    } catch (error) {
      console.error("Parsing error:", error);
      alert("Failed to parse the file. Please try a different format.");
      setIsParsing(false);
    }
    setShowContextOptions(false);
  };

  const handleSend = async () => {
    if (!input.trim() && !linkedinUrl && !resumeText) return;
    
    const userMsg = input || (linkedinData ? `Analyze my LinkedIn profile context.` : "Analyze my uploaded resume for career advice.");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setIsLoading(true);

    const advice = await getCareerAdvice(userMsg, profile, {
      resume: resumeText || undefined,
      linkedIn: linkedinData || linkedinUrl || undefined
    });
    
    setMessages(prev => [...prev, { role: 'ai', text: advice || "Error fetching advice." }]);
    setIsLoading(false);
    setShowContextOptions(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
      <div className="p-5 bg-slate-900/50 border-b border-slate-700/50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            ⚡
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-none">Spark.E</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Career Mentor</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowContextOptions(!showContextOptions)}
             title="Context Options"
             className={cn(
               "p-1.5 rounded-lg transition-all",
               showContextOptions ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-slate-700 text-slate-500"
             )}
           >
             <Settings size={14} className={cn(showContextOptions && "rotate-90 transition-transform")} />
           </button>
           {(resumeText || linkedinData) && (
             <button 
               onClick={clearContext}
               title="Clear All Context"
               className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-all"
             >
               <Trash2 size={14} />
             </button>
           )}
           {resumeText && <FileText size={14} className="text-emerald-400" />}
           {linkedinData && <Linkedin size={14} className="text-blue-400" />}
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="bg-indigo-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
               <MessageSquare size={32} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Connect with your future</h4>
            <p className="text-slate-500 text-[10px] leading-relaxed max-w-xs mx-auto uppercase tracking-widest font-black mb-6">Personalize with your data</p>
            
            <button 
              onClick={() => setShowContextOptions(!showContextOptions)}
              className={cn(
                "w-full py-4 px-6 bg-slate-700/30 border border-dashed rounded-3xl flex items-center justify-center gap-3 transition-all group mb-6",
                showContextOptions ? "border-indigo-500 bg-indigo-500/5" : "border-slate-600 hover:bg-slate-700/50"
              )}
            >
              <Settings size={20} className={cn("text-slate-400 group-hover:text-indigo-400 transition-all", showContextOptions && "rotate-90 text-indigo-400")} />
              <div className="text-left">
                <span className="block text-[10px] font-black text-white uppercase tracking-widest leading-none">Context Options</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">Resume • LinkedIn • AI Persona</span>
              </div>
            </button>

            {analyzedSkills.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-5 bg-slate-900/50 rounded-2xl border border-slate-700/50 relative overflow-hidden group/matrix"
              >
                <div className="absolute top-0 right-0 p-1 opacity-20 group-hover/matrix:opacity-40 transition-opacity">
                  <Activity size={40} className="text-indigo-500" />
                </div>
                <div className="flex items-center justify-between mb-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Profile Skill Density</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">vs. 2026 Demand Peaks</span>
                </div>
                <div className="grid gap-4">
                  {analyzedSkills.map((skill, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] text-white font-semibold flex items-center gap-1.5">
                          {skill.strength > 85 ? <Star size={10} className="text-amber-400 fill-amber-400" /> : null}
                          {skill.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-indigo-300 font-black tabular-nums">{skill.strength}%</span>
                          <span className="text-[8px] px-1 bg-indigo-500/10 text-indigo-400 rounded uppercase font-black">
                            {skill.strength > 90 ? "Peak" : skill.strength > 80 ? "Alpha" : "Beta"}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.strength}%` }}
                          transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.1 }}
                          className="h-full bg-gradient-to-r from-indigo-600 via-indigo-400 to-blue-300 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 font-medium italic text-left uppercase tracking-wider">
                    AI-Derived from documentation & professional signals
                  </span>
                  <div className="flex -space-x-1">
                    {[1,2,3].map(i => <div key={i} className="w-4 h-4 rounded-full border border-slate-800 bg-slate-700 flex items-center justify-center text-[6px] font-bold text-slate-400">AI</div>)}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        {showContextOptions && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-5 bg-slate-900 border-b border-slate-700/50 space-y-6 overflow-hidden"
          >
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Career Context Intelligence</h4>
                <button onClick={() => setShowContextOptions(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={14} />
                </button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                {/* Resume Upload Column */}
                <div className="space-y-3">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Document Sync</p>
                   <label className={cn(
                     "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-dashed transition-all cursor-pointer group/upload",
                     resumeText ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-800 border-slate-700 hover:border-indigo-500/50"
                   )}>
                      {isParsing ? (
                        <RotateCcw size={16} className="text-indigo-400 animate-spin" />
                      ) : (
                        resumeText ? <CheckCircle size={16} className="text-emerald-400" /> : <UploadCloud size={16} className="text-slate-500 group-hover/upload:text-indigo-400" />
                      )}
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter",
                        resumeText ? "text-emerald-400/80" : "text-slate-400 group-hover/upload:text-indigo-300"
                      )}>
                        {isParsing ? "Analyzing..." : resumeText ? "Resume Synced" : "Upload Resume"}
                      </span>
                      <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.pdf" disabled={isParsing} />
                   </label>
                </div>

                {/* LinkedIn Sync Column */}
                <div className="space-y-3">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Social Identity</p>
                   <div className="space-y-2">
                       <input 
                         type="url" 
                         value={linkedinUrl}
                         onChange={(e) => setLinkedinUrl(e.target.value)}
                         placeholder="linkedin.com/in/..."
                         className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[9px] text-white outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600"
                       />
                       <button 
                         onClick={handleLinkedinSync}
                         disabled={isAnalyzingLinkedIn || !linkedinUrl}
                         className="w-full py-2 bg-indigo-600 rounded-xl text-[8px] font-black uppercase text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                       >
                          {isAnalyzingLinkedIn ? <RotateCcw size={10} className="animate-spin" /> : <Linkedin size={10} />}
                          {isAnalyzingLinkedIn ? "Syncing" : linkedinData ? "Refresh Context" : "Link Account"}
                       </button>
                   </div>
                </div>
             </div>

             <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <p className="text-[8px] text-slate-500 font-medium italic">
                  * All context data is processed locally for your session. Purple badge signals represent active AI focus alignment.
                </p>
             </div>
          </motion.div>
        )}

        {messages.map((m, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i} 
            className={cn(
              "max-w-[95%] p-5 rounded-3xl text-[11px] leading-relaxed",
              m.role === 'user' ? "bg-indigo-600 text-white ml-auto font-medium shadow-lg" : "bg-slate-700/50 text-slate-100 border border-slate-600/50"
            )}
          >
            <div className="prose prose-invert prose-xs max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match && match[1] === 'career-data') {
                      try {
                        const careerData = JSON.parse(String(children).replace(/\n/g, ''));
                        if (careerData.type === 'growth') {
                          return (
                            <div className="my-4 p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <TrendingUp size={12} /> Market Growth Projection
                              </p>
                              <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={careerData.data}>
                                    <defs>
                                      <linearGradient id="careerGrowth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                                    <XAxis dataKey="year" fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                    <YAxis fontSize={8} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="val" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#careerGrowth)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        }
                        if (careerData.type === 'skills') {
                          return (
                            <div className="my-4 p-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl">
                              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target size={12} /> Competency Matrix
                              </p>
                              <div className="space-y-3">
                                {careerData.data.map((skill: any, idx: number) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                      <span>{skill.name}</span>
                                      <span>{skill.val}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${skill.val}%` }}
                                        className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" 
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        return <code className={className} {...props}>{children}</code>;
                      }
                    }
                    return <code className={className} {...props}>{children}</code>;
                  }
                }}
              >
                {m.text}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 bg-slate-700/30 p-4 rounded-2xl w-fit">
            <div className="flex gap-1">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-indigo-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-indigo-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-indigo-500 rounded-full" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest tracking-tighter">Analyzing Context</span>
          </div>
        )}
      </div>

      <div className="p-5 bg-slate-900/40 border-t border-slate-700/50 flex gap-3 relative">
        {resumeText && (
          <div className="absolute -top-8 left-5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Check size={8} /> Resume Synced
          </div>
        )}
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask Spark.E anything..."
          className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-xs text-white placeholder-slate-500 font-medium"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 font-bold text-[10px] uppercase tracking-widest"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

const ParentalDashboard = ({ profile, onBack, careers }: { profile: UserProfile, onBack: () => void, careers: CareerPath[] }) => {
  const currentPath = careers.find(p => p.id === profile.targetCareerId) || careers[0];
  const progressPercent = Math.min(((profile.completedMilestones.length / currentPath.milestones.length) * 100), 100);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <SectionTitle title="Parental Control Center" subtitle={`Monitoring progress for: ${profile.name}`} />
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-all text-sm font-bold"
        >
          <ArrowLeft size={16} /> Exit Supervisor View
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Exploration Roadmap Progress</h3>
            <div className="space-y-4 relative z-10">
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{currentPath.title}</p>
                <span className="text-3xl font-black text-slate-900">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-indigo-600 shadow-lg shadow-indigo-100" 
                />
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <ShieldCheck size={160} className="text-slate-900" />
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <h4 className="font-bold text-emerald-900 mb-1">Recommended Next Step</h4>
              <p className="text-emerald-700 text-sm leading-relaxed mb-4">
                {profile.name} has completed the "Exploratory Phase". We recommend enrolling in a 
                <span className="font-bold"> Python for Beginners</span> micro-course to start the "Foundational Phase".
              </p>
              <button className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all">
                Send Materials to {profile.name}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats & Controls */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Guardianship Status</h4>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">SJ</div>
                  <div>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Sarah Jenkins</p>
                     <p className="text-[9px] text-slate-400">Primary Supervisor</p>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-50 space-y-3">
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="text-[10px] font-bold text-slate-500">EMAIL ALERTS</span>
                     <div className="w-8 h-4 bg-indigo-600 rounded-full flex items-center justify-end px-1 shadow-inner"><div className="w-2 h-2 bg-white rounded-full"></div></div>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 opacity-50">
                     <span className="text-[10px] font-bold text-slate-500">SPENDING CAP</span>
                     <span className="text-[10px] font-black text-slate-800">$1,200/mo</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
             <h4 className="text-sm font-bold mb-4">Top Careers for {profile.name}</h4>
             <div className="space-y-3">
                {CAREER_PATHS.map(p => (
                   <div key={p.id} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                      <span className="font-medium text-slate-300">{p.title.split(' ')[0]} Specialist</span>
                      <span className="text-emerald-400 font-black">94% Fit</span>
                   </div>
                ))}
             </div>
             <p className="text-[10px] text-slate-500 italic mt-6">*Compatibility based on interest evolution in 2026.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FundingOpportunitiesView = ({ profile }: { profile: UserProfile }) => {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const performMatch = async () => {
    setIsLoading(true);
    const matches = await matchScholarships(profile);
    setOpportunities(matches);
    setIsLoading(false);
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds(prev => 
      prev.includes(id) ? prev.filter(savedId => savedId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    performMatch();
  }, [profile.targetCareerId]);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         opp.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSaved = !showSavedOnly || savedIds.includes(opp.id);
    return matchesSearch && matchesSaved;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Consolidated Funding Opportunities</h4>
          <p className="text-[10px] text-slate-400 font-medium">Manage your financial portfolio and bookmarked aids.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
              showSavedOnly 
                ? "bg-rose-50 border-rose-100 text-rose-600" 
                : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"
            )}
          >
            <Heart size={12} fill={showSavedOnly ? "currentColor" : "none"} />
            {showSavedOnly ? `Saved (${savedIds.length})` : "View Saved"}
          </button>
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text"
              placeholder="Search by name or provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
            />
          </div>
          <button 
            onClick={performMatch}
            disabled={isLoading}
            className="text-[10px] font-black uppercase text-indigo-600 hover:underline flex items-center gap-1 disabled:opacity-50 shrink-0"
          >
            <Activity size={12} /> {isLoading ? "Syncing..." : "Sync Funding Hub"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 animate-pulse">
               <div className="h-4 w-3/4 bg-slate-100 rounded" />
               <div className="h-3 w-1/2 bg-slate-50 rounded" />
               <div className="h-12 bg-slate-50 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {opportunities.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
              <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-500">
                <Landmark size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Financial Intelligence Dormant</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Click 'Sync Funding Hub' to run the AI matching engine based on your profile and academic standing.</p>
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
              <div className="bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">No matches found</h3>
              <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
                {showSavedOnly ? "You haven't bookmarked any opportunities matching these criteria yet." : "Try adjusting your search query to find relevant funding."}
              </p>
              {showSavedOnly && (
                <button 
                  onClick={() => setShowSavedOnly(false)}
                  className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline"
                >
                  Show all opportunities
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredOpportunities.map((opp, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={opp.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between"
                  >
                    {/* ... rest of the card content ... */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          opp.type === 'Scholarship' ? "bg-emerald-50 text-emerald-600" : 
                          opp.type === 'Grant' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {opp.type}
                        </span>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest truncate">{opp.category}</span>
                      </div>
                      <h5 className="font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.5rem]">{opp.name}</h5>
                      <p className="text-[9px] text-slate-400 font-medium truncate">Provider: {opp.provider}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button 
                        onClick={(e) => toggleSave(opp.id, e)}
                        className={cn(
                          "p-2 rounded-xl border transition-all",
                          savedIds.includes(opp.id) 
                            ? "bg-rose-50 border-rose-100 text-rose-500 shadow-sm shadow-rose-100" 
                            : "bg-white border-slate-100 text-slate-300 hover:text-slate-400 hover:border-slate-200"
                        )}
                      >
                        <Heart size={14} fill={savedIds.includes(opp.id) ? "currentColor" : "none"} />
                      </button>
                      <div className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black flex flex-col items-center justify-center min-w-[3.5rem]",
                        (opp.matchScore || 0) > 80 ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      )}>
                        <span>{opp.matchScore || 0}%</span>
                        <span className="text-[7px] uppercase -mt-0.5 opacity-60">Match</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 bg-slate-50/50 rounded-xl px-3 border border-slate-100">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Value</p>
                      <p className="text-sm font-black text-slate-800">${opp.amount.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div className="text-right">
                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-tighter mb-0.5 text-center">Deadline</p>
                      <p className="text-[10px] font-bold text-rose-900">{new Date(opp.deadline).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {opp.terms && (
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                       <p className="text-[9px] font-bold text-amber-700 uppercase flex items-center gap-1">
                         <Target size={10} /> {opp.terms}
                       </p>
                    </div>
                  )}

                  {opp.matchReasoning && (
                    <p className="text-[10px] text-slate-500 italic leading-snug line-clamp-2 px-1">
                      "{opp.matchReasoning}"
                    </p>
                  )}
                </div>

                <button className="mt-4 w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                  <ExternalLink size={12} /> Apply now
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </>
  )}
</div>
  );
};

const FinancialView = ({ profile, setProfile }: { profile: UserProfile, setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) => {
  const [activeTab, setActiveTab] = useState<'planner' | 'projections' | 'calculator' | 'funding'>('planner');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [showGoalNotification, setShowGoalNotification] = useState<string | null>(null);
  
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const expenseData = profile.financialProfile?.monthlyExpenses.map(e => ({ name: e.category, value: e.amount })) || [];
  const totalMonthlyExpenses = profile.financialProfile?.monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  // Retirement Projection Mock Logic
  const currentAge = profile.age;
  const retireAge = 65;
  const yearsToRetire = retireAge - currentAge;
  const monthlySavings = (profile.financialProfile?.annualIncome || 0) / 12 - totalMonthlyExpenses;
  const projectedReturn = 0.07; // 7% annual
  
  const projectionData = Array.from({ length: yearsToRetire / 5 + 1 }, (_, i) => {
    const years = i * 5;
    const futureValue = (profile.financialProfile?.currentSavings || 0) * Math.pow(1 + projectedReturn, years) +
      (monthlySavings * 12 * (Math.pow(1 + projectedReturn, years) - 1)) / projectedReturn;
    return {
      year: currentAge + years,
      balance: Math.round(futureValue)
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <SectionTitle title="Financial Intelligence" subtitle="System Integrated Capital Planning" />
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
           {['planner', 'projections', 'calculator', 'funding'].map((t) => (
             <button
               key={t}
               onClick={() => setActiveTab(t as any)}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                 activeTab === t ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:text-indigo-600"
               )}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Controls / Forms */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Wallet size={16} className="text-indigo-600" /> Income & Savings
            </h4>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Annual Income</label>
                 <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <span className="text-slate-400 font-mono italic">$</span>
                   <input 
                     type="number" 
                     className="bg-transparent outline-none w-full font-bold text-slate-800 text-sm"
                     value={profile.financialProfile?.annualIncome}
                     onChange={(e) => setProfile(prev => ({ 
                       ...prev, 
                       financialProfile: { ...prev.financialProfile!, annualIncome: parseInt(e.target.value) || 0 } 
                     }))}
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Total Savings</label>
                 <div className="flex items-center gap-2 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
                   <PiggyBank size={14} className="text-indigo-600" />
                   <input 
                     type="number" 
                     className="bg-transparent outline-none w-full font-bold text-indigo-900 text-sm"
                     value={profile.financialProfile?.currentSavings}
                     onChange={(e) => setProfile(prev => ({ 
                       ...prev, 
                       financialProfile: { ...prev.financialProfile!, currentSavings: parseInt(e.target.value) || 0 } 
                     }))}
                   />
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white text-xs leading-relaxed shadow-xl border border-slate-800">
             <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest mb-4">
                <ShieldCheck size={14} /> AI Recommendation
             </div>
             <p className="text-slate-300 italic mb-4">
               "Based on your savings rate and {profile.targetCareerId} trajectory, you have a 
               <span className="text-white font-bold"> matched contribution</span> opportunity. 
               Move $1,200 of current savings into an index-linked tax-shelter."
             </p>
             <button className="w-full py-2 bg-indigo-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all">
                Execute AI Portfolio Sync
             </button>
          </div>
        </div>

        {/* Right: Visualization Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === 'planner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex justify-between items-center">
                  Expense Distribution <span className="text-xs text-slate-400 font-mono tracking-tighter">${totalMonthlyExpenses}/mo</span>
                </h4>
                <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                   {expenseData.map((e, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                        <span className="text-[10px] font-bold text-slate-500 truncate uppercase">{e.name}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex justify-between items-center">
                  Financial Goals
                  <AnimatePresence>
                    {showGoalNotification && (
                      <motion.span 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1"
                      >
                        <Check size={10} /> {showGoalNotification}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </h4>
                <div className="space-y-6 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide flex-1">
                  {profile.financialProfile?.goals.map(goal => (
                    <div key={goal.id} className="group relative bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                       {editingGoalId === goal.id ? (
                         <div className="space-y-3">
                            <input 
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                              value={goal.title}
                              onChange={(e) => {
                                const newGoals = profile.financialProfile?.goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g) || [];
                                setProfile(prev => ({ 
                                  ...prev, 
                                  financialProfile: { 
                                    ...(prev.financialProfile || { annualIncome: 0, currentSavings: 0, monthlyExpenses: [], goals: [], debt: [] }), 
                                    goals: newGoals 
                                  } 
                                }));
                              }}
                            />
                            <div className="flex gap-2">
                               <div className="flex-1 space-y-1">
                                 <label className="text-[8px] font-black uppercase text-slate-400">Current</label>
                                 <input 
                                   type="number"
                                   className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                   value={goal.current}
                                   onChange={(e) => {
                                     const val = parseInt(e.target.value) || 0;
                                     const newGoals = profile.financialProfile?.goals.map(g => g.id === goal.id ? { ...g, current: val } : g) || [];
                                     setProfile(prev => ({ 
                                       ...prev, 
                                       financialProfile: { 
                                         ...(prev.financialProfile || { annualIncome: 0, currentSavings: 0, monthlyExpenses: [], goals: [], debt: [] }), 
                                         goals: newGoals 
                                       } 
                                     }));
                                     setShowGoalNotification(`Progress Sync: ${goal.title}`);
                                     setTimeout(() => setShowGoalNotification(null), 3000);
                                   }}
                                 />
                               </div>
                               <div className="flex-1 space-y-1">
                                 <label className="text-[8px] font-black uppercase text-slate-400">Target</label>
                                 <input 
                                   type="number"
                                   className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                   value={goal.target}
                                   onChange={(e) => {
                                     const val = parseInt(e.target.value) || 0;
                                     const newGoals = profile.financialProfile?.goals.map(g => g.id === goal.id ? { ...g, target: val } : g) || [];
                                     setProfile(prev => ({ 
                                       ...prev, 
                                       financialProfile: { 
                                         ...(prev.financialProfile || { annualIncome: 0, currentSavings: 0, monthlyExpenses: [], goals: [], debt: [] }), 
                                         goals: newGoals 
                                       } 
                                     }));
                                   }}
                                 />
                               </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                               <button 
                                 onClick={() => {
                                   if (confirm(`Delete goal: ${goal.title}?`)) {
                                     const newGoals = profile.financialProfile?.goals.filter(g => g.id !== goal.id) || [];
                                     setProfile(prev => ({ 
                                       ...prev, 
                                       financialProfile: { 
                                         ...(prev.financialProfile || { annualIncome: 0, currentSavings: 0, monthlyExpenses: [], goals: [], debt: [] }), 
                                         goals: newGoals 
                                       } 
                                     }));
                                     setEditingGoalId(null);
                                   }
                                 }}
                                 className="text-[9px] font-black text-rose-500 uppercase hover:underline"
                               >
                                 Purge Goal
                               </button>
                               <button 
                                 onClick={() => setEditingGoalId(null)}
                                 className="bg-indigo-600 text-white px-4 py-1 rounded-lg text-[9px] font-black uppercase shadow-lg shadow-indigo-100"
                               >
                                 Finalize
                               </button>
                            </div>
                         </div>
                       ) : (
                         <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">{goal.title}</span>
                                <button 
                                  onClick={() => setEditingGoalId(goal.id)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-500 transition-all p-1"
                                  title="Edit Goal"
                                >
                                  <Pencil size={10} />
                                </button>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-indigo-600">${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-slate-100/50 rounded-full overflow-hidden border border-slate-100">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  (goal.current / goal.target) >= 1 ? "bg-emerald-500" : "bg-indigo-500"
                                )} 
                              />
                            </div>
                            <div className="flex justify-between items-center">
                               <p className="text-[9px] text-slate-400 font-bold uppercase">Deadline: {goal.deadline}</p>
                               <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{Math.round((goal.current / goal.target) * 100)}%</span>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newId = `goal-${Date.now()}`;
                      const newGoal = { id: newId, title: "New Custom Goal", target: 5000, current: 0, deadline: new Date(Date.now() + 31536000000).toISOString().split('T')[0] };
                      const newGoals = [...(profile.financialProfile?.goals || []), newGoal];
                      setProfile(prev => ({ 
                        ...prev, 
                        financialProfile: { 
                          ...(prev.financialProfile || { annualIncome: 0, currentSavings: 0, monthlyExpenses: [], goals: [], debt: [] }), 
                          goals: newGoals 
                        } 
                      }));
                      setEditingGoalId(newId);
                    }}
                    className="w-full py-3 border border-dashed border-slate-200 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Target size={12} /> Add New Financial Goal
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projections' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1 flex flex-col">
               <h4 className="text-sm font-bold text-slate-800 mb-6">Retirement & Net Worth Projection</h4>
               <div className="flex-1 min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} tickFormatter={(v) => `$${(v/1000)}k`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-6 p-4 bg-indigo-50 rounded-2xl flex items-center justify-between border border-indigo-100">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase">Est. Nest Egg at 65</p>
                    <p className="text-2xl font-black text-indigo-900">${projectionData[projectionData.length-1].balance.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Growth Formula</p>
                    <p className="text-xs font-bold text-indigo-700">7% Ann. Returns + ${monthlySavings.toLocaleString()}/mo Savings</p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <TrendingDown size={16} className="text-rose-500" /> Debt Paydown Tracker
                  </h4>
                  <div className="space-y-4">
                    {profile.financialProfile?.debt.map(d => (
                      <div key={d.id} className="p-4 bg-rose-50/30 rounded-2xl border border-rose-100">
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-rose-900 uppercase tracking-tighter">{d.title}</span>
                            <span className="text-[10px] font-black text-rose-600 bg-white px-2 py-0.5 rounded shadow-sm">{d.interestRate}% APR</span>
                         </div>
                         <div className="flex justify-between items-end">
                            <p className="text-lg font-black text-rose-900">${d.amount.toLocaleString()}</p>
                            <button className="text-[9px] font-black uppercase text-rose-500 hover:underline">One-time payment</button>
                         </div>
                      </div>
                    ))}
                    <button className="w-full py-3 border border-dashed border-rose-200 rounded-2xl text-[10px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
                      Add New Debt Account
                    </button>
                  </div>
               </div>

               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                       <Landmark size={16} className="text-indigo-600" /> Savings Yield Forecast
                    </h4>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      Your current liquid savings are generating <span className="font-bold text-indigo-600">4.1% APY</span> in a high-yield account.
                    </p>
                    <div className="space-y-3">
                       {['HYS Account', 'Direct CD', 'T-Bills (3-mo)'].map((acc, i) => (
                         <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                           <span className="text-[10px] font-bold capitalize text-slate-700">{acc}</span>
                           <span className="text-[10px] font-black text-indigo-600 tracking-widest">{4.1 + i*0.2}%</span>
                         </div>
                       ))}
                    </div>
                  </div>
                  <p className="mt-6 text-[9px] text-slate-400 font-mono italic">Market Data via Fed-Sync 2026 API.</p>
               </div>
            </div>
          )}

          {activeTab === 'funding' && <FundingOpportunitiesView profile={profile} />}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap'>('landing');
  const [selectedPathId, setSelectedPathId] = useState<string>("ai-engineer");
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState("");

  const handleNavigate = (view: typeof activeView, search?: string) => {
    if (view === 'institutions' && search) {
      setInstitutionSearchQuery(search);
    } else if (view !== 'institutions') {
      setInstitutionSearchQuery("");
    }
    setActiveView(view);
  };
  const [careers, setCareers] = useState<CareerPath[]>(CAREER_PATHS);
  const [isCareersLoading, setIsCareersLoading] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex",
    age: 16,
    education: "High School Junior",
    interests: ["Coding", "Robotics", "Space"],
    budget: 50000,
    country: "USA",
    targetCareerId: "ai-engineer",
    completedMilestones: ["ai-engineer-0"], // Pre-populated progress
    academicPerformance: {
      gpa: 3.9,
      achievements: ["Winner of Regional Robotics Hackathon", "Gold Medal in Creative Tech Math Olympiad"]
    },
    financialProfile: {
      annualIncome: 65000,
      currentSavings: 12000,
      monthlyExpenses: [
        { category: "Housing", amount: 1200 },
        { category: "Food", amount: 400 },
        { category: "Transport", amount: 300 },
        { category: "Entertainment", amount: 200 }
      ],
      goals: [
        { id: '1', title: 'Emergency Fund', target: 20000, current: 8000, deadline: '2026-12-31' },
        { id: '2', title: 'Tech Equipment', target: 5000, current: 2000, deadline: '2026-06-30' }
      ],
      debt: [
        { id: '1', title: 'Student Loan', amount: 15000, interestRate: 4.5 }
      ]
    }
  });

  const handleSelectPath = (id: string) => {
    setSelectedPathId(id);
    setProfile(prev => ({ ...prev, targetCareerId: id }));
    setActiveView('roadmap');
  };

  useEffect(() => {
    const fetchCareers = async () => {
      setIsCareersLoading(true);
      const dynamicCareers = await getTopGlobalCareers();
      if (dynamicCareers && dynamicCareers.length > 0) {
        setCareers(dynamicCareers);
        // Ensure default selected is valid
        if (!dynamicCareers.some(p => p.id === selectedPathId)) {
          setSelectedPathId(dynamicCareers[0].id);
        }
      }
      setIsCareersLoading(false);
    };
    fetchCareers();
  }, []);

  if (activeView === 'landing') {
    return <LandingPage onStart={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Header Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 z-20 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView('dashboard')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-200">CV</div>
          <span className="text-xl font-bold tracking-tight text-slate-800">CareerVision<span className="text-indigo-600 font-black italic">AI</span></span>
        </div>
        <nav className="hidden lg:flex gap-8">
          <NavItem label="Dashboard" active={activeView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <NavItem label="Personalized Roadmap" active={activeView === 'roadmap'} onClick={() => handleNavigate('roadmap')} />
          <NavItem label="Institutions" active={activeView === 'institutions'} onClick={() => handleNavigate('institutions')} />
          <NavItem label="Career Hubs" active={activeView === 'heatmap'} onClick={() => handleNavigate('heatmap')} />
          <NavItem label="Learning Hub" active={activeView === 'materials'} onClick={() => handleNavigate('materials')} />
          <NavItem label="Financial Simulator" active={activeView === 'expenses'} onClick={() => handleNavigate('expenses')} />
        </nav>
        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <div className="h-6 w-6 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
            <User size={14} className="text-indigo-600" />
          </div>
          <span className="text-xs font-bold text-slate-700">{profile.name}</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* Left Column: Context & Mentor */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          {/* Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Context</h3>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Global ID</span>
                <span className="text-[10px] font-mono font-bold bg-slate-50 px-2 py-0.5 rounded text-slate-400">#EDU-2026-XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Age Stage</span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700 uppercase tracking-tighter">
                  {profile.age} • {profile.age >= 18 ? 'Specialized' : 'Exploratory'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Target Path</span>
                <span className="text-xs font-bold text-slate-800">{careers.find(p => p.id === selectedPathId)?.title.split(' ')[0]}...</span>
              </div>
            </div>
          </div>

          {/* AI Advisor Shortcut / Container */}
          <div className="flex-1 overflow-hidden">
            <AIAdvisor profile={profile} />
          </div>
        </section>

        {/* Middle Column: Viewport */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              transition={{ duration: 0.15 }}
              className="flex-1"
            >
              {activeView === 'dashboard' && <Dashboard profile={profile} onSelectPath={handleSelectPath} careers={careers} isLoading={isCareersLoading} />}
              {activeView === 'roadmap' && <RoadmapView profile={profile} pathId={selectedPathId} careers={careers} onNavigate={handleNavigate} />}
              {activeView === 'institutions' && <InstitutionsView profile={profile} initialSearch={institutionSearchQuery} />}
              {activeView === 'heatmap' && <HeatmapView />}
              {activeView === 'materials' && <MaterialsView />}
              {activeView === 'parent' && <ParentalDashboard profile={profile} onBack={() => setActiveView('dashboard')} careers={careers} />}
              {activeView === 'expenses' && <FinancialView profile={profile} setProfile={setProfile} />}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Right Column: Daily Spark & Parental */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          {/* Daily Spark Widget style */}
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Daily Spark</h3>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-tighter">Audio</span>
            </div>
            <div className="relative flex h-32 items-center justify-center rounded-xl bg-slate-800 overflow-hidden group">
                <img src={STUDY_MATERIALS[1].thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                <button className="z-10 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform">
                    <PlayCircle size={20} />
                </button>
                <div className="absolute bottom-2 left-2 right-2">
                   <p className="text-[10px] font-bold text-white line-clamp-1">Today's Topic: Quantum Ethics in AI</p>
                </div>
            </div>
            <div className="space-y-1.5">
               <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                  <span>PLAYLIST PROGRESS</span>
                  <span>25%</span>
               </div>
               <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-indigo-500"></div>
               </div>
            </div>
          </div>

          {/* Parental Dashboard Shortcut */}
          <button 
            onClick={() => setActiveView('parent')}
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 transition-colors group",
              activeView === 'parent' 
                ? "border-indigo-600 bg-indigo-50/10" 
                : "border-dashed border-slate-300 text-slate-500 hover:bg-slate-50"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-110",
              activeView === 'parent' ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"
            )}>
               <ShieldCheck size={20} />
            </div>
            <div className="text-left">
                <p className={cn("text-xs font-bold", activeView === 'parent' ? "text-indigo-600" : "text-slate-800")}>Parental Dashboard</p>
                <p className="text-[10px] text-slate-400">Sync progress with supervisors</p>
            </div>
            <ChevronRight size={16} className="ml-auto" />
          </button>

          {/* Upsell Widget */}
          <div className="rounded-2xl bg-slate-900 p-5 mt-auto text-white shadow-xl">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">CareerVision Premium</p>
            <p className="text-[11px] text-slate-300 font-medium">Unlock priority scholarship matching and elite institutional data pipelines.</p>
            <button className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/20 border border-white/5 py-2 text-[10px] font-black text-white uppercase tracking-widest transition-all">
                Upgrade Pro
            </button>
          </div>
        </section>
      </main>

      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] shrink-0">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> IPEDS Access: Online</span>
          <span>O*NET Sync: Active</span>
        </div>
        <div className="flex gap-4">
          <span className="text-indigo-500">Multi-Tenant Secure Cloud</span>
        </div>
      </footer>
    </div>
  );
}
