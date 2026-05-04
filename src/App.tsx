import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Map, 
  School, 
  BookOpen, 
  CircleDollarSign, 
  MessageSquare, 
  ChevronRight,
  User,
  LogOut,
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
  Sparkles,
  Globe,
  RotateCcw,
  Trash2,
  Briefcase,
  ArrowUpRight,
  Mic,
  MicOff,
  Monitor,
  CheckCircle,
  UploadCloud,
  Pencil,
  Download,
  Loader2,
  BrainCircuit,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons for Vite/Standard environments
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

import { 
  AreaChart, 
  Area, 
  LineChart,
  Line,
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
import { getCareerAdvice, matchScholarships, getRecommendedCourses, getTopGlobalCareers, aiSearchCareerPaths, generateCoverLetter, getLatestCareerNews, getAiInstitutionRecommendations, getDynamicInstitutions, getDynamicStudyMaterials, getVisaGuidance, getCareerHubIntelligence } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

import { LandingPage } from './components/LandingPage';
import { InterviewHotSeat } from './components/InterviewHotSeat';
import MaterialsView from './components/MaterialsView';
import { RegisterScreen } from './components/RegisterScreen';
import { InterviewStats } from './types/interview';
import { AuthProvider, LoginScreen } from './components/Auth';
import { VisaDetails } from './components/VisaDetails';
import { CareerHubCard } from './components/CareerHubCard';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// --- Components ---

type InstitutionRoadmapContext = {
  careerTitle: string;
  milestoneTitle: string;
  milestoneDescription: string;
  requirements: string[];
  ageRange: string;
};

const NavItem = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
  onClick={onClick}
    className={cn(
      "relative px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 group",
      active ? "text-indigo-600" : "text-slate-400 hover:text-slate-900"
    )}
  >
    <span className="relative z-10">{label}</span>
    {active && (
      <motion.div 
        layoutId="activeNav"
        className="absolute inset-0 bg-indigo-50/60 rounded-xl -z-0"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

import { NewsFlash } from './components/NewsFlash';
import { JobBoardView } from './components/JobBoardView';
import { InstitutionComparator } from './components/InstitutionComparator';

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-8">
    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{title}</h1>
    {subtitle && <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">{subtitle}</p>}
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

const INTEL_VIDEOS: Record<string, { url: string; thumb: string; quote: string }> = {
  default: {
    url: "https://www.youtube.com/watch?v=2ePf9rue1Ao",
    thumb: "https://img.youtube.com/vi/2ePf9rue1Ao/hqdefault.jpg",
    quote: "Global sector shifts indicate a 12% rise in Biotech demand for 2026.",
  },
  "ai-engineer": {
    url: "https://www.youtube.com/watch?v=ad79nYk2keg",
    thumb: "https://img.youtube.com/vi/ad79nYk2keg/hqdefault.jpg",
    quote: "AI Engineers are the fastest-growing tech role — 40% YoY demand surge in 2026.",
  },
  "data-scientist": {
    url: "https://www.youtube.com/watch?v=X3paOmcrTjQ",
    thumb: "https://img.youtube.com/vi/X3paOmcrTjQ/hqdefault.jpg",
    quote: "Data Science salaries hit $180k median in 2026 — cloud + ML skills required.",
  },
  "cybersecurity": {
    url: "https://www.youtube.com/watch?v=inWWhr5tnEA",
    thumb: "https://img.youtube.com/vi/inWWhr5tnEA/hqdefault.jpg",
    quote: "3.5M unfilled cybersecurity roles globally — demand outpaces supply by 300%.",
  },
};

const IntelligenceFeedCard = ({ careerId }: { careerId: string }) => {
  const [playing, setPlaying] = useState(false);
  const intel = INTEL_VIDEOS[careerId] ?? INTEL_VIDEOS["default"];
  const videoId = intel.url.match(/v=([^&]+)/)?.[1] ?? "";

  return (
    <div className="bento-card p-6 bg-slate-900 text-white">
      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Intelligence Feed</h4>
      <div className="aspect-video bg-slate-800 rounded-2xl mb-4 overflow-hidden relative group">
        {playing && videoId ? (
          <iframe
            className="absolute inset-0 w-full h-full rounded-2xl"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="Career Intelligence Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img
              src={intel.thumb}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center group/play"
              aria-label="Play video"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/90 flex items-center justify-center shadow-xl shadow-blue-500/40 group-hover/play:scale-110 group-hover/play:bg-blue-400 transition-all">
                <PlayCircle size={28} className="text-white" />
              </div>
            </button>
          </>
        )}
      </div>
      <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">"{intel.quote}"</p>
    </div>
  );
};

// --- Pages ---

const HeatmapView = () => {
  const [hubs, setHubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<string>("");

  const hubLocations = [
    { city: "Silicon Valley", country: "USA" },
    { city: "Zurich", country: "Switzerland" },
    { city: "London", country: "UK" },
    { city: "Mumbai", country: "India" },
    { city: "Bangalore", country: "India" },
    { city: "Berlin", country: "Germany" }
  ];

  useEffect(() => {
    const loadCareerHubData = async () => {
      setIsLoading(true);
      try {
        const hubData = await Promise.all(
          hubLocations.map(loc => getCareerHubIntelligence(loc.city, loc.country))
        );
        setHubs(hubData);
          setCacheStatus("Data synchronized with global database");
      } catch (error) {
        console.error("Failed to load career hub data:", error);
          setCacheStatus("Using locally cached data");
        // Fallback to basic structure
        setHubs(hubLocations.map((loc, idx) => ({
          ...loc,
          intensity: Math.floor(Math.random() * 30 + 70),
          topCareers: [],
          marketHealthScore: 75
        })));
      } finally {
        setIsLoading(false);
      }
    };

    loadCareerHubData();
  }, []);

  return (
    <div className="space-y-8">
      <SectionTitle 
        title="Career Hub Heatmap" 
        subtitle="Active Geospatial Density: High — Explore global job markets and hiring trends" 
      />
      
        {cacheStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2"
          >
            <Zap size={16} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">{cacheStatus}</span>
          </motion.div>
        )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubLocations.map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm animate-pulse">
              <div className="h-8 w-3/4 bg-slate-100 rounded mb-4" />
              <div className="h-4 w-1/2 bg-slate-50 rounded mb-6" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-slate-50 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubs.map((hub, idx) => (
            <CareerHubCard key={`${hub.city}-${idx}`} hub={hub} />
          ))}
        </div>
      )}

      {/* Insights Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-8">
        <div className="max-w-3xl">
          <h3 className="text-xl font-black text-slate-800 mb-3">🌍 Global Market Insights</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Tech Boom Continues:</strong> Silicon Valley and Bangalore remain the hottest markets with 95%+ intensity. AI/ML roles command 15%+ salary premiums.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>European Expansion:</strong> London, Zurich, and Berlin are emerging hubs for fintech, sustainability tech, and deep tech. Visa openness: Medium-High.
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Remote-First Wave:</strong> 40-50% of roles across these hubs now offer full remote or hybrid flexibility. Cost of living varies 1.0x-1.4x baseline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinancialBreakdownWidget = ({ profile }: { profile: UserProfile }) => {
  const expenses = profile.financialProfile?.monthlyExpenses || [];
  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  const data = expenses.map(e => ({
    name: e.category,
    value: e.amount,
  }));

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Burn Rate</h4>
        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px]">
           <Zap size={10} className="fill-rose-500" /> Critical
        </div>
      </div>
      
      <div className="relative w-full aspect-square max-w-[180px] mb-6">
        <div className="w-full h-full">
           <ResponsiveContainer width="100%" height="100%">
             <PieChart>
               <Pie
                 data={data}
                 cx="50%"
                 cy="50%"
                 innerRadius={50}
                 outerRadius={75}
                 paddingAngle={8}
                 cornerRadius={4}
                 dataKey="value"
                 stroke="none"
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                 itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
               />
             </PieChart>
           </ResponsiveContainer>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</p>
           <p className="text-xl font-black text-slate-900 leading-none">${total}</p>
        </div>
      </div>

      <div className="w-full space-y-2">
        {data.map((e, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight truncate max-w-[100px]">{e.name}</span>
            </div>
            <span className="text-[10px] font-black text-slate-900">${e.value}</span>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-2.5 bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
         View Full Audit
      </button>
    </div>
  );
};

// NewsFlash is now imported from components/NewsFlash.tsx

const Dashboard = ({ profile, onSelectPath, careers, isLoading, onInitInterview, onAiCareerSearch, isAiCareerLoading, aiCareerSearchMessage }: { profile: UserProfile, onSelectPath: (id: string) => void, careers: CareerPath[], isLoading: boolean, onInitInterview: (role: string, company?: string) => void, onAiCareerSearch: (query: string) => Promise<void>, isAiCareerLoading: boolean, aiCareerSearchMessage: string }) => {
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-12 animate-in fade-in duration-700">
      {/* Left Sidebar: Intelligence & Profile */}
      <div className="xl:col-span-3 space-y-6">
         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-lg">
                  {profile.name[0]}
               </div>
               <div>
                  <h4 className="text-sm font-black text-slate-900 leading-none mb-1">{profile.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{profile.targetCareerId}</p>
               </div>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  <span>Current Readiness</span>
                  <span className="text-indigo-600">68%</span>
               </div>
               <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[68%] bg-indigo-600 rounded-full" />
               </div>
            </div>

            <button 
              onClick={() => onInitInterview(profile.targetCareerId || careers[0]?.id)}
              className="mt-6 w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Mic size={14} className="text-rose-400" /> Start Mock Interview
            </button>
          </div>

         <FinancialBreakdownWidget profile={profile} />
      </div>

      {/* Center: Main Explorer */}
      <div className="xl:col-span-6 space-y-10">
         <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
            <div className="relative bg-slate-950 rounded-[2.5rem] p-10 text-white overflow-hidden shadow-2xl">
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="flex-1">
                     <h2 className="text-4xl font-black mb-4 tracking-tighter leading-tight italic">
                       Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">{profile.name.split(' ')[0]}</span>.
                     </h2>
                     <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-xl font-medium">
                       Our AI clusters have analyzed <span className="text-white font-bold">4.2M career nodes</span> for 2026. 
                       Here are your optimized growth trajectories.
                     </p>
                     <button 
                       onClick={() => onSelectPath(careers[0]?.id || "")}
                       disabled={isLoading || careers.length === 0}
                       className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-3 text-[10px] shadow-xl shadow-indigo-500/20 disabled:opacity-50 group/btn"
                     >
                       {isLoading ? "Syncing Logic..." : "Optimize Future"} 
                       <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
                  <div className="hidden md:block w-32 h-32 relative">
                     <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-full animate-spin-slow" />
                     <div className="absolute inset-4 border border-indigo-400/20 rounded-full" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Target size={32} className="text-indigo-400" />
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
            </div>
         </div>

         <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
               <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Future Trajectories</h3>
                  <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest leading-none">2026 Sector Correlation</p>
               </div>
               <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                     <input 
                        type="text" 
                        placeholder="Search clusters..." 
                        className="pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none w-32 focus:w-48 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                     />
                  </div>
                  <button
                    onClick={() => onAiCareerSearch(searchQuery)}
                    disabled={isAiCareerLoading || !searchQuery.trim()}
                    className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50"
                  >
                    {isAiCareerLoading ? 'Searching...' : 'AI Global Search'}
                  </button>
               </div>
               {aiCareerSearchMessage && (
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{aiCareerSearchMessage}</p>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {isLoading ? (
                 [...Array(4)].map((_, idx) => (
                   <div key={idx} className="h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse" />
                 ))
               ) : filteredPaths.length > 0 ? (
                 filteredPaths.map((path, idx) => (
                   <motion.div
                     key={path.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     whileHover={{ y: -4 }}
                     onClick={() => onSelectPath(path.id)}
                     className="bg-white border border-slate-100 rounded-[2.5rem] p-8 cursor-pointer shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all flex flex-col justify-between group h-full"
                   >
                     <div className="mb-8">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                             <TrendingUp size={24} />
                          </div>
                          <span className="bg-slate-950 text-white text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest">{path.growth} GROWTH</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-900 leading-none mb-3 tracking-tighter group-hover:text-indigo-600 transition-colors uppercase italic">{path.title}</h3>
                       <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2">{path.description}</p>
                       
                       {/* Career Intelligence Badges */}
                       <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
                         <div className="flex items-center justify-between gap-2">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Market Demand</span>
                           <div className="flex items-center gap-2">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full w-[85%] bg-emerald-500 rounded-full" />
                             </div>
                             <span className="text-[9px] font-black text-emerald-600">85%</span>
                           </div>
                         </div>
                         <div className="flex items-center justify-between gap-2">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">2-Year Growth</span>
                           <span className="text-[9px] font-black text-indigo-600">+{Math.floor(Math.random() * 20 + 10)}%</span>
                         </div>
                         <div className="flex items-center justify-between gap-2">
                           <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Avg Salary Range</span>
                           <span className="text-[9px] font-black text-slate-700">$65k - $150k</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{path.milestones.length} Adaptive Stages</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="col-span-full py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center text-center px-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                       <Search size={24} />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">No Matching Trajectories</h4>
                    <p className="text-[10px] text-slate-400 font-medium max-w-[200px]">Adjust your filters to discover other global career clusters.</p>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Right Sidebar: Sector Intelligence & Quick Actions */}
      <div className="xl:col-span-3 space-y-6">
         <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
               <h4 className="text-[9px] font-black uppercase tracking-widest mb-8 text-indigo-400">Sector Health Index</h4>
               <div className="space-y-8">
                  {[
                    { name: 'AI & ML', value: 85, trend: '+24%' },
                    { name: 'BioTech', value: 60, trend: '+12%' },
                    { name: 'Sustainability', value: 45, trend: '+38%' }
                  ].map((sector, i) => (
                     <div key={sector.name} className="space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                           <span>{sector.name}</span>
                           <span className="text-indigo-300">{sector.trend}</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${sector.value}%` }}
                              transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                              className="h-full bg-indigo-400 rounded-full" 
                           />
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mb-16 -mr-16" />
         </div>

         <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Execution Sync</h4>
            <div className="grid grid-cols-2 gap-3">
               {[
                 { label: 'Visa Hub', icon: Globe },
                 { label: 'Market', icon: BarChart3 },
                 { label: 'Housing', icon: Landmark },
                 { label: 'Network', icon: UserCheck }
               ].map(item => (
                 <button key={item.label} className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex flex-col items-center gap-3 hover:bg-indigo-50 hover:border-indigo-100 transition-all group">
                    <item.icon size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">{item.label}</span>
                 </button>
               ))}
            </div>
         </div>

         <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white flex flex-col items-center text-center shadow-xl shadow-indigo-200">
            <div className="bg-white/20 p-3 rounded-2xl mb-4">
               <ShieldCheck size={28} />
            </div>
            <h5 className="text-sm font-black uppercase tracking-tight mb-2">Security Verified</h5>
            <p className="text-[10px] text-indigo-100/80 leading-relaxed font-medium">
               Your career progression is end-to-end encrypted and verified via AI logic clusters.
            </p>
         </div>
      </div>
    </div>
  );
};


const RoadmapView = ({ profile, pathId, careers, onNavigate, onInitInterview }: { profile: UserProfile, pathId?: string, careers: CareerPath[], onNavigate: (view: 'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap', context?: { search?: string; roadmap?: InstitutionRoadmapContext | null }) => void, onInitInterview: (role: string, company?: string) => void }) => {
  const path = careers.find(p => p.id === pathId) || careers[0];
  
  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionTitle 
        title="Predictive Roadmap" 
        subtitle={`Visual GPS for ${path.title} • Age ${profile.age}`} 
      />
      
      <div className="flex-1 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden relative p-8 flex flex-col overflow-y-auto scrollbar-hide">
         {/* Vertical Path Line */}
         <div className="absolute top-0 left-[68px] bottom-0 w-[2px] bg-slate-100">
            <motion.div 
               initial={{ height: 0 }}
               animate={{ height: '100%' }}
               transition={{ duration: 2, ease: "easeInOut" }}
               className="w-full bg-gradient-to-b from-indigo-500 via-indigo-400 to-indigo-100"
            />
         </div>
         
         <div className="space-y-12 relative z-10">
            {path.milestones.map((ms, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-10 group"
              >
                 {/* Marker */}
                 <div className="shrink-0 relative">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex flex-col items-center justify-center border-4 border-white shadow-xl transition-all duration-500",
                      idx === 0 ? "bg-slate-900 text-white scale-110" : "bg-white text-slate-400 group-hover:bg-slate-50"
                    )}>
                       <p className="text-[7px] font-black uppercase opacity-60">Age</p>
                       <p className="text-sm font-black leading-none">{ms.ageRange.split('-')[0]}</p>
                    </div>
                    {idx === 0 && <div className="absolute -inset-1 bg-indigo-500/20 rounded-2xl animate-ping -z-10" />}
                 </div>
                 
                 <div className="flex-1 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm group-hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                       <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                         Level {idx + 1}
                       </span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{ms.title}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{ms.description}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                       {ms.requirements.map((req, i) => (
                         <span key={i} className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 italic">
                           {req}
                         </span>
                       ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <button 
                         onClick={() => onNavigate('institutions', {
                           roadmap: {
                             careerTitle: path.title,
                             milestoneTitle: ms.title,
                             milestoneDescription: ms.description,
                             requirements: ms.requirements,
                             ageRange: ms.ageRange,
                           }
                         })}
                         className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:translate-x-1 transition-all"
                       >
                         Sync Institutions <ChevronRight size={12} />
                       </button>
                       <div className="flex items-center gap-2 text-emerald-500">
                          <CheckCircle size={12} />
                          <span className="text-[8px] font-black uppercase">Optimized</span>
                       </div>
                    </div>
                 </div>
              </motion.div>
            ))}
         </div>
         
         {/* End Goal Card */}
         <div className="mt-12 p-8 bg-slate-900 rounded-[2rem] text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent" />
            <div className="relative z-10">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Terminal Trajectory</p>
               <h4 className="text-2xl font-black tracking-tighter uppercase leading-none">{path.title}</h4>
            </div>
            <div className="relative z-10 text-right">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Peak Readiness</p>
               <p className="text-3xl font-black text-white leading-none">2029</p>
            </div>
         </div>
      </div>
    </div>
  );
};


const InstitutionsView = ({ profile, selectedPathId, initialSearch = "", onInitInterview, institutions = INSTITUTIONS, isLoading = false, visaGuidance, isVisaLoading = false, roadmapContext = null }: { profile: UserProfile, selectedPathId: string, initialSearch?: string, onInitInterview: (role: string, company?: string) => void, institutions?: Institution[], isLoading?: boolean, visaGuidance?: any, isVisaLoading?: boolean, roadmapContext?: InstitutionRoadmapContext | null }) => {
  const [search, setSearch] = useState(initialSearch);
  const [intlOnly, setIntlOnly] = useState(false);
  const [maxCost, setMaxCost] = useState(100000);
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [radius, setRadius] = useState<"Local" | "National" | "Global">("Global");
  const [visaFilter, setVisaFilter] = useState<Institution['visaSupport'] | 'All'>('All');
  const [showComparator, setShowComparator] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(6); // Display 6 institutions initially, load more in batches of 6
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedInstitutionVisaGuidance, setSelectedInstitutionVisaGuidance] = useState<any>(null);
  const [isSelectedInstitutionVisaLoading, setIsSelectedInstitutionVisaLoading] = useState(false);

  // AI Recommendation States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecs, setAiRecs] = useState<{ institution: Institution, rationale: string }[]>([]);
  const [showAiRecs, setShowAiRecs] = useState(false);

  const fetchAiRecs = async () => {
    setIsAiLoading(true);
    setShowAiRecs(true);
    try {
      const results = await getAiInstitutionRecommendations(profile, selectedPathId);
      setAiRecs(results);
    } catch (error) {
      console.error("AI Recommendation Error:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    setSearch(initialSearch || "");
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

  const programs = ["All Programs", ...Array.from(new Set(institutions.flatMap(inst => inst.programs)))].map(p => ({
    name: p,
    count: p === "All Programs" 
      ? institutions.length 
      : institutions.filter(i => i.programs.includes(p)).length
  }));

  const filtered = institutions.filter(inst => {
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

  const visibleInstitutions = filtered.slice(0, displayLimit);

  useEffect(() => {
    setIsSearching(true);
    setDisplayLimit(6); // Reset display limit when filters change
    const timer = setTimeout(() => setIsSearching(false), 600);
    return () => clearTimeout(timer);
  }, [search, intlOnly, maxCost, selectedProgram, radius, visaFilter]);

  useEffect(() => {
    if (visibleInstitutions.length === 0) {
      setSelectedInstitution(null);
      return;
    }

    if (!selectedInstitution || !visibleInstitutions.some(inst => inst.id === selectedInstitution.id)) {
      setSelectedInstitution(visibleInstitutions[0]);
    }
  }, [visibleInstitutions, selectedInstitution]);

  useEffect(() => {
    if (!selectedInstitution) {
      setSelectedInstitutionVisaGuidance(null);
      return;
    }

    const fetchSelectedInstitutionVisaGuidance = async () => {
      setIsSelectedInstitutionVisaLoading(true);
      try {
        const guidance = await getVisaGuidance(
          profile,
          selectedInstitution.country,
          roadmapContext?.careerTitle || selectedPathId,
        );
        setSelectedInstitutionVisaGuidance(guidance);
      } catch (error) {
        console.error('Selected Institution Visa Guidance Error:', error);
        setSelectedInstitutionVisaGuidance(null);
      } finally {
        setIsSelectedInstitutionVisaLoading(false);
      }
    };

    fetchSelectedInstitutionVisaGuidance();
  }, [profile, roadmapContext, selectedInstitution, selectedPathId]);

  const handleExport = () => {
    if (filtered.length === 0) return;

    const headers = ["Institution Name", "City", "Country", "Average Cost (p/a)", "Visa Support", "Programs", "Website"];
    const rows = filtered.map(inst => [
      inst.name,
      inst.city,
      inst.country,
      `$${inst.avgCost.toLocaleString()}`,
      inst.visaSupport,
      inst.programs.join("; "),
      inst.website
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CareerVision_Institutions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    // Simulated IP Geolocation Sync
    const timer = setTimeout(() => {
      console.log("Geospatial Layer: User detected in London, UK region. Calibrating local hub radius.");
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionTitle 
        title="Global Hub Navigator" 
        subtitle={`${isLoading ? '🔄 Discovering Institutions...' : 'Spatial Intelligence'} • ${filtered.length} Institutions Found`} 
      />

      {roadmapContext && (
        <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600">Selected Roadmap</p>
              <h3 className="text-xl font-black tracking-tight text-slate-900">{roadmapContext.careerTitle} - {roadmapContext.milestoneTitle}</h3>
              <p className="text-sm font-bold text-slate-500">{roadmapContext.milestoneDescription} • Age Window {roadmapContext.ageRange}</p>
            </div>
            <div className="flex flex-wrap gap-2 lg:max-w-[50%] lg:justify-end">
              {roadmapContext.requirements.map((requirement, index) => (
                <span key={`${requirement}-${index}`} className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                  {requirement}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl relative bg-slate-50 min-h-[500px]">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          {visibleInstitutions.map((inst) => (
            <Marker 
              key={inst.id} 
              position={[inst.coordinates.lat, inst.coordinates.lng]}
              eventHandlers={{ click: () => setSelectedInstitution(inst) }}
              icon={L.divIcon({
                className: 'custom-hub-marker',
                html: `<div style="width: 32px; height: 32px; background: #0f172a; border-radius: 12px; border: 2px solid white; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center;">
                  <div style="width: 6px; height: 6px; background: #818cf8; border-radius: 9999px;"></div>
                </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              })}
            />
          ))}
        </MapContainer>

        {selectedInstitution && (
          <div className="absolute left-1/2 top-8 z-[1005] w-[260px] -translate-x-1/2 pointer-events-none">
            <div className="rounded-[2rem] border border-white bg-white/95 p-5 shadow-2xl backdrop-blur-xl pointer-events-auto">
              <div className="mb-4 overflow-hidden rounded-2xl">
                <img src={selectedInstitution.image} className="h-24 w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h4 className="text-xs font-black uppercase leading-none text-slate-900">{selectedInstitution.name}</h4>
              <p className="mt-2 text-[10px] font-bold text-slate-400">{selectedInstitution.city}, {selectedInstitution.country}</p>
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <a
                  href={selectedInstitution.website}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full rounded-lg bg-blue-600 py-2 text-center text-[9px] font-black uppercase text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95"
                >
                  View Node
                </a>
                <button 
                  onClick={() => onInitInterview("Student", selectedInstitution.name)}
                  className="w-full py-2 bg-slate-900 text-white text-[9px] font-black uppercase rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Mic size={10} /> Interview Prep
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Floating Search Controls */}
        <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
           <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white shadow-2xl space-y-4 w-[280px] pointer-events-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                      <Globe size={18} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">Spatial Intelligence</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Calibrating global hubs</p>
                   </div>
                </div>
                <button 
                  onClick={fetchAiRecs}
                  disabled={isAiLoading}
                  className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
                  title="AI Recommendation Engine"
                >
                  {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <BrainCircuit size={14} />}
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <input 
                      type="text" 
                      placeholder="Find Hub (e.g. London)..." 
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                   />
                   {search && (
                      <button 
                         onClick={() => setSearch("")}
                         className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                      >
                         <X size={12} />
                      </button>
                   )}
                </div>
                <div className="flex flex-wrap gap-1">
                   {["USA", "UK", "Singapore", "Canada"].map(country => (
                     <button 
                        key={country} 
                        onClick={() => setSearch(country)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500 transition-colors"
                     >
                       {country}
                     </button>
                   ))}
                </div>
              </div>
           </div>
        </div>

        {/* Results Sidebar */}
        <div className="absolute top-6 right-6 z-[1010] pointer-events-none h-[calc(100%-180px)] flex flex-col gap-4">
           <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl w-[320px] pointer-events-auto flex flex-col overflow-hidden max-h-full">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Ecosystem Nodes</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{isSearching ? 'Calibrating...' : `${visibleInstitutions.length}/${filtered.length} Matches`}</p>
                 </div>
                 {isSearching && <Loader2 size={16} className="animate-spin text-indigo-600" />}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                 {isSearching ? (
                   [1,2,3,4].map(i => (
                     <div key={i} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                        <div className="flex-1 space-y-2">
                           <div className="h-2 w-20 bg-slate-200 rounded" />
                           <div className="h-2 w-12 bg-slate-100 rounded" />
                        </div>
                     </div>
                   ))
                 ) : (
                   visibleInstitutions.map(inst => (
                     <div key={inst.id} onClick={() => setSelectedInstitution(inst)} className={cn("p-3 bg-slate-50 rounded-2xl border flex items-center gap-3 group transition-all cursor-pointer", selectedInstitution?.id === inst.id ? "border-indigo-500 shadow-sm" : "border-slate-100 hover:border-indigo-500")}>
                        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0 overflow-hidden">
                           <img src={inst.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className="text-[10px] font-black uppercase truncate group-hover:text-indigo-600">{inst.name}</p>
                           <p className="text-[8px] text-slate-400 font-bold uppercase">{inst.city}, {inst.country}</p>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                           <ArrowUpRight size={14} />
                        </button>
                     </div>
                   ))
                 )}
              </div>

              {!isSearching && displayLimit < filtered.length && (
                <button 
                  onClick={() => setDisplayLimit(prev => Math.min(prev + 6, filtered.length))}
                  className="w-full mt-4 py-2.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200/50 flex items-center justify-center gap-2"
                >
                  <ChevronRight size={12} />
                  View More ({filtered.length - displayLimit})
                </button>
              )}
           </div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none">
           <div className="bg-slate-900/90 backdrop-blur-xl p-5 rounded-[2.5rem] border border-slate-800 shadow-2xl text-white min-w-[220px] pointer-events-auto">
              <div className="space-y-4">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Ecosystem Density</p>
                    <p className="text-xl font-black">{visibleInstitutions.length} <span className="text-xs text-indigo-400 uppercase">Training Nodes</span></p>
                 </div>
                 <div className="h-px bg-slate-800" />
                 <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Hub Accuracy</span>
                    <span className="text-emerald-400">99.8%</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Floating Comparison Bar */}
      <AnimatePresence>
        {showAiRecs && (
          <motion.div 
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            className="absolute left-6 top-48 z-[1000] w-[320px] pointer-events-auto"
          >
            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-xl text-white">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Spark.E Analyst</p>
                    <p className="text-sm font-black uppercase tracking-tight">AI Curated Programs</p>
                  </div>
                </div>
                <button onClick={() => setShowAiRecs(false)}>
                  <X size={18} className="text-slate-500" />
                </button>
              </div>

              {isAiLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl animate-pulse">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-2 w-24 bg-slate-700 rounded" />
                          <div className="h-2 w-16 bg-slate-700/50 rounded" />
                        </div>
                      </div>
                      <div className="h-10 bg-slate-700/30 rounded-xl mb-3" />
                      <div className="flex gap-2">
                        <div className="flex-1 h-6 bg-slate-700 rounded-lg" />
                        <div className="flex-1 h-6 bg-slate-700 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {aiRecs.map((rec, i) => (
                    <motion.div 
                      key={`${rec.institution.id}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-slate-800/50 border border-slate-700 p-4 rounded-2xl hover:border-indigo-500 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-8 h-8 rounded-lg bg-slate-700 overflow-hidden shrink-0">
                            <img src={rec.institution.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         </div>
                         <div className="overflow-hidden">
                            <p className="text-[10px] font-black uppercase truncate group-hover:text-indigo-400 transition-colors">
                              {rec.institution.name}
                            </p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{rec.institution.location}</p>
                         </div>
                      </div>
                      <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 mb-3">
                         <p className="text-[9px] font-medium text-indigo-200 italic leading-relaxed">
                           "{rec.rationale}"
                         </p>
                      </div>
                      <div className="flex gap-2">
                         <button className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-[8px] font-black uppercase transition-all">Details</button>
                         <button 
                           onClick={() => onInitInterview("Student", rec.institution.name)}
                           className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-[8px] font-black uppercase transition-all"
                         >
                           Practice
                         </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                       <img src={inst?.image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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

      {/* Visa Details Panel */}
      {(selectedInstitutionVisaGuidance || visaGuidance) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <VisaDetails 
            visaGuidance={selectedInstitutionVisaGuidance || visaGuidance} 
            isLoading={selectedInstitution ? isSelectedInstitutionVisaLoading : isVisaLoading} 
            targetCountry={selectedInstitution?.country || profile.targetLocation || profile.country} 
            profile={profile} 
          />
        </motion.div>
      )}
    </div>
  );
};

// MaterialsView is now imported from components/MaterialsView.tsx



import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const AIAdvisor = ({ profile, embedded }: { profile: UserProfile; embedded?: boolean }) => {
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
    // Improved skill extraction logic - scanning text for matches
    const skillDirectory = [
      "React", "TypeScript", "Python", "Data Analysis", "Project Management", 
      "AI", "Machine Learning", "Cloud", "UX Design", "Product Management",
      "Java", "C++", "SQL", "DevOps", "Cybersecurity", "Blockchain",
      "Marketing", "Finance", "Healthcare", "BioTech", "Logistics"
    ];
    
    const lowercaseText = text.toLowerCase();
    const matches = skillDirectory.filter(skill => 
      lowercaseText.includes(skill.toLowerCase())
    );

    // Add profile interests as high-priority matches
    const interestMatches = profile.interests.filter(interest =>
      lowercaseText.includes(interest.toLowerCase())
    );

    const merged = Array.from(new Set([...interestMatches, ...matches]));
    
    const extracted = merged.length > 0 
      ? merged.map(skill => ({
          name: skill,
          strength: Math.floor(Math.random() * 30) + 70 // High strength 70-100% for found skills
        })).slice(0, 8)
      : profile.interests.map(interest => ({ // Fallback if no matches found
          name: interest,
          strength: 50
        })).slice(0, 5);
    
    setAnalyzedSkills(extracted);
  };

  const handleLinkedinSync = async () => {
    if (!linkedinUrl) return;
    setIsAnalyzingLinkedIn(true);
    
    // Simulate LinkedIn Data Fetching & Analysis
    setTimeout(() => {
      const insight = `Profile detected: Senior level expertise in ${profile.interests[0] || 'Strategic Planning'}. 
      Market alignment for 2026: 92%. 
      Recommended focus: ${profile.interests[1] || 'AI Orchestration'}.`;
      
      setLinkedinData(insight);
      simulateSkillExtraction(`LinkedIn Profile Context for ${profile.name}. Interested in ${profile.interests.join(", ")}.`); // Update the skill matrix
      setIsAnalyzingLinkedIn(false);
      setShowContextOptions(false);
      
      // Auto-post a message about the sync
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: `LinkedIn profile synchronized. I've integrated your professional trajectory into my reasoning engine. Your background in ${profile.interests[0] || 'your core sector'} provides a strong foundation for the 2026 shifts we're tracking.` 
      }]);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous state
    setIsParsing(true);

    try {
      let extractedText = "";

      if (file.type === "text/plain") {
        extractedText = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text || text.trim().length < 10) {
              reject(new Error("File content too sparse for meaningful context."));
            } else {
              resolve(text);
            }
          };
          reader.onerror = () => reject(new Error("Local file reader encountered an IO error."));
          reader.readAsText(file);
        });
      } else if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        
        try {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          if (pdf.numPages === 0) {
            throw new Error("Empty PDF document detected.");
          }

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            let lastY;
            let pageText = "";
            
            for (const item of textContent.items as any[]) {
              // Proper vertical position tracking for line breaks
              if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += "\n";
              } else if (lastY !== undefined) {
                pageText += " ";
              }
              pageText += item.str;
              lastY = item.transform[5];
            }
            extractedText += pageText + "\n";
          }
          
          if (extractedText.trim().length < 50) {
            throw new Error("Text extraction yielded minimal results. The PDF might be a scanned image without OCR.");
          }
        } catch (pdfError: any) {
          if (pdfError.name === 'PasswordException') {
            throw new Error("Cannot parse encrypted/password-protected PDF files.");
          }
          throw pdfError;
        }
      } else {
        throw new Error(`The file format "${file.type || 'unknown'}" is not supported. Please provide a standard .pdf or .txt file.`);
      }

      // If we reach here, extraction was successful
      setResumeText(extractedText);
      simulateSkillExtraction(extractedText);
      
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `Analysis complete. I've indexed your resume context and identified ${extractedText.split(' ').length} tokens of professional data to optimize your trajectory.`
      }]);
      
      setIsParsing(false);
    } catch (error: any) {
      console.error("Ingestion Error:", error);
      const errorMsg = error.message || "An unexpected error occurred during document analysis.";
      alert(`Spark.E Error: ${errorMsg}`);
      setIsParsing(false);
    }
    
    setShowContextOptions(false);
    // Clear the input
    e.target.value = '';
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInput(prev => prev + event.results[i][0].transcript + ' ');
          }
        }
      };

      recognitionRef.current.onend = () => setIsRecording(false);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleEtiquetteInsight = async () => {
    if (!profile.targetLocation) {
      alert("Please set a target location in your profile first.");
      return;
    }
    setIsLoading(true);
    try {
      const { getLocalizedEtiquette } = await import('./services/interviewService');
      const insights = await getLocalizedEtiquette(profile.targetLocation, profile.targetCareerId || "Professional");
      const formatted = insights.map(i => `**${i.category}** (${i.importance}): ${i.insight}`).join('\n\n');
      setMessages(prev => [...prev, { role: 'ai', text: `### Localized Etiquette Protocol: ${profile.targetLocation}\n\n${formatted}\n\n*Note: These protocols are synchronized with the 2026 cultural shifts in ${profile.targetLocation}. Spark.E recommends strictly adhering to these for optimal cultural alignment.*` }]);
    } catch (error) {
      console.error("Failed to fetch etiquette insights");
    } finally {
      setIsLoading(false);
    }
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
    <div className={cn(
      "flex flex-col h-full overflow-hidden",
      embedded
        ? "bg-white"
        : "bg-slate-800 rounded-3xl shadow-2xl border border-slate-700"
    )}>
      {/* Header — only shown when NOT embedded (drawer has its own header) */}
      {!embedded && (
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
             onClick={handleEtiquetteInsight}
             title="Localized Etiquette"
             className="p-1.5 hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-500 rounded-lg transition-all"
           >
             <Globe size={14} />
           </button>
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
      )}

      {/* Embedded toolbar (shown when inside drawer, replaces standalone header buttons) */}
      {embedded && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={handleEtiquetteInsight}
            title="Localized Etiquette"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent hover:border-emerald-100 transition-all"
          >
            <Globe size={12} /> Etiquette
          </button>
          <button
            onClick={() => setShowContextOptions(!showContextOptions)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
              showContextOptions
                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                : "text-slate-500 hover:bg-slate-100 border-transparent"
            )}
          >
            <Settings size={12} className={cn(showContextOptions && "rotate-90")} /> Context
          </button>
          {(resumeText || linkedinData) && (
            <button onClick={clearContext} title="Clear context" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all">
              <Trash2 size={12} /> Clear
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            {resumeText && <FileText size={13} className="text-emerald-500" />}
            {linkedinData && <Linkedin size={13} className="text-blue-500" />}
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
          </div>
        </div>
      )}
      
      <div className={cn("flex-1 overflow-y-auto space-y-4 scrollbar-hide", embedded ? "p-4 bg-slate-50" : "p-6")}>
        {linkedinData && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-start gap-4 mb-2 group/linkedin relative"
          >
             <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                <Linkedin size={20} />
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                   <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active LinkedIn Context</h5>
                   <span className="text-[8px] font-bold text-slate-500 uppercase">{linkedinUrl.split('/').pop()}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed italic">{linkedinData}</p>
             </div>
             <button 
               onClick={() => setLinkedinData(null)}
               className="absolute top-2 right-2 opacity-0 group-hover/linkedin:opacity-100 transition-opacity text-slate-500 hover:text-red-400"
             >
                <X size={12} />
             </button>
          </motion.div>
        )}

        {messages.length === 0 && !linkedinData && !resumeText && (
          <div className="text-center py-12 px-6">
            <div className="bg-indigo-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
               <MessageSquare size={32} />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Connect with your future</h4>
            <p className="text-slate-500 text-[10px] leading-relaxed max-w-xs mx-auto uppercase tracking-widest font-black mb-6">Personalize with your data</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => setShowContextOptions(true)}
                  className="flex flex-col items-center justify-center p-6 bg-slate-700/30 border border-slate-600 rounded-3xl hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group"
                >
                  <UploadCloud size={24} className="text-slate-400 group-hover:text-emerald-400 mb-2 transition-colors" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-emerald-400">Upload Resume</span>
                </button>
                <button 
                  onClick={() => {
                    setShowContextOptions(true);
                    // Using a slight delay to ensure the input is rendered
                    setTimeout(() => {
                      const input = document.getElementById('linkedin-url-input');
                      if (input) input.focus();
                    }, 100);
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-slate-700/30 border border-slate-600 rounded-3xl hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
                >
                  <Linkedin size={24} className="text-slate-400 group-hover:text-blue-400 mb-2 transition-colors" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-blue-400">Link account</span>
                </button>
            </div>

            <button 
              onClick={() => setShowContextOptions(!showContextOptions)}
              className={cn(
                "w-full py-4 px-6 bg-slate-700/30 border border-dashed rounded-3xl flex items-center justify-center gap-3 transition-all group mb-6",
                showContextOptions ? "border-indigo-500 bg-indigo-500/5" : "border-slate-600 hover:bg-slate-700/50"
              )}
            >
              <Settings size={20} className={cn("text-slate-400 group-hover:text-indigo-400 transition-all", showContextOptions && "rotate-90 text-indigo-400")} />
              <div className="text-left">
                <span className="block text-[10px] font-black text-white uppercase tracking-widest leading-none">Advanced Context</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase">AI Persona • Focus Tuning</span>
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
                   <div className="flex gap-2">
                       <input 
                         id="linkedin-url-input"
                         type="url" 
                         value={linkedinUrl}
                         onChange={(e) => setLinkedinUrl(e.target.value)}
                         placeholder="linkedin.com/in/..."
                         className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[9px] text-white outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 min-w-0"
                       />
                       <button 
                         onClick={handleLinkedinSync}
                         disabled={isAnalyzingLinkedIn || !linkedinUrl}
                         className="shrink-0 p-2 bg-blue-600 rounded-xl text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
                         title="Sync Profile"
                       >
                          {isAnalyzingLinkedIn ? <RotateCcw size={12} className="animate-spin" /> : <ArrowUpRight size={12} />}
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
              "max-w-[95%] p-4 rounded-3xl text-[11px] leading-relaxed",
              m.role === 'user'
                ? "bg-indigo-600 text-white ml-auto font-medium shadow-lg"
                : embedded
                  ? "bg-white text-slate-700 border border-slate-200 shadow-sm"
                  : "bg-slate-700/50 text-slate-100 border border-slate-600/50"
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
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-2xl w-fit",
            embedded ? "bg-slate-100" : "bg-slate-700/30"
          )}>
            <div className="flex gap-1">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-indigo-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-indigo-500 rounded-full" />
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-indigo-500 rounded-full" />
            </div>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest tracking-tighter", embedded ? "text-slate-400" : "text-slate-500")}>Analyzing Context</span>
          </div>
        )}
      </div>

      <div className={cn(
        "p-4 border-t flex flex-col gap-3 relative shrink-0",
        embedded ? "bg-white border-slate-100" : "bg-slate-900/40 border-slate-700/50"
      )}>
        {resumeText && (
          <div className="absolute -top-8 left-5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
            <Check size={8} /> Resume Synced
          </div>
        )}
        <div className="flex gap-3">
          <button 
            onClick={toggleVoiceInput}
            className={cn(
              "p-3 rounded-xl transition-all shadow-sm",
              isRecording ? "bg-rose-500 text-white animate-pulse" : embedded ? "bg-slate-100 text-slate-500 hover:text-slate-800" : "bg-slate-700 text-slate-400 hover:text-white"
            )}
            title={isRecording ? "Stop Recording" : "Voice Input (Speech-to-Text)"}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "Listening to your trajectory..." : "Ask Spark.E anything..."}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-xs placeholder-slate-400 font-medium",
              embedded
                ? "bg-slate-100 border border-slate-200 text-slate-900 focus:border-indigo-400"
                : "bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500"
            )}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-emerald-500 text-white px-4 rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        {isRecording && (
          <div className="flex items-center gap-4 px-2 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex-1 space-y-1">
               <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                  <span>Articulation Clarity</span>
                  <span>Analyze...</span>
               </div>
               <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 w-[85%] animate-pulse" />
               </div>
            </div>
            <div className="flex-1 space-y-1">
               <div className="flex justify-between text-[8px] font-black uppercase text-slate-500">
                  <span>Pacing Delta</span>
                  <span>Optimal</span>
               </div>
               <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 w-[90%] animate-pulse" />
               </div>
            </div>
          </div>
        )}
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

                <button className="mt-4 w-full py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
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
  const [aiRecommendation, setAiRecommendation] = useState<string>("Based on your savings rate and target trajectory, I can generate a financial action plan with budget priorities, savings guidance, and next-step recommendations.");
  const [isAiRecommendationLoading, setIsAiRecommendationLoading] = useState(false);
  const financialDefaults: NonNullable<UserProfile['financialProfile']> = {
    annualIncome: 0,
    currentSavings: 0,
    monthlyExpenses: [],
    goals: [],
    debt: [],
  };
  const financialProfile = profile.financialProfile || financialDefaults;

  const updateFinancialProfile = (updater: (current: NonNullable<UserProfile['financialProfile']>) => NonNullable<UserProfile['financialProfile']>) => {
    setProfile(prev => {
      const current = prev.financialProfile || financialDefaults;
      return {
        ...prev,
        financialProfile: updater(current),
      };
    });
  };

  const addStarterBudget = () => {
    updateFinancialProfile(current => ({
      ...current,
      monthlyExpenses: current.monthlyExpenses.length > 0 ? current.monthlyExpenses : [
        { category: 'Housing', amount: Math.max(600, Math.round(profile.budget / 24)) },
        { category: 'Food', amount: 320 },
        { category: 'Transport', amount: 140 },
        { category: 'Learning', amount: 180 },
      ],
      goals: current.goals.length > 0 ? current.goals : [
        {
          id: `goal-emergency-${Date.now()}`,
          title: 'Emergency Fund',
          target: 6000,
          current: Math.min(current.currentSavings, 2500),
          deadline: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        }
      ],
    }));
    setShowGoalNotification('Starter budget loaded');
    setTimeout(() => setShowGoalNotification(null), 3000);
  };

  const addExpenseItem = () => {
    updateFinancialProfile(current => ({
      ...current,
      monthlyExpenses: [
        ...current.monthlyExpenses,
        {
          category: `Expense ${current.monthlyExpenses.length + 1}`,
          amount: 150,
        }
      ]
    }));
  };

  const addDebtAccount = () => {
    updateFinancialProfile(current => ({
      ...current,
      debt: [
        ...current.debt,
        {
          id: `debt-${Date.now()}`,
          title: `Debt Account ${current.debt.length + 1}`,
          amount: 2500,
          interestRate: 8.5,
        }
      ]
    }));
  };
  
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const expenseData = financialProfile.monthlyExpenses.map(e => ({ name: e.category, value: e.amount }));
  const totalMonthlyExpenses = financialProfile.monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Retirement Projection Mock Logic
  const currentAge = profile.age;
  const retireAge = 65;
  const yearsToRetire = retireAge - currentAge;
  const monthlySavings = financialProfile.annualIncome / 12 - totalMonthlyExpenses;
  const projectedReturn = 0.07; // 7% annual
  
  const fiveYearProjectionData = Array.from({ length: 11 }, (_, i) => {
    const years = i * 0.5; // Every 6 months for 5 years
    const growthFactor = (profile.targetCareerId === 'ai-engineer' ? 1.15 : 1.08); // AI path has higher expected growth
    const adjustedReturn = projectedReturn * (1 + (i / 20)); // Return slightly improves with portfolio size
    
    const futureValue = financialProfile.currentSavings * Math.pow(1 + adjustedReturn, years) +
      (monthlySavings * 12 * (Math.pow(1 + adjustedReturn, years) - 1)) / adjustedReturn;
      
    return {
      name: `Yr ${years}`,
      balance: Math.round(futureValue),
      growth: Math.round(futureValue * (growthFactor - 1))
    };
  });

  const generateFinancialRecommendation = async () => {
    setIsAiRecommendationLoading(true);
    try {
      const topExpenses = financialProfile.monthlyExpenses
        .slice()
        .sort((left, right) => right.amount - left.amount)
        .slice(0, 3)
        .map(expense => `${expense.category}: $${expense.amount}/mo`)
        .join(', ');

      const prompt = `Create a financial action plan for this user.
Career Target: ${profile.targetCareerId || 'Not selected'}
Country: ${profile.country}
Target Location: ${profile.targetLocation || 'Not set'}
Annual Income: $${financialProfile.annualIncome}
Current Savings: $${financialProfile.currentSavings}
Monthly Expenses Total: $${totalMonthlyExpenses}
Largest Monthly Expenses: ${topExpenses || 'No expenses recorded'}
Active Goals: ${financialProfile.goals.map(goal => `${goal.title} ($${goal.current}/$${goal.target})`).join(', ') || 'No goals yet'}
Debt Accounts: ${financialProfile.debt.map(debt => `${debt.title} ($${debt.amount} at ${debt.interestRate}% APR)`).join(', ') || 'No debt tracked'}

Return a concise finance-first recommendation with:
- one budget priority
- one savings move
- one risk warning
- one next action for this week`;

      const recommendation = await getCareerAdvice(prompt, profile);
      setAiRecommendation(recommendation || '');
    } catch (error) {
      console.error('Financial AI Recommendation Error:', error);
      setAiRecommendation('I could not generate a fresh recommendation right now. Review your expense mix, protect at least one month of runway, and prioritize high-interest debt before speculative spending.');
    } finally {
      setIsAiRecommendationLoading(false);
    }
  };

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
                     value={financialProfile.annualIncome}
                     onChange={(e) => setProfile(prev => ({ 
                       ...prev, 
                       financialProfile: { ...(prev.financialProfile || financialProfile), annualIncome: parseInt(e.target.value) || 0 } 
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
                     value={financialProfile.currentSavings}
                     onChange={(e) => setProfile(prev => ({ 
                       ...prev, 
                       financialProfile: { ...(prev.financialProfile || financialProfile), currentSavings: parseInt(e.target.value) || 0 } 
                     }))}
                   />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <button
                   onClick={addStarterBudget}
                   className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-indigo-700 transition-all hover:bg-indigo-100"
                 >
                   Load Starter Budget
                 </button>
                 <button
                   onClick={addExpenseItem}
                   className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all hover:border-indigo-200 hover:text-indigo-600"
                 >
                   Add Expense Line
                 </button>
               </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white text-xs leading-relaxed shadow-xl border border-slate-800">
             <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest mb-4">
                <ShieldCheck size={14} /> AI Recommendation
             </div>
             <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 min-h-[96px]">
               {isAiRecommendationLoading ? (
                 <div className="flex h-full items-center gap-3 text-slate-300">
                   <Loader2 size={14} className="animate-spin text-indigo-400" />
                   <span className="text-[11px] font-bold">Generating finance recommendation...</span>
                 </div>
               ) : (
                 <div className="prose prose-invert prose-p:my-0 prose-strong:text-white max-w-none text-slate-300 text-[11px] leading-relaxed">
                   <ReactMarkdown>{aiRecommendation}</ReactMarkdown>
                 </div>
               )}
             </div>
             <button onClick={generateFinancialRecommendation} disabled={isAiRecommendationLoading} className="w-full py-2 bg-indigo-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                {isAiRecommendationLoading ? 'Syncing AI Recommendation' : 'Execute AI Portfolio Sync'}
             </button>
          </div>
        </div>

        {/* Right: Visualization Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {activeTab === 'projections' && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm h-full flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative z-10">
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2 lowercase">
                    Capital <span className="text-indigo-600">Trajectory</span> Analysis
                  </h4>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Simulation v.5.0</span>
                     <div className="h-4 w-px bg-slate-200" />
                     <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded text-[9px] font-bold text-indigo-600 uppercase tracking-tighter">
                        <Zap size={10} className="fill-indigo-600" /> Career Boost Active
                     </div>
                  </div>
                </div>
                
                <div className="flex gap-8">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Net Worth @ Age {profile.age + 5}</p>
                      <p className="text-2xl font-black text-slate-900 leading-none tabular-nums">${fiveYearProjectionData[fiveYearProjectionData.length - 1].balance.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Alpha Coefficient</p>
                      <p className="text-2xl font-black text-emerald-500 leading-none">{(1.08 + (profile.targetCareerId === 'ai-engineer' ? 0.07 : 0)).toFixed(2)}x</p>
                   </div>
                </div>
              </div>

              <div className="flex-1 min-h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fiveYearProjectionData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      dx={-10}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-2xl">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
                              <div className="space-y-1">
                                <p className="text-sm font-black text-white flex items-center justify-between gap-6">
                                  Balance: <span>${payload[0].value?.toLocaleString()}</span>
                                </p>
                                <p className="text-[10px] font-bold text-indigo-400 flex items-center justify-between">
                                  Growth: <span>+${payload[0].payload.growth?.toLocaleString()}</span>
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#4f46e5" 
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorBalance)"
                      animationDuration={2000}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Annual Savings', value: `$${(monthlySavings * 12).toLocaleString()}`, icon: PiggyBank, color: 'text-indigo-600' },
                   { label: 'Compounding Rate', value: '7.4% Avg', icon: TrendingUp, color: 'text-emerald-600' },
                   { label: 'Financial Freedom', value: 'Yr 14 Est.', icon: Target, color: 'text-amber-600' }
                 ].map((stat, i) => (
                   <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className={cn("p-2 bg-white rounded-xl shadow-sm", stat.color)}>
                         <stat.icon size={16} />
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                         <p className="text-sm font-black text-slate-900 tracking-tight">{stat.value}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}


          {activeTab === 'planner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex justify-between items-center">
                  Expense Distribution <span className="text-xs text-slate-400 font-mono tracking-tighter">${totalMonthlyExpenses}/mo</span>
                </h4>
                {expenseData.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                    <p className="text-sm font-black text-slate-700">No monthly expenses yet</p>
                    <p className="mt-2 text-[11px] font-bold text-slate-400">Load a starter budget or add an expense line to activate the planner.</p>
                    <div className="mt-5 flex gap-3">
                      <button onClick={addStarterBudget} className="rounded-xl bg-indigo-600 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:bg-indigo-500">Starter Budget</button>
                      <button onClick={addExpenseItem} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-200 hover:text-indigo-600">Add Expense</button>
                    </div>
                  </div>
                )}
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
                  {financialProfile.goals.map(goal => (
                    <div key={goal.id} className="group relative bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                       {editingGoalId === goal.id ? (
                         <div className="space-y-3">
                            <input 
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                              value={goal.title}
                              onChange={(e) => {
                                const newGoals = financialProfile.goals.map(g => g.id === goal.id ? { ...g, title: e.target.value } : g);
                                setProfile(prev => ({ 
                                  ...prev, 
                                  financialProfile: { 
                                    ...(prev.financialProfile || financialProfile), 
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
                                     const newGoals = financialProfile.goals.map(g => g.id === goal.id ? { ...g, current: val } : g);
                                     setProfile(prev => ({ 
                                       ...prev, 
                                       financialProfile: { 
                                         ...(prev.financialProfile || financialProfile), 
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
                                     const newGoals = financialProfile.goals.map(g => g.id === goal.id ? { ...g, target: val } : g);
                                     setProfile(prev => ({ 
                                       ...prev, 
                                       financialProfile: { 
                                         ...(prev.financialProfile || financialProfile), 
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
                                     const newGoals = financialProfile.goals.filter(g => g.id !== goal.id);
                                     setProfile(prev => ({ 
                                       ...prev, 
                                       financialProfile: { 
                                         ...(prev.financialProfile || financialProfile), 
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
                      const newGoals = [...financialProfile.goals, newGoal];
                      updateFinancialProfile(current => ({ ...current, goals: newGoals }));
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

          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <TrendingDown size={16} className="text-rose-500" /> Debt Paydown Tracker
                  </h4>
                  <div className="space-y-4">
                    {financialProfile.debt.map(d => (
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
                    {financialProfile.debt.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 px-4 py-6 text-center">
                        <p className="text-sm font-black text-rose-900">No debt accounts tracked</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-rose-400">Add a loan or card to model paydown.</p>
                      </div>
                    )}
                    <button onClick={addDebtAccount} className="w-full py-3 border border-dashed border-rose-200 rounded-2xl text-[10px] font-bold text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all">
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
  const [globalView, setGlobalView] = useState<'landing' | 'app'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [localUser, setLocalUser] = useState<any>(null);

  return (
    <AuthProvider>
      {({ user, loading }) => {
        const activeUser = user || localUser;

        if (loading && globalView === 'app' && !localUser) {
          return (
            <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl animate-pulse flex items-center justify-center">
                 <Sparkles size={32} className="text-white" />
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Syncing Trajectory...</p>
            </div>
          );
        }

        if (globalView === 'landing') {
          return <LandingPage onStart={() => setGlobalView('app')} />;
        }

        if (!activeUser) {
          if (authMode === 'register') {
            return (
              <RegisterScreen 
                onBack={() => {
                  setAuthMode('login');
                  setGlobalView('landing');
                }}
                onSuccess={() => {
                  setAuthMode('login');
                  setGlobalView('app');
                }}
              />
            );
          }
          
          return (
            <LoginScreen 
              onBack={() => setGlobalView('landing')}
              onShowRegister={() => setAuthMode('register')}
              onLoginSuccess={(userData: any) => {
                setLocalUser(userData);
                setGlobalView('app');
              }}
            />
          );
        }

        return <AuthenticatedApp user={activeUser} onExit={() => { setLocalUser(null); setGlobalView('landing'); }} />;
      }}
    </AuthProvider>
  );
}

function AuthenticatedApp({ user, onExit }: { user: any, onExit: () => void }) {
  const [activeView, setActiveView] = useState<'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap' | 'jobs'>('dashboard');
  const [selectedPathId, setSelectedPathId] = useState<string>("ai-engineer");
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState("");
  const [institutionRoadmapContext, setInstitutionRoadmapContext] = useState<InstitutionRoadmapContext | null>(null);
  const [sparkEOpen, setSparkEOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [interviewRole, setInterviewRole] = useState("");
  const [interviewCompany, setInterviewCompany] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewStats, setInterviewStats] = useState<InterviewStats>({
    fieldReadiness: 45,
    streakCount: 0,
    badges: [],
    questionsAnswered: 0
  });

  const [profile, setProfile] = useState<UserProfile>(user.profile || {
    name: user.displayName || "Explorer",
    age: 16,
    education: "High School Junior",
    interests: ["Coding", "Robotics", "Space"],
    budget: 50000,
    country: "USA",
    targetLocation: "Germany",
    targetCareerId: "ai-engineer",
    completedMilestones: ["ai-engineer-0"],
    academicPerformance: {
      gpa: 3.9,
      achievements: ["Winner of Regional Robotics Hackathon"]
    }
  });

  // Sync profile to Firestore when it changes
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Prune immutable fields to minimize diff and avoid rule violations
        const { uid, email, createdAt, ...updateData } = profile;
        
        await updateDoc(userDocRef, {
          ...updateData,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      }
    };
    
    // De-bounce sync to avoid excessive writes
    const timeout = setTimeout(syncProfile, 5000);
    return () => clearTimeout(timeout);
  }, [profile, user.uid]);

  const initiateInterview = (role: string, company?: string, location?: string) => {
    setInterviewRole(role);
    setInterviewCompany(company || "");
    setInterviewLocation(location || profile.targetLocation || "");
    setIsInterviewOpen(true);
  };

  const handleNavigate = (view: typeof activeView, context?: { search?: string; roadmap?: InstitutionRoadmapContext | null }) => {
    if (view === 'institutions') {
      setInstitutionSearchQuery(context?.search ?? "");
      setInstitutionRoadmapContext(context?.roadmap ?? null);
    } else {
      setInstitutionSearchQuery("");
      setInstitutionRoadmapContext(null);
    }
    setActiveView(view);
  };
  const [careers, setCareers] = useState<CareerPath[]>(CAREER_PATHS);
  const [isCareersLoading, setIsCareersLoading] = useState(false);
  const [isAiCareerLoading, setIsAiCareerLoading] = useState(false);
  const [aiCareerSearchMessage, setAiCareerSearchMessage] = useState<string>("");
  
  // Dynamic data from LLM based on navigation
  const [dynamicInstitutions, setDynamicInstitutions] = useState<Institution[]>([]);
  const [isInstitutionsLoading, setIsInstitutionsLoading] = useState(false);
  const [dynamicMaterials, setDynamicMaterials] = useState<any[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [visaGuidance, setVisaGuidance] = useState<any>(null);
  const [isVisaLoading, setIsVisaLoading] = useState(false);
  
  const handleSelectPath = (id: string) => {
    setSelectedPathId(id);
    setProfile(prev => ({ ...prev, targetCareerId: id }));
    setActiveView('roadmap');
  };

  const handleAiCareerSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setAiCareerSearchMessage('Enter a query to search global careers with AI.');
      return;
    }

    setIsAiCareerLoading(true);
    setAiCareerSearchMessage(`Searching global careers for "${trimmedQuery}"...`);

    try {
      const results = await aiSearchCareerPaths(trimmedQuery);
      if (results.length > 0) {
        setCareers(results);
        setSelectedPathId(results[0].id);
        setAiCareerSearchMessage(`Found ${results.length} AI-powered global career paths for "${trimmedQuery}".`);
      } else {
        setAiCareerSearchMessage(`No AI career paths found for "${trimmedQuery}". Try another search term.`);
      }
    } catch (error) {
      console.error('AI career search failed:', error);
      setAiCareerSearchMessage('AI global career search failed. Please try again later.');
    } finally {
      setIsAiCareerLoading(false);
    }
  };

  useEffect(() => {
    const fetchCareers = async () => {
      setIsCareersLoading(true);
      const dynamicCareers = await getTopGlobalCareers();
      if (dynamicCareers && dynamicCareers.length > 0) {
        setCareers(dynamicCareers);
        if (!dynamicCareers.some(p => p.id === selectedPathId)) {
          setSelectedPathId(dynamicCareers[0].id);
        }
      }
      setIsCareersLoading(false);
    };
    fetchCareers();
  }, []);

  // Fetch institutions dynamically when navigating to institutions view
  useEffect(() => {
    if (activeView === 'institutions' && selectedPathId) {
      const fetchInstitutions = async () => {
        setIsInstitutionsLoading(true);
        const selectedCareer = careers.find(c => c.id === selectedPathId);
        const targetLocation = profile.targetLocation || 'Global';
        
        const roadmapFocus = institutionRoadmapContext
          ? `${institutionRoadmapContext.milestoneTitle}: ${institutionRoadmapContext.milestoneDescription}. Requirements: ${institutionRoadmapContext.requirements.join(', ')}`
          : undefined;

        const dynamicInsts = await getDynamicInstitutions(
          profile,
          selectedCareer?.title || selectedPathId,
          targetLocation,
          roadmapFocus,
        );
        if (dynamicInsts && dynamicInsts.length > 0) {
          setDynamicInstitutions(dynamicInsts);
        } else {
          setDynamicInstitutions(INSTITUTIONS.slice(0, 20));
        }
        setIsInstitutionsLoading(false);
      };
      fetchInstitutions();
    }
  }, [activeView, selectedPathId, profile.targetLocation, careers, institutionRoadmapContext]);

  // Fetch study materials dynamically when navigating to materials view
  useEffect(() => {
    if (activeView === 'materials' && selectedPathId) {
      const fetchMaterials = async () => {
        setIsMaterialsLoading(true);
        const skillLevel = profile.academicPerformance?.gpa ? (profile.academicPerformance.gpa > 3.7 ? 'Advanced' : 'Intermediate') : 'Beginner';
        const region = profile.country === 'USA' ? 'NA' : 'Global';
        
        const materials = await getDynamicStudyMaterials(selectedPathId, skillLevel, region);
        if (materials && materials.length > 0) {
          setDynamicMaterials(materials);
        } else {
          // Fallback to mock materials filtered by career
          setDynamicMaterials(STUDY_MATERIALS.filter(m => m.careerId === selectedPathId).slice(0, 12));
        }
        setIsMaterialsLoading(false);
      };
      fetchMaterials();
    }
  }, [activeView, selectedPathId, profile]);

  // Fetch visa guidance when profile or selected path changes
  useEffect(() => {
    if (selectedPathId && profile.targetLocation) {
      const fetchVisaInfo = async () => {
        setIsVisaLoading(true);
        const selectedCareer = careers.find(c => c.id === selectedPathId);
        const guidance = await getVisaGuidance(profile, profile.targetLocation || '', selectedCareer?.title || selectedPathId);
        setVisaGuidance(guidance);
        setIsVisaLoading(false);
      };
      fetchVisaInfo();
    }
  }, [selectedPathId, profile.targetLocation, careers]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onExit();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden relative">
      <NewsFlash country={profile.country} />
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-xl px-10 py-5 z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onExit()}>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 font-black text-white shadow-xl shadow-indigo-200 group-hover:scale-110 transition-transform">CV</div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">CareerVision<span className="text-indigo-600 italic">AI</span></span>
        </div>
        <nav className="hidden lg:flex gap-4">
          <NavItem label="Control" active={activeView === 'dashboard'} onClick={() => handleNavigate('dashboard')} />
          <NavItem label="Jobs" active={activeView === 'jobs'} onClick={() => handleNavigate('jobs')} />
          <NavItem label="Roadmap" active={activeView === 'roadmap'} onClick={() => handleNavigate('roadmap')} />
          <NavItem label="Institutions" active={activeView === 'institutions'} onClick={() => handleNavigate('institutions')} />
          <NavItem label="Hubs" active={activeView === 'heatmap'} onClick={() => handleNavigate('heatmap')} />
          <NavItem label="Academy" active={activeView === 'materials'} onClick={() => handleNavigate('materials')} />
          <NavItem label="Fin-Bot" active={activeView === 'expenses'} onClick={() => handleNavigate('expenses')} />
        </nav>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Authentication</span>
             <button 
               onClick={handleLogout}
               className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:underline"
             >
               <LogOut size={10} /> Disconnect Protocol
             </button>
          </div>
          <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm pr-4 group cursor-pointer hover:border-indigo-200 transition-colors">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-indigo-600 group-hover:text-white transition-colors" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{profile.name}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Level 1 Trajectory</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto scrollbar-hide relative z-10 px-6 lg:px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="h-full"
          >
            {activeView === 'dashboard' && <Dashboard profile={profile} onSelectPath={handleSelectPath} careers={careers} isLoading={isCareersLoading} onInitInterview={initiateInterview} onAiCareerSearch={handleAiCareerSearch} isAiCareerLoading={isAiCareerLoading} aiCareerSearchMessage={aiCareerSearchMessage} />}
            
            {activeView !== 'dashboard' && (
              <div className="grid grid-cols-12 gap-8 h-full">
                <section className="col-span-12 xl:col-span-9 space-y-8 h-full">
                   {activeView === 'roadmap' && <RoadmapView profile={profile} pathId={selectedPathId} careers={careers} onNavigate={handleNavigate} onInitInterview={initiateInterview} />}
                   {activeView === 'jobs' && <JobBoardView profile={profile} />}
                   {activeView === 'institutions' && <InstitutionsView profile={profile} selectedPathId={selectedPathId} initialSearch={institutionSearchQuery} onInitInterview={initiateInterview} institutions={dynamicInstitutions.length > 0 ? dynamicInstitutions : INSTITUTIONS} isLoading={isInstitutionsLoading} visaGuidance={visaGuidance} isVisaLoading={isVisaLoading} roadmapContext={institutionRoadmapContext} />}
                   {activeView === 'heatmap' && <HeatmapView />}
                   {activeView === 'materials' && <MaterialsView materials={dynamicMaterials.length > 0 ? dynamicMaterials : STUDY_MATERIALS} isLoading={isMaterialsLoading} />}
                   {activeView === 'parent' && <ParentalDashboard profile={profile} onBack={() => setActiveView('dashboard')} careers={careers} />}
                   {activeView === 'expenses' && <FinancialView profile={profile} setProfile={setProfile} />}
                </section>

                <section className="hidden xl:col-span-3 xl:flex flex-col gap-8 overflow-hidden">
                   <IntelligenceFeedCard careerId={selectedPathId} />
                   <FinancialBreakdownWidget profile={profile} />
                   {/* Quick Spark.E CTA */}
                   <button
                     onClick={() => setSparkEOpen(true)}
                     className="w-full flex items-center gap-3 px-5 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all group shadow-xl shadow-indigo-200"
                   >
                     <Sparkles size={18} className="shrink-0" />
                     <div className="text-left flex-1 min-w-0">
                       <p className="text-[10px] font-black uppercase tracking-widest leading-none">Ask Spark.E</p>
                       <p className="text-[9px] text-indigo-200 leading-none mt-0.5 truncate">AI Career Mentor</p>
                     </div>
                     <ChevronRight size={14} className="shrink-0 group-hover:translate-x-1 transition-transform" />
                   </button>
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Footer Status Bar */}
      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-10 py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] shrink-0 relative z-10">
        <div className="flex gap-8">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 
            IPEDS Access: Online
          </span>
          <span>O*NET Sync: Terminal_Active</span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="text-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors">v2.1.0-AI_Core</span>
          <div className="h-4 w-[1px] bg-slate-200" />
          <span>Multi-Tenant Secure Cloud</span>
        </div>
      </footer>

      <InterviewHotSeat 
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        role={interviewRole}
        company={interviewCompany}
        location={interviewLocation}
        onStatsUpdate={setInterviewStats}
      />

      {/* Spark.E Floating Bubble */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Tooltip label */}
        <AnimatePresence>
          {!sparkEOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-xl pointer-events-none"
            >
              Spark.E ⚡
            </motion.div>
          )}
        </AnimatePresence>
        {/* Bubble button */}
        <motion.button
          onClick={() => setSparkEOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="relative w-14 h-14 rounded-2xl bg-indigo-600 shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {sparkEOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X size={22} />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <Sparkles size={22} />
              </motion.span>
            )}
          </AnimatePresence>
          {/* Pulse ring */}
          {!sparkEOpen && (
            <span className="absolute inset-0 rounded-2xl border-2 border-indigo-400 animate-ping opacity-30 pointer-events-none" />
          )}
        </motion.button>
      </div>

      {/* Spark.E Slide-in Drawer */}
      <AnimatePresence>
        {sparkEOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSparkEOpen(false)}
              className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-40"
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-950">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white tracking-tight leading-none">⚡ Spark.E</p>
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest leading-none mt-0.5">AI Career Mentor</p>
                  </div>
                </div>
                <button
                  onClick={() => setSparkEOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              {/* AIAdvisor fills the rest */}
              <div className="flex-1 overflow-hidden">
                <AIAdvisor profile={profile} embedded />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
