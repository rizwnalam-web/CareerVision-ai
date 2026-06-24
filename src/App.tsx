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
  Lightbulb,
  AlertCircle,
  ChevronDown,
  DollarSign,
  Users,
  Layers,
  Crown,
  Building2,
  Bell,
  CalendarDays,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Circle } from 'react-leaflet';
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts';
import { cn } from './lib/utils';
// mock data removed — all data is loaded from the AI/backend
import { FUNDING_OPPORTUNITIES } from './constants/mockData';
import { CareerPath, UserProfile, Institution, FundingOpportunity, DashboardIntelligence, CareerSkillGap } from './types/career';
import { getCareerAdvice, matchScholarships, getRecommendedCourses, getTopGlobalCareers, aiSearchCareerPaths, generateCoverLetter, getLatestCareerNews, getAiInstitutionRecommendations, getDynamicInstitutions, getDynamicStudyMaterials, getVisaGuidance, getCareerHubIntelligence, aiSearchInstitutions, aiSearchCareerHubs, getDashboardIntelligence, getCareerSkillGap, getGlobalContextInsights, getCareersByCountry, getCareerMilestones, getJobDirectory, getCareerRequirements, GlobalInsight, type CountryCareerEntry, type CareerMilestone, type JobDirectory, type CareerRequirements } from './services/geminiService';
import ReactMarkdown from 'react-markdown';

import { LandingPage } from './components/LandingPage';
import Logo from './components/Logo';
import { CareerDirectoryView } from './components/CareerDirectoryView';
import NetworkView from './components/NetworkView';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsConditions } from './components/TermsConditions';
import { FAQPage } from './components/FAQPage';
import { InterviewHotSeat } from './components/InterviewHotSeat';
import MaterialsView from './components/MaterialsView';
import { RegisterScreen } from './components/RegisterScreen';
import { InterviewStats } from './types/interview';
import { AuthProvider, LoginScreen } from './components/Auth';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from './lib/AccessibilityContext';
import { VisaDetails } from './components/VisaDetails';
import { CareerHubCard } from './components/CareerHubCard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PricingPage from './components/PricingPage';
import EnterpriseView from './components/EnterpriseView';
import CareerCoachChat from './components/CareerCoachChat';
import IndustrySimulator from './components/IndustrySimulator';
import SoftSkillsAssessment from './components/SoftSkillsAssessment';
import SalaryNegotiationCoach from './components/SalaryNegotiationCoach';
import SideHustleAdvisor from './components/SideHustleAdvisor';
import BurnoutPrevention from './components/BurnoutPrevention';
import AdminDashboard from './components/AdminDashboard';
import { trackView } from './services/analyticsService';
import { prefetchVariants } from './lib/abTesting';
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

// Nav item accent colors per view
const NAV_ACCENTS: Record<string, { bg: string; text: string; icon: string; ring: string }> = {
  dashboard:    { bg: 'bg-slate-900',   text: 'text-white',        icon: 'text-white',         ring: 'ring-slate-200' },
  roadmap:      { bg: 'bg-violet-600',  text: 'text-white',        icon: 'text-white',         ring: 'ring-violet-200' },
  institutions: { bg: 'bg-sky-600',     text: 'text-white',        icon: 'text-white',         ring: 'ring-sky-200' },
  materials:    { bg: 'bg-amber-500',   text: 'text-white',        icon: 'text-white',         ring: 'ring-amber-200' },
  jobs:         { bg: 'bg-indigo-600',  text: 'text-white',        icon: 'text-white',         ring: 'ring-indigo-200' },
  heatmap:      { bg: 'bg-teal-600',    text: 'text-white',        icon: 'text-white',         ring: 'ring-teal-200' },
  expenses:     { bg: 'bg-emerald-600', text: 'text-white',        icon: 'text-white',         ring: 'ring-emerald-200' },
  resume:       { bg: 'bg-rose-500',    text: 'text-white',        icon: 'text-white',         ring: 'ring-rose-200' },
  'job-match':  { bg: 'bg-purple-600',  text: 'text-white',        icon: 'text-white',         ring: 'ring-purple-200' },
  'interview':   { bg: 'bg-violet-600',  text: 'text-white',        icon: 'text-white',         ring: 'ring-violet-200' },
};

const NAV_HOVER_ICONS: Record<string, string> = {
  dashboard:    'group-hover:text-slate-700',
  roadmap:      'group-hover:text-violet-600',
  institutions: 'group-hover:text-sky-600',
  materials:    'group-hover:text-amber-500',
  jobs:         'group-hover:text-indigo-600',
  heatmap:      'group-hover:text-teal-600',
  expenses:     'group-hover:text-emerald-600',
  resume:       'group-hover:text-rose-500',
  'job-match':  'group-hover:text-purple-600',
};

const NavItem = ({ label, active, onClick, icon: Icon, view }: { label: string, active: boolean, onClick: () => void, icon?: React.ElementType, view?: string }) => {
  const accent = view ? NAV_ACCENTS[view] : NAV_ACCENTS.dashboard;
  return (
    <div className="relative group/nav">
      <button
        onClick={onClick}
        aria-label={label}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150",
          active
            ? cn(accent.bg, "shadow-md shadow-black/10")
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        )}
      >
        {Icon && (
          <Icon size={15} className={cn("transition-colors shrink-0", active ? "text-white" : "")} />
        )}
        {/* Active indicator dot */}
        {active && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-60" />
        )}
      </button>
      {/* Tooltip */}
      <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50
                      opacity-0 group-hover/nav:opacity-100 translate-y-1 group-hover/nav:translate-y-0
                      transition-all duration-150">
        <div className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest
                        px-2.5 py-1 rounded-lg whitespace-nowrap shadow-xl">
          {label}
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -top-1 left-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
};

import { NewsFlash } from './components/NewsFlash';
import { JobBoardView } from './components/JobBoardView';
import ResumeManager from './components/ResumeManager';
import JobMatchView from './components/JobMatchView';
import InterviewPrepView from './components/InterviewPrepView';
import MobileInterviewView from './components/MobileInterviewView';
import OfflineBanner from './components/OfflineBanner';
import { isMobileDevice } from './lib/pwa';
import { InstitutionComparator } from './components/InstitutionComparator';
import { UserProfileModal } from './components/UserProfileModal';
import { fetchLLMHealth, reprobeLLM, type LLMHealthStatus } from './services/llmHealthService';
import AccessibilityToolbar from './components/AccessibilityToolbar';
import AccessibilityChecker from './components/AccessibilityChecker';

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

const HeatmapView = ({ profile }: { profile: UserProfile }) => {
  const DEFAULT_HUBS = [
    { city: "Silicon Valley", country: "USA", coords: { lat: 37.3875, lng: -122.0575 } },
    { city: "London", country: "UK", coords: { lat: 51.5074, lng: -0.1278 } },
    { city: "Singapore", country: "Singapore", coords: { lat: 1.3521, lng: 103.8198 } },
    { city: "Berlin", country: "Germany", coords: { lat: 52.5200, lng: 13.4050 } },
    { city: "Bangalore", country: "India", coords: { lat: 12.9716, lng: 77.5946 } },
    { city: "Dubai", country: "UAE", coords: { lat: 25.2048, lng: 55.2708 } },
  ];

  const LOCATION_OVERRIDES: Record<string, { city: string; country: string; coords: { lat: number; lng: number } }> = {
    germany: { city: "Berlin", country: "Germany", coords: { lat: 52.5200, lng: 13.4050 } },
    uk: { city: "London", country: "UK", coords: { lat: 51.5074, lng: -0.1278 } },
    usa: { city: "Silicon Valley", country: "USA", coords: { lat: 37.3875, lng: -122.0575 } },
    india: { city: "Bangalore", country: "India", coords: { lat: 12.9716, lng: 77.5946 } },
    singapore: { city: "Singapore", country: "Singapore", coords: { lat: 1.3521, lng: 103.8198 } },
    uae: { city: "Dubai", country: "UAE", coords: { lat: 25.2048, lng: 55.2708 } },
  };

  const [hubs, setHubs] = useState<any[]>([]);
  const [hubLoadingStates, setHubLoadingStates] = useState<Record<string, boolean>>({});
  const [hubErrors, setHubErrors] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'cards'>('map');

  const resolveHubCoords = (city: string, country: string) => {
    const overrideKey = `${city},${country}`.toLowerCase();
    const known = DEFAULT_HUBS.find(h => h.city.toLowerCase() === city.toLowerCase() && h.country.toLowerCase() === country.toLowerCase());
    if (known) return known.coords;
    const generic = LOCATION_OVERRIDES[country.toLowerCase()] || LOCATION_OVERRIDES[city.toLowerCase()];
    return generic?.coords ?? null;
  };

  const personalHub = profile.targetLocation ? LOCATION_OVERRIDES[profile.targetLocation.toLowerCase()] : undefined;
  const initialHubs = personalHub
    ? [personalHub, ...DEFAULT_HUBS.filter(h => h.city !== personalHub.city || h.country !== personalHub.country)]
    : DEFAULT_HUBS;

  const fetchHub = async (city: string, country: string, key: string) => {
    setHubLoadingStates(prev => ({ ...prev, [key]: true }));
    setHubErrors(prev => ({ ...prev, [key]: false }));
    try {
      const data = await getCareerHubIntelligence(city, country);
      if (data) {
        setHubs(prev => {
          const exists = prev.find(h => `${h.city}-${h.country}` === key);
          if (exists) return prev.map(h => `${h.city}-${h.country}` === key ? data : h);
          return [...prev, { ...data, city, country }];
        });
      } else {
        setHubErrors(prev => ({ ...prev, [key]: true }));
      }
    } catch {
      setHubErrors(prev => ({ ...prev, [key]: true }));
    } finally {
      setHubLoadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadHubs = async (sourceHubs = initialHubs) => {
    setHubs([]);
    setHubLoadingStates({});
    setHubErrors({});
    setCacheStatus(`Fetching live market intelligence for ${profile.targetLocation || profile.country || 'global'} markets...`);
    for (const loc of sourceHubs) {
      const key = `${loc.city}-${loc.country}`;
      await fetchHub(loc.city, loc.country, key);
      await new Promise(r => setTimeout(r, 400));
    }
    setLastUpdated(new Date());
    setCacheStatus(`Live market intelligence updated from ${sourceHubs.length} hubs`);
  };

  useEffect(() => {
    loadHubs();
  }, [profile.targetLocation]);

  const handleAiSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? searchQuery).trim();
    if (!q) return;
    setIsAiSearching(true);
    setHasSearched(true);
    setCacheStatus(`Searching global hubs for "${q}"...`);
    try {
      const locations = await aiSearchCareerHubs(q);
      if (locations.length === 0) {
        setCacheStatus("No hubs matched your query. Try different terms.");
        setIsAiSearching(false);
        return;
      }
      setHubs([]);
      setHubLoadingStates({});
      setHubErrors({});
      setCacheStatus(`Found ${locations.length} hubs — fetching live data...`);
      for (const loc of locations) {
        const key = `${loc.city}-${loc.country}`;
        await fetchHub(loc.city, loc.country, key);
        await new Promise(r => setTimeout(r, 400));
      }
      setLastUpdated(new Date());
      setCacheStatus(`Live data ready for ${locations.length} AI-matched hubs`);
    } catch {
      setCacheStatus("AI hub search failed. Please try again.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const EXAMPLE_QUERIES = [
    'best AI hubs Europe',
    'finance cities Asia',
    'affordable tech hubs',
  ];

  const handleRefresh = () => {
    setHasSearched(false);
    setSearchQuery("");
    loadHubs();
  };

  const isAnyLoading = Object.values(hubLoadingStates).some(Boolean);
  const loadedCount = hubs.length;
  const allErrored = !isAnyLoading && loadedCount === 0 && Object.keys(hubErrors).length > 0;

  const markerHubs = hubs
    .map(hub => {
      const coords = resolveHubCoords(hub.city, hub.country);
      return coords ? { ...hub, coords } : null;
    })
    .filter(Boolean) as Array<any>;

  const mapCenter: [number, number] = markerHubs.length
    ? [markerHubs.reduce((sum, h) => sum + h.coords.lat, 0) / markerHubs.length, markerHubs.reduce((sum, h) => sum + h.coords.lng, 0) / markerHubs.length]
    : [20, 0];

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Career Hub Heatmap"
        subtitle={`Market pulse for ${profile.targetLocation || profile.country || 'global'} career hubs`}
      />

      {/* Status bar */}
      <motion.div
        key={cacheStatus || 'heatmap-status'}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl px-4 py-3 flex flex-col sm:flex-row gap-3 sm:gap-2 items-start sm:items-center ${isAnyLoading || isAiSearching ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200'}`}
      >
        <div className="flex items-center gap-2">
          {isAnyLoading || isAiSearching
            ? <Loader2 size={16} className="text-indigo-600 animate-spin shrink-0" />
            : <Zap size={16} className="text-emerald-600 shrink-0" />}
          <span className={`text-xs font-bold ${isAnyLoading || isAiSearching ? 'text-indigo-700' : 'text-emerald-700'}`}>
            {cacheStatus || 'Initializing market hub data...'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 items-center ml-auto">
          {loadedCount > 0 && !isAnyLoading && lastUpdated && (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {loadedCount > 0 && (
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {loadedCount} hubs loaded
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isAnyLoading}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:border-slate-300 bg-white text-slate-600 disabled:opacity-50"
          >
            Refresh all
          </button>
        </div>
      </motion.div>

      <div className="grid gap-6">
        {/* Per-hub comparison metrics strip */}
        {markerHubs.length > 0 && (
          <div className="flex gap-3 overflow-x-auto py-2 px-1">
            {markerHubs.map((hub, i) => (
              <div key={`cmp-${hub.city}-${i}`} className="min-w-[220px] bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-black text-slate-800">{hub.city}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{hub.country}</p>
                  </div>
                  <div className="text-xs font-black text-indigo-600">{hub.intensity ?? 'N/A'}%</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-slate-500">Cost Index</div>
                  <div className="font-black text-slate-800">{Number(hub.costOfLiving || 1).toFixed(1)}x</div>
                  <div className="text-slate-500">Avg Salary</div>
                  <div className="font-black text-slate-800">${Math.round((hub.averageSalaryRange?.max || 0)/1000)}k</div>
                  <div className="text-slate-500">Openings</div>
                  <div className="font-black text-slate-800">{(hub.topCareers || []).reduce((s: number, c: any) => s + (c.openings || 0), 0)}</div>
                  <div className="text-slate-500">Visa</div>
                  <div className="font-black text-slate-800">{hub.visaOpenness || 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.28em]">Map View</p>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Spatial Heatmap of Active Hubs</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">Markers show loaded hubs; larger circles indicate higher hiring intensity.</p>
            </div>
          </div>
          {viewMode === 'map' && (
            <div className="h-[360px]">
              <MapContainer center={mapCenter} zoom={2} scrollWheelZoom={false} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              {markerHubs.map((hub, idx) => (
                <React.Fragment key={`${hub.city}-${hub.country}-${idx}`}>
                  <Marker position={[hub.coords.lat, hub.coords.lng]}>
                    <Popup>
                      <div className="max-w-[200px]">
                        <p className="text-sm font-black text-slate-900">{hub.city}, {hub.country}</p>
                        <p className="text-[11px] text-slate-500">Intensity: {hub.intensity ?? 'N/A'}%</p>
                        <p className="text-[10px] text-slate-500">Health: {hub.marketHealthScore ?? 'N/A'}%</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[hub.coords.lat, hub.coords.lng]}
                    radius={Math.max(12000, (hub.intensity ?? 50) * 1200)}
                    pathOptions={{ color: 'rgba(79,70,229,0.45)', fillColor: 'rgba(79,70,229,0.18)', weight: 1 }}
                  />
                </React.Fragment>
              ))}
          </MapContainer>
        </div>
      )}

        {allErrored && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center">
            <p className="text-sm font-black text-rose-700">Live data temporarily unavailable</p>
            <p className="mt-2 text-[10px] text-rose-500">We could not fetch fresh hub intelligence right now. Your map is still visible, but results are loading from cached infrastructure when available.</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-5 py-3 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-700 transition-all"
            >
              Retry all
            </button>
          </div>
        )}
        </div>
      </div>

      {/* AI Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex gap-3 items-center">
        <div className="flex items-center gap-2 shrink-0">
          <BrainCircuit size={18} className="text-indigo-600" />
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest hidden sm:block">AI Hub Search</span>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAiSearch()}
          placeholder='e.g. "best AI hubs Europe", "finance cities Asia", "affordable tech hubs"...'
          className="flex-1 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
        />
        <button         
          onClick={() => handleAiSearch()}
          disabled={isAiSearching || isAnyLoading || !searchQuery.trim()}
          className="px-4 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isAiSearching ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Search
        </button>
        {hasSearched && (
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all active:scale-95 shrink-0"
            title="Reset to default hubs"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Example queries */}
      <div className="flex gap-2 mt-2">
        {EXAMPLE_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => handleAiSearch(q)}
            className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 hover:bg-indigo-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Hub Grid (card view) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Loaded hubs */}
        {hubs.map((hub, idx) => (
          <motion.div
            key={`${hub.city}-${hub.country}-${idx}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.05 }}
          >
            <CareerHubCard hub={hub} />
          </motion.div>
        ))}

        {/* Per-hub loading skeletons for hubs still in flight */}
        {Object.entries(hubLoadingStates)
          .filter(([, loading]) => loading)
          .map(([key]) => (
            <div key={`loading-${key}`} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={16} className="text-indigo-400 animate-spin shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-slate-50 rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                ))}
              </div>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-4 text-center">
                Fetching live market data...
              </p>
            </div>
          ))}

        {/* Error states */}
        {Object.entries(hubErrors)
          .filter(([, err]) => err)
          .map(([key]) => {
            const [city, country] = key.split('-');
            return (
              <div key={`error-${key}`} className="bg-rose-50 border border-rose-200 p-6 rounded-3xl flex flex-col items-center justify-center gap-3 text-center min-h-[200px]">
                <AlertCircle size={24} className="text-rose-400" />
                <div>
                  <p className="text-sm font-black text-rose-700">{city}</p>
                  <p className="text-[10px] text-rose-400 font-bold uppercase">{country}</p>
                </div>
                <p className="text-[10px] text-rose-500 font-medium">Failed to fetch live data</p>
                <button
                  onClick={() => fetchHub(city, country, key)}
                  className="px-3 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all flex items-center gap-1"
                >
                  <RotateCcw size={10} /> Retry
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Global Insights - shown once at least one hub is loaded */}
      {loadedCount > 0 && !isAnyLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <BrainCircuit size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Live Global Market Snapshot</h3>
              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">AI-synthesized from {loadedCount} active hubs</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Avg Market Heat", value: `${Math.round(hubs.reduce((s, h) => s + (h.intensity || 0), 0) / loadedCount)}%`, icon: Zap, color: "text-amber-600" },
              { label: "Avg Health Score", value: `${Math.round(hubs.reduce((s, h) => s + (h.marketHealthScore || 0), 0) / loadedCount)}%`, icon: TrendingUp, color: "text-emerald-600" },
              { label: "Avg Remote Work", value: `${Math.round(hubs.reduce((s, h) => s + (h.remoteWorkPercentage || 0), 0) / loadedCount)}%`, icon: Globe, color: "text-indigo-600" },
              { label: "Hubs Tracked", value: `${loadedCount}`, icon: MapPin, color: "text-purple-600" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 text-center">
                  <Icon size={20} className={`mx-auto mb-2 ${stat.color}`} />
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
              );
            })}
          </div>
          <div className="space-y-3">
            {hubs.slice(0, 3).filter(h => h.hiringTrends).map((hub, i) => (
              <div key={i} className="bg-white/60 rounded-xl p-3 border border-indigo-50">
                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">{hub.city}, {hub.country}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{hub.hiringTrends}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
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

  if (data.length === 0 || total === 0) {
    return (
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <p className="text-xs text-slate-400 text-center">Add monthly expenses to your financial profile to see breakdown</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Burn Rate</h4>
        <div className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px]">
           <Zap size={10} className="fill-rose-500" /> Critical
        </div>
      </div>
      
      <div className="relative w-full aspect-square max-w-[180px] mb-6">
        <div className="w-full h-full" style={{ minWidth: 1, minHeight: 1 }}>
           <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                 isAnimationActive={false}
               >
                 {data.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <RechartsTooltip 
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

const GlobalContextBar = ({ profile, onInsightClick }: { profile: UserProfile; onInsightClick?: (insight: GlobalInsight) => void }) => {
  const COLOR_MAP: Record<GlobalInsight['color'], { pill: string; dot: string }> = {
    emerald: { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', dot: 'bg-emerald-400' },
    indigo:  { pill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',   dot: 'bg-indigo-400' },
    amber:   { pill: 'bg-amber-500/15 text-amber-300 border-amber-500/25',      dot: 'bg-amber-400' },
    rose:    { pill: 'bg-rose-500/15 text-rose-300 border-rose-500/25',         dot: 'bg-rose-400' },
    purple:  { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/25',   dot: 'bg-purple-400' },
  };

  const FALLBACK: GlobalInsight[] = [
    { flag: '🇩🇪', city: 'BERLIN', country: 'Germany', stat: 'AI +24%', category: 'AI', color: 'emerald' },
    { flag: '🇸🇬', city: 'SINGAPORE', country: 'Singapore', stat: 'TECH +31%', category: 'Tech', color: 'indigo' },
    { flag: '🇬🇧', city: 'LONDON', country: 'UK', stat: 'FINTECH +18%', category: 'FinTech', color: 'amber' },
    { flag: '🇺🇸', city: 'NYC', country: 'USA', stat: 'AI ROLES +32%', category: 'AI', color: 'rose' },
    { flag: '🇦🇪', city: 'DUBAI', country: 'UAE', stat: 'CLOUD +28%', category: 'Cloud', color: 'purple' },
    { flag: '🇨🇦', city: 'TORONTO', country: 'Canada', stat: 'HIRING +21%', category: 'Tech', color: 'emerald' },
  ];

  const [insights, setInsights] = useState<GlobalInsight[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [now, setNow] = useState(() => new Date().toISOString().slice(0, 16).replace('T', ' '));

  // Fetch live insights once on mount
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      const data = await getGlobalContextInsights(
        profile.targetLocation || profile.country || 'Global',
        profile.interests || [],
        profile.targetCareerId || 'technology'
      );
      if (!cancelled && data.length > 0) {
        setInsights(data);
      }
      if (!cancelled) setLoading(false);
    };
    fetch();
    return () => { cancelled = true; };
  }, [profile.targetLocation, profile.country, profile.targetCareerId]);

  // Cycle through insights every 3.5 seconds
  useEffect(() => {
    if (insights.length <= 4) return;
    const timer = setInterval(() => {
      setActiveIdx(i => (i + 1) % Math.max(1, insights.length - 3));
    }, 3500);
    return () => clearInterval(timer);
  }, [insights.length]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().toISOString().slice(0, 16).replace('T', ' '));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Show 4 insights at a time, cycling through the list
  const visible = insights.slice(activeIdx, activeIdx + 4);

  return (
    <div className="bg-slate-950 border-b border-white/[0.06] shrink-0 z-30 overflow-hidden">
      <div className="px-6 py-2 flex items-center justify-between gap-4">

        {/* Left: label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] hidden sm:block">
            Global Intel
          </span>
        </div>

        {/* Center: cycling insight pills */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden min-w-0">
          {loading ? (
            // Skeleton placeholders while fetching
            [0, 1, 2, 3].map(i => (
              <div key={i} className="h-6 w-28 rounded-full bg-white/5 animate-pulse shrink-0" />
            ))
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((item) => {
                const c = COLOR_MAP[item.color] ?? COLOR_MAP.indigo;
                return (
                  <motion.button
                    key={`${item.city}-${item.stat}`}
                    type="button"
                    onClick={() => onInsightClick?.(item)}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5 shrink-0 rounded-full px-2 py-1 bg-slate-800/20 hover:bg-slate-900/30 transition-colors"
                  >
                    <span className="text-base leading-none select-none">{item.flag}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden md:block">
                      {item.city}:
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap ${c.pill}`}>
                      {item.stat}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Right: timestamp + live dot */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] text-slate-600 font-medium hidden lg:block tabular-nums">
            {now} UTC
          </span>
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const COUNTRY_FILTERS: { flag: string; label: string; query: string | null }[] = [
  { flag: '🌐', label: 'Global',    query: null },
  { flag: '🇺🇸', label: 'USA',       query: 'top 10 most in-demand jobs in United States 2026' },
  { flag: '🇬🇧', label: 'UK',        query: 'top 10 most in-demand jobs in United Kingdom 2026' },
  { flag: '🇨🇦', label: 'Canada',    query: 'top 10 most in-demand jobs in Canada 2026' },
  { flag: '🇩🇪', label: 'Germany',   query: 'top 10 most in-demand jobs in Germany 2026' },
  { flag: '🇦🇺', label: 'Australia', query: 'top 10 most in-demand jobs in Australia 2026' },
  { flag: '🇸🇬', label: 'Singapore', query: 'top 10 most in-demand jobs in Singapore 2026' },
  { flag: '🇦🇪', label: 'UAE',       query: 'top 10 most in-demand jobs in UAE 2026' },
  { flag: '🇮🇳', label: 'India',     query: 'top 10 most in-demand jobs in India 2026' },
  { flag: '🇯🇵', label: 'Japan',     query: 'top 10 most in-demand jobs in Japan 2026' },
  { flag: '🇫🇷', label: 'France',    query: 'top 10 most in-demand jobs in France 2026' },
  { flag: '🇳🇱', label: 'Netherlands', query: 'top 10 most in-demand jobs in Netherlands 2026' },
];

// Static preview tiles shown when no personalised sector data is available yet
const SECTOR_PLACEHOLDERS = [
  { name: 'Technology',      status: 'Hot'      as const, color: '#818cf8', trend: '+8.4% hiring velocity',  spark: [{v:70},{v:75},{v:72},{v:80},{v:85},{v:88},{v:92}] },
  { name: 'Healthcare',      status: 'Rising'   as const, color: '#34d399', trend: '+6.2% demand surge',     spark: [{v:60},{v:65},{v:68},{v:72},{v:75},{v:80},{v:87}] },
  { name: 'Finance',         status: 'Stable'   as const, color: '#60a5fa', trend: 'Steady market signals',  spark: [{v:74},{v:76},{v:75},{v:78},{v:77},{v:79},{v:78}] },
  { name: "Gov't & Defence", status: 'Emerging' as const, color: '#fbbf24', trend: '+12% new openings',      spark: [{v:40},{v:45},{v:50},{v:55},{v:58},{v:62},{v:65}] },
];

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Deadline Tracker — countdown helpers
// ─────────────────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  const deadline = new Date(dateStr);
  deadline.setHours(23, 59, 59, 999);
  const now = new Date();
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineUrgency(days: number): {
  label: string; bg: string; border: string; text: string;
  numBg: string; badge: string; pulse: boolean;
} {
  if (days <= 7)  return { label: 'Critical', bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-600',   numBg: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700 border-rose-200',   pulse: true  };
  if (days <= 30) return { label: 'Urgent',   bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-600',  numBg: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700 border-amber-200',  pulse: false };
  if (days <= 90) return { label: 'Soon',     bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600', numBg: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', pulse: false };
  return               { label: 'Upcoming',  bg: 'bg-slate-50',  border: 'border-slate-100',  text: 'text-slate-400',  numBg: 'bg-slate-400',  badge: 'bg-slate-100 text-slate-500 border-slate-200',  pulse: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// DeadlineCountdownWidget
// ─────────────────────────────────────────────────────────────────────────────

const DeadlineCountdownWidget = ({
  onViewAll,
}: {
  onViewAll: () => void;
}) => {
  const [, setTick] = useState(0);
  // Re-render every 60 s so countdowns stay live
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...FUNDING_OPPORTUNITIES]
    .map(opp => ({ ...opp, daysLeft: getDaysUntil(opp.deadline) }))
    .filter(opp => opp.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const urgentCount = sorted.filter(o => o.daysLeft <= 30).length;

  const handleReminder = (opp: (typeof sorted)[0]) => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        new Notification(`Deadline Reminder: ${opp.name}`, {
          body: `Application closes in ${opp.daysLeft} day${opp.daysLeft !== 1 ? 's' : ''} on ${new Date(opp.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}. Amount: $${opp.amount.toLocaleString()}.`,
          icon: '/manifest.webmanifest',
          tag: `deadline-${opp.id}`,
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ef4444' }}>
              <CalendarDays size={12} className="text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline Tracker</span>
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                {urgentCount} urgent
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-snug">
            Application windows — live countdown
          </p>
        </div>
        <button onClick={onViewAll} className="shrink-0 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-1 mt-1">
          View All <ChevronRight size={11} />
        </button>
      </div>

      <div className="px-4 pb-5 space-y-2.5">
        {sorted.length === 0 ? (
          <p className="text-[10px] text-slate-400 font-bold text-center py-6 uppercase tracking-widest">No upcoming deadlines</p>
        ) : sorted.slice(0, 5).map((opp, idx) => {
          const cfg = getDeadlineUrgency(opp.daysLeft);
          return (
            <motion.div
              key={opp.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-2xl border p-3 ${cfg.bg} ${cfg.border} ${cfg.pulse ? 'ring-1 ring-rose-300' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                {/* Countdown box */}
                <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${cfg.numBg}`}>
                  <span className="text-[15px] font-black text-white leading-none">{opp.daysLeft}</span>
                  <span className="text-[6px] font-black text-white/70 uppercase tracking-widest">days</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                      {opp.type}
                    </span>
                    {cfg.pulse && (
                      <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">● Closing soon</span>
                    )}
                  </div>
                  <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{opp.name}</p>
                  <p className="text-[8px] text-slate-400 font-medium">{opp.provider} · {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>

                {/* Amount + remind */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[12px] font-black text-slate-900">${opp.amount.toLocaleString()}</span>
                  <button
                    onClick={() => handleReminder(opp)}
                    title="Set browser reminder"
                    className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-colors ${cfg.badge} hover:opacity-80`}
                  >
                    <Bell size={8} /> Remind
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between">
        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{sorted.length} active window{sorted.length !== 1 ? 's' : ''}</span>
        <button onClick={onViewAll} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-1">
          Browse Funding <ArrowUpRight size={10} />
        </button>
      </div>
    </div>
  );
};

// Scholarship Triage System — Intelligent Tiered Categorization// Three tiers: Merit | Need | Interest/Inclusion
// Scores each tier using the full user profile, not just academics.
// ─────────────────────────────────────────────────────────────────────────────

type ScholarshipTier = 'Merit' | 'Need' | 'Interest';

interface TieredMatch extends FundingOpportunity {
  localScore: number;
  tier: ScholarshipTier;
  breakdown: { label: string; points: number; max: number }[];
  profileSignals: string[];
}

/** Classify an opportunity into its primary funding tier */
function classifyTier(opp: FundingOpportunity): ScholarshipTier {
  if (opp.category === 'Merit') return 'Merit';
  if (opp.category === 'Need') return 'Need';
  if (opp.category === 'Interest' || opp.category === 'Geographic') return 'Interest';
  const text = `${opp.name} ${opp.description} ${opp.eligibilityCriteria.join(' ')}`.toLowerCase();
  if (/\bgpa\b|merit|academic|grade|honor|dean|excellence/.test(text)) return 'Merit';
  if (/income|need-based|financial aid|family income|low.income|household|demonstrated need/.test(text)) return 'Need';
  return 'Interest';
}

/** Tier-aware scoring — each tier uses the profile data most relevant to it */
function computeTieredScore(
  opp: FundingOpportunity,
  profile: UserProfile,
  tier: ScholarshipTier
): { score: number; breakdown: { label: string; points: number; max: number }[]; profileSignals: string[] } {
  const breakdown: { label: string; points: number; max: number }[] = [];
  const signals: string[] = [];
  const text = `${opp.name} ${opp.description} ${opp.eligibilityCriteria.join(' ')}`.toLowerCase();
  const gpa = Number(profile.academicPerformance?.gpa ?? 0);
  const edu = (profile.education || '').toLowerCase();
  const career = (profile.targetCareerId || '').toLowerCase();
  const interests = (Array.isArray(profile.interests) ? profile.interests : []).map((i: string) => i.toLowerCase().trim()).filter(i => i.length > 2);
  const budget = Number(profile.budget ?? (profile as any).financialProfile?.monthlyIncome ?? 0);
  const location = (profile.targetLocation || profile.country || '').toLowerCase();

  if (tier === 'Merit') {
    // GPA (40 pts)
    const reqGpa = parseFloat((text.match(/gpa\s*[>≥]\s*([\d.]+)/)?.[1] ?? '0'));
    let gpaPts = 0;
    if (reqGpa > 0) {
      gpaPts = gpa >= reqGpa + 0.5 ? 40 : gpa >= reqGpa + 0.2 ? 33 : gpa >= reqGpa ? 25 : gpa >= reqGpa - 0.3 ? 10 : 0;
    } else {
      gpaPts = gpa >= 3.8 ? 40 : gpa >= 3.5 ? 34 : gpa >= 3.2 ? 26 : gpa >= 3.0 ? 18 : gpa >= 2.7 ? 10 : 4;
    }
    if (gpa > 0) signals.push(`GPA ${gpa.toFixed(1)}`);
    breakdown.push({ label: 'GPA', points: gpaPts, max: 40 });

    // Field of study (35 pts)
    const stemKw = ['engineer', 'comput', 'tech', 'science', 'math', 'data', 'ai', 'cyber', 'bio', 'physics', 'nursing', 'medicine'];
    const isStemEdu = stemKw.some(k => edu.includes(k));
    const isStemOpp = stemKw.some(k => text.includes(k));
    let fieldPts = 14; // baseline
    if (edu && text.includes(edu.split(' ')[0])) fieldPts = 35;
    else if (isStemEdu && isStemOpp) fieldPts = 28;
    if (edu) signals.push(edu.split(' ').slice(0, 2).join(' '));
    breakdown.push({ label: 'Field of Study', points: fieldPts, max: 35 });

    // Career alignment (15 pts)
    const careerPts = career && (text.includes(career.split(' ')[0]) || career.split(' ').some(w => w.length > 3 && text.includes(w))) ? 15 : 6;
    if (career) signals.push(career.split(' ')[0]);
    breakdown.push({ label: 'Career Goal', points: careerPts, max: 15 });

    // Location (10 pts)
    breakdown.push({ label: 'Location', points: location && text.includes(location) ? 10 : 5, max: 10 });

  } else if (tier === 'Need') {
    // Financial need (50 pts) — primary driver
    const hasNeedCriteria = /income|need.based|financial|family|household/.test(text);
    let needPts = 0;
    if (hasNeedCriteria) {
      needPts = budget < 20000 ? 50 : budget < 35000 ? 42 : budget < 50000 ? 32 : budget < 70000 ? 18 : 8;
    } else {
      needPts = budget < 30000 ? 35 : budget < 50000 ? 25 : 15;
    }
    if (budget > 0) signals.push(`Budget $${budget.toLocaleString()}`);
    breakdown.push({ label: 'Financial Need', points: needPts, max: 50 });

    // Academic minimum (20 pts)
    const minGpa = parseFloat((text.match(/gpa\s*[>≥]\s*([\d.]+)/)?.[1] ?? '0'));
    const acadPts = minGpa === 0 ? 20 : gpa >= minGpa ? 20 : gpa >= minGpa - 0.3 ? 12 : 0;
    if (gpa > 0) signals.push(`GPA ${gpa.toFixed(1)}`);
    breakdown.push({ label: 'Academic Min', points: acadPts, max: 20 });

    // Location / citizenship (20 pts)
    const locPts = location && text.includes(location) ? 20 : 10;
    if (location) signals.push(location);
    breakdown.push({ label: 'Citizenship', points: locPts, max: 20 });

    // Field fit (10 pts)
    const fieldPts = edu && text.includes(edu.split(' ')[0]) ? 10 : 5;
    breakdown.push({ label: 'Field', points: fieldPts, max: 10 });

  } else {
    // Interest / Inclusion tier
    // Interest keyword matches (50 pts)
    const hits = interests.filter(i => text.includes(i) || i.split(' ').some(w => w.length > 3 && text.includes(w)));
    const interestPts = Math.min(50, hits.length * 15 + (hits.length > 0 ? 5 : 0));
    if (interests.length > 0) signals.push(...interests.slice(0, 2));
    breakdown.push({ label: 'Interests', points: interestPts, max: 50 });

    // Background / identity (25 pts) — open-to-all gets 10 as baseline
    const identityKw = ['women', 'minority', 'hispanic', 'latina', 'latino', 'black', 'african', 'asian',
      'indigenous', 'native', 'lgbtq', 'first-generation', 'first generation', 'veteran', 'disability', 'underrepresented'];
    const profileBlob = `${career} ${interests.join(' ')}`.toLowerCase();
    const identityMatches = identityKw.filter(k => text.includes(k) && profileBlob.includes(k)).length;
    const bgPts = identityMatches > 0 ? Math.min(25, identityMatches * 13) : 10;
    breakdown.push({ label: 'Background', points: bgPts, max: 25 });

    // Career field fit (15 pts)
    const careerPts = career && career.split(' ').some(w => w.length > 3 && text.includes(w)) ? 15 : 6;
    if (career) signals.push(career.split(' ')[0]);
    breakdown.push({ label: 'Career', points: careerPts, max: 15 });

    // Location (10 pts)
    breakdown.push({ label: 'Location', points: location && text.includes(location) ? 10 : 5, max: 10 });
  }

  const total = breakdown.reduce((s, b) => s + b.points, 0);
  return { score: Math.min(100, Math.round(total)), breakdown, profileSignals: [...new Set(signals)].slice(0, 3) };
}

const TIER_CONFIG: Record<ScholarshipTier, {
  label: string; subtitle: string;
  ringColor: string; barClass: string;
  headerClass: string; iconClass: string; textClass: string; badgeClass: string;
}> = {
  Merit: {
    label: 'Merit-Based', subtitle: 'GPA & field of study',
    ringColor: '#3b82f6', barClass: 'bg-blue-500',
    headerClass: 'bg-blue-50 border-blue-100', iconClass: 'bg-blue-600', textClass: 'text-blue-700', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  Need: {
    label: 'Need-Based', subtitle: 'Financial profile',
    ringColor: '#f59e0b', barClass: 'bg-amber-500',
    headerClass: 'bg-amber-50 border-amber-100', iconClass: 'bg-amber-600', textClass: 'text-amber-700', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  Interest: {
    label: 'Interest & Inclusion', subtitle: 'Extracurriculars & background',
    ringColor: '#8b5cf6', barClass: 'bg-violet-500',
    headerClass: 'bg-violet-50 border-violet-100', iconClass: 'bg-violet-600', textClass: 'text-violet-700', badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
  },
};

const TIER_ICONS: Record<ScholarshipTier, React.FC<{ size?: number; className?: string }>> = {
  Merit: (p) => <BookOpen {...p} />,
  Need: (p) => <CircleDollarSign {...p} />,
  Interest: (p) => <Sparkles {...p} />,
};

// ─────────────────────────────────────────────────────────────────────────────
// Scholarship Match Wizard — progressive Q&A that refines match scores
// ─────────────────────────────────────────────────────────────────────────────
type WizardKey =
  | 'enrolled' | 'studyField' | 'gpaAbove35' | 'gpaAbove38'
  | 'incomeBelow30k' | 'hasFinancialNeed' | 'firstGen'
  | 'hasGreenProject' | 'isWoman' | 'underrepresented' | 'studyCountry';

type WizardAnswers = Record<WizardKey, boolean | string | null>;

const EMPTY_WIZARD: WizardAnswers = {
  enrolled: null, studyField: null, gpaAbove35: null, gpaAbove38: null,
  incomeBelow30k: null, hasFinancialNeed: null, firstGen: null,
  hasGreenProject: null, isWoman: null, underrepresented: null, studyCountry: null,
};

interface WizardQuestionDef {
  id: WizardKey;
  label: string;
  hint: string;
  type: 'yesno' | 'dropdown';
  options?: { value: string; label: string }[];
  showIf?: (a: WizardAnswers) => boolean;
  impact: string;
}

const WIZARD_QUESTIONS: WizardQuestionDef[] = [
  {
    id: 'enrolled',
    label: 'Are you currently enrolled in a degree programme?',
    hint: 'Full-time or part-time at any accredited university.',
    type: 'yesno',
    impact: 'Affects all scholarships',
  },
  {
    id: 'studyField',
    label: 'What is your primary field of study?',
    hint: 'Helps match field-specific awards.',
    type: 'dropdown',
    options: [
      { value: 'cs-ai',          label: 'Computer Science / AI / Software' },
      { value: 'healthcare',     label: 'Healthcare / Nursing / Medicine' },
      { value: 'stem-other',     label: 'Other STEM (Engineering, Physics, Maths)' },
      { value: 'sustainability', label: 'Environmental Science / Sustainability' },
      { value: 'business',       label: 'Business / Finance / Economics' },
      { value: 'social',         label: 'Social Sciences / Arts / Humanities' },
    ],
    showIf: (a) => a.enrolled === true,
    impact: 'Merit & interest-based scholarships',
  },
  {
    id: 'gpaAbove35',
    label: 'Is your current GPA 3.5 or above?',
    hint: 'On a standard 4.0 scale.',
    type: 'yesno',
    showIf: (a) => a.enrolled === true,
    impact: 'Merit scholarships',
  },
  {
    id: 'gpaAbove38',
    label: 'Is your GPA 3.8 or above?',
    hint: 'Required for top-tier merit awards like the Rhodes.',
    type: 'yesno',
    showIf: (a) => a.gpaAbove35 === true,
    impact: 'Rhodes Award · Future Innovators Grant',
  },
  {
    id: 'incomeBelow30k',
    label: 'Is your annual household income below $30,000 USD?',
    hint: 'Based on total household income, not personal earnings.',
    type: 'yesno',
    impact: 'Need-based scholarships',
  },
  {
    id: 'hasFinancialNeed',
    label: 'Do you have significant education-related financial hardship?',
    hint: 'E.g. student debt, no family financial support, or self-funding tuition.',
    type: 'yesno',
    showIf: (a) => a.incomeBelow30k !== null,
    impact: 'Equity & healthcare funds',
  },
  {
    id: 'firstGen',
    label: 'Are you a first-generation university student?',
    hint: "Neither parent holds a bachelor's degree.",
    type: 'yesno',
    showIf: (a) => a.enrolled !== null,
    impact: 'Inclusion & need-based awards',
  },
  {
    id: 'hasGreenProject',
    label: 'Have you worked on a sustainability, green tech, or climate project?',
    hint: 'Research, capstone, volunteer, or open-source work all count.',
    type: 'yesno',
    showIf: (a) => a.studyField !== null,
    impact: 'Green Earth Award · Climate Fellowship',
  },
  {
    id: 'isWoman',
    label: 'Do you identify as a woman or non-binary person?',
    hint: 'Certain inclusion grants specifically support women & non-binary students.',
    type: 'yesno',
    showIf: (a) => a.studyField !== null,
    impact: 'Women in STEM Excellence Grant',
  },
  {
    id: 'underrepresented',
    label: 'Do you identify as a member of an underrepresented community?',
    hint: 'E.g. racial minority, indigenous, LGBTQ+, disability, or similar.',
    type: 'yesno',
    showIf: (a) => a.firstGen !== null,
    impact: 'Equity & inclusion awards',
  },
  {
    id: 'studyCountry',
    label: 'Which country are you currently studying in?',
    hint: 'Some awards are region-specific.',
    type: 'dropdown',
    options: [
      { value: 'us',    label: 'United States' },
      { value: 'uk',    label: 'United Kingdom' },
      { value: 'au',    label: 'Australia' },
      { value: 'ca',    label: 'Canada' },
      { value: 'ng',    label: 'Nigeria' },
      { value: 'gh',    label: 'Ghana' },
      { value: 'ke',    label: 'Kenya' },
      { value: 'za',    label: 'South Africa' },
      { value: 'in',    label: 'India' },
      { value: 'other', label: 'Other / Not listed' },
    ],
    showIf: (a) => a.enrolled !== null,
    impact: 'Geographic & global scholarships',
  },
];

function computeWizardRefinedScore(opp: FundingOpportunity, answers: WizardAnswers): number {
  const text = `${opp.name} ${opp.description} ${(opp.eligibilityCriteria || []).join(' ')}`.toLowerCase();
  const answered = Object.values(answers).filter(v => v !== null).length;
  if (answered === 0) return 0;

  let score = 30; // baseline when at least 1 answer exists

  // Enrollment
  if (answers.enrolled === true)  score += 8;
  if (answers.enrolled === false) score -= 25;

  // Field of study
  const FIELD_KWS: Record<string, string[]> = {
    'cs-ai':          ['tech', 'software', 'ai', 'robotic', 'comput', 'innovat', 'data'],
    'healthcare':     ['health', 'nurs', 'medic', 'paramedic', 'clinical'],
    'stem-other':     ['stem', 'engineer', 'physic', 'math', 'science'],
    'sustainability': ['sustain', 'green', 'climate', 'renew', 'earth', 'environment'],
    'business':       ['business', 'finance', 'econom', 'entrepreneur'],
    'social':         ['social', 'arts', 'humanit', 'education'],
  };
  if (answers.studyField) {
    const kws = FIELD_KWS[answers.studyField as string] || [];
    const hit = kws.some(k => text.includes(k));
    if (hit) score += opp.category === 'Merit' ? 25 : (opp.category === 'Interest' || opp.category === 'Geographic') ? 20 : 8;
    else if (opp.category === 'Merit' || opp.category === 'Interest') score -= 12;
  }

  // GPA / merit
  if (opp.category === 'Merit') {
    if (answers.gpaAbove38 === true)       score += 32;
    else if (answers.gpaAbove35 === true)  score += 18;
    else if (answers.gpaAbove35 === false) score -= 22;
  } else {
    if (answers.gpaAbove35 === true) score += 5;
  }

  // Financial need
  if (opp.category === 'Need') {
    if (answers.incomeBelow30k === true)       score += 35;
    else if (answers.incomeBelow30k === false) score -= 28;
    if (answers.hasFinancialNeed === true)     score += 14;
  } else {
    if (answers.incomeBelow30k === true) score += 5;
  }

  // First-generation
  if (answers.firstGen === true) score += /first.gen|first generation/.test(text) ? 20 : 6;

  // Sustainability project
  const isGreen = /green|sustain|climate|renew|earth/.test(text);
  if (answers.hasGreenProject === true  && isGreen) score += 32;
  if (answers.hasGreenProject === false && isGreen) score -= 18;

  // Gender inclusion
  const needsWomen = /women|woman|female|non.binary|gender/.test(text);
  if (answers.isWoman === true  && needsWomen) score += 32;
  if (answers.isWoman === false && needsWomen) score -= 15;

  // Underrepresented
  if (answers.underrepresented === true && /minority|underrepresent|equity|inclus|diversity/.test(text)) score += 28;

  // Country
  const COUNTRY_KWS: Record<string, string[]> = {
    us: ['united states', 'usa', 'america'], uk: ['united kingdom', 'uk', 'britain'],
    au: ['australia'], ca: ['canada'],       ng: ['nigeria'],
    gh: ['ghana'],     ke: ['kenya'],        za: ['south africa'], in: ['india'],
  };
  if (answers.studyCountry && answers.studyCountry !== 'other') {
    const kws = COUNTRY_KWS[answers.studyCountry as string] || [];
    if (kws.some(k => text.includes(k))) score += 12;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

const ScholarshipWizardModal: React.FC<{ onClose: () => void; onViewScholarship?: (id: string) => void }> = ({ onClose, onViewScholarship }) => {
  const [answers, setAnswers] = useState<WizardAnswers>({ ...EMPTY_WIZARD });
  const feedEndRef = useRef<HTMLDivElement>(null);

  const answeredCount = Object.values(answers).filter(v => v !== null).length;
  const activeQuestions = WIZARD_QUESTIONS.filter(q => !q.showIf || q.showIf(answers));
  const rankedOpps = FUNDING_OPPORTUNITIES
    .filter(o => o.type !== 'Loan')
    .map(o => ({ ...o, wScore: computeWizardRefinedScore(o, answers) }))
    .sort((a, b) => b.wScore - a.wScore);

  const handleAnswer = (id: WizardKey, value: boolean | string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setTimeout(() => feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 200);
  };

  const topMatch = rankedOpps[0];
  const completionPct = Math.round((answeredCount / WIZARD_QUESTIONS.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10,12,16,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-4 shrink-0">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-slate-900 tracking-tight">Scholarship Match Wizard</h2>
            <p className="text-[11px] text-slate-400 font-medium">Answer questions to sharpen your scholarship rankings in real-time</p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {answeredCount} / {WIZARD_QUESTIONS.length} answered
            </span>
            <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.4 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)' }}
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Left — question feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Questions</p>

            {activeQuestions.map((q, idx) => {
              const answered = answers[q.id];
              const answeredSoFar = activeQuestions.filter(x => answers[x.id] !== null).length;
              const isActiveQ = answered === null && idx === answeredSoFar;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`rounded-2xl border p-4 transition-all ${
                    answered !== null
                      ? 'bg-slate-50 border-slate-100'
                      : isActiveQ
                      ? 'bg-white border-indigo-200 shadow-sm shadow-indigo-50'
                      : 'bg-white border-slate-100 opacity-40 pointer-events-none'
                  }`}
                >
                  {/* Question row */}
                  <div className="flex items-start gap-2.5 mb-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      answered !== null
                        ? 'border-indigo-500 bg-indigo-500'
                        : isActiveQ ? 'border-indigo-400' : 'border-slate-300'
                    }`}>
                      {answered !== null && <Check size={8} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-[12px] font-bold leading-snug ${answered !== null ? 'text-slate-400' : 'text-slate-800'}`}>
                        {q.label}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">{q.hint}</p>
                    </div>
                  </div>

                  {/* Answer area */}
                  {answered !== null ? (
                    /* Already answered */
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        {typeof answered === 'boolean'
                          ? (answered ? 'Yes' : 'No')
                          : (q.options?.find(o => o.value === answered)?.label ?? String(answered))}
                      </span>
                      <button
                        className="text-[9px] text-slate-400 hover:text-slate-600 font-bold underline transition-colors"
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: null }))}
                      >
                        Change
                      </button>
                    </div>
                  ) : q.type === 'yesno' ? (
                    /* Yes / No */
                    <div className="flex gap-2 pl-6">
                      {(['Yes', 'No'] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(q.id, opt === 'Yes')}
                          className={`flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                            opt === 'Yes'
                              ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400'
                              : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          {opt === 'Yes' ? '✓  Yes' : '✗  No'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /* Dropdown */
                    <div className="pl-6">
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-[12px] font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer"
                        defaultValue=""
                        onChange={e => { if (e.target.value) handleAnswer(q.id, e.target.value); }}
                      >
                        <option value="" disabled>Select an option…</option>
                        {q.options!.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Impact label */}
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2 pl-6">
                    Impacts: {q.impact}
                  </p>
                </motion.div>
              );
            })}

            <div ref={feedEndRef} />
          </div>

          {/* Right — live rankings */}
          <div className="w-64 shrink-0 overflow-y-auto p-5 bg-slate-50 border-l border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Rankings</p>

            {answeredCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center gap-3 px-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center">
                  <Sparkles size={16} className="text-slate-400" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-snug">
                  Answer questions to see your personalised rankings.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {rankedOpps.map((opp, idx) => (
                  <motion.div
                    key={opp.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-white rounded-2xl border border-slate-100 p-3 shadow-sm transition-all ${
                      onViewScholarship ? 'cursor-pointer hover:border-indigo-200 hover:shadow-md' : ''
                    }`}
                    onClick={() => { if (onViewScholarship) { onViewScholarship(opp.id); onClose(); } }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[8px] font-black text-slate-400 w-4">{idx + 1}</span>
                      {idx === 0 && (
                        <span className="text-[7px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                          Best
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-slate-800 leading-tight">{opp.name}</p>
                    <p className="text-[8px] text-slate-400 mt-0.5 mb-1.5">{opp.provider}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: `${opp.wScore}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: opp.wScore >= 70 ? '#4f46e5' : opp.wScore >= 45 ? '#f59e0b' : '#94a3b8' }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-slate-600 w-5 text-right shrink-0">{opp.wScore}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[8px] text-slate-400 font-medium">${opp.amount.toLocaleString()}</span>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                        opp.wScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
                        opp.wScore >= 45 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {opp.wScore >= 70 ? 'Strong fit' : opp.wScore >= 45 ? 'Possible' : 'Low fit'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div>
            {answeredCount > 0 && topMatch && (
              <p className="text-[11px] font-medium text-slate-600">
                Top match: <span className="font-black text-indigo-600">{topMatch.name}</span>
                <span className="text-slate-400 ml-1">({topMatch.wScore}% fit)</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnswers({ ...EMPTY_WIZARD })}
              className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors flex items-center gap-1"
            >
              <RotateCcw size={9} /> Reset
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white rounded-xl hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const ScholarshipAutoMatchWidget = ({
  profile,
  onViewAll,
  onViewScholarship,
}: {
  profile: UserProfile;
  onViewAll: () => void;
  onViewScholarship?: (id: string) => void;
}) => {
  const [tieredMatches, setTieredMatches] = useState<Record<ScholarshipTier, TieredMatch[]>>({ Merit: [], Need: [], Interest: [] });
  const [aiRefined, setAiRefined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openTiers, setOpenTiers] = useState<Set<ScholarshipTier>>(new Set(['Merit', 'Need', 'Interest']));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);

  const toggleTier = (t: ScholarshipTier) =>
    setOpenTiers(prev => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });

  useEffect(() => {
    // Pass 1 — instant local tier-aware scoring
    const buckets: Record<ScholarshipTier, TieredMatch[]> = { Merit: [], Need: [], Interest: [] };
    for (const opp of FUNDING_OPPORTUNITIES) {
      const tier = classifyTier(opp);
      const { score, breakdown, profileSignals } = computeTieredScore(opp, profile, tier);
      buckets[tier].push({ ...opp, localScore: score, matchScore: score, tier, breakdown, profileSignals });
    }
    for (const t of Object.keys(buckets) as ScholarshipTier[]) {
      buckets[t].sort((a, b) => b.localScore - a.localScore);
    }
    setTieredMatches(buckets);
    setLoading(false);

    // Pass 2 — AI-refined scores
    matchScholarships(profile)
      .then(aiMatches => {
        setTieredMatches(prev => {
          const next = { ...prev };
          for (const t of Object.keys(next) as ScholarshipTier[]) {
            next[t] = next[t].map(m => {
              const ai = aiMatches.find((a: FundingOpportunity) => a.id === m.id);
              return ai?.matchScore !== undefined
                ? { ...m, matchScore: ai.matchScore, matchReasoning: ai.matchReasoning ?? m.matchReasoning }
                : m;
            }).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
          }
          return next;
        });
        setAiRefined(true);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.targetCareerId, (profile.interests || []).join(','), profile.academicPerformance?.gpa, profile.budget]);

  const totalCount = Object.values(tieredMatches).reduce((s, arr) => s + arr.length, 0);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      {/* ── Widget header ── */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers size={12} className="text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scholarship Triage</span>
            {aiRefined && (
              <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> AI Refined
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-snug">
            Personalised across merit, need &amp; interests
          </p>
        </div>
        <button onClick={onViewAll} className="shrink-0 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-1 mt-1">
          View All <ChevronRight size={11} />
        </button>
      </div>

      {/* ── Three tier sections ── */}
      <div className="px-4 pb-5 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />)
        ) : (
          (['Merit', 'Need', 'Interest'] as ScholarshipTier[]).map(tier => {
            const cfg = TIER_CONFIG[tier];
            const TierIcon = TIER_ICONS[tier];
            const opps = tieredMatches[tier].slice(0, 2);
            const isOpen = openTiers.has(tier);
            const topSignals = opps[0]?.profileSignals ?? [];

            return (
              <div key={tier} className={`rounded-2xl border overflow-hidden ${cfg.headerClass}`}>
                {/* Tier header row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                  onClick={() => toggleTier(tier)}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconClass}`}>
                    <TierIcon size={13} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${cfg.textClass}`}>{cfg.label}</p>
                    <p className="text-[8px] text-slate-500 font-medium mt-0.5">{cfg.subtitle}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeClass}`}>
                    {opps.length} match{opps.length !== 1 ? 'es' : ''}
                  </span>
                  <ChevronDown size={13} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''} ${cfg.textClass}`} />
                </button>

                {/* Profile signals strip */}
                {isOpen && topSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                    {topSignals.map(s => (
                      <span key={s} className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${cfg.badgeClass}`}>{s}</span>
                    ))}
                  </div>
                )}

                {/* Scholarship cards */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2 border-t border-white/60">
                        {opps.length === 0 ? (
                          <p className="text-[9px] text-slate-400 font-bold text-center py-4 uppercase tracking-widest">
                            Complete your profile to unlock matches
                          </p>
                        ) : opps.map((opp, idx) => {
                          const score = opp.matchScore ?? opp.localScore;
                          const CIRC_R = 15;
                          const CIRC_C = 2 * Math.PI * CIRC_R;
                          const dash = CIRC_C - (score / 100) * CIRC_C;
                          const isExpanded = expandedId === opp.id;
                          const isSaved = savedIds.includes(opp.id);

                          return (
                            <motion.div
                              key={opp.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.06 }}
                              className={`bg-white rounded-xl border transition-all cursor-pointer ${isExpanded ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}
                              onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                            >
                              {/* Card main row */}
                              <div className="flex items-center gap-2.5 p-3">
                                {/* Fit score ring */}
                                <div className="relative shrink-0">
                                  <svg width={36} height={36} className="-rotate-90">
                                    <circle cx={18} cy={18} r={CIRC_R} fill="none" stroke="#f1f5f9" strokeWidth={3.5} />
                                    <motion.circle cx={18} cy={18} r={CIRC_R} fill="none"
                                      stroke={cfg.ringColor} strokeWidth={3.5} strokeLinecap="round"
                                      strokeDasharray={CIRC_C}
                                      initial={{ strokeDashoffset: CIRC_C }}
                                      animate={{ strokeDashoffset: dash }}
                                      transition={{ duration: 0.9, ease: 'easeOut', delay: idx * 0.1 }}
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-[10px] font-black leading-none ${cfg.textClass}`}>{score}</span>
                                  </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  {idx === 0 && (
                                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${cfg.badgeClass} inline-block mb-0.5`}>
                                      Best Match
                                    </span>
                                  )}
                                  <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{opp.name}</p>
                                  <p className="text-[8px] text-slate-400 font-medium truncate">{opp.provider}</p>
                                </div>

                                {/* Amount + save */}
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                  <span className="text-[12px] font-black text-slate-900">${opp.amount.toLocaleString()}</span>
                                  <button
                                    onClick={e => { e.stopPropagation(); setSavedIds(p => p.includes(opp.id) ? p.filter(i => i !== opp.id) : [...p, opp.id]); }}
                                    className={`transition-colors ${isSaved ? 'text-rose-500' : 'text-slate-200 hover:text-slate-400'}`}
                                  >
                                    <Heart size={11} fill={isSaved ? 'currentColor' : 'none'} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded detail */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    key="detail"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden border-t border-slate-100"
                                  >
                                    <div className="px-3 pb-3 pt-2.5 space-y-2.5">
                                      {/* Breakdown bars */}
                                      <div className="space-y-1.5">
                                        {opp.breakdown.map(b => (
                                          <div key={b.label} className="flex items-center gap-2">
                                            <span className="text-[7px] font-black text-slate-400 uppercase w-20 shrink-0">{b.label}</span>
                                            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                              <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(b.points / b.max) * 100}%` }}
                                                transition={{ duration: 0.5 }}
                                                className={`h-full rounded-full ${cfg.barClass}`}
                                              />
                                            </div>
                                            <span className="text-[7px] font-black text-slate-500 w-7 text-right">{b.points}/{b.max}</span>
                                          </div>
                                        ))}
                                      </div>

                                      {/* AI reasoning */}
                                      {opp.matchReasoning && (
                                        <p className="text-[9px] text-slate-500 italic leading-snug border-l-2 pl-2" style={{ borderColor: cfg.ringColor }}>
                                          "{opp.matchReasoning}"
                                        </p>
                                      )}

                                      {/* Deadline + Actions */}
                                      <div className="flex flex-col gap-2 pt-0.5">
                                        <span className="text-[8px] font-black text-slate-400 flex items-center gap-1">
                                          <Clock size={8} /> {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          {onViewScholarship && (
                                            <button
                                              onClick={e => { e.stopPropagation(); onViewScholarship(opp.id); }}
                                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[8px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                                            >
                                              View Hub
                                            </button>
                                          )}
                                          <a
                                            href={opp.website || `https://www.google.com/search?q=${encodeURIComponent(opp.name + ' apply')}`}
                                            target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-white rounded-lg hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: cfg.ringColor }}
                                          >
                                            Apply <ExternalLink size={8} />
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setWizardOpen(true)}
          className="text-[9px] font-black text-violet-600 hover:text-violet-800 uppercase tracking-widest transition-colors flex items-center gap-1"
        >
          <Sparkles size={9} /> Refine with Wizard
        </button>
        <button onClick={onViewAll} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-1">
          View Full Hub <ArrowUpRight size={10} />
        </button>
      </div>
      {/* Scholarship Match Wizard modal — fixed-positioned, safe inside any container */}
      <AnimatePresence>
        {wizardOpen && <ScholarshipWizardModal onClose={() => setWizardOpen(false)} onViewScholarship={onViewScholarship} />}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ScholarshipAlertBanner — shown when new matched scholarships are detected
// ─────────────────────────────────────────────────────────────────────────────

const CV_SEEN_KEY = 'cv_seen_scholarships_v1';

function computeScholarshipMatches(profile: UserProfile): FundingOpportunity[] {
  const userWords = [
    ...(profile.interests || []),
    profile.targetCareerId || '',
    profile.education || '',
    profile.targetCareer || '',
  ].flatMap(s => s.toLowerCase().split(/[\s,]+/)).filter(w => w.length > 3);

  return FUNDING_OPPORTUNITIES.filter(opp => {
    if (opp.type === 'Loan') return false; // Only scholarships / grants
    const text = `${opp.name} ${opp.description} ${opp.eligibilityCriteria.join(' ')}`.toLowerCase();
    return userWords.some(w => text.includes(w));
  });
}

const ScholarshipAlertBanner = ({
  newMatches,
  onDismiss,
  onViewAll,
}: {
  newMatches: FundingOpportunity[];
  onDismiss: () => void;
  onViewAll: () => void;
}) => {
  if (newMatches.length === 0) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="alert-banner"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="mb-6 rounded-[2rem] p-4 flex items-center gap-4 shadow-lg shadow-indigo-100 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
      >
        {/* Glow blob */}
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full opacity-20 pointer-events-none" style={{ background: '#818cf8', filter: 'blur(48px)' }} />
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Bell size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-white uppercase tracking-widest mb-0.5">
            {newMatches.length} new scholarship{newMatches.length !== 1 ? 's' : ''} match your profile
          </p>
          <p className="text-[10px] text-indigo-100 font-medium truncate">
            {newMatches.map(m => m.name).join(' · ')}
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="shrink-0 px-3 py-1.5 bg-white text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-colors"
        >
          View
        </button>
        <button onClick={onDismiss} className="shrink-0 text-white/60 hover:text-white transition-colors ml-1">
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const Dashboard = ({ profile, onSelectPath, onSelectByTitle, careers, isLoading, onInitInterview, onAiCareerSearch, isAiCareerLoading, aiCareerSearchMessage, onNavigate, dashboardIntel, isDashboardIntelLoading, onResetToGlobal, onNavigateToScholarship }: { profile: UserProfile, onSelectPath: (id: string) => void, onSelectByTitle: (title: string) => void, careers: CareerPath[], isLoading: boolean, onInitInterview: (role: string, company?: string) => void, onAiCareerSearch: (query: string) => Promise<void>, isAiCareerLoading: boolean, aiCareerSearchMessage: string, onNavigate: (view: 'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap' | 'jobs' | 'resume' | 'interview') => void, dashboardIntel: DashboardIntelligence | null, isDashboardIntelLoading: boolean, onResetToGlobal: () => Promise<void>, onNavigateToScholarship: (id: string) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const [skillGapCache, setSkillGapCache] = useState<Record<string, CareerSkillGap[]>>({});
  const [skillGapLoading, setSkillGapLoading] = useState<Record<string, boolean>>({});
  const [skillGapError, setSkillGapError] = useState<Record<string, boolean>>({});

  // ── Scholarship alert state (new-match notifications) ─────────────────────
  const [scholarshipAlerts, setScholarshipAlerts] = useState<FundingOpportunity[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);
  useEffect(() => {
    if (alertDismissed) return;
    const matched = computeScholarshipMatches(profile);
    const seen = new Set<string>(JSON.parse(localStorage.getItem(CV_SEEN_KEY) || '[]'));
    const fresh = matched.filter(o => !seen.has(o.id));
    if (fresh.length > 0) setScholarshipAlerts(fresh);
  // Re-run when relevant profile fields change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.targetCareerId, (profile.interests || []).join(','), profile.education, alertDismissed]);

  const dismissAlerts = () => {
    const seen = new Set<string>(JSON.parse(localStorage.getItem(CV_SEEN_KEY) || '[]'));
    scholarshipAlerts.forEach(o => seen.add(o.id));
    localStorage.setItem(CV_SEEN_KEY, JSON.stringify([...seen]));
    setAlertDismissed(true);
    setScholarshipAlerts([]);
  };

  // Default to user's home country if it matches a COUNTRY_FILTERS entry, else 'Global'
  const defaultCountry = (() => {
    if (!profile.country) return 'Global';
    const match = COUNTRY_FILTERS.find(c =>
      c.label.toLowerCase() === profile.country.toLowerCase() ||
      (profile.country.toLowerCase().includes('uk') && c.label === 'UK') ||
      (profile.country.toLowerCase().includes('united states') && c.label === 'USA') ||
      (profile.country.toLowerCase().includes('united kingdom') && c.label === 'UK')
    );
    return match?.label ?? 'Global';
  })();

  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountry);
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [countryEntries, setCountryEntries] = useState<CountryCareerEntry[]>([]);
  const [countryEntriesError, setCountryEntriesError] = useState(false);

  // Fetch country-specific careers from backend (cached)
  const fetchCountryEntries = async (country: string, forceRefresh = false) => {
    setIsCountryLoading(true);
    setCountryEntriesError(false);
    try {
      const result = await getCareersByCountry(country, {
        interests: profile.interests,
        targetCareerId: profile.targetCareerId,
        education: profile.education,
      }, forceRefresh);
      setCountryEntries(result);
    } catch {
      setCountryEntriesError(true);
    } finally {
      setIsCountryLoading(false);
      if (forceRefresh) setIsSyncing(false);
    }
  };

  // On mount — load for default country
  useEffect(() => { fetchCountryEntries(defaultCountry); }, []);

  const handleCountrySelect = async (chip: typeof COUNTRY_FILTERS[0]) => {
    if (chip.label === selectedCountry && countryEntries.length > 0) return;
    setSelectedCountry(chip.label);
    setExpandedPath(null);
    setSkillGapCache({});
    setSkillGapError({});
    fetchCountryEntries(chip.label === 'Global' ? 'Global' : chip.label);
  };

  const handleSync = () => {
    setIsSyncing(true);
    fetchCountryEntries(selectedCountry, true);
  };

  // ── Job Directory state ──
  const homeCountry = profile.country || defaultCountry;
  const targetCountry = profile.targetLocation || homeCountry;
  const [dirCountry, setDirCountry] = useState<string>(targetCountry);
  const dirManuallyToggled = useRef(false); // true once user clicks the toggle
  const [jobDirectory, setJobDirectory] = useState<JobDirectory | null>(null);
  const [isJobDirLoading, setIsJobDirLoading] = useState(false);
  const [jobDirError, setJobDirError] = useState(false);
  const [activeDirSector, setActiveDirSector] = useState<'Government' | 'Private'>('Government');
  const [expandedDirCategory, setExpandedDirCategory] = useState<string | null>(null);
  const [centerTab, setCenterTab] = useState<'careers' | 'scholarships'>('careers');

  const fetchJobDirectory = async (country: string, attempt = 1) => {
    setIsJobDirLoading(true);
    setJobDirError(false);
    try {
      const dirProfile = {
        interests: profile.interests,
        targetCareerId: profile.targetCareerId,
        targetCareer: profile.targetCareer,
        education: profile.education,
      };
      const result = await getJobDirectory(country, dirProfile);
      // If sectors came back empty and we haven't retried yet, wait 3s and retry once
      if ((!result.sectors || result.sectors.length === 0) && attempt === 1) {
        console.warn('[JobDirectory] Received empty sectors, retrying in 3s...');
        setTimeout(() => fetchJobDirectory(country, 2), 3000);
        return;
      }
      setJobDirectory(result);
    } catch {
      setJobDirError(true);
    } finally {
      setIsJobDirLoading(false);
    }
  };

  // On mount and when profile location changes (async load), fetch for correct country
  useEffect(() => {
    if (dirManuallyToggled.current) return;
    const resolved = profile.targetLocation || profile.country || defaultCountry;
    if (resolved) {
      setDirCountry(resolved);
      fetchJobDirectory(resolved);
    }
  }, [profile.targetLocation, profile.country]);

  const readinessBreakdown = dashboardIntel ? [
    { label: 'Skills', value: dashboardIntel.readiness.skills, color: '#6366f1' },
    { label: 'Education', value: dashboardIntel.readiness.education, color: '#10b981' },
    { label: 'Experience', value: dashboardIntel.readiness.experience, color: '#f59e0b' },
  ] : [
    { label: 'Skills', value: 0, color: '#6366f1' },
    { label: 'Education', value: 0, color: '#10b981' },
    { label: 'Experience', value: 0, color: '#f59e0b' },
  ];

  // Derive readiness from AI or fall back to milestone-based estimate
  const READINESS = Math.max(0, Math.min(100,
    dashboardIntel?.readiness.overall ??
    (readinessBreakdown.length > 0
      ? Math.round(readinessBreakdown.reduce((sum, metric) => sum + metric.value, 0) / readinessBreakdown.length)
      : 0)
  ));
  const RADIUS = 36;
  const CIRC = 2 * Math.PI * RADIUS;
  const dashOffset = CIRC - (READINESS / 100) * CIRC;

  const nextActions = dashboardIntel?.nextActions ?? [];
  const openActionCount = nextActions.length;
  const openActionValue = openActionCount > 0 ? `${openActionCount} pending` : 'Ready';

  // Contextual goal detection — personalises Next Actions
  const _goalStr       = (profile.targetCareerId || '').toLowerCase();
  const _isTechGoal    = /software|engineer|developer|data|devops|cloud|backend|frontend|fullstack/.test(_goalStr);
  const _isDesignGoal  = /design|ux\b|ui\b|product|visual|creative|motion|graphic/.test(_goalStr);
  const _isFinanceGoal = /finance|banking|invest|account|trading|economist/.test(_goalStr);

  // Profile setup milestones (gamified)
  const profileMilestones: Array<{ label: string; xp: number; done: boolean; nav: Parameters<typeof onNavigate>[0] | null }> = [
    { label: 'Set Target Career',       xp: 15, done: !!profile.targetCareerId,                    nav: null },
    { label: 'Set Target Location',     xp: 10, done: !!profile.targetLocation,                    nav: null },
    { label: 'Build Financial Profile', xp: 20, done: !!(profile.financialProfile?.monthlyBudget), nav: 'expenses' },
    { label: _isTechGoal ? 'Upload Technical Resume' : _isDesignGoal ? 'Upload Portfolio Resume' : _isFinanceGoal ? 'Upload Finance Resume' : 'Upload Your Resume', xp: 20, done: false, nav: 'resume' },
    { label: 'Run a Mock Interview',    xp: 25, done: false,                                        nav: 'interview' },
    { label: 'Explore Career Maps',     xp: 10, done: false,                                        nav: 'roadmap' },
  ];
  const milestonesDone = profileMilestones.filter(m => m.done).length;
  const milestonesProgress = Math.round((milestonesDone / profileMilestones.length) * 100);
  const firstPendingMilestoneIdx = profileMilestones.findIndex(m => !m.done);

  const sectorData = dashboardIntel?.sectors ?? [];
  const [activeSector, setActiveSector] = useState<string>('');
  const [showAllPaths, setShowAllPaths] = useState(false);
  const [showDashboardTour, setShowDashboardTour] = useState(true);
  const activeSectorObj = sectorData.length > 0
    ? sectorData.find(s => s.name === (activeSector || sectorData[0].name)) ?? sectorData[0]
    : { name: 'TBD', trend: 'Complete your profile', score: 0, status: 'Stable', color: '#818cf8', spark: [], news: [] };
  const hasSectorData = sectorData.length > 0;

  useEffect(() => {
    if (!activeSector && sectorData.length > 0) {
      setActiveSector(sectorData[0].name);
    }
  }, [activeSector, sectorData]);

  const salaryTrendData = dashboardIntel?.salaryTrajectory ?? [];

  type ExecSyncItem = {
    label: string;
    sublabel: string;
    kpi: string;
    icon: React.ElementType;
    view: 'institutions' | 'heatmap' | 'expenses' | 'jobs';
    iconBg: string;
    iconColor: string;
    bg: string;
    border: string;
    statusColor: string;
    checklist: string | null;
    urgent: boolean;
  };

  // Derive execSync sublabels from real profile data (no hardcoding)
  const targetLoc = profile.targetLocation || profile.country || 'Global';
  const docsCompleted = (profile.visaRequirements ?? []).filter(Boolean).length;
  const hasExpenses = (profile.financialProfile?.monthlyExpenses?.length ?? 0) > 0;
  const monthlyExpenseTotal = profile.financialProfile?.monthlyExpenses?.reduce((a, e) => a + e.amount, 0) ?? 0;
  const execSync: ExecSyncItem[] = [
    {
      label: 'Visa Hub',
      sublabel: profile.targetVisaType ? `${profile.targetVisaType}` : 'Review Required',
      kpi: !profile.targetVisaType ? '2 Pending' : docsCompleted > 0 ? `${docsCompleted} Docs` : 'Visa Set',
      icon: Globe,
      view: 'institutions',
      iconBg: 'bg-indigo-100',
      iconColor: profile.targetVisaType ? 'text-indigo-600' : 'text-amber-500',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      statusColor: profile.targetVisaType ? 'text-emerald-500' : 'text-amber-500',
      checklist: docsCompleted > 0 ? `${docsCompleted} docs` : null,
      urgent: !profile.targetVisaType || docsCompleted === 0,
    },
    {
      label: 'Markets',
      sublabel: `${targetLoc}: Live`,
      kpi: profile.targetLocation ? 'Live' : 'Offline',
      icon: BarChart3,
      view: 'heatmap',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      statusColor: 'text-emerald-500',
      checklist: null,
      urgent: !profile.targetLocation,
    },
    {
      label: 'Budget',
      sublabel: hasExpenses ? `$${monthlyExpenseTotal.toLocaleString()}/mo` : 'Not set',
      kpi: hasExpenses ? `$${monthlyExpenseTotal >= 1000 ? (monthlyExpenseTotal / 1000).toFixed(1) + 'K' : monthlyExpenseTotal}` : 'Not Set',
      icon: PiggyBank,
      view: 'expenses',
      iconBg: 'bg-amber-100',
      iconColor: hasExpenses ? 'text-amber-600' : 'text-amber-500',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      statusColor: hasExpenses ? 'text-emerald-500' : 'text-amber-500',
      checklist: null,
      urgent: !hasExpenses,
    },
    {
      label: 'Network',
      sublabel: careers.length > 0 ? `${careers.length} paths active` : 'Explore Listings',
      kpi: careers.length > 0 ? `${careers.length} Active` : 'Explore',
      icon: Briefcase,
      view: 'jobs',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      statusColor: 'text-purple-500',
      checklist: null,
      urgent: careers.length === 0,
    },
  ];

  // Fetch skill gap — used on expand and on manual retry
  const fetchSkillGap = async (pathId: string, pathTitle: string) => {
    setSkillGapLoading(prev => ({ ...prev, [pathId]: true }));
    setSkillGapError(prev => ({ ...prev, [pathId]: false }));
    try {
      const gap = await getCareerSkillGap(profile, pathTitle);
      setSkillGapCache(prev => ({ ...prev, [pathId]: gap }));
    } catch {
      setSkillGapError(prev => ({ ...prev, [pathId]: true }));
    } finally {
      setSkillGapLoading(prev => ({ ...prev, [pathId]: false }));
    }
  };

  const handleTogglePath = (pathId: string, pathTitle: string) => {
    const next = expandedPath === pathId ? null : pathId;
    setExpandedPath(next);
    if (next && !skillGapCache[pathId] && !skillGapLoading[pathId]) {
      fetchSkillGap(pathId, pathTitle);
    }
  };

  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');

  // getVisibility for CareerPath objects (used only for expanded skill gap panel)
  const PUBLIC_CATEGORIES = ['Technology & Digital', 'Healthcare & Life Sciences', 'Business, Finance & Management', 'Engineering, Science & Environment'];
  const getVisibility = (path: { category?: string; tags?: string[]; visibility?: string }): 'public' | 'private' => {
    if (path.visibility === 'public' || path.visibility === 'private') return path.visibility;
    if (PUBLIC_CATEGORIES.includes(path.category ?? '')) return 'public';
    if (Array.isArray(path.tags) && path.tags.some((t: string) => ['Remote Economy', 'AI Integration', 'Global Demand', 'Global Mobility'].includes(t))) return 'public';
    return 'private';
  };

  // filteredEntries — operates on countryEntries (have explicit visibility) + falls back to careers
  const filteredEntries = countryEntries.length > 0
    ? countryEntries.filter(e => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q);
        const matchVis = visibilityFilter === 'all' || e.visibility === visibilityFilter;
        return matchSearch && matchVis;
      })
    : [];

  // Legacy filteredPaths for fallback when countryEntries is empty (initial load)
  const filteredPaths = careers.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchSearch;
  });

  return (
    <div className="pb-12 animate-in fade-in duration-700">
      {/* ── Scholarship match notification banner ── */}
      <ScholarshipAlertBanner
        newMatches={scholarshipAlerts}
        onDismiss={dismissAlerts}
        onViewAll={() => {
          dismissAlerts();
          // Navigate to Finance & Budget and auto-open the FUNDING tab.
          // Passing the first matched scholarship ID sets scholarshipHighlightId in the parent,
          // which causes FinancialView to switch to the 'funding' tab via its useEffect.
          onNavigateToScholarship(scholarshipAlerts[0]?.id ?? '');
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

      {/* ── LEFT SIDEBAR ── */}
      <div className="xl:col-span-3 space-y-5">

        {/* Profile card — Hero Arc */}
        <div className="bg-gradient-to-b from-indigo-50/70 to-white p-6 rounded-[2.5rem] border border-indigo-100/50 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-300/10 rounded-full blur-3xl -mt-12 -mr-12 pointer-events-none" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-[0.2em]">Career Journey</span>
            {profile.country && <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{profile.country}</span>}
          </div>
          <div className="flex items-start gap-4 mb-6 relative z-10">
            {/* Circular progress */}
            <div className="relative shrink-0">
              <svg width={88} height={88} className="-rotate-90">
                <circle cx={44} cy={44} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={7} />
                <motion.circle
                  cx={44} cy={44} r={RADIUS} fill="none"
                  stroke="url(#readGrad)" strokeWidth={7} strokeLinecap="round"
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                />
                <defs>
                  <linearGradient id="readGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[17px] font-black text-slate-900 leading-none">{READINESS}%</span>
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Ready</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="text-sm font-black text-slate-900 leading-none mb-1 truncate">{profile.name}</h4>
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest truncate mb-4">{profile.targetCareerId || 'Career Explorer'}</p>
              <div className="space-y-2">
                {isDashboardIntelLoading ? (
                  [0,1,2].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-14 h-2 bg-slate-100 rounded-full animate-pulse" />
                      <div className="flex-1 h-1 bg-slate-100 rounded-full" />
                      <div className="w-7 h-2 bg-slate-100 rounded-full animate-pulse" />
                    </div>
                  ))
                ) : readinessBreakdown.map(m => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-[7px] font-black text-slate-400 uppercase w-14 shrink-0">{m.label}</span>
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1, delay: 0.6 }} className="h-full rounded-full" style={{ backgroundColor: m.color }} />
                    </div>
                    <span className="text-[7px] font-black w-7 text-right" style={{ color: m.color }}>{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Actions panel */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {nextActions.length === 0 && !isDashboardIntelLoading ? 'Setup Guide' : 'Next Actions'}
              </h5>
              {isDashboardIntelLoading ? (
                <div className="w-14 h-4 bg-slate-100 rounded-full animate-pulse" />
              ) : nextActions.length === 0 ? (
                <span className="text-[7px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">{milestonesProgress}% setup</span>
              ) : (
                <span className="text-[7px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{nextActions.length} pending</span>
              )}
            </div>
            <div className="space-y-2">
              {isDashboardIntelLoading ? (
                [0, 1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-7 h-7 rounded-xl bg-slate-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-200 animate-pulse" style={{ width: ['75%','60%','50%'][i] }} />
                      <div className="h-1.5 w-14 rounded-full bg-slate-100 animate-pulse" />
                    </div>
                    <div className="w-9 h-3.5 rounded-full bg-slate-200 animate-pulse" />
                  </div>
                ))
              ) : nextActions.length === 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${milestonesProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                      />
                    </div>
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest shrink-0">{milestonesDone}/{profileMilestones.length}</span>
                  </div>
                  {profileMilestones.map((m, i) => {
                    const isNext = i === firstPendingMilestoneIdx;
                    return (
                      <motion.button
                        key={i}
                        whileHover={!m.done ? { x: 2 } : {}}
                        onClick={() => m.nav && onNavigate(m.nav)}
                        disabled={!m.nav && !m.done}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                          m.done
                            ? 'bg-emerald-50/60 border-emerald-100'
                            : isNext
                              ? 'bg-amber-50 border-amber-300/60 cursor-pointer ring-1 ring-amber-200/50'
                              : 'bg-slate-50 border-slate-100 cursor-pointer hover:border-slate-200'
                        )}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                          m.done ? 'bg-emerald-500' : isNext ? 'bg-amber-500' : 'bg-slate-200'
                        )}>
                          {m.done
                            ? <Check size={11} className="text-white" />
                            : <span className={cn('text-[9px] font-black', isNext ? 'text-white' : 'text-slate-400')}>{i + 1}</span>}
                        </div>
                        <p className={cn(
                          'flex-1 text-[9px] font-black uppercase tracking-widest truncate',
                          m.done ? 'text-emerald-700' : isNext ? 'text-amber-900' : 'text-slate-400'
                        )}>
                          {m.label}
                        </p>
                        <span className={cn(
                          'text-[8px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-widest',
                          m.done
                            ? 'bg-emerald-100 text-emerald-600'
                            : isNext
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-400'
                        )}>
                          +{m.xp}%
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : nextActions.map((action, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 2 }}
                  onClick={action.type === 'practice' ? () => onInitInterview(profile.targetCareerId || careers[0]?.id) : undefined}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${action.urgent ? 'bg-amber-50/90 border-amber-200' : 'bg-slate-50 border-slate-100 hover:border-amber-100 hover:bg-amber-50/50'}`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${action.urgent ? 'bg-amber-500' : 'bg-white border border-slate-200'}`}>
                    {action.type === 'learn' && <BookOpen size={11} className={action.urgent ? 'text-white' : 'text-slate-400'} />}
                    {action.type === 'build' && <Pencil size={11} className={action.urgent ? 'text-white' : 'text-slate-400'} />}
                    {action.type === 'practice' && <Mic size={11} className={action.urgent ? 'text-white' : 'text-slate-400'} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] font-bold leading-snug truncate ${action.urgent ? 'text-amber-900' : 'text-slate-700'}`}>{action.title}</p>
                    <p className={`text-[7px] font-black uppercase tracking-widest mt-0.5 ${action.urgent ? 'text-amber-600' : 'text-emerald-600'}`}>{action.impact}</p>
                  </div>
                  <ChevronRight size={11} className="text-slate-300 shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Compact Burn Rate */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Burn Rate</h4>
            <span className="text-[8px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse inline-block" /> Live
            </span>
          </div>
          {(profile.financialProfile?.monthlyExpenses || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financial profile missing</p>
              <p className="text-[11px] font-bold text-slate-700">Set up your budget to unlock smarter career guidance.</p>
              <button
                onClick={() => onNavigate('expenses')}
                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all"
              >
                Build Financial Profile
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(profile.financialProfile?.monthlyExpenses || []).slice(0, 4).map((e, i) => {
                const total = (profile.financialProfile?.monthlyExpenses || []).reduce((acc, curr) => acc + curr.amount, 0);
                const pct = total > 0 ? Math.round((e.amount / total) * 100) : 0;
                const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-400', 'bg-emerald-500'];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight w-16 shrink-0 truncate">{e.category}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[i]} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] font-black text-slate-700 w-12 text-right">${e.amount}</span>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => onNavigate('expenses')} className="w-full mt-5 py-2.5 bg-slate-50 text-slate-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1.5">
            Full Budget Analysis <ArrowUpRight size={10} />
          </button>
        </div>

        {/* Execution Sync — quick-action tiles */}
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Execution Sync</h4>
          <div className="space-y-3">
            {execSync.some(item => item.urgent) && (
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-amber-500 mb-2">Needs attention</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {execSync.filter(item => item.urgent).map(item => {
                    const Icon = item.icon;
                    return (
                      <button key={item.label} onClick={() => onNavigate(item.view)}
                        className={`p-3.5 rounded-[1.5rem] border ${item.border} ${item.bg} flex flex-col items-start gap-1.5 transition-all group active:scale-95 hover:shadow-md text-left`}>
                        <div className="flex items-start justify-between w-full">
                          <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                            <Icon size={14} className={item.iconColor} />
                          </div>
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0 mt-1" />
                        </div>
                        <div className="w-full min-w-0">
                          <p className={`text-[13px] font-black leading-none mb-1 ${item.statusColor}`}>{item.kpi}</p>
                          <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">{item.label}</p>
                          <p className={`text-[7px] font-medium mt-0.5 leading-snug ${item.statusColor} opacity-80`}>{item.sublabel}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Live insights</p>
              <div className="grid grid-cols-2 gap-2.5">
                {execSync.filter(item => !item.urgent).map(item => {
                  const Icon = item.icon;
                  return (
                    <button key={item.label} onClick={() => onNavigate(item.view)}
                      className={`p-3.5 rounded-[1.5rem] border ${item.border} ${item.bg} flex flex-col items-start gap-1.5 transition-all group active:scale-95 hover:shadow-md text-left`}>
                      <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform mb-0.5`}>
                        <Icon size={14} className={item.iconColor} />
                      </div>
                      <div className="w-full min-w-0">
                        <p className={`text-[13px] font-black leading-none mb-1 ${item.statusColor}`}>{item.kpi}</p>
                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">{item.label}</p>
                        <p className={`text-[7px] font-medium mt-0.5 leading-snug ${item.statusColor} opacity-80`}>{item.sublabel}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── CENTER COLUMN ── */}
      <div className="xl:col-span-6 space-y-8">

        {/* Hero: AI Career Catalyst Hub */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000" />
          <div className="relative bg-slate-950 rounded-[2.5rem] p-9 text-white overflow-hidden shadow-2xl">
            {/* Animated network visualization */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 600 220" preserveAspectRatio="xMidYMid slice">
                {([[110,55,240,110],[240,110,390,70],[390,70,520,130],[240,110,290,175],[290,175,440,185],[110,55,170,175],[520,130,560,80]] as [number,number,number,number][]).map(([x1,y1,x2,y2], i) => (
                  <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#818cf8" strokeWidth="1.5"
                    initial={{ opacity: 0.15 }} animate={{ opacity: [0.15, 0.55, 0.15] }}
                    transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.25 }}
                  />
                ))}
                {([[110,55],[240,110],[390,70],[520,130],[290,175],[440,185],[170,175],[560,80]] as [number,number][]).map(([cx,cy], i) => (
                  <motion.circle key={i} cx={cx} cy={cy} fill="#6366f1"
                    initial={{ r: i === 1 ? 7 : 4, opacity: 0.4 }}
                    animate={{ r: i === 1 ? [6,9,6] : [3,5,3], opacity: [0.4,1,0.4] }}
                    transition={{ duration: 2 + i * 0.35, repeat: Infinity, delay: i * 0.18 }}
                  />
                ))}
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-2">AI Career Catalyst Hub</p>
                  <h2 className="text-3xl font-black tracking-tighter leading-tight italic">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">{profile.name.split(' ')[0]}</span>.
                  </h2>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 mt-1">
                  <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
                  </div>
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">4.2M nodes</span>
                </div>
              </div>

              <p className="text-slate-400 text-xs mb-6 leading-relaxed max-w-lg">
                Analyzed <span className="text-white font-bold">4.2M career nodes</span> for 2026. Your personalized trajectories are live below.
              </p>

              {/* Live mini-stats */}
              <div className="flex flex-wrap gap-2.5 mb-7">
                {[
                  { label: 'Market',       value: 'Hot 🔥',                       bg: 'bg-amber-500/15 border-amber-500/25',                                                                                         text: 'text-amber-300'   },
                  { label: 'Profile Fit',  value: `${READINESS}%`,                bg: 'bg-blue-500/15 border-blue-500/25',                                                                                           text: 'text-blue-300'    },
                  { label: 'Top Sector',   value: activeSectorObj.name || 'TBD',  bg: hasSectorData ? 'bg-emerald-500/15 border-emerald-500/25' : 'bg-blue-500/15 border-blue-500/25',     text: hasSectorData ? 'text-emerald-300' : 'text-blue-300' },
                  { label: 'Open Actions', value: openActionValue,                 bg: openActionCount > 0 ? 'bg-amber-500/15 border-amber-500/25' : 'bg-emerald-500/15 border-emerald-500/25', text: openActionCount > 0 ? 'text-amber-300' : 'text-emerald-300' },
                ].map(stat => (
                  <div key={stat.label} className={`flex flex-col px-3.5 py-2 rounded-xl border ${stat.bg}`}>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">{stat.label}</span>
                    <span className={`text-sm font-black ${stat.text} leading-tight mt-1`}>{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => onSelectPath(careers[0]?.id || '')}
                  disabled={isLoading || careers.length === 0}
                  className="bg-indigo-600 text-white px-7 py-2.5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-3 text-[10px] shadow-xl shadow-indigo-500/20 disabled:opacity-50 group/btn"
                >
                  {isLoading && <Loader2 size={12} className="animate-spin" />}
                  {isLoading ? 'Syncing...' : 'Optimize Future'}
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => onNavigate('roadmap')}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-100 bg-white/10 border border-white/20 rounded-2xl px-5 py-2.5 hover:bg-white/20 transition-all"
                >
                  Change goal
                </button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px]" />
          </div>
        </div>

        {/* ── Center tab switcher ── */}
        <div className="flex items-center gap-1 p-1 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          {([
            { id: 'careers',      label: 'Careers',      emoji: '🧭' },
            { id: 'scholarships', label: 'Scholarships', emoji: '🎓' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setCenterTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                centerTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="text-base leading-none">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {centerTab === 'scholarships' ? (
          <ScholarshipAutoMatchWidget
            profile={profile}
            onViewAll={() => onNavigate('expenses')}
            onViewScholarship={onNavigateToScholarship}
          />
        ) : (
          <div className="space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 px-1">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Career Directories</h3>
              <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">
                {dirCountry} · Government &amp; Private Sector · AI-Generated
              </p>
            </div>
            <div className="flex items-center gap-2">
              {homeCountry !== targetCountry && (
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  {[{ label: homeCountry, value: homeCountry }, { label: targetCountry, value: targetCountry }].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        dirManuallyToggled.current = true;
                        setDirCountry(opt.value);
                        setJobDirectory(null);
                        setActiveDirSector('Government');
                        fetchJobDirectory(opt.value);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        dirCountry === opt.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {opt.value === homeCountry ? '🏠' : '🎯'} {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => fetchJobDirectory(dirCountry)}
                disabled={isJobDirLoading}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 border border-slate-200 hover:border-emerald-200"
              >
                <RotateCcw size={10} className={isJobDirLoading ? 'animate-spin' : ''} />
                {isJobDirLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Sector tab switcher */}
          <div className="flex gap-2">
            {(['Government', 'Private'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setActiveDirSector(s); setExpandedDirCategory(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  activeDirSector === s
                    ? s === 'Government'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-200'
                      : 'bg-slate-900 text-white border-slate-950 shadow-md shadow-slate-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <span className="text-base leading-none">{s === 'Government' ? '🏛️' : '🏢'}</span>
                {s} Sector
              </button>
            ))}
          </div>

          {/* Directory content */}
          {isJobDirLoading ? (
            <div className="space-y-2">
              {[
                { w1: '42%', w2: '65%' },
                { w1: '58%', w2: '48%' },
                { w1: '35%', w2: '72%' },
                { w1: '63%', w2: '52%' },
                { w1: '47%', w2: '80%' },
              ].map((ws, i) => (
                <div key={i} className="flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="h-2.5 rounded-full bg-slate-200 animate-pulse" style={{ width: ws.w1 }} />
                    <div className="h-1.5 rounded-full bg-slate-100 animate-pulse" style={{ width: ws.w2 }} />
                  </div>
                  <div className="h-5 w-10 rounded-full bg-slate-100 animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : jobDirError ? (
            <div className="py-12 bg-rose-50 rounded-3xl border border-rose-100 flex flex-col items-center gap-3">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Failed to load directory</p>
              <button
                onClick={() => fetchJobDirectory(dirCountry)}
                className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 transition-all"
              >
                ↻ Retry
              </button>
            </div>
          ) : !jobDirectory || jobDirectory.sectors.length === 0 ? (
            <div className="py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center gap-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI is generating your directory…</p>
              <p className="text-[9px] text-slate-400">This may take a moment on first load</p>
              <button
                onClick={() => fetchJobDirectory(dirCountry)}
                className="text-[9px] font-black uppercase tracking-widest px-4 py-2 bg-white text-indigo-500 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all"
              >
                ↻ Retry Now
              </button>
            </div>
          ) : (() => {
            // ── Interest-matching engine ──────────────────────────────────────
            const _ints: string[] = Array.isArray(profile.interests)
              ? (profile.interests as string[]).map(i => i.toLowerCase().trim()).filter(i => i.length > 2)
              : typeof profile.interests === 'string'
                ? (profile.interests as string).split(/[,;\s]+/).map(i => i.toLowerCase().trim()).filter(i => i.length > 2)
                : [];
            const _getMatches = (catName: string, jobs: string[]): string[] => {
              if (_ints.length === 0) return [];
              const text = `${catName} ${jobs.join(' ')}`.toLowerCase();
              return _ints.filter(kw => text.includes(kw));
            };
            const _allCats = jobDirectory.sectors.find(s => s.sector === activeDirSector)?.categories ?? [];
            const _totalMatches = _allCats.filter(c => _getMatches(c.category, c.jobs).length > 0).length;
            // Sort matched categories to top
            const _sorted = [..._allCats].sort((a, b) =>
              _getMatches(b.category, b.jobs).length - _getMatches(a.category, a.jobs).length
            );
            return (
              <div className="space-y-2.5">
                {/* ── Personalized for You banner ── */}
                {_totalMatches > 0 && _ints.length > 0 && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200/70 rounded-2xl">
                    <span className="text-xl shrink-0">✦</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1">Personalized for You</p>
                      <p className="text-[8px] text-amber-600 font-medium">{_totalMatches} {_totalMatches === 1 ? 'category' : 'categories'} match your interests · Sorted to top</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[130px]">
                      {_ints.slice(0, 3).map(kw => (
                        <span key={kw} className="text-[7px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full capitalize">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {_sorted.map(cat => {
                  const isOpen = expandedDirCategory === cat.category;
                  const _cl = cat.category.toLowerCase();
                  const catEmoji = _cl.includes('civil') ? '📋' : _cl.includes('defen') || _cl.includes('secur') ? '🛡️' : _cl.includes('financ') || _cl.includes('bank') ? '🏦' : _cl.includes('health') || _cl.includes('medic') ? '⚕️' : _cl.includes('nurs') ? '🩺' : _cl.includes('educ') || _cl.includes('research') ? '🎓' : _cl.includes('judic') || _cl.includes('legal') ? '⚖️' : _cl.includes('infra') || _cl.includes('environ') ? '🏗️' : _cl.includes('tech') ? '💻' : _cl.includes('engin') ? '⚙️' : _cl.includes('media') || _cl.includes('comm') ? '📡' : _cl.includes('corp') || _cl.includes('manage') ? '📊' : _cl.includes('arts') || _cl.includes('creat') ? '🎨' : '📁';
                  const _matches = _getMatches(cat.category, cat.jobs);
                  const _isMatch = _matches.length > 0;
                  return (
                    <div key={cat.category} className={`rounded-[1.5rem] overflow-hidden transition-all group ${
                      _isMatch
                        ? 'bg-gradient-to-br from-amber-50/70 to-white border border-amber-200/60 shadow-sm hover:shadow-md hover:shadow-amber-100/70 ring-1 ring-amber-100/40'
                        : activeDirSector === 'Government'
                          ? 'bg-white border border-indigo-100/70 shadow-sm hover:shadow-md hover:shadow-indigo-100/60'
                          : 'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:shadow-slate-200/60'
                    }`}>
                      <button
                        className="w-full text-left"
                        onClick={() => setExpandedDirCategory(isOpen ? null : cat.category)}
                      >
                        <div className="flex items-center gap-4 px-5 py-4">
                          {/* Category icon tile */}
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-lg ${
                            _isMatch ? 'bg-amber-100' : activeDirSector === 'Government' ? 'bg-indigo-50' : 'bg-slate-100'
                          }`}>
                            {catEmoji}
                          </div>
                          {/* Name + badges + preview chips */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider leading-none">{cat.category}</span>
                              <span className={`text-[7px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                activeDirSector === 'Government'
                                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                  : 'bg-slate-100 text-slate-500'
                              }`}>{cat.jobs.length} roles</span>
                              {_isMatch && (
                                <span className="text-[7px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-0.5 shrink-0">
                                  ✦ Your Interest
                                </span>
                              )}
                            </div>
                            {/* Role preview chips — amber-tinted when they match an interest */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {cat.jobs.slice(0, 3).map(job => {
                                const isJobMatch = _ints.some(kw => kw.length > 2 && job.toLowerCase().includes(kw));
                                return (
                                  <span key={job} className={`text-[8px] border px-2 py-0.5 rounded-lg font-medium leading-none ${
                                    isJobMatch
                                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                                      : 'text-slate-400 bg-slate-50 border-slate-100'
                                  }`}>{job}</span>
                                );
                              })}
                              {cat.jobs.length > 3 && <span className="text-[8px] text-slate-400 font-bold">+{cat.jobs.length - 3}</span>}
                            </div>
                          </div>
                          {/* Chevron */}
                          <ChevronDown size={14} className={`shrink-0 transition-all duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-300 group-hover:text-slate-500'}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className={`px-5 pb-5 pt-3 border-t ${_isMatch ? 'border-amber-100' : activeDirSector === 'Government' ? 'border-indigo-50' : 'border-slate-50'}`}>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.jobs.map(job => {
                              const isJobMatch = _ints.some(kw => kw.length > 2 && job.toLowerCase().includes(kw));
                              return (
                                <button
                                  key={job}
                                  onClick={() => onSelectByTitle(job)}
                                  className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wide border transition-all cursor-pointer ${
                                    isJobMatch
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500'
                                      : activeDirSector === 'Government'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                                  }`}
                                >
                                  {job}{isJobMatch ? ' ✦' : ' →'}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        )}

      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <div className="xl:col-span-3 space-y-5">

        {/* Deadline Countdown Tracker — top of right for immediate visibility */}
        <DeadlineCountdownWidget
          onViewAll={() => onNavigate('expenses')}
        />

        {/* Sector Health Index with sparklines */}
        <div className="bg-indigo-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">Sector Health Index</h4>
                <p className="text-[7px] text-white/30">Click to filter news feed ↓</p>
              </div>
              <div className="group relative cursor-default">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-black text-indigo-300 hover:bg-white/20 transition-all">?</div>
                <div className="absolute right-0 top-6 hidden group-hover:block bg-slate-900 text-[8px] text-slate-300 p-3 rounded-xl w-44 z-20 leading-relaxed border border-white/10 shadow-2xl">
                  Calculated daily from live job openings, salary growth, and hiring velocity across 80+ sources.
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {isDashboardIntelLoading ? (
                [0,1,2,3].map(i => (
                  <div key={i} className="p-3 rounded-2xl border border-white/10 bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="h-2.5 rounded-full bg-white/20 animate-pulse" style={{ width: ['55%','42%','62%','48%'][i] }} />
                          <div className="h-3.5 w-9 rounded-md bg-white/10 animate-pulse" />
                        </div>
                        <div className="h-1.5 w-24 rounded-full bg-white/10 animate-pulse" />
                      </div>
                      <div className="w-20 h-9 shrink-0 flex items-end gap-0.5 px-1">
                        {[40,55,48,62,58,70,65].map((h, j) => (
                          <div key={j} className="flex-1 rounded-sm bg-white/20 animate-pulse" style={{ height: `${h}%`, animationDelay: `${j * 80}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : !hasSectorData ? (
                <div className="space-y-2">
                  {SECTOR_PLACEHOLDERS.map(sector => (
                    <div key={sector.name} className="p-3 rounded-2xl border border-white/10 bg-white/[0.04] opacity-60">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-tight truncate text-white/70">{sector.name}</span>
                            <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0 ${sector.status === 'Hot' ? 'bg-amber-500/30 text-amber-300' : sector.status === 'Rising' ? 'bg-emerald-500/30 text-emerald-300' : sector.status === 'Stable' ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-500/30 text-blue-300'}`}>{sector.status}</span>
                          </div>
                          <span className="text-[8px] font-black" style={{ color: sector.color }}>{sector.trend}</span>
                        </div>
                        <div className="w-20 h-9 shrink-0">
                          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <LineChart data={sector.spark}>
                              <Line type="monotone" dataKey="v" stroke={sector.color} strokeWidth={1.5} dot={false} activeDot={false} strokeOpacity={0.5} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-[8px] text-white/30 text-center font-black uppercase tracking-widest pt-1">Set your career to unlock live sectors</p>
                </div>
              ) : sectorData.map(sector => (
                <div
                  key={sector.name}
                  onClick={() => setActiveSector(sector.name)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all border ${(activeSector || sectorData[0]?.name) === sector.name ? 'bg-white/15 border-white/20' : 'border-transparent hover:bg-white/[0.07] hover:border-white/10'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-tight truncate">{sector.name}</span>
                        <span className={`text-[6px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest shrink-0 ${sector.status === 'Hot' ? 'bg-amber-500/30 text-amber-300' : sector.status === 'Rising' ? 'bg-emerald-500/30 text-emerald-300' : sector.status === 'Stable' ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-500/30 text-blue-300'}`}>{sector.status}</span>
                      </div>
                      <span className="text-[8px] font-black" style={{ color: sector.color }}>{sector.trend}</span>
                    </div>
                    {/* Sparkline */}
                    <div className="w-20 h-9 shrink-0">
                      {sector.spark && sector.spark.length >= 2 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                          <LineChart data={sector.spark}>
                            <Line type="monotone" dataKey="v" stroke={sector.color} strokeWidth={1.5} dot={false} activeDot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-full h-0.5 rounded-full opacity-30" style={{ backgroundColor: sector.color }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl -mb-14 -mr-14" />
        </div>

        {/* Talent Intelligence — filtered by active sector */}
        <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Talent Intelligence</h4>
              <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{activeSectorObj?.name ?? '...'} · Live</p>
            </div>
            <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={activeSectorObj?.name ?? 'loading'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }} className="space-y-2.5">
              {isDashboardIntelLoading ? (
                [0,1].map(i => <div key={i} className="h-14 bg-slate-50 rounded-2xl animate-pulse" />)
              ) : (!activeSectorObj?.news || activeSectorObj.news.length === 0) ? (
                <div className="text-[10px] text-slate-400 text-center py-6">
                  <p className="font-black uppercase tracking-widest mb-2">Talent data unavailable</p>
                  <p className="text-[9px]">Select a sector or complete your profile to surface market intelligence.</p>
                </div>
              ) : (
                <>
                  {activeSectorObj.news.map((headline, i) => (
                    <div key={i} className="flex gap-2.5 items-start p-3 rounded-2xl bg-slate-50/80 border border-slate-50 hover:bg-indigo-50/60 hover:border-indigo-50 transition-all">
                      <div className="w-6 h-6 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Zap size={9} className="text-indigo-600" />
                      </div>
                      <p className="text-[9px] font-bold text-slate-700 leading-snug">{headline}</p>
                    </div>
                  ))}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
    </div>
  );
};

const RoadmapView = ({ profile, pathId, careers, onNavigate, onInitInterview }: { profile: UserProfile, pathId?: string, careers: CareerPath[], onNavigate: (view: 'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap', context?: { search?: string; roadmap?: InstitutionRoadmapContext | null }) => void, onInitInterview: (role: string, company?: string) => void }) => {
  const path = careers.find(p => p.id === pathId) || careers[0];

  const [skillGap, setSkillGap] = useState<CareerSkillGap[]>([]);
  const [isSkillGapLoading, setIsSkillGapLoading] = useState(false);
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set(profile.completedMilestones || [])
  );
  const [activeTab, setActiveTab] = useState<'milestones' | 'skills' | 'requirements' | 'artifacts' | 'actions'>('milestones');
  const [liveMilestones, setLiveMilestones] = useState<CareerMilestone[]>([]);
  const [isMilestonesLoading, setIsMilestonesLoading] = useState(false);
  const [careerRequirements, setCareerRequirements] = useState<CareerRequirements | null>(null);
  const [isRequirementsLoading, setIsRequirementsLoading] = useState(false);
  const [checkedArtifacts, setCheckedArtifacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!path) return;
    setIsSkillGapLoading(true);
    getCareerSkillGap(profile, path.title)
      .then(setSkillGap)
      .catch(() => setSkillGap([]))
      .finally(() => setIsSkillGapLoading(false));
  }, [path?.id]);

  // Fetch milestones from backend (cached) when path has none
  useEffect(() => {
    if (!path) return;
    const hasMilestones = Array.isArray(path.milestones) && path.milestones.length > 0;
    if (hasMilestones) {
      setLiveMilestones(path.milestones as CareerMilestone[]);
      return;
    }
    setIsMilestonesLoading(true);
    setLiveMilestones([]);
    getCareerMilestones(
      path.title,
      Number(profile.age) || 22,
      profile.education || '',
      profile.targetLocation || profile.country || 'Global'
    )
      .then(setLiveMilestones)
      .catch(() => setLiveMilestones([]))
      .finally(() => setIsMilestonesLoading(false));
  }, [path?.id]);

  // Fetch career requirements when requirements/artifacts tab is active or on path change
  useEffect(() => {
    if (!path) return;
    setIsRequirementsLoading(true);
    setCareerRequirements(null);
    getCareerRequirements(
      path.title,
      profile.targetLocation || profile.country || 'Global'
    )
      .then(setCareerRequirements)
      .catch(() => setCareerRequirements(null))
      .finally(() => setIsRequirementsLoading(false));
  }, [path?.id]);

  if (!path) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
        <Loader2 size={32} className="text-indigo-400 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Loading career roadmap…</p>
      </div>
    );
  }

  const toggleMilestone = (key: string) => {
    setCompletedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const totalMilestones = liveMilestones.length;
  const completedCount = liveMilestones.filter((_, i) => completedMilestones.has(`${path.id}-${i}`)).length;
  const progressPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  const GROWTH_COLOR = path.growth === 'high' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    path.growth === 'medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-blue-600 bg-blue-50 border-blue-200';

  const ownedSkills = skillGap.filter(s => s.owned);
  const gapSkills = skillGap.filter(s => !s.owned);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SectionTitle
        title="Predictive Roadmap"
        subtitle={`Visual GPS for ${path.title} • Age ${profile.age}`}
      />

      {/* Header card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-white blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${GROWTH_COLOR}`}>
                {path.growth} growth
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white">
                {path.workType}
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-white/10 border border-white/20 text-white">
                {path.category}
              </span>
            </div>
            <h2 className="text-2xl font-black leading-tight mb-1">{path.title}</h2>
            <p className="text-[11px] text-indigo-200 leading-relaxed max-w-xl">{path.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(Array.isArray(path.tags) ? path.tags : (typeof path.tags === 'string' ? (() => { try { return JSON.parse(path.tags as string); } catch { return []; } })() : [])).slice(0, 5).map((tag: string) => (
                <span key={tag} className="text-[8px] font-bold px-2 py-0.5 bg-white/10 border border-white/15 rounded-full text-white/80">{tag}</span>
              ))}
            </div>
          </div>
          {/* Progress ring */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
              <svg width={80} height={80} className="-rotate-90">
                <circle cx={40} cy={40} r={32} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
                <circle
                  cx={40} cy={40} r={32} fill="none"
                  stroke="white" strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - progressPct / 100)}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-white leading-none">{progressPct}%</span>
                <span className="text-[7px] text-white/60 font-bold uppercase">done</span>
              </div>
            </div>
            <p className="text-[8px] text-white/60 font-bold uppercase tracking-widest text-center">{completedCount}/{totalMilestones} steps</p>
          </div>
        </div>
        {/* Quick actions */}
        <div className="relative z-10 flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/10">
          <button
            onClick={() => onInitInterview(path.title)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all"
          >
            <Mic size={10} /> Mock Interview
          </button>
          <button
            onClick={() => onNavigate('institutions')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
          >
            <School size={10} /> Find Programs
          </button>
          <button
            onClick={() => onNavigate('materials', { search: path.title })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
          >
            <BookOpen size={10} /> Study Resources
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
        {([
          { key: 'milestones', label: '🗺️ Milestones' },
          { key: 'skills', label: '🎯 Skills' },
          { key: 'requirements', label: '📋 Requirements' },
          { key: 'artifacts', label: '🗂️ Artifacts' },
          { key: 'actions', label: '⚡ Actions' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          {isMilestonesLoading ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-10 flex flex-col items-center gap-3 text-center">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Generating milestones…</p>
              <p className="text-[9px] text-slate-300 uppercase tracking-widest">Building your personalised roadmap</p>
            </div>
          ) : liveMilestones.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-10 flex flex-col items-center gap-3 text-center">
              <Search size={20} className="text-slate-300" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No milestones available</p>
            </div>
          ) : (
            liveMilestones.map((milestone, idx) => {
              const key = `${path.id}-${idx}`;
              const isDone = completedMilestones.has(key);
              const isLast = idx === (path.milestones?.length ?? 1) - 1;
              return (
                <div key={key} className="relative flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-transparent" />
                  )}
                  {/* Step dot */}
                  <button
                    onClick={() => toggleMilestone(key)}
                    className={`shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 transition-all ${
                      isDone
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'bg-white border-slate-200 text-slate-300 hover:border-indigo-300 hover:text-indigo-400'
                    }`}
                    title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                    {isDone ? <CheckCircle size={16} /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                  </button>
                  {/* Card */}
                  <div className={`flex-1 bg-white rounded-[1.5rem] border p-5 shadow-sm transition-all ${
                    isDone ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-100'
                  }`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{milestone.ageRange}</span>
                        <h3 className={`text-sm font-black mt-0.5 ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {milestone.title}
                        </h3>
                      </div>
                      {isDone && (
                        <span className="shrink-0 text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-600 text-white rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{milestone.description}</p>
                    {milestone.requirements?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {milestone.requirements.map((req, rIdx) => (
                          <span key={rIdx} className="text-[8px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                            {req}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Skills */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Owned skills */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle size={12} className="text-emerald-500" /> You already have ({ownedSkills.length})
            </h4>
            {isSkillGapLoading ? (
              [0,1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse mb-2" />)
            ) : ownedSkills.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-6">No matched skills yet</p>
            ) : (
              <div className="space-y-2">
                {ownedSkills.map(s => (
                  <div key={s.skill} className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-800">{s.skill}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${s.demand}%` }} />
                      </div>
                      <span className="text-[8px] font-black text-emerald-600">{s.demand}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Gap skills */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target size={12} className="text-rose-500" /> Skills to develop ({gapSkills.length})
            </h4>
            {isSkillGapLoading ? (
              [0,1,2,3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-xl animate-pulse mb-2" />)
            ) : gapSkills.length === 0 && !isSkillGapLoading ? (
              <p className="text-[11px] text-slate-400 text-center py-6">Loading skill analysis…</p>
            ) : (
              <div className="space-y-2">
                {gapSkills.map(s => (
                  <div key={s.skill} className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="text-[10px] font-bold text-rose-800">{s.skill}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-rose-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${s.demand}%` }} />
                      </div>
                      <span className="text-[8px] font-black text-rose-600">{s.demand}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Actions */}
      {activeTab === 'actions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: Mic,
              title: 'Mock Interview',
              description: `Practice ${path.title} interview questions with AI feedback`,
              color: 'indigo',
              action: () => onInitInterview(path.title),
            },
            {
              icon: School,
              title: 'Find Programs',
              description: `Browse universities and courses for ${path.title}`,
              color: 'violet',
              action: () => onNavigate('institutions'),
            },
            {
              icon: BookOpen,
              title: 'Study Materials',
              description: 'Access curated courses, videos and articles',
              color: 'blue',
              action: () => onNavigate('materials'),
            },
            {
              icon: Globe,
              title: 'Career Hubs',
              description: 'Explore global cities hiring for this role',
              color: 'emerald',
              action: () => onNavigate('heatmap'),
            },
            {
              icon: DollarSign,
              title: 'Financial Planner',
              description: 'Budget your education and living costs',
              color: 'amber',
              action: () => onNavigate('expenses'),
            },
            {
              icon: Users,
              title: 'Parental Guide',
              description: 'Share this roadmap with your parents',
              color: 'rose',
              action: () => onNavigate('parent'),
            },
          ].map(item => {
            const Icon = item.icon;
            const colorMap: Record<string, string> = {
              indigo: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300 text-indigo-600',
              violet: 'bg-violet-50 border-violet-100 hover:border-violet-300 text-violet-600',
              blue: 'bg-blue-50 border-blue-100 hover:border-blue-300 text-blue-600',
              emerald: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 text-emerald-600',
              amber: 'bg-amber-50 border-amber-100 hover:border-amber-300 text-amber-600',
              rose: 'bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-600',
            };
            return (
              <button
                key={item.title}
                onClick={item.action}
                className={`text-left p-5 rounded-[1.5rem] border transition-all hover:shadow-md group ${colorMap[item.color]}`}
              >
                <Icon size={20} className="mb-3 transition-transform group-hover:scale-110" />
                <p className="text-[11px] font-black text-slate-900 mb-1">{item.title}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">{item.description}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Requirements */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          {isRequirementsLoading ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-10 flex flex-col items-center gap-3 text-center">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analysing requirements…</p>
              <p className="text-[9px] text-slate-300 uppercase tracking-widest">Building your competition blueprint</p>
            </div>
          ) : !careerRequirements ? (
            <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-10 flex flex-col items-center gap-3">
              <Search size={20} className="text-slate-300" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No requirements data</p>
            </div>
          ) : (
            <>
              {/* Overview */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[2rem] border border-indigo-100 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📌</span>
                  <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Career Overview</h3>
                  <span className={`ml-auto text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    careerRequirements.sector === 'government' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    careerRequirements.sector === 'private' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    'bg-violet-100 text-violet-700 border-violet-200'
                  }`}>{careerRequirements.sector} sector</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{careerRequirements.overview}</p>
              </div>

              {/* Eligibility */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>✅</span> Eligibility Criteria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {careerRequirements.eligibility.map((crit, idx) => {
                    const typeColor: Record<string, string> = {
                      education: 'bg-blue-50 border-blue-200 text-blue-700',
                      age: 'bg-amber-50 border-amber-200 text-amber-700',
                      nationality: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                      physical: 'bg-rose-50 border-rose-200 text-rose-700',
                      exam: 'bg-violet-50 border-violet-200 text-violet-700',
                      experience: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                      other: 'bg-slate-50 border-slate-200 text-slate-600',
                    };
                    return (
                      <div key={idx} className={`rounded-xl border p-3 ${typeColor[crit.type] || typeColor.other}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{crit.type}</span>
                          {crit.mandatory && <span className="text-[7px] font-black uppercase tracking-widest bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Mandatory</span>}
                        </div>
                        <p className="text-[10px] font-black leading-none mb-0.5">{crit.label}</p>
                        <p className="text-[10px] leading-relaxed opacity-80">{crit.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection Process */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span>🔄</span> Selection Process
                </h3>
                <div className="space-y-4">
                  {careerRequirements.selectionProcess.map((stage, idx) => {
                    const stageIcon: Record<string, string> = {
                      written: '📝', interview: '🎤', physical: '🏃', medical: '🏥',
                      document: '📁', online: '💻', 'skill-test': '🔬',
                    };
                    const stageColor: Record<string, string> = {
                      written: 'bg-blue-600', interview: 'bg-violet-600', physical: 'bg-rose-600',
                      medical: 'bg-green-600', document: 'bg-amber-600', online: 'bg-indigo-600', 'skill-test': 'bg-teal-600',
                    };
                    const isLast = idx === careerRequirements.selectionProcess.length - 1;
                    return (
                      <div key={idx} className="relative flex gap-4">
                        {!isLast && <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-indigo-200 to-transparent" />}
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm z-10 shadow-md ${stageColor[stage.type] || 'bg-indigo-600'}`}>
                          {stageIcon[stage.type] || stage.stage}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-[1.5rem] border border-slate-100 p-4">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Stage {stage.stage}</span>
                            {stage.duration && <span className="text-[8px] text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">{stage.duration}</span>}
                          </div>
                          <p className="text-[11px] font-black text-slate-900 mb-1">{stage.title}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{stage.description}</p>
                          {stage.tips && (
                            <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                              <span className="text-amber-500 text-xs mt-px">💡</span>
                              <p className="text-[9px] text-amber-700 leading-relaxed">{stage.tips}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Exams */}
              {careerRequirements.keyExams.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span>📚</span> Key Competitive Exams
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {careerRequirements.keyExams.map((exam, idx) => (
                      <div key={idx} className="border border-indigo-100 rounded-[1.5rem] p-4 bg-indigo-50/30">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-[11px] font-black text-indigo-900">{exam.name}</p>
                            <p className="text-[9px] text-indigo-500">{exam.conductedBy}</p>
                          </div>
                          <span className="shrink-0 text-[8px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">{exam.frequency}</span>
                        </div>
                        <p className="text-[9px] text-slate-600 mb-2 italic">{exam.examPattern}</p>
                        <div className="flex flex-wrap gap-1">
                          {exam.syllabusHighlights.map((topic, tIdx) => (
                            <span key={tIdx} className="text-[8px] font-bold px-2 py-0.5 bg-white border border-indigo-200 rounded-lg text-indigo-700">{topic}</span>
                          ))}
                        </div>
                        {exam.officialUrl && (
                          <a href={exam.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-[8px] text-indigo-500 font-bold hover:text-indigo-700 transition-colors">
                            <Globe size={9} /> Official Site
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preparation Timeline */}
              {careerRequirements.preparationTimeline.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span>⏱️</span> Preparation Timeline
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {careerRequirements.preparationTimeline.map((phase, idx) => {
                      const gradients = ['from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600'];
                      return (
                        <div key={idx} className={`bg-gradient-to-br ${gradients[idx % gradients.length]} rounded-[1.5rem] p-5 text-white`}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">{phase.icon}</span>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/70">{phase.duration}</p>
                              <p className="text-[11px] font-black leading-tight">{phase.phase}</p>
                            </div>
                          </div>
                          <div className="space-y-1 mb-3">
                            {phase.focusAreas.map((area, aIdx) => (
                              <div key={aIdx} className="flex items-start gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-white/50 mt-1.5 shrink-0" />
                                <p className="text-[9px] text-white/80">{area}</p>
                              </div>
                            ))}
                          </div>
                          <div className="bg-white/10 rounded-xl px-3 py-2">
                            <p className="text-[8px] text-white/60 uppercase tracking-widest mb-0.5">Key Action</p>
                            <p className="text-[9px] font-bold text-white">{phase.keyAction}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pro Tips */}
              {careerRequirements.proTips.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] border border-amber-100 p-6">
                  <h3 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span>⭐</span> Pro Tips
                  </h3>
                  <div className="space-y-2.5">
                    {careerRequirements.proTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-[8px] font-black flex items-center justify-center">{idx + 1}</span>
                        <p className="text-[10px] text-amber-800 leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Artifacts */}
      {activeTab === 'artifacts' && (
        <div className="space-y-6">
          {isRequirementsLoading ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 p-10 flex flex-col items-center gap-3 text-center">
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading artifacts checklist…</p>
            </div>
          ) : !careerRequirements ? (
            <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-10 flex flex-col items-center gap-3">
              <Search size={20} className="text-slate-300" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No artifacts data</p>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5 flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <span className="text-sm">🗂️</span>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Total Artifacts</p>
                    <p className="text-sm font-black text-slate-900">{careerRequirements.artifacts.reduce((acc, cat) => acc + cat.items.length, 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                    <span className="text-sm">🔴</span>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Essential</p>
                    <p className="text-sm font-black text-red-600">{careerRequirements.artifacts.reduce((acc, cat) => acc + cat.items.filter(i => i.priority === 'Essential').length, 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <span className="text-sm">🟡</span>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Important</p>
                    <p className="text-sm font-black text-amber-600">{careerRequirements.artifacts.reduce((acc, cat) => acc + cat.items.filter(i => i.priority === 'Important').length, 0)}</p>
                  </div>
                </div>
                <div className="ml-auto">
                  <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold mb-1">Checked</p>
                  <p className="text-sm font-black text-indigo-600">{checkedArtifacts.size} / {careerRequirements.artifacts.reduce((acc, cat) => acc + cat.items.length, 0)}</p>
                </div>
              </div>

              {/* Categories */}
              {careerRequirements.artifacts.map((cat, catIdx) => (
                <div key={catIdx} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span> {cat.category}
                  </h3>
                  <div className="space-y-2.5">
                    {cat.items.map((item, itemIdx) => {
                      const key = `${catIdx}-${itemIdx}`;
                      const isChecked = checkedArtifacts.has(key);
                      const priorityStyle: Record<string, string> = {
                        Essential: 'bg-red-100 text-red-700 border-red-200',
                        Important: 'bg-amber-100 text-amber-700 border-amber-200',
                        Optional: 'bg-slate-100 text-slate-500 border-slate-200',
                      };
                      return (
                        <div
                          key={key}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                            isChecked ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                          }`}
                          onClick={() => {
                            setCheckedArtifacts(prev => {
                              const next = new Set(prev);
                              if (next.has(key)) next.delete(key); else next.add(key);
                              return next;
                            });
                          }}
                        >
                          {/* Checkbox */}
                          <div className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-indigo-300'
                          }`}>
                            {isChecked && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <p className={`text-[10px] font-black ${isChecked ? 'line-through text-slate-400' : 'text-slate-900'}`}>{item.name}</p>
                              <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${priorityStyle[item.priority]}`}>{item.priority}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-relaxed">{item.description}</p>
                            <div className="flex gap-3 mt-1.5 flex-wrap">
                              <span className="text-[8px] text-slate-400">📅 {item.whenNeeded}</span>
                              {item.format && <span className="text-[8px] text-slate-400">📄 {item.format}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Official Links */}
              {careerRequirements.officialLinks.length > 0 && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Globe size={12} /> Official Resources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {careerRequirements.officialLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-[9px] font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <Globe size={9} /> {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};


const InstitutionsView = ({ profile, selectedPathId, careerTitle, initialSearch = "", onInitInterview, institutions = [], isLoading = false, visaGuidance, isVisaLoading = false, roadmapContext = null }: { profile: UserProfile, selectedPathId: string, careerTitle?: string, initialSearch?: string, onInitInterview: (role: string, company?: string) => void, institutions?: Institution[], isLoading?: boolean, visaGuidance?: any, isVisaLoading?: boolean, roadmapContext?: InstitutionRoadmapContext | null }) => {
  const [search, setSearch] = useState(initialSearch);
  const [intlOnly, setIntlOnly] = useState(false);
  const [maxCost, setMaxCost] = useState(100000);
  const [selectedProgram, setSelectedProgram] = useState("All Programs");
  const [radius, setRadius] = useState<"Local" | "National" | "Global">("Global");
  const [visaFilter, setVisaFilter] = useState<Institution['visaSupport'] | 'All'>('All');
  const [showComparator, setShowComparator] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedInstitutionVisaGuidance, setSelectedInstitutionVisaGuidance] = useState<any>(null);
  const [isSelectedInstitutionVisaLoading, setIsSelectedInstitutionVisaLoading] = useState(false);

  // AI Recommendation States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecs, setAiRecs] = useState<{ institution: Institution, rationale: string }[]>([]);
  const [showAiRecs, setShowAiRecs] = useState(false);

  // AI Global Search States
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<Institution[]>([]);
  const [hasAiSearched, setHasAiSearched] = useState(false);

  // Country quick-switch — profile's target country first, then popular alternatives
  const popularCountries = ["United States", "United Kingdom", "Germany", "Canada", "Australia", "Singapore", "Japan", "France", "Netherlands", "UAE"];
  const targetFirst = profile.targetLocation || "";
  const homeCountry = profile.country || "";
  const [activeCountryFilter, setActiveCountryFilter] = React.useState<string>(targetFirst || "");

  // Sync to profile target location changes
  React.useEffect(() => {
    if (profile.targetLocation) setActiveCountryFilter(profile.targetLocation);
  }, [profile.targetLocation]);

  // Country-specific institution fetch (backend cache-first, LLM fallback)
  const [countryInstitutions, setCountryInstitutions] = useState<Institution[]>([]);
  const [isCountryLoading, setIsCountryLoading] = useState(false);
  const [fetchedForCountry, setFetchedForCountry] = useState<string | null>(null);

  const fetchInstitutionsForCountry = async (country: string) => {
    // Guard against bare numeric IDs (e.g. "1") — use a meaningful fallback
    const isUsableTitle = (s?: string) => !!s && !/^\d+$/.test(s);
    const career = isUsableTitle(careerTitle)
      ? careerTitle!
      : isUsableTitle(selectedPathId)
        ? selectedPathId.replace(/-/g, ' ')
        : 'Technology & Computing';
    setIsCountryLoading(true);
    setCountryInstitutions([]);
    try {
      const result = await getDynamicInstitutions(
        profile,
        career,
        country || 'Global'
      );
      setCountryInstitutions(result || []);
    } catch {
      setCountryInstitutions([]);
    } finally {
      setIsCountryLoading(false);
      setFetchedForCountry(country);
    }
  };

  // Fetch whenever activeCountryFilter changes; also runs on mount (fetchedForCountry starts null)
  React.useEffect(() => {
    const target = activeCountryFilter || profile.targetLocation || profile.country || 'Global';
    if (fetchedForCountry !== target) {
      fetchInstitutionsForCountry(target);
    }
  }, [activeCountryFilter]);

  const forceRefresh = () => {
    setFetchedForCountry(null);
    const target = activeCountryFilter || profile.targetLocation || profile.country || 'Global';
    fetchInstitutionsForCountry(target);
  };

  const fetchAiRecs = async () => {
    setIsAiLoading(true);
    setShowAiRecs(true);
    try {
      const title = careerTitle || selectedPathId.replace(/-/g, ' ');
      const results = await getAiInstitutionRecommendations(profile, title);
      setAiRecs(results);
    } catch (error) {
      console.error("AI Recommendation Error:", error);
      setAiRecs([]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiSearch = async () => {
    const q = aiSearchQuery.trim();
    if (!q) return;

    setIsAiSearching(true);
    try {
      // Use aiSearchInstitutions which returns full Institution objects with real coordinates
      const results = await aiSearchInstitutions(q, profile);
      setAiSearchResults(results || []);
      setHasAiSearched(true);
    } catch {
      setAiSearchResults([]);
      setHasAiSearched(true);
    } finally {
      setIsAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiSearchQuery("");
    setAiSearchResults([]);
    setHasAiSearched(false);
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
  const userCountry = profile.country || "";

  const hubCountryFilters = Array.from(new Set([
    ...(targetFirst ? [targetFirst] : []),
    ...(homeCountry && homeCountry !== targetFirst ? [homeCountry] : []),
    ...popularCountries.filter(c => c !== targetFirst && c !== homeCountry)
  ])).slice(0, 8);

  const programs = ["All Programs", ...Array.from(new Set(institutions.flatMap(inst => inst.programs)))].map(p => ({
    name: p,
    count: p === "All Programs" 
      ? institutions.length 
      : institutions.filter(i => i.programs.includes(p)).length
  }));

  // When AI search results are present, use those; otherwise use country-fetched institutions
  const baseInstitutions = hasAiSearched ? aiSearchResults : countryInstitutions;
  const isDataLoading = isLoading || isCountryLoading;

  const filtered = baseInstitutions.filter(inst => {
    const matchesSearch = !search || inst.name.toLowerCase().includes(search.toLowerCase()) || 
                         inst.country.toLowerCase().includes(search.toLowerCase()) ||
                         inst.city.toLowerCase().includes(search.toLowerCase()) ||
                         inst.programs.some(p => p.toLowerCase().includes(search.toLowerCase()));
    const matchesIntl = !intlOnly || inst.allowsInternationalStudents;
    const matchesCost = inst.avgCost <= maxCost;
    const matchesProgram = selectedProgram === "All Programs" || inst.programs.includes(selectedProgram);
    const matchesVisa = visaFilter === "All" || inst.visaSupport === visaFilter;
    // Don't filter by country when data is already country-specific from backend fetch
    return matchesSearch && matchesIntl && matchesCost && matchesProgram && matchesVisa;
  });

  const visibleInstitutions = filtered;

  useEffect(() => {
    setIsSearching(true);
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
      setIsSelectedInstitutionVisaLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSelectedInstitutionVisaGuidance = async () => {
      setIsSelectedInstitutionVisaLoading(true);
      setSelectedInstitutionVisaGuidance(null);
      try {
        const guidance = await getVisaGuidance(
          profile,
          selectedInstitution.country,
          roadmapContext?.careerTitle || selectedPathId,
          {
            name: selectedInstitution.name,
            city: selectedInstitution.city,
            country: selectedInstitution.country,
            type: selectedInstitution.type,
            programs: selectedInstitution.programs,
          }
        );
        if (!cancelled) {
          setSelectedInstitutionVisaGuidance(guidance);
        }
      } catch (error) {
        console.error('Selected Institution Visa Guidance Error:', error);
        if (!cancelled) {
          setSelectedInstitutionVisaGuidance(null);
        }
      } finally {
        if (!cancelled) {
          setIsSelectedInstitutionVisaLoading(false);
        }
      }
    };

    fetchSelectedInstitutionVisaGuidance();

    return () => { cancelled = true; };
  }, [profile.country, profile.citizenCountry, profile.education, profile.budget, roadmapContext?.careerTitle, selectedInstitution?.id, selectedInstitution?.country, selectedPathId]);

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
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-1">Global Hub Navigator</p>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {isDataLoading ? 'Discovering Institutions…' : `${filtered.length} Institution${filtered.length !== 1 ? 's' : ''} Found`}
          </h2>
          <p className="text-sm text-slate-400 font-bold mt-0.5">
            {activeCountryFilter ? `Filtered by ${activeCountryFilter}` : 'Worldwide · Spatial Intelligence'}
            {hasAiSearched ? ' · AI Global Search Active' : ''}
          </p>
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-2 items-center">
          {[
            { label: 'Institutions', value: filtered.length.toString(), color: 'indigo' },
            { label: 'Countries', value: String(new Set(filtered.map(i => i.country)).size), color: 'sky' },
            { label: 'Avg Cost', value: filtered.length ? `$${Math.round(filtered.reduce((s,i)=>s+i.avgCost,0)/filtered.length).toLocaleString()}` : '—', color: 'emerald' },
            { label: 'Intl Friendly', value: `${filtered.filter(i=>i.allowsInternationalStudents).length}`, color: 'violet' },
          ].map(chip => (
            <div key={chip.label} className={`px-3 py-2 rounded-2xl border bg-${chip.color}-50 border-${chip.color}-200 flex flex-col items-center min-w-[64px]`}>
              <span className={`text-sm font-black text-${chip.color}-700`}>{chip.value}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest text-${chip.color}-500`}>{chip.label}</span>
            </div>
          ))}
          <button
            onClick={forceRefresh}
            disabled={isDataLoading}
            className="ml-1 p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-400 transition-all disabled:opacity-40"
            title="Refresh institutions from AI"
          >
            <RotateCcw size={14} className={isDataLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

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
      
      <div className="rounded-[3rem] overflow-hidden border border-slate-200 shadow-2xl relative bg-slate-50 h-[620px]">
        {isDataLoading && (
          <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm gap-4">
            <Loader2 size={36} className="text-indigo-500 animate-spin" />
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Discovering institutions worldwide…</p>
          </div>
        )}
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {filtered.map((inst) => {
            const isSelected = selectedInstitution?.id === inst.id;
            return (
              <Marker 
                key={inst.id} 
                position={[inst.coordinates.lat, inst.coordinates.lng]}
                eventHandlers={{ click: () => setSelectedInstitution(inst) }}
                icon={L.divIcon({
                  className: 'custom-hub-marker',
                  html: `<div style="
                    position: relative;
                    width: ${isSelected ? '52px' : '44px'};
                    height: ${isSelected ? '52px' : '44px'};
                    transition: all 0.2s;
                  ">
                    <div style="
                      width: 100%;
                      height: 100%;
                      border-radius: 50%;
                      border: 3px solid ${isSelected ? '#6366f1' : 'white'};
                      box-shadow: ${isSelected ? '0 0 0 3px #6366f1, 0 8px 24px rgba(99,102,241,0.4)' : '0 4px 16px rgba(0,0,0,0.25)'};
                      overflow: hidden;
                      background: #e2e8f0;
                      cursor: pointer;
                    ">
                      <img
                        src="${inst.image}"
                        style="width: 100%; height: 100%; object-fit: cover; display: block;"
                        onerror="this.style.display='none'; this.parentNode.innerHTML += '<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#6366f1;\\'><svg width=\\'20\\' height=\\'20\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'white\\' stroke-width=\\'2\\'><path d=\\'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\\'></path><polyline points=\\'9 22 9 12 15 12 15 22\\'></polyline></svg></div>'"
                      />
                    </div>
                    <div style="
                      position: absolute;
                      bottom: -5px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 0; height: 0;
                      border-left: 6px solid transparent;
                      border-right: 6px solid transparent;
                      border-top: 8px solid ${isSelected ? '#6366f1' : 'white'};
                      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));
                    "></div>
                  </div>`,
                  iconSize: [isSelected ? 52 : 44, isSelected ? 60 : 52],
                  iconAnchor: [isSelected ? 26 : 22, isSelected ? 60 : 52],
                  popupAnchor: [0, -60]
                })}
              >
                 <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                   <span className="text-[10px] font-black uppercase">{inst.name}</span>
                 </Tooltip>
                 <Popup className="max-w-[260px] rounded-3xl border border-slate-200 shadow-2xl">
                   <div className="space-y-3">
                     <div className="overflow-hidden rounded-2xl">
                       <img src={inst.image || undefined} alt={inst.name} className="w-full h-28 object-cover" referrerPolicy="no-referrer" />
                     </div>
                     <div className="space-y-1 text-slate-800">
                       <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600">{inst.city}, {inst.country}</p>
                       <h4 className="text-sm font-black leading-tight">{inst.name}</h4>
                       <div className="grid grid-cols-3 gap-2 text-[9px] uppercase tracking-[0.2em] text-slate-500">
                         <span className="bg-slate-100 rounded-full py-1 px-2">{inst.ranking ? `#${inst.ranking}` : 'Global Hub'}</span>
                         <span className="bg-slate-100 rounded-full py-1 px-2">${inst.avgCost.toLocaleString()}</span>
                         <span className="bg-slate-100 rounded-full py-1 px-2">{inst.visaSupport}</span>
                       </div>
                       <p className="text-[9px] font-bold text-slate-700">Programs: {inst.programs.slice(0, 2).join(', ')}{inst.programs.length > 2 ? '...' : ''}</p>
                     </div>
                   </div>
                 </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {selectedInstitution && (
          <div className="absolute left-1/2 top-8 z-[1005] w-[260px] -translate-x-1/2 pointer-events-none">
            <div className="rounded-[2rem] border border-white bg-white/95 p-5 shadow-2xl backdrop-blur-xl pointer-events-auto">
              <div className="mb-4 overflow-hidden rounded-2xl">
                <img src={selectedInstitution.image || undefined} className="h-24 w-full object-cover" referrerPolicy="no-referrer" />
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
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{hasAiSearched ? 'AI Global Results' : 'Calibrating global hubs'}</p>
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
                {/* Standard filter search */}
                {!hasAiSearched && (
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
                )}

                {/* AI Global Search */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={10} className="text-indigo-500" />
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Global Search</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder='e.g. "top medical schools Asia"'
                      className={`w-full pl-3 pr-16 py-2.5 border rounded-xl text-[10px] font-bold outline-none transition-all ${hasAiSearched ? 'bg-indigo-50 border-indigo-300 focus:ring-1 focus:ring-indigo-500' : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-400'}`}
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {hasAiSearched && (
                        <button onClick={clearAiSearch} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Clear AI results">
                          <X size={11} />
                        </button>
                      )}
                      <button                        
                        onClick={() => handleAiSearch()}
                        disabled={isAiSearching || !aiSearchQuery.trim()}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        title="Search globally with AI"
                      >
                        {isAiSearching ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                      </button>
                    </div>
                  </div>
                  {hasAiSearched && (
                    <p className="text-[9px] text-indigo-600 font-bold flex items-center gap-1">
                      <Check size={9} className="text-emerald-500" /> {aiSearchResults.length} global results found
                    </p>
                  )}
                </div>

                {!hasAiSearched && (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        Country
                        {isCountryLoading && <Loader2 size={8} className="text-indigo-400 animate-spin" />}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => { setActiveCountryFilter(""); setSearch(""); }}
                          disabled={isCountryLoading}
                          className={`px-2 py-1 border rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${activeCountryFilter === "" ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-indigo-400"} disabled:opacity-50`}
                        >
                          All
                        </button>
                        {hubCountryFilters.map(country => (
                          <button 
                            key={country} 
                            onClick={() => { setActiveCountryFilter(country); setSearch(""); }}
                            disabled={isCountryLoading}
                            className={`px-2 py-1 border rounded-lg text-[8px] font-black uppercase tracking-widest transition-colors ${activeCountryFilter === country ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-indigo-400"} disabled:opacity-50`}
                            title={country === targetFirst ? "Your target country" : country === homeCountry ? "Your home country" : ""}
                          >
                            {country === targetFirst ? `⭐ ${country}` : country}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <select
                        value={visaFilter}
                        onChange={(e) => setVisaFilter(e.target.value as Institution['visaSupport'] | 'All')}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] text-slate-500"
                      >
                        <option value="All">Visa Support</option>
                        <option value="Full">Full</option>
                        <option value="Partial">Partial</option>
                        <option value="None">None</option>
                      </select>
                      <select
                        value={selectedProgram}
                        onChange={(e) => setSelectedProgram(e.target.value)}
                        className="w-full py-2 px-3 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] text-slate-500"
                      >
                        {programs.map(program => (
                          <option key={program.name} value={program.name}>{program.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-3">
                      <label className="text-[8px] uppercase tracking-[0.25em] text-slate-500 font-black">Max annual cost</label>
                      <input
                        type="range"
                        min={5000}
                        max={100000}
                        step={5000}
                        value={maxCost}
                        onChange={(e) => setMaxCost(Number(e.target.value))}
                        className="w-full mt-2 accent-indigo-600"
                      />
                      <p className="text-[8px] text-slate-400 mt-1">Showing options up to ${maxCost.toLocaleString()}</p>
                    </div>
                  </>
                )}
              </div>
           </div>
        </div>

        {/* Results Sidebar */}
        <div className="absolute top-6 right-6 z-[1010] pointer-events-none h-[calc(100%-180px)] flex flex-col gap-4">
           <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl w-[320px] pointer-events-auto flex flex-col overflow-hidden max-h-full">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      Ecosystem Nodes
                      {hasAiSearched && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-black rounded-md uppercase tracking-widest">AI</span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">
                      {isSearching || isAiSearching ? 'Calibrating...' : `${visibleInstitutions.length}/${filtered.length} Matches`}
                    </p>
                 </div>
                 {(isSearching || isAiSearching) && <Loader2 size={16} className="animate-spin text-indigo-600" />}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                 {isSearching || isAiSearching ? (
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
                   filtered.map(inst => (
                     <div className={cn("p-3 rounded-2xl border flex flex-col gap-2.5 group transition-all cursor-pointer", selectedInstitution?.id === inst.id ? "bg-indigo-50 border-indigo-400 shadow-sm" : "bg-slate-50 border-slate-100 hover:border-indigo-300")}
                          key={inst.id}
                          onClick={() => setSelectedInstitution(inst)}
                     >
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-11 h-11 rounded-xl bg-slate-200 shrink-0 overflow-hidden">
                             <img src={inst.image || undefined} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                             <div className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-white text-center text-[7px] font-black py-0.5">#{inst.ranking || '—'}</div>
                          </div>
                          <div className="flex-1 overflow-hidden">
                             <p className="text-[10px] font-black uppercase truncate group-hover:text-indigo-700 transition-colors">{inst.name}</p>
                             <p className="text-[8px] text-slate-400 font-bold uppercase">{inst.city}, {inst.country}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[8px] font-black uppercase">
                           <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">${inst.avgCost.toLocaleString()}/yr</span>
                           <span className={`rounded-full px-2 py-0.5 border ${inst.visaSupport === 'Full' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : inst.visaSupport === 'Partial' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{inst.visaSupport}</span>
                           {inst.allowsInternationalStudents && <span className="bg-sky-50 border border-sky-200 text-sky-700 rounded-full px-2 py-0.5">Intl ✓</span>}
                        </div>
                        <div className="flex items-center justify-between gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCompare(inst.id); }}
                            className={cn(
                              "flex-1 py-1.5 rounded-xl text-[8px] font-black uppercase transition-all",
                              compareIds.includes(inst.id) ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-300"
                            )}
                          >
                            {compareIds.includes(inst.id) ? '✓ Selected' : 'Compare'}
                          </button>
                          <a
                            href={inst.website}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex-1 py-1.5 rounded-xl bg-indigo-600 text-white text-[8px] font-black uppercase text-center hover:bg-indigo-700 transition-all"
                          >
                            Visit
                          </a>
                        </div>
                     </div>
                   ))
                 )}
              </div>

           </div>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none">
           <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-800 shadow-2xl text-white min-w-[200px] pointer-events-auto">
              <div className="space-y-3">
                 <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">On Map</p>
                    <p className="text-xl font-black">{filtered.length} <span className="text-[10px] text-indigo-400 uppercase font-black">Institutions</span></p>
                 </div>
                 <div className="h-px bg-slate-800" />
                 <div className="space-y-1.5 text-[9px] font-black uppercase tracking-widest">
                    <div className="flex justify-between"><span className="text-slate-500">Countries</span><span className="text-white">{new Set(filtered.map(i=>i.country)).size}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Intl Friendly</span><span className="text-emerald-400">{filtered.filter(i=>i.allowsInternationalStudents).length}</span></div>
                    {filtered.length > 0 && <div className="flex justify-between"><span className="text-slate-500">Avg Cost</span><span className="text-indigo-400">${Math.round(filtered.reduce((s,i)=>s+i.avgCost,0)/filtered.length).toLocaleString()}</span></div>}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* ── Top 10 Universities Ranked Grid ─────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">Top Ranked</p>
            <h3 className="text-lg font-black text-slate-900">
              {activeCountryFilter ? `${activeCountryFilter} Universities` : 'Global Top Universities'}
            </h3>
          </div>
          {isDataLoading && <Loader2 size={18} className="text-indigo-400 animate-spin" />}
        </div>

        {isDataLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4 animate-pulse space-y-3">
                <div className="h-28 w-full rounded-xl bg-slate-200" />
                <div className="h-3 w-3/4 bg-slate-200 rounded" />
                <div className="h-2 w-1/2 bg-slate-100 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 flex-1 bg-slate-100 rounded-full" />
                  <div className="h-5 flex-1 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
            <Globe size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No institutions found</p>
            <p className="text-xs text-slate-300 mt-1">Try selecting a different country or adjusting your filters</p>
            <button onClick={forceRefresh} className="mt-4 px-4 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-indigo-700 transition-all">
              Generate with AI
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {filtered.slice(0, 10).map((inst, index) => (
              <div
                key={inst.id}
                onClick={() => setSelectedInstitution(inst)}
                className={`rounded-[1.5rem] border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden ${selectedInstitution?.id === inst.id ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-indigo-300'}`}
              >
                {/* Image */}
                <div className="relative h-28 bg-gradient-to-br from-indigo-100 to-slate-100 overflow-hidden">
                  {inst.image ? (
                    <img src={inst.image} alt={inst.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                  ) : null}
                  {/* Rank badge */}
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-white rounded-xl px-2 py-1 flex items-center gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase">#</span>
                    <span className="text-xs font-black">{inst.ranking || index + 1}</span>
                  </div>
                  {/* Visa badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-xl text-[8px] font-black uppercase backdrop-blur ${inst.visaSupport === 'Full' ? 'bg-emerald-500/90 text-white' : inst.visaSupport === 'Partial' ? 'bg-amber-500/90 text-white' : 'bg-slate-500/80 text-white'}`}>
                    {inst.visaSupport}
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-[10px] font-black text-slate-900 leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors">{inst.name}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{inst.city}, {inst.country}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-700">${inst.avgCost.toLocaleString()}<span className="text-[8px] text-slate-400 font-bold">/yr</span></span>
                    {inst.allowsInternationalStudents && (
                      <span className="text-[8px] bg-sky-50 text-sky-600 border border-sky-200 rounded-full px-2 py-0.5 font-black uppercase">Intl</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {inst.programs.slice(0, 2).map(p => (
                      <span key={p} className="text-[8px] bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5 text-slate-500 font-bold truncate max-w-full">{p}</span>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <a
                      href={inst.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex-1 text-center py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[8px] font-black uppercase rounded-lg transition-all"
                    >
                      Visit
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); toggleCompare(inst.id); }}
                      className={`flex-1 py-1.5 text-[8px] font-black uppercase rounded-lg transition-all ${compareIds.includes(inst.id) ? 'bg-indigo-100 text-indigo-700 border border-indigo-300' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {compareIds.includes(inst.id) ? '✓ Sel' : 'Compare'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* Visa Details Panel */}
      {(selectedInstitutionVisaGuidance || visaGuidance || isSelectedInstitutionVisaLoading || isVisaLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-8"
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
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="val" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#careerGrowth)" activeDot={false} />
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
  const progressPercent = Math.min((((profile.completedMilestones?.length ?? 0) / Math.max(currentPath?.milestones?.length ?? 1, 1)) * 100), 100);

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
                {careers.map(p => (
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

const FundingOpportunitiesView = ({ profile, highlightId, onHighlightConsumed }: {
  profile: UserProfile;
  highlightId?: string | null;
  onHighlightConsumed?: () => void;
}) => {
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rateLimited, setRateLimited] = useState(false);
  const [retryIn, setRetryIn] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Scroll to and briefly ring-highlight the targeted scholarship card
  useEffect(() => {
    if (!highlightId || !highlightRef.current) return;
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Clear the highlight after 3.5s so it doesn’t persist
      const clear = setTimeout(() => onHighlightConsumed?.(), 3500);
      return () => clearTimeout(clear);
    }, 600);
    return () => clearTimeout(t);
  }, [highlightId, opportunities]);

  const performMatch = async () => {
    setIsLoading(true);
    setRateLimited(false);
    try {
      const matches = await matchScholarships(profile);
      setOpportunities(matches);
    } catch (err: any) {
      const msg: string = err?.message || String(err);
      if (/rate.?limit|503|429|retry/i.test(msg)) {
        setRateLimited(true);
        // Count down and auto-retry after 60s
        let countdown = 60;
        setRetryIn(countdown);
        const timer = setInterval(() => {
          countdown -= 1;
          setRetryIn(countdown);
          if (countdown <= 0) {
            clearInterval(timer);
            performMatch();
          }
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
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
      ) : rateLimited ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-10 text-center space-y-4">
          <div className="bg-amber-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 className="text-base font-bold text-amber-900">AI providers are rate-limited</h3>
          <p className="text-amber-700 text-sm max-w-sm mx-auto">All LLM providers hit their request limits simultaneously. Auto-retrying in <span className="font-black">{retryIn}s</span>…</p>
          <button onClick={performMatch} className="mt-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all">
            Retry Now
          </button>
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
                {filteredOpportunities.map((opp, i) => {
                  const isHighlighted = highlightId === opp.id;
                  return (
                  <motion.div
                    ref={isHighlighted ? highlightRef : undefined}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={opp.id}
                    className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group flex flex-col justify-between ${
                      isHighlighted
                        ? 'border-indigo-400 ring-2 ring-indigo-300 ring-offset-2 shadow-indigo-100'
                        : 'border-slate-200'
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(to right, #4f46e5, #7c3aed)' }} />
                    )}
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

                <a
                  href={opp.website || `https://www.google.com/search?q=${encodeURIComponent(opp.name + ' ' + opp.provider + ' apply')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <ExternalLink size={12} /> Apply Now
                </a>
              </motion.div>
            );
          })}
          </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FinancialView = ({ profile, setProfile, highlightScholarshipId, onClearHighlight }: {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  highlightScholarshipId?: string | null;
  onClearHighlight?: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<'planner' | 'projections' | 'calculator' | 'funding'>('planner');

  // Auto-switch to the funding tab when arriving via a scholarship deep-link
  useEffect(() => {
    if (highlightScholarshipId) setActiveTab('funding');
  }, [highlightScholarshipId]);
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

  // Currency handling
  const currencyOptions = ['USD', 'CHF', 'EUR', 'GBP'];
  const currency = (profile.preferredCurrency as string) || 'USD';
  const symbolMap: Record<string, string> = { USD: '$', CHF: 'CHF', EUR: '€', GBP: '£' };
  const formatMoney = (value: number | string | undefined, cur = currency) => {
    const num = Number(value || 0);
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(num);
    } catch (e) {
      // Fallback to simple symbol formatting
      const sym = symbolMap[cur] || cur;
      return `${sym} ${num.toLocaleString()}`;
    }
  };

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
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Currency</label>
          <select
            value={currency}
            onChange={(e) => setProfile(prev => ({ ...prev, preferredCurrency: e.target.value }))}
            className="text-sm rounded-lg border border-slate-200 bg-white px-3 py-1"
            aria-label="Preferred currency"
          >
            {currencyOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
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
                   <span className="text-slate-400 font-mono italic">{symbolMap[currency] ?? currency}</span>
                   <input 
                     type="number" 
                     className="bg-transparent outline-none w-full font-bold text-slate-800 text-sm placeholder-gray-300"
                     placeholder="0"
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
                     className="bg-transparent outline-none w-full font-bold text-indigo-900 text-sm placeholder-gray-300"
                     placeholder="0"
                     value={financialProfile.currentSavings}
                     onChange={(e) => setProfile(prev => ({ 
                       ...prev, 
                       financialProfile: { ...(prev.financialProfile || financialProfile), currentSavings: parseInt(e.target.value) || 0 } 
                     }))}
                   />
                 </div>
               </div>
               <div className="grid grid-cols-1 gap-3">
                 <button
                   onClick={() => { addStarterBudget(); }}
                   className="rounded-xl border border-indigo-200 bg-indigo-600 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-500"
                 >
                   Get Started — Load Starter Budget
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
                   {aiRecommendation ? (
                     <ReactMarkdown>{aiRecommendation}</ReactMarkdown>
                   ) : (
                     <div>
                       <p className="font-black text-white">Starter recommendation</p>
                       <p className="text-slate-300">Most users targeting AI Engineer roles in {profile.targetLocation || profile.country || 'your region'} budget ~{formatMoney(60000)} for living costs — load a sample budget to compare.</p>
                     </div>
                   )}
                 </div>
               )}
             </div>
             <button onClick={generateFinancialRecommendation} disabled={isAiRecommendationLoading} className="w-full py-2 bg-indigo-600 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
               {isAiRecommendationLoading ? 'Generating...' : 'Generate AI Recommendation'}
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
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                    <RechartsTooltip 
                      content={(props: any) => {
                        const { active, payload, label } = props;
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
                      activeDot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Annual Savings', value: `$${(monthlySavings * 12).toLocaleString()}`, icon: PiggyBank, color: 'text-indigo-600' },
                   { label: 'Compounding Rate', value: '7.4% Avg', icon: TrendingUp, color: 'text-emerald-600' },
                   { label: 'Financial Freedom', value: 'Yr 14 Est.', icon: Target, color: 'text-amber-600' }
                  ].map((stat, i) => {
                   const Icon = stat.icon;
                   return (
                    <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                      <div className={cn("p-2 bg-white rounded-xl shadow-sm", stat.color)}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{stat.value}</p>
                      </div>
                    </div>
                   );
                  })}
              </div>
            </div>
          )}


          {activeTab === 'planner' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                  <h4 className="text-sm font-bold text-slate-800 mb-6 flex justify-between items-center">
                  Expense Distribution <span className="text-xs text-slate-400 font-mono tracking-tighter">{formatMoney(totalMonthlyExpenses)}/mo</span>
                </h4>
                {expenseData.length > 0 && totalMonthlyExpenses > 0 ? (
                  <>
                    <div className="flex-1 min-h-[250px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <PieChart>
                          <Pie
                            data={expenseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            isAnimationActive={false}
                          >
                            {expenseData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
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

          {activeTab === 'funding' && <FundingOpportunitiesView profile={profile} highlightId={highlightScholarshipId} onHighlightConsumed={onClearHighlight} />}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [globalView, setGlobalView] = useState<'landing' | 'app' | 'privacy' | 'terms' | 'faq'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Restore email/password session from localStorage on page load
  const [localUser, setLocalUserState] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('cv_local_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setLocalUser = (userData: any) => {
    if (userData) {
      localStorage.setItem('cv_local_user', JSON.stringify(userData));
      // Always start at dashboard on fresh login
      sessionStorage.removeItem('cv_activeView');
    } else {
      localStorage.removeItem('cv_local_user');
    }
    setLocalUserState(userData);
  };

  return (
    <>
      <OfflineBanner />
      <AuthProvider>
      {({ user, loading }) => {
        const activeUser = user || localUser;

        // Always show a loading screen while Firebase resolves its persisted session.
        // This prevents a flash to the landing page for already-authenticated users.
        if (loading) {
          return (
            <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-indigo-600 rounded-3xl animate-pulse flex items-center justify-center">
                 <Sparkles size={32} className="text-white" />
              </div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">Syncing Trajectory...</p>
            </div>
          );
        }

        // If Firebase restored a session (page refresh), skip landing/login entirely.
        if (activeUser) {
          return <AuthenticatedApp user={activeUser} onExit={() => { setLocalUser(null); setGlobalView('landing'); }} />;
        }

        if (globalView === 'privacy') {
          return <PrivacyPolicy onBack={() => setGlobalView('landing')} />;
        }

        if (globalView === 'terms') {
          return <TermsConditions onBack={() => setGlobalView('landing')} />;
        }

        if (globalView === 'faq') {
          return <FAQPage onBack={() => setGlobalView('landing')} onStart={() => setGlobalView('app')} />;
        }

        if (globalView === 'landing') {
          return <LandingPage onStart={() => setGlobalView('app')} onShowPrivacy={() => setGlobalView('privacy')} onShowTerms={() => setGlobalView('terms')} onShowFaq={() => setGlobalView('faq')} />;
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
                  sessionStorage.removeItem('cv_activeView');
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
    </>
  );
}

function AuthenticatedApp({ user, onExit }: { user: any, onExit: () => void }) {
  const { t } = useTranslation();
  const { language, setLanguage } = useAccessibility();

  // ── Admin check (used for pillar visibility + admin view) ──────────────────
  const isAdmin = !!(user?.email && import.meta.env.VITE_ADMIN_EMAIL && user.email === import.meta.env.VITE_ADMIN_EMAIL);

  type AppView = 'dashboard' | 'roadmap' | 'institutions' | 'materials' | 'expenses' | 'advisor' | 'parent' | 'heatmap' | 'jobs' | 'resume' | 'job-match' | 'interview' | 'directory' | 'network' | 'analytics' | 'pricing' | 'enterprise' | 'career-coach' | 'industry-sim' | 'soft-skills' | 'salary-coach' | 'side-hustle' | 'burnout' | 'admin';
  const VALID_VIEWS: AppView[] = ['dashboard', 'roadmap', 'institutions', 'materials', 'expenses', 'advisor', 'parent', 'heatmap', 'jobs', 'resume', 'job-match', 'interview', 'directory', 'network', 'analytics', 'pricing', 'enterprise', 'career-coach', 'industry-sim', 'soft-skills', 'salary-coach', 'side-hustle', 'burnout', 'admin'];
  // ── Pillar Definitions ──
  type PillarSub = { label: string; view: AppView; icon: React.ElementType; desc: string };
  type Pillar = { id: string; label: string; icon: React.ElementType; primaryView: AppView; views: AppView[]; accent: { bg: string; text: string }; subs: PillarSub[] };
  const PILLAR_DEFS: Pillar[] = [
    { id: 'dashboard', label: t('pillars.dashboard'), icon: LayoutDashboard, primaryView: 'dashboard', views: ['dashboard'], accent: { bg: 'bg-slate-950', text: 'text-white' }, subs: [] },
    {
      id: 'explore', label: t('pillars.explore'), icon: Layers, primaryView: 'roadmap', views: ['roadmap', 'institutions', 'materials', 'directory'],
      accent: { bg: 'bg-violet-600', text: 'text-white' },
      subs: [
        { label: t('pillars.subs.careerMaps'),  view: 'roadmap',      icon: Map,      desc: 'Visual nodes & trajectory mapping' },
        { label: t('pillars.subs.institutions'), view: 'institutions', icon: School,   desc: 'Global universities & bootcamps' },
        { label: t('pillars.subs.academy'),      view: 'materials',    icon: BookOpen, desc: 'Study materials & guides' },
        { label: t('pillars.subs.directory'),    view: 'directory',    icon: Layers,   desc: 'Browse careers by your target location' },
      ],
    },
    {
      id: 'ai-coach', label: t('pillars.aiCoach'), icon: BrainCircuit, primaryView: 'interview', views: ['interview', 'resume', 'job-match', 'career-coach', 'industry-sim', 'soft-skills', 'salary-coach'],
      accent: { bg: 'bg-purple-600', text: 'text-white' },
      subs: [
        { label: t('pillars.subs.interviewPrep'), view: 'interview',    icon: Mic,            desc: 'AI mock interview simulator' },
        { label: t('pillars.subs.resume'),         view: 'resume',       icon: FileText,       desc: 'Build & score your resume' },
        { label: t('pillars.subs.aiMatch'),        view: 'job-match',    icon: Zap,            desc: 'Smart job-fit scoring' },
        { label: t('pillars.subs.careerCoach'),    view: 'career-coach', icon: MessageSquare,  desc: 'AI career coach chatbot' },
        { label: t('pillars.subs.industrySim'),    view: 'industry-sim', icon: Building2,      desc: 'Role-play industry scenarios' },
        { label: t('pillars.subs.softSkills'),     view: 'soft-skills',  icon: Users,          desc: 'Personality & communication' },
        { label: t('pillars.subs.salaryCoach'),    view: 'salary-coach', icon: DollarSign,     desc: 'Salary negotiation training' },
      ],
    },
    {
      id: 'mobility', label: t('pillars.mobility'), icon: Globe, primaryView: 'expenses', views: ['expenses', 'heatmap', 'jobs', 'side-hustle'],
      accent: { bg: 'bg-teal-600', text: 'text-white' },
      subs: [
        { label: t('pillars.subs.financeBudget'), view: 'expenses',    icon: CircleDollarSign, desc: 'Cost-of-living, ROI & budget' },
        { label: t('pillars.subs.marketHubs'),    view: 'heatmap',     icon: TrendingUp,       desc: 'Global career market intel' },
        { label: t('pillars.subs.jobsBoard'),     view: 'jobs',        icon: Briefcase,        desc: 'Live listings & opportunities' },
        { label: t('pillars.subs.sideHustle'),    view: 'side-hustle', icon: Zap,              desc: 'AI side hustle suggestions' },
      ],
    },
    {
      id: 'network', label: t('pillars.network'), icon: Users, primaryView: 'network', views: ['network'],
      accent: { bg: 'bg-rose-600', text: 'text-white' },
      subs: [
        { label: t('pillars.subs.communities'),   view: 'network', icon: MessageSquare, desc: 'Industry channels & peer groups' },
      ],
    },
    {
      id: 'analytics', label: t('pillars.analytics'), icon: BarChart3, primaryView: 'analytics', views: ['analytics', 'burnout'],
      accent: { bg: 'bg-indigo-600', text: 'text-white' },
      subs: [
        { label: t('pillars.subs.marketTrends'),  view: 'analytics', icon: TrendingUp, desc: 'AI-powered job market intelligence' },
        { label: t('pillars.subs.burnout'),        view: 'burnout',   icon: Heart,      desc: 'Work-life balance & burnout check' },
      ],
    },
    {
      id: 'plans', label: t('pillars.plans'), icon: Crown, primaryView: 'pricing', views: ['pricing', 'enterprise'],
      accent: { bg: 'bg-amber-600', text: 'text-white' },
      subs: [
        { label: t('pillars.subs.pricing'),    view: 'pricing',    icon: Crown,        desc: 'Plans, upgrades & affiliate partners' },
        { label: t('pillars.subs.enterprise'), view: 'enterprise', icon: Building2,     desc: 'Team & company-scale solutions' },
      ],
    },
    ...(isAdmin ? [{
      id: 'admin', label: 'Admin', icon: ShieldCheck, primaryView: 'admin' as AppView, views: ['admin' as AppView],
      accent: { bg: 'bg-rose-700', text: 'text-white' },
      subs: [] as PillarSub[],
    }] : []),
  ];
  const persistedView = sessionStorage.getItem('cv_activeView') as AppView | null;
  const [activeView, setActiveViewState] = useState<AppView>(
    persistedView && VALID_VIEWS.includes(persistedView) ? persistedView : 'dashboard'
  );
  const setActiveView = (view: AppView) => {
    sessionStorage.setItem('cv_activeView', view);
    setActiveViewState(view);
    if (user?.id || (user as any)?.uid) {
      trackView((user.id || (user as any).uid) as string, view);
    }
  };
  const activePillar = PILLAR_DEFS.find(p => p.views.includes(activeView)) || PILLAR_DEFS[0];
  const LANG_OPTIONS = [
    { code: 'en' as const, flag: '🇬🇧', label: 'EN' },
    { code: 'es' as const, flag: '🇪🇸', label: 'ES' },
    { code: 'fr' as const, flag: '🇫🇷', label: 'FR' },
    { code: 'ar' as const, flag: '🇸🇦', label: 'AR' },
    { code: 'zh' as const, flag: '🇨🇳', label: 'ZH' },
  ];
  const [showMoreNav, setShowMoreNav] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [scholarshipHighlightId, setScholarshipHighlightId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string>("ai-engineer");
  const [institutionSearchQuery, setInstitutionSearchQuery] = useState("");
  const [institutionRoadmapContext, setInstitutionRoadmapContext] = useState<InstitutionRoadmapContext | null>(null);
  const [sparkEOpen, setSparkEOpen] = useState(false);
  const [sparkEPosition, setSparkEPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showA11yChecker, setShowA11yChecker] = useState(false);
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

  const [profile, setProfile] = useState<UserProfile>(() => {
    // user can be a flat DB row (email login) or a Firebase user with nested .profile
    // Flat fields use snake_case aliases written by the PUT route
    const p = user.profile;
    const interestsParsed = (() => {
      const raw = p?.interests ?? user.interests;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return raw.split(',').map((s: string) => s.trim()).filter(Boolean); } }
      return ["Technology", "Science"];
    })();
    return {
      name: p?.name || user.displayName || user.name || user.email?.split('@')[0] || "Explorer",
      age: p?.age ?? user.age ?? 16,
      education: p?.education || user.education || "High School",
      interests: interestsParsed,
      budget: p?.budget ?? user.budget ?? 30000,
      country: p?.country || user.country || "",
      targetLocation: p?.targetLocation || user.targetLocation || user.target_location || "",
      targetCareerId: p?.targetCareerId || user.targetCareerId || user.target_career_id || "",
      completedMilestones: p?.completedMilestones || [],
      academicPerformance: p?.academicPerformance || {
        gpa: p?.gpa ?? user.gpa ?? 3.0,
        achievements: [],
      },
    };
  });

  // Sync profile to Firestore when it changes
  useEffect(() => {
    if (!user?.uid) return;
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
  const [careers, setCareers] = useState<CareerPath[]>([]);
  const [isCareersLoading, setIsCareersLoading] = useState(true); // true: start loading immediately
  const [isAiCareerLoading, setIsAiCareerLoading] = useState(false);
  const [aiCareerSearchMessage, setAiCareerSearchMessage] = useState<string>("");
  
  // Dynamic data from LLM based on navigation
  const [dynamicInstitutions, setDynamicInstitutions] = useState<Institution[]>([]);
  const [isInstitutionsLoading, setIsInstitutionsLoading] = useState(false);
  const [dynamicMaterials, setDynamicMaterials] = useState<any[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [visaGuidance, setVisaGuidance] = useState<any>(null);
  const [isVisaLoading, setIsVisaLoading] = useState(false);
  const [dashboardIntel, setDashboardIntel] = useState<DashboardIntelligence | null>(null);
  const [isDashboardIntelLoading, setIsDashboardIntelLoading] = useState(false);
  
  const handleSelectPath = (id: string) => {
    setSelectedPathId(id);
    setProfile(prev => ({ ...prev, targetCareerId: id }));
    setActiveView('roadmap');
  };

  // Navigate to roadmap by job title — matches existing career or creates a synthetic one
  const handleSelectByTitle = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = careers.find(
      c => c.title.toLowerCase() === title.toLowerCase() || c.id === slug
    );
    if (existing) {
      handleSelectPath(existing.id);
      return;
    }
    // Create a synthetic career entry so RoadmapView has a title to work with
    const synthetic: CareerPath = {
      id: slug,
      title,
      description: `Explore the ${title} career path with AI-powered milestones and skill gap analysis.`,
      growth: 'medium',
      category: 'General',
      subCategory: '',
      milestones: [],
      workType: 'On-site',
      tags: [],
    };
    setCareers(prev => {
      if (prev.some(c => c.id === slug)) return prev;
      return [synthetic, ...prev];
    });
    setSelectedPathId(slug);
    setProfile(prev => ({ ...prev, targetCareerId: slug }));
    setActiveView('roadmap');
  };

  const handleAiCareerSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setAiCareerSearchMessage('Enter a query to search global careers with AI.');
      return;
    }

    setIsAiCareerLoading(true);
    setAiCareerSearchMessage(`Searching careers for "${trimmedQuery}"…`);

    try {
      const results = await aiSearchCareerPaths(trimmedQuery);
      if (results.length > 0) {
        setCareers(results);
        setSelectedPathId(results[0].id);
        setAiCareerSearchMessage(`Found ${results.length} career paths for "${trimmedQuery}".`);
      } else {
        // AI returned an empty array — try a simpler prompt automatically
        setAiCareerSearchMessage(`Refining search for "${trimmedQuery}"…`);
        const retry = await aiSearchCareerPaths(trimmedQuery.split(' ').slice(0, 5).join(' '));
        if (retry.length > 0) {
          setCareers(retry);
          setSelectedPathId(retry[0].id);
          setAiCareerSearchMessage(`Found ${retry.length} career paths for "${trimmedQuery}".`);
        } else {
          setAiCareerSearchMessage(`No career paths found for "${trimmedQuery}". Try a different term.`);
        }
      }
    } catch (error) {
      console.error('AI career search failed:', error);
      setAiCareerSearchMessage('AI search failed. Check your connection and try again.');
    } finally {
      setIsAiCareerLoading(false);
    }
  };

  const fetchTopGlobalCareers = async () => {
    setIsCareersLoading(true);
    setAiCareerSearchMessage("");
    const dynamicCareers = await getTopGlobalCareers();
    if (dynamicCareers && dynamicCareers.length > 0) {
      setCareers(dynamicCareers);
      if (!dynamicCareers.some(p => p.id === selectedPathId)) {
        setSelectedPathId(dynamicCareers[0].id);
      }
    }
    setIsCareersLoading(false);
  };

  useEffect(() => { fetchTopGlobalCareers(); }, []);

  // Fetch dashboard intelligence when component mounts or primary career changes
  useEffect(() => {
    const fetchDashboardIntel = async () => {
      if (!profile.targetCareerId && !selectedPathId) return;
      setIsDashboardIntelLoading(true);
      const intel = await getDashboardIntelligence(profile, profile.targetCareerId || selectedPathId);
      setDashboardIntel(intel);
      setIsDashboardIntelLoading(false);
    };
    fetchDashboardIntel();
  }, [profile.targetCareerId, selectedPathId]);

  // Institutions are now fetched internally by InstitutionsView based on country filter.
  // This outer fetch is kept only to pre-warm the initial location cache.
  const [institutionsFetchedForPath, setInstitutionsFetchedForPath] = React.useState<string | null>(null);
  useEffect(() => {
    const fetchKey = `${selectedPathId}__${profile.targetLocation || profile.country || 'Global'}`;
    if (activeView === 'institutions' && fetchKey !== institutionsFetchedForPath) {
      setInstitutionsFetchedForPath(fetchKey);
    }
  }, [activeView, selectedPathId, profile.targetLocation, profile.country, institutionRoadmapContext]);

  // Fetch study materials dynamically when navigating to materials view
  useEffect(() => {
    if (activeView === 'materials') {
      const fetchMaterials = async () => {
        setIsMaterialsLoading(true);
        const skillLevel = profile.academicPerformance?.gpa
          ? (profile.academicPerformance.gpa > 3.7 ? 'Advanced' : 'Intermediate')
          : 'Beginner';
        const region = profile.targetLocation || profile.country || 'Global';

        // Always resolve to a human-readable career title, never a bare numeric ID
        const isUsableId = (s: string) => !!s && !/^\d+$/.test(s);
        const selectedCareer = careers.find(c => c.id === selectedPathId);
        const careerTitle = selectedCareer?.title
          || (isUsableId(selectedPathId) ? selectedPathId.replace(/-/g, ' ') : null)
          || profile.targetCareerId?.replace(/-/g, ' ')
          || 'Technology & Computing';

        try {
          const materials = await getDynamicStudyMaterials(careerTitle, skillLevel, region);
          setDynamicMaterials(materials && materials.length > 0 ? materials : []);
        } catch {
          setDynamicMaterials([]);
        } finally {
          setIsMaterialsLoading(false);
        }
      };
      fetchMaterials();
    }
  }, [activeView, selectedPathId]);

  // Fetch visa guidance only when on institutions view
  useEffect(() => {
    if (activeView === 'institutions' && selectedPathId && profile.targetLocation) {
      const fetchVisaInfo = async () => {
        setIsVisaLoading(true);
        const selectedCareer = careers.find(c => c.id === selectedPathId);
        const guidance = await getVisaGuidance(profile, profile.targetLocation || '', selectedCareer?.title || selectedPathId);
        setVisaGuidance(guidance);
        setIsVisaLoading(false);
      };
      fetchVisaInfo();
    }
  }, [activeView, selectedPathId, profile.targetLocation]);

  const authProviderLabel = user?.providerData?.[0]?.providerId === 'google.com'
    ? 'Google Secure'
    : user?.providerData?.[0]?.providerId === 'password'
      ? 'Email Secure'
      : 'Secure Login';

  // ── LLM health probe ────────────────────────────────────────────────────
  const [llmHealth, setLlmHealth] = useState<LLMHealthStatus | null>(null);
  const [isReprobingLLM, setIsReprobingLLM] = useState(false);

  useEffect(() => {
    fetchLLMHealth().then(setLlmHealth);
  }, []);

  const handleReprobeLLM = async () => {
    setIsReprobingLLM(true);
    const result = await reprobeLLM();
    setLlmHealth(result);
    setIsReprobingLLM(false);
  };

  const completedMilestones = profile.completedMilestones?.length ?? 0;
  const totalMilestones = Math.max(careers.reduce((acc, curr) => acc + (curr.milestones?.length ?? 0), 0), 1);
  const profileCompletion = Math.min(100, Math.round((completedMilestones / totalMilestones) * 100) + (profile.targetLocation ? 10 : 0) + (profile.targetCareerId ? 10 : 0));

  const handleInsightClick = (insight: GlobalInsight) => {
    const query = `${insight.city} ${insight.category}`;
    setInstitutionSearchQuery(query);
    handleNavigate('institutions', { search: query });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onExit();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDockSparkE = () => {
    setSparkEPosition(pos => pos === 'bottom-right' ? 'bottom-left' : 'bottom-right');
  };

  const profileStatusLabel = profile.targetCareerId ? `${profile.targetCareerId} trajectory` : 'Career explorer';

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden relative">
      {/* Skip-to-content link for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:font-bold focus:text-sm focus:shadow-xl"
      >
        Skip to main content
      </a>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="flex items-center justify-between border-b border-slate-200/60 bg-white/70 backdrop-blur-xl px-4 py-3 z-[200] shrink-0 sticky top-0 gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={() => onExit()}>
          <Logo size={34} className="group-hover:scale-110 transition-transform rounded-xl shadow-xl shadow-indigo-200" />
          <span className="text-lg font-black tracking-tighter text-slate-900 hidden lg:block">CareerVision<span className="text-indigo-600 italic">AI</span></span>
        </div>

        {/* Desktop grouped nav — icon-only on md-xl, icon+label on xl+ */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 relative" aria-label="Main navigation">
          <div className="flex items-center gap-0.5 bg-slate-100/70 rounded-2xl p-1">
            {PILLAR_DEFS.map((pillar, idx) => {
              const isPillarActive = activePillar.id === pillar.id;
              const PillarIcon = pillar.icon;
              const showSeparator = idx > 0 && ['mobility', 'plans'].includes(pillar.id);
              return (
                <React.Fragment key={pillar.id}>
                  {showSeparator && (
                    <div className="w-px h-4 bg-slate-300/60 mx-0.5 self-center" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => handleNavigate(pillar.primaryView)}
                    aria-current={isPillarActive ? 'page' : undefined}
                    aria-label={pillar.label}
                    title={pillar.label}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-150 whitespace-nowrap',
                      isPillarActive
                        ? cn(pillar.accent.bg, pillar.accent.text, 'shadow-md shadow-black/10')
                        : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800'
                    )}
                  >
                    <PillarIcon size={14} aria-hidden="true" />
                    {/* Label hidden on md-xl, visible on xl+ */}
                    <span className="hidden xl:block">{pillar.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </nav>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Hamburger — visible on md (tablet) as supplement, hidden on xl+ */}
          <button
            className="xl:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors"
            onClick={() => setShowMobileNav(true)}
            aria-label="Open navigation"
            aria-expanded={showMobileNav}
            aria-controls="mobile-nav-drawer"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect y="3" width="18" height="1.8" rx="0.9" fill="currentColor"/><rect y="8.1" width="18" height="1.8" rx="0.9" fill="currentColor"/><rect y="13.2" width="18" height="1.8" rx="0.9" fill="currentColor"/></svg>
          </button>

          {/* Auth + logout — only on xl+ */}
          <div className="hidden xl:flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-1.5">
              <ShieldCheck size={11} className="text-emerald-600" />
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Secure</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[9px] font-black text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 hover:border-rose-500 bg-rose-50 rounded-md px-2 py-0.5 transition-all"
            >
              <LogOut size={9} /> Sign out
            </button>
          </div>

          {/* Language switcher popup — next to profile */}
          <div className="relative">
            <button
              onClick={() => setShowLangPopup(v => !v)}
              aria-label="Change language"
              aria-expanded={showLangPopup}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-300 bg-white hover:border-indigo-400 hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <Globe size={15} className="text-slate-600" />
              {/* Show flag + lang text on xl+ */}
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest hidden xl:block">
                {LANG_OPTIONS.find(l => l.code === language)?.flag ?? '🌐'} {language.toUpperCase()}
              </span>
              {/* Show just flag on md-xl */}
              <span className="text-base xl:hidden" aria-hidden="true">
                {LANG_OPTIONS.find(l => l.code === language)?.flag ?? '🌐'}
              </span>
            </button>
            <AnimatePresence>
              {showLangPopup && (
                <>
                  <div className="fixed inset-0 z-[9000]" onClick={() => setShowLangPopup(false)} />
                  <motion.div
                    key="lang-popup"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="fixed top-[64px] right-4 z-[9001] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 p-2 min-w-[160px]"
                  >
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1">Language</p>
                    {LANG_OPTIONS.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setShowLangPopup(false); }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all',
                          language === lang.code
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                      >
                        <span className="text-base leading-none">{lang.flag}</span>
                        <span className="font-black tracking-wider">{lang.label}</span>
                        {language === lang.code && <span className="ml-auto text-[9px] text-indigo-200 uppercase font-black">Active</span>}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Profile button — icon+name on xl+, icon-only on md-lg */}
          <button className="flex items-center gap-2 bg-white pl-1.5 pr-2 xl:pr-3 py-1.5 rounded-2xl border border-slate-300 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group" onClick={() => setShowProfileModal(true)}>
            <div className="h-8 w-8 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center group-hover:bg-indigo-600 transition-colors overflow-hidden shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-indigo-600 group-hover:text-white transition-colors" />
              )}
            </div>
            {/* Name visible only on xl+ */}
            <div className="hidden xl:flex flex-col items-start">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[110px]">{profile.name}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none truncate max-w-[110px]">{profileStatusLabel}</span>
            </div>
          </button>
        </div>
      </header>

      <div className="hidden lg:flex items-center justify-between gap-4 border-b border-slate-200/60 bg-indigo-50/80 px-5 py-2 text-[11px] text-slate-700 font-black uppercase tracking-[0.18em] z-20 shrink-0">
        <div className="flex flex-row items-center gap-3">
          <span className="text-slate-900">{profileCompletion}% profile complete</span>
          <span className="hidden xl:block text-slate-500">{profileStatusLabel} · {profile.targetLocation || 'Location pending'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden xl:block bg-white border border-indigo-100 px-3 py-1 rounded-full text-[10px] text-indigo-600">{authProviderLabel}</span>
          <button
            onClick={() => handleNavigate(profile.targetCareerId ? 'roadmap' : 'dashboard')}
            className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.18em] hover:bg-indigo-500 transition-colors"
          >
            Resume setup
          </button>
        </div>
      </div>

      {/* ── SUB-NAV STRIP ── */}
      {activePillar.subs.length > 0 && (
        <nav className="hidden md:flex items-center gap-1 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm px-5 py-2 z-20 shrink-0" aria-label={`${activePillar.label} sub-navigation`}>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mr-2" aria-hidden="true">{activePillar.label}</span>
          <div className="w-px h-3.5 bg-slate-200 mr-1.5" aria-hidden="true" />
          {activePillar.subs.map(sub => {
            const SubIcon = sub.icon;
            const isSubActive = activeView === sub.view;
            return (
              <button
                key={sub.view}
                onClick={() => handleNavigate(sub.view)}
                aria-current={isSubActive ? 'page' : undefined}
                aria-label={sub.label}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                  isSubActive
                    ? cn(activePillar.accent.bg, activePillar.accent.text, 'shadow-sm')
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                )}
              >
                <SubIcon size={11} aria-hidden="true" />
                {sub.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* ── MOBILE DRAWER ── */}
      <AnimatePresence>
        {showMobileNav && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mob-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 xl:hidden"
              onClick={() => setShowMobileNav(false)}
            />
            {/* Drawer panel */}
            <motion.div
              key="mob-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              id="mobile-nav-drawer"
              className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl xl:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <Logo size={32} className="rounded-xl" />
                  <span className="text-sm font-black text-white tracking-tighter">CareerVision<span className="text-indigo-400 italic">AI</span></span>
                </div>
                <button
                  onClick={() => setShowMobileNav(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={15} />
                </button>
              </div>
              {/* Nav items — grouped */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Mobile navigation">
                {/* Group: Core */}
                <div className="mb-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 px-3 mb-1">Core</p>
                  {PILLAR_DEFS.filter(p => p.id === 'dashboard' || p.id === 'admin').map(pillar => {
                    const isPillarActive = activePillar.id === pillar.id;
                    const PillarIcon = pillar.icon;
                    return (
                      <button
                        key={pillar.id}
                        onClick={() => { handleNavigate(pillar.primaryView); setShowMobileNav(false); }}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                          isPillarActive ? cn(pillar.accent.bg, pillar.accent.text) : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isPillarActive ? 'bg-white/20' : 'bg-slate-100')}>
                          <PillarIcon size={15} className={isPillarActive ? 'text-white' : 'text-slate-600'} />
                        </div>
                        <p className="flex-1 text-left">{pillar.label}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="h-px bg-slate-100 mx-2 my-2" />

                {/* Group: Discover & Coaching & Mobility */}
                <div className="mb-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 px-3 mb-1">Discover & Grow</p>
                  {PILLAR_DEFS.filter(p => ['explore', 'ai-coach', 'mobility'].includes(p.id)).map(pillar => {
                    const isPillarActive = activePillar.id === pillar.id;
                    const PillarIcon = pillar.icon;
                    return (
                      <div key={pillar.id}>
                        <button
                          onClick={() => {
                            handleNavigate(pillar.primaryView);
                            if (pillar.subs.length === 0) setShowMobileNav(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                            isPillarActive ? cn(pillar.accent.bg, pillar.accent.text) : 'text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isPillarActive ? 'bg-white/20' : 'bg-slate-100')}>
                            <PillarIcon size={15} className={isPillarActive ? 'text-white' : 'text-slate-600'} />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p>{pillar.label}</p>
                            {pillar.subs.length > 0 && (
                              <p className={cn('text-[9px] font-medium normal-case tracking-normal mt-0.5 truncate', isPillarActive ? 'text-white/60' : 'text-slate-400')}>
                                {pillar.subs.slice(0, 3).map(s => s.label).join(' · ')}{pillar.subs.length > 3 ? ` +${pillar.subs.length - 3}` : ''}
                              </p>
                            )}
                          </div>
                          {pillar.subs.length > 0 && (
                            <ChevronRight size={12} className={cn('shrink-0 transition-transform', isPillarActive && 'rotate-90')} />
                          )}
                        </button>
                        {isPillarActive && pillar.subs.length > 0 && (
                          <div className="ml-4 pl-4 border-l-2 border-slate-100 mt-0.5 mb-1 space-y-0.5">
                            {pillar.subs.map(sub => {
                              const SubIcon = sub.icon;
                              const isSubActive = activeView === sub.view;
                              return (
                                <button
                                  key={sub.view}
                                  onClick={() => { handleNavigate(sub.view); setShowMobileNav(false); }}
                                  className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                                    isSubActive ? cn(pillar.accent.bg, pillar.accent.text, 'shadow-sm') : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                  )}
                                >
                                  <SubIcon size={12} />
                                  <div className="text-left flex-1 min-w-0">
                                    <p>{sub.label}</p>
                                    <p className="text-[9px] font-medium normal-case tracking-normal mt-0.5 text-slate-400 truncate">{sub.desc}</p>
                                  </div>
                                  {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="h-px bg-slate-100 mx-2 my-2" />

                {/* Group: Community, Analytics, Plans */}
                <div className="mb-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 px-3 mb-1">Community & Plans</p>
                  {PILLAR_DEFS.filter(p => ['network', 'analytics', 'plans'].includes(p.id)).map(pillar => {
                    const isPillarActive = activePillar.id === pillar.id;
                    const PillarIcon = pillar.icon;
                    return (
                      <div key={pillar.id}>
                        <button
                          onClick={() => {
                            handleNavigate(pillar.primaryView);
                            if (pillar.subs.length <= 1) setShowMobileNav(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                            isPillarActive ? cn(pillar.accent.bg, pillar.accent.text) : 'text-slate-600 hover:bg-slate-50'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', isPillarActive ? 'bg-white/20' : 'bg-slate-100')}>
                            <PillarIcon size={15} className={isPillarActive ? 'text-white' : 'text-slate-600'} />
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p>{pillar.label}</p>
                            {pillar.subs.length > 0 && (
                              <p className={cn('text-[9px] font-medium normal-case tracking-normal mt-0.5 truncate', isPillarActive ? 'text-white/60' : 'text-slate-400')}>
                                {pillar.subs.map(s => s.label).join(' · ')}
                              </p>
                            )}
                          </div>
                          {pillar.subs.length > 1 && (
                            <ChevronRight size={12} className={cn('shrink-0 transition-transform', isPillarActive && 'rotate-90')} />
                          )}
                        </button>
                        {isPillarActive && pillar.subs.length > 1 && (
                          <div className="ml-4 pl-4 border-l-2 border-slate-100 mt-0.5 mb-1 space-y-0.5">
                            {pillar.subs.map(sub => {
                              const SubIcon = sub.icon;
                              const isSubActive = activeView === sub.view;
                              return (
                                <button
                                  key={sub.view}
                                  onClick={() => { handleNavigate(sub.view); setShowMobileNav(false); }}
                                  className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all',
                                    isSubActive ? cn(pillar.accent.bg, pillar.accent.text, 'shadow-sm') : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                  )}
                                >
                                  <SubIcon size={12} />
                                  <div className="text-left flex-1 min-w-0">
                                    <p>{sub.label}</p>
                                    <p className="text-[9px] font-medium normal-case tracking-normal mt-0.5 text-slate-400 truncate">{sub.desc}</p>
                                  </div>
                                  {isSubActive && <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Language quick-switch in mobile drawer */}
                <div className="h-px bg-slate-100 mx-2 my-2" />
                <div className="px-3 pb-1">
                  <p className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Language</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { code: 'en' as const, flag: '🇬🇧', label: 'EN' },
                      { code: 'es' as const, flag: '🇪🇸', label: 'ES' },
                      { code: 'fr' as const, flag: '🇫🇷', label: 'FR' },
                      { code: 'ar' as const, flag: '🇸🇦', label: 'AR' },
                      { code: 'zh' as const, flag: '🇨🇳', label: 'ZH' },
                    ].map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all',
                          language === lang.code ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions — inside the scrollable nav so they're always reachable */}
                <div className="h-px bg-slate-100 mx-2 my-2" />
                <div className="px-3 pb-3 space-y-2">
                  <button
                    onClick={() => { setSparkEOpen(true); setShowMobileNav(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
                  >
                    <Sparkles size={15} />
                    <span className="text-xs font-black uppercase tracking-widest">Ask Spark.E</span>
                  </button>
                  <button
                    onClick={() => { handleLogout(); setShowMobileNav(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-xs font-black uppercase tracking-widest text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all"
                  >
                    <LogOut size={13} /> Sign Out
                  </button>
                </div>
              </nav>
              {/* Drawer footer — kept minimal now that actions live in the nav */}
              <div className="px-5 py-3 border-t border-slate-100">
                <p className="text-[9px] text-slate-400 text-center font-medium">CareerVision AI · easycareer-ai.decodflow.com</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Main Content Viewport */}
      <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto scrollbar-hide relative z-10 px-4 lg:px-10 py-6 pb-24 lg:pb-32" aria-label="Main content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className={activeView === 'institutions' ? 'min-h-full' : 'h-full'}
          >
            {activeView === 'dashboard' && <Dashboard profile={profile} onSelectPath={handleSelectPath} onSelectByTitle={handleSelectByTitle} careers={careers} isLoading={isCareersLoading} onInitInterview={initiateInterview} onAiCareerSearch={handleAiCareerSearch} isAiCareerLoading={isAiCareerLoading} aiCareerSearchMessage={aiCareerSearchMessage} onNavigate={handleNavigate} dashboardIntel={dashboardIntel} isDashboardIntelLoading={isDashboardIntelLoading} onResetToGlobal={fetchTopGlobalCareers} onNavigateToScholarship={(id) => { setScholarshipHighlightId(id); handleNavigate('expenses'); }} />}

            {/* Admin view — full width, no sidebar */}
            {activeView === 'admin' && isAdmin && (
              <AdminDashboard adminEmail={user.email} />
            )}
            
            {activeView !== 'dashboard' && activeView !== 'admin' && (
              <div className={activeView === 'institutions' ? 'grid grid-cols-12 gap-8' : 'grid grid-cols-12 gap-8 h-full'}>
                <section className={activeView === 'institutions' ? 'col-span-12 xl:col-span-9 space-y-8' : 'col-span-12 xl:col-span-9 space-y-8 h-full'}>
                   {activeView === 'roadmap' && <RoadmapView profile={profile} pathId={selectedPathId} careers={careers} onNavigate={handleNavigate} onInitInterview={initiateInterview} />}
                   {activeView === 'jobs' && <JobBoardView profile={profile} />}
                   {activeView === 'institutions' && <InstitutionsView profile={profile} selectedPathId={selectedPathId} careerTitle={careers.find(c => c.id === selectedPathId)?.title || selectedPathId} initialSearch={institutionSearchQuery} onInitInterview={initiateInterview} institutions={dynamicInstitutions} isLoading={isInstitutionsLoading} visaGuidance={visaGuidance} isVisaLoading={isVisaLoading} roadmapContext={institutionRoadmapContext} />}
                   {activeView === 'heatmap' && <HeatmapView profile={profile} />}
                   {activeView === 'materials' && <MaterialsView materials={dynamicMaterials} isLoading={isMaterialsLoading} careerTitle={careers.find(c => c.id === selectedPathId)?.title || profile.targetCareerId?.replace(/-/g,' ') || 'Technology'} />}
                   {activeView === 'parent' && <ParentalDashboard profile={profile} onBack={() => setActiveView('dashboard')} careers={careers} />}
                   {activeView === 'expenses' && <FinancialView profile={profile} setProfile={setProfile} highlightScholarshipId={scholarshipHighlightId} onClearHighlight={() => setScholarshipHighlightId(null)} />}
                   {activeView === 'resume' && <ResumeManager profile={profile} userId={user.id || user.uid} />}
                   {activeView === 'job-match' && <JobMatchView userId={user.id || user.uid} resumeContent={null} />}
                   {activeView === 'interview' && (
                     isMobileDevice()
                       ? <MobileInterviewView userId={(user?.id || (user as any)?.uid) as string} defaultRole={profile.targetCareerId?.replace(/-/g,' ') || 'Software Engineer'} />
                       : <InterviewPrepView userId={user.id || user.uid} defaultRole={profile.targetCareerId?.replace(/-/g,' ') || 'Software Engineer'} />
                   )}
                   {activeView === 'directory' && <CareerDirectoryView profile={profile} />}
                   {activeView === 'network' && <NetworkView profile={profile} />}
                   {activeView === 'analytics' && <AnalyticsDashboard profile={profile} userId={(user?.id || (user as any)?.uid) as string} />}
                   {activeView === 'pricing' && <PricingPage userId={(user?.id || (user as any)?.uid) as string} onNavigate={(v) => setActiveView(v as AppView)} />}
                   {activeView === 'enterprise' && <EnterpriseView userId={(user?.id || (user as any)?.uid) as string} onNavigatePricing={() => setActiveView('pricing')} />}
                   {activeView === 'career-coach'  && <CareerCoachChat profile={profile} />}
                   {activeView === 'industry-sim'  && <IndustrySimulator profile={profile} />}
                   {activeView === 'soft-skills'   && <SoftSkillsAssessment profile={profile} />}
                   {activeView === 'salary-coach'  && <SalaryNegotiationCoach profile={profile} />}
                   {activeView === 'side-hustle'   && <SideHustleAdvisor profile={profile} />}
                   {activeView === 'burnout'        && <BurnoutPrevention profile={profile} />}
                </section>

                <section className="hidden xl:col-span-3 xl:flex flex-col gap-8 overflow-hidden">
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

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl shadow-slate-200/60" aria-label="Mobile navigation">
        <div className="grid grid-cols-4 h-16" role="list">
          {PILLAR_DEFS.map(pillar => {
            const isPillarActive = activePillar.id === pillar.id;
            const PillarIcon = pillar.icon;
            return (
              <button
                key={pillar.id}
                role="listitem"
                onClick={() => handleNavigate(pillar.primaryView)}
                aria-current={isPillarActive ? 'page' : undefined}
                aria-label={pillar.label}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 transition-all relative',
                  isPillarActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                )}
              >
                {isPillarActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full"
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                    aria-hidden="true"
                  />
                )}
                <PillarIcon size={18} strokeWidth={isPillarActive ? 2.5 : 1.8} aria-hidden="true" />
                <span className="text-[9px] font-black uppercase tracking-widest" aria-hidden="true">{pillar.label}</span>
              </button>
            );
          })}
        </div>
        {/* Safe area spacer for iOS */}
        <div className="h-safe-bottom bg-white/95" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
      
      <InterviewHotSeat 
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        role={interviewRole}
        company={interviewCompany}
        location={interviewLocation}
        onStatsUpdate={setInterviewStats}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        profile={profile}
        onProfileUpdate={(updated) => setProfile(updated)}
      />

      {/* Spark.E Floating Bubble */}
      <div className={`fixed bottom-24 lg:bottom-8 ${sparkEPosition === 'bottom-right' ? 'right-6 items-end' : 'left-6 items-start'} z-50 flex flex-col gap-2`}>
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
        {/* Bubble button — explicit container boundary */}
        <div className="p-2 bg-white/80 backdrop-blur-md rounded-[22px] shadow-xl shadow-slate-300/50 border border-slate-200/70">
          <motion.button
            onClick={() => setSparkEOpen(o => !o)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/40 flex items-center justify-center text-white overflow-hidden"
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

      {/* Accessibility Toolbar — always visible */}
      <AccessibilityToolbar
        isAdmin={!!(user?.email && import.meta.env.VITE_ADMIN_EMAIL && user.email === import.meta.env.VITE_ADMIN_EMAIL)}
        onOpenChecker={() => setShowA11yChecker(true)}
      />

      {/* Accessibility Checker — admin only, opened on demand */}
      {showA11yChecker && (
        <AccessibilityChecker onClose={() => setShowA11yChecker(false)} />
      )}

    </div>
  );
}
