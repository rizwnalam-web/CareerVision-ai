import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, MapPin, Briefcase, DollarSign, Clock, 
  ExternalLink, Building2, Filter, Loader2, Sparkles,
  ArrowUpRight, Tag, Bookmark, CheckCircle2, X,
  ChevronDown, BrainCircuit, TrendingUp, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Avatar from './Avatar';
import { JobListing, UserProfile, MarketInsights } from '../types/career';
import { JOB_LISTINGS, CAREER_PATHS } from '../constants/mockData';
import { aiSearchJobs, getAiJobSuggestions, getAiProactiveJobRecommendations, getMarketInsights } from '../services/geminiService';

type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Rejected';

const JOB_STATUS_ORDER: JobStatus[] = ['Saved', 'Applied', 'Interviewing', 'Rejected'];

const COUNTRY_ALIASES: Record<string, string[]> = {
  usa: ['usa', 'us', 'united states', 'united states of america'],
  uk: ['uk', 'united kingdom', 'great britain', 'england'],
  usa_test: ['america', 'states'],
};

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  usa: 'USD',
  'united states': 'USD',
  uk: 'GBP',
  'united kingdom': 'GBP',
  switzerland: 'CHF',
  germany: 'EUR',
  france: 'EUR',
  canada: 'CAD',
  australia: 'AUD',
  japan: 'JPY',
  india: 'INR',
};

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  CHF: 1.09,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.74,
  AUD: 0.66,
  JPY: 0.0068,
  INR: 0.012,
};

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
}

function isSameCountry(userCountry: string, location: string): boolean {
  const normalizedUser = normalizeCountryName(userCountry);
  const normalizedLocation = normalizeCountryName(location);

  const aliases = COUNTRY_ALIASES[normalizedUser] || [];
  if (aliases.some(alias => normalizedLocation.includes(alias))) {
    return true;
  }

  return normalizedLocation.includes(normalizedUser);
}

function inferVisaBadge(location: string, type: string, userCountry: string) {
  const isRemote = /remote/i.test(type) || /remote/i.test(location) || /global/i.test(location);
  if (isRemote) {
    return { label: 'Remote — no visa required', color: 'emerald' };
  }

  if (userCountry && isSameCountry(userCountry, location)) {
    return { label: 'Local role — likely no visa needed', color: 'blue' };
  }

  return { label: 'Visa sponsorship likely', color: 'amber' };
}

function inferCurrencyFromCountry(country: string) {
  const normalized = normalizeCountryName(country);
  return CURRENCY_BY_COUNTRY[normalized] || 'USD';
}

function convertCurrency(amount: number, from: string, to: string) {
  if (from === to) return amount;
  const fromRate = EXCHANGE_RATES[from] ?? 1;
  const toRate = EXCHANGE_RATES[to] ?? 1;
  return amount * (fromRate / toRate);
}

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${Math.round(value)}`;
  }
}

function getSalaryDisplay(job: JobListing, preferredCurrency: string) {
  const primaryMin = formatCurrency(job.salary.min, job.salary.currency);
  const primaryMax = formatCurrency(job.salary.max, job.salary.currency);
  if (preferredCurrency === job.salary.currency) {
    return { primary: `${primaryMin}–${primaryMax}` };
  }

  const convertedMin = convertCurrency(job.salary.min, job.salary.currency, preferredCurrency);
  const convertedMax = convertCurrency(job.salary.max, job.salary.currency, preferredCurrency);
  return {
    primary: `${primaryMin}–${primaryMax}`,
    secondary: `(~${formatCurrency(convertedMin, preferredCurrency)}–${formatCurrency(convertedMax, preferredCurrency)})`,
  };
}

function inferMarketHeading(locationQuery: string, profile: UserProfile) {
  const trimmed = locationQuery.trim();
  if (!trimmed) return profile.targetLocation || profile.country || 'Global';
  if (/remote|global/i.test(trimmed)) return 'Remote / Global';
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : trimmed;
}

function inferMarketRegion(locationQuery: string, profile: UserProfile) {
  const trimmed = locationQuery.trim();
  if (!trimmed) return profile.targetLocation || profile.country || 'Global';
  if (/remote|global/i.test(trimmed)) return profile.targetLocation || profile.country || 'Global';
  const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : profile.targetLocation || profile.country || 'Global';
}

function calculateMatchScore(job: JobListing, profile: UserProfile, searchQuery: string, locationQuery: string, activeCareer: string) {
  let score = 30;
  const careerMatch = job.careerId === profile.targetCareerId;
  if (careerMatch) score += 35;

  const search = searchQuery.toLowerCase();
  if (search && (job.title.toLowerCase().includes(search) || job.company.toLowerCase().includes(search))) {
    score += 20;
  }

  const location = locationQuery.toLowerCase();
  if (location && (job.location.toLowerCase().includes(location) || /remote|global/i.test(location))) {
    score += 20;
  } else if (/remote/i.test(job.type)) {
    score += 10;
  }

  if (activeCareer !== 'All' && job.careerId === CAREER_PATHS.find(c => c.title === activeCareer)?.id) {
    score += 10;
  }

  return Math.min(100, score);
}

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Posted today';
  if (diffDays === 1) return 'Posted yesterday';
  if (diffDays < 30) return `Posted ${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  return `Posted ${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
}

export const JobBoardView = ({ profile }: { profile: UserProfile }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [activeCareer, setActiveCareer] = useState<string>("All");
  const [activeType, setActiveType] = useState<string>("All");
  const [isSearching, setIsSearching] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('savedJobs');
    return saved ? JSON.parse(saved) : [];
  });

  // Real-time AI-fetched base jobs (replaces mock JOB_LISTINGS)
  const [baseJobs, setBaseJobs] = useState<JobListing[]>([]);
  const [isBaseJobsLoading, setIsBaseJobsLoading] = useState(true);

  // Fetch real jobs from AI on mount + career change
  useEffect(() => {
    const fetchBaseJobs = async () => {
      setIsBaseJobsLoading(true);
      try {
        const results = await getAiJobSuggestions(profile);
        setBaseJobs(results && results.length > 0 ? results : JOB_LISTINGS);
      } catch {
        setBaseJobs(JOB_LISTINGS); // fallback to mock data
      } finally {
        setIsBaseJobsLoading(false);
      }
    };
    fetchBaseJobs();
  }, [profile.targetCareerId, profile.country, profile.targetLocation]);

  // AI Search State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<JobListing[]>([]);
  const [hasAiSearched, setHasAiSearched] = useState(false);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<JobListing[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Proactive State
  const [proactiveRecs, setProactiveRecs] = useState<JobListing[]>([]);
  const [isProactiveLoading, setIsProactiveLoading] = useState(false);
  const [jobStatusMap, setJobStatusMap] = useState<Record<string, JobStatus>>(() => {
    const existing = localStorage.getItem('jobStatusMap');
    return existing ? (JSON.parse(existing) as Record<string, JobStatus>) : {};
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(4);

  // Market Insights State
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const preferredCurrency = profile.preferredCurrency || inferCurrencyFromCountry(profile.country);

  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  useEffect(() => {
    localStorage.setItem('jobStatusMap', JSON.stringify(jobStatusMap));
  }, [jobStatusMap]);

  useEffect(() => {
    const fetchInsights = async () => {
      const careerId = profile.targetCareerId || CAREER_PATHS[0].id;
      const marketRegion = inferMarketRegion(locationQuery, profile);
      setIsLoadingInsights(true);
      try {
        const insights = await getMarketInsights(careerId, marketRegion);
        setMarketInsights(insights);
      } catch (error) {
        console.error("Failed to fetch market insights:", error);
      } finally {
        setIsLoadingInsights(false);
      }
    };
    fetchInsights();
  }, [locationQuery, profile.targetCareerId, profile.targetLocation, profile.country]);

  const toggleSaveJob = (id: string) => {
    setSavedJobIds(prev => {
      const saved = prev.includes(id);
      const updated = saved ? prev.filter(jobId => jobId !== id) : [...prev, id];

      setJobStatusMap((statusMap) => {
        if (saved) {
          const nextMap = { ...statusMap };
          if (nextMap[id] === 'Saved') {
            delete nextMap[id];
          }
          return nextMap;
        }

        return {
          ...statusMap,
          [id]: statusMap[id] || 'Saved',
        };
      });

      return updated;
    });
  };

  const updateJobStatus = (id: string, status: JobStatus) => {
    setJobStatusMap((prev) => ({
      ...prev,
      [id]: status,
    }));

    if (status === 'Saved') {
      setSavedJobIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  const loadProactiveRecs = async () => {
    setIsProactiveLoading(true);
    try {
      const savedJobs = baseJobs.filter(j => savedJobIds.includes(j.id));
      if (savedJobs.length === 0) {
        const fallback = baseJobs.filter(j => j.careerId === profile.targetCareerId).slice(0, 4);
        setProactiveRecs(fallback);
        setCurrentPage(1);
        return;
      }

      const results = await getAiProactiveJobRecommendations(profile, savedJobs);
      setProactiveRecs(results);
      setCurrentPage(1);
    } catch (error) {
      console.error("Proactive Recs Error:", error);
      const fallback = baseJobs.filter(j => j.careerId === profile.targetCareerId).slice(0, 4);
      setProactiveRecs(fallback);
      setCurrentPage(1);
    } finally {
      setIsProactiveLoading(false);
    }
  };

  const careers = ["All", ...CAREER_PATHS.map(c => c.title)];

  const filteredJobs = useMemo(() => {
    // Real AI jobs as primary source, with AI search / proactive overrides
    const sourceList = [...baseJobs];
    if (hasAiSearched) sourceList.unshift(...aiResults);
    if (suggestions.length > 0) sourceList.unshift(...suggestions);
    if (proactiveRecs.length > 0) sourceList.unshift(...proactiveRecs);

    // Deduplicate by ID
    const uniqueMap = new Map<string, JobListing>();
    sourceList.forEach(job => uniqueMap.set(job.id, job));
    const combined = Array.from(uniqueMap.values());

    return combined.filter(job => {
      const career = CAREER_PATHS.find(c => c.id === job.careerId);
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLocation = job.location.toLowerCase().includes(locationQuery.toLowerCase());
      const matchesCareer = activeCareer === "All" || career?.title === activeCareer;
      const matchesType = activeType === "All" || job.type === activeType;
      const matchesSaved = !showSavedOnly || savedJobIds.includes(job.id);

      return matchesSearch && matchesLocation && matchesCareer && matchesType && matchesSaved;
    });
  }, [baseJobs, searchQuery, locationQuery, activeCareer, activeType, aiResults, hasAiSearched, suggestions, proactiveRecs, showSavedOnly, savedJobIds]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleJobsCount = paginatedJobs.length;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const loadAiSuggestions = async () => {
    setIsSuggesting(true);
    setShowSuggestions(true);
    try {
      const results = await getAiJobSuggestions(profile);
      setSuggestions(results);
    } catch (error) {
      console.error("Suggestions Error:", error);
      const fallback = baseJobs.filter(j => j.careerId === profile.targetCareerId).slice(0, 4);
      setSuggestions(fallback);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAiSearch = async () => {
    const q = searchQuery.trim() || "Top jobs";
    const loc = locationQuery.trim() || "Global";

    setIsAiSearching(true);
    setHasAiSearched(true);
    try {
      const results = await aiSearchJobs(q, loc);
      setAiResults(results);
      setCurrentPage(1);
    } catch (error) {
      console.error("AI Job Search Error:", error);
      const fallback = JOB_LISTINGS.filter(j => j.careerId === profile.targetCareerId).slice(0, 4);
      setAiResults(fallback);
      setCurrentPage(1);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 800);
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Global Job Board
            </h2>
            <div className="bg-indigo-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
              Live
            </div>
          </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-500" />
            {isBaseJobsLoading ? (
              <span className="flex items-center gap-2 text-indigo-600">
                <Loader2 size={14} className="animate-spin" /> Fetching live jobs…
              </span>
            ) : (
              <>
                {filteredJobs.length} Market Matches Analyzed
                {filteredJobs.length > visibleJobsCount && (
                  <span className="text-[10px] text-slate-400 normal-case">({filteredJobs.length} total, page {currentPage}/{totalPages})</span>
                )}
              </>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSavedOnly(!showSavedOnly)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
              showSavedOnly 
                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm" 
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
            )}
          >
            <Bookmark size={14} className={showSavedOnly ? "fill-rose-600" : ""} />
            {showSavedOnly ? "Showing Saved" : "Show Saved"}
            {savedJobIds.length > 0 && (
              <span className={cn(
                "ml-1 px-1.5 py-0.5 rounded-md text-[8px]",
                showSavedOnly ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {savedJobIds.length}
              </span>
            )}
          </button>

          <button 
            onClick={loadProactiveRecs}
            disabled={isProactiveLoading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
              proactiveRecs.length > 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 disabled:opacity-30"
            )}
          >
            {isProactiveLoading ? <Loader2 size={14} className="animate-spin" /> : <TrendingUp size={14} />}
            {isProactiveLoading ? "Sourcing..." : proactiveRecs.length > 0 ? "AI Recommendations Ready" : "Source Jobs From Saved"}
          </button>

          <button 
            onClick={loadAiSuggestions}
            disabled={isSuggesting}
            className="group relative flex items-center gap-3 bg-white border-2 border-indigo-100 px-6 py-4 rounded-[2rem] hover:border-indigo-500 transition-all shadow-sm hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50"
          >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
            {isSuggesting ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Smart Scout</p>
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Personalized Suggestions</p>
          </div>
        </button>
      </div>
    </div>

    {/* Suggested Section */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest">AI Market Pulse</h3>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-tight">Based on your {profile.targetCareerId || 'career'} path in {profile.country}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSuggestions(false)}
                  className="text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

                  {isSuggesting ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-white/50 animate-pulse rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((job) => (
                    <motion.div 
                      key={`suggest-${job.id}`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between gap-4 group hover:border-indigo-500 transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar name={job.company} src={job.logo} size={40} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0" />
                        <div className="overflow-hidden">
                           <h4 className="text-xs font-black text-slate-950 truncate uppercase tracking-tight">{job.title}</h4>
                           <p className="text-[10px] font-bold text-slate-400 truncate">{job.company}</p>
                        </div>
                      </div>
                      <a href={job.url} target="_blank" className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                        <ArrowUpRight size={14} />
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Controls */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Role or Company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>
        <div className="flex-1 relative group">
          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="City, Country or Remote..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all"
          />
        </div>
        <div className="relative group min-w-[200px]">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={activeCareer}
            onChange={(e) => setActiveCareer(e.target.value)}
            className="w-full appearance-none bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-10 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500/30 transition-all cursor-pointer"
          >
            {careers.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            className="bg-slate-900 text-white px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-indigo-500/10 active:scale-95 flex items-center justify-center gap-3"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span className="hidden sm:inline">Search</span>
          </button>

          <button 
            onClick={handleAiSearch}
            disabled={isAiSearching}
            className={cn(
              "px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 disabled:grayscale",
              isAiSearching ? "bg-indigo-900 text-white" : "bg-indigo-600 text-white shadow-indigo-200 hover:-translate-y-1"
            )}
          >
            {isAiSearching ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            <span className="hidden sm:inline">{isAiSearching ? "Discovering..." : "AI Discover"}</span>
          </button>
        </div>
      </div>

      {/* AI Search Active Indicator */}
      {hasAiSearched && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-6 py-4 rounded-[2rem]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <Sparkles size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em]">Spark.E Job Intelligence Active</p>
              <p className="text-xs font-bold text-indigo-600">Showing {aiResults.length} global vacancies matched to your intent</p>
            </div>
          </div>
          <button 
            onClick={() => { setHasAiSearched(false); setAiResults([]); }}
            className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
          >
            Clear AI Findings
          </button>
        </motion.div>
      )}

      {/* Proactive Recommendations Section */}
      {proactiveRecs.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-emerald-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden mb-8"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-20 -mr-32 -mt-32" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/20">
                 <BrainCircuit size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">AI Recommended Jobs</h3>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Sourced uniquely from your saved patterns</p>
              </div>
            </div>
            <button 
              onClick={() => setProactiveRecs([])}
              className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Close Feed
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proactiveRecs.map((job) => (
              <motion.div 
                key={`proactive-${job.id}`}
                whileHover={{ scale: 1.02 }}
                className="bg-white/5 border border-white/10 p-5 rounded-[2rem] hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4 mb-4">
                   <Avatar name={job.company} src={job.logo} size={48} className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center overflow-hidden shrink-0" />
                   <div className="overflow-hidden">
                      <h4 className="font-black text-sm uppercase truncate">{job.title}</h4>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase truncate">{job.company}</p>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-emerald-100/60">
                      <MapPin size={12} />
                      <span className="text-[9px] font-bold uppercase">{job.location}</span>
                   </div>
                   <a 
                    href={job.url} 
                    target="_blank" 
                    className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                   >
                     <ArrowUpRight size={18} />
                   </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Market Insights Column */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400 border border-white/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Market Pulse</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inferMarketHeading(locationQuery, profile)} Intelligence</p>
              </div>
            </div>

            {isLoadingInsights ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse rounded-2xl" />)}
              </div>
            ) : marketInsights ? (
              <div className="space-y-8">
                {/* Salaries */}
                {marketInsights.salaryBenchmarks && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Benchmarks</p>
                    <span className="px-2 py-1 bg-white/10 rounded-md text-[8px] font-black uppercase">{marketInsights.salaryBenchmarks.currency ?? 'USD'} / Yr</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Entry</p>
                      <p className="text-xs font-black">{((marketInsights.salaryBenchmarks.entry ?? 0) / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30">
                      <p className="text-[8px] font-bold text-indigo-400 uppercase mb-1">Mid</p>
                      <p className="text-xs font-black">{((marketInsights.salaryBenchmarks.mid ?? 0) / 1000).toFixed(0)}k</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-bold text-slate-500 uppercase mb-1">Senior</p>
                      <p className="text-xs font-black">{((marketInsights.salaryBenchmarks.senior ?? 0) / 1000).toFixed(0)}k</p>
                    </div>
                  </div>
                </div>
                )}

                {/* Growth */}
                {marketInsights.growthForecast && (
                <div className="bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Growth Forecast</p>
                      <p className="text-lg font-black mt-1">+{marketInsights.growthForecast.percentage ?? 0}% Demand</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-xl",
                      marketInsights.growthForecast.trend === 'rising' ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                    )}>
                      <TrendingUp size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-emerald-100/60 leading-relaxed italic">
                    "{marketInsights.growthForecast.description ?? ''}"
                  </p>
                </div>
                )}

                {/* Skills */}
                {marketInsights.inDemandSkills?.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-Demand Skills</p>
                  <div className="space-y-3">
                    {marketInsights.inDemandSkills.map((skill, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase">
                          <span>{skill.name}</span>
                          <span className="text-indigo-400">{skill.importance}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.importance}%` }}
                            className="h-full bg-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* Companies */}
                {marketInsights.topHiringCompanies?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Core Hiring Nodes</p>
                  <div className="flex flex-wrap gap-2">
                    {marketInsights.topHiringCompanies.map((company, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold text-slate-300">
                        {company}
                      </span>
                    ))}
                  </div>
                </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No detailed insights yet</p>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                <Lightbulb size={20} />
              </div>
              <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Spark.E Tip</p>
            </div>
            <p className="text-xs font-medium text-indigo-900/70 leading-relaxed italic">
              "Focusing on {marketInsights?.inDemandSkills?.[0]?.name || 'emerging technologies'} can increase your mid-level salary potential by up to 25% in the {profile.country} market."
            </p>
          </div>
        </div>

        {/* Job Listings Column */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-12 scrollbar-hide">
            {paginatedJobs.map((job, i) => (
              <JobCard 
                key={job.id} 
                job={job} 
                index={i} 
                status={jobStatusMap[job.id] ?? 'Saved'}
                isSaved={savedJobIds.includes(job.id)}
                onToggleSave={() => toggleSaveJob(job.id)}
                onChangeStatus={(status) => updateJobStatus(job.id, status)}
                userCountry={profile.country}
                preferredCurrency={preferredCurrency}
                matchScore={calculateMatchScore(job, profile, searchQuery, locationQuery, activeCareer)}
              />
            ))}
            {filteredJobs.length === 0 && !isBaseJobsLoading && (
              <div className="col-span-full py-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-4 text-center">
                <div className="p-6 bg-slate-50 rounded-full text-slate-300">
                  <Briefcase size={48} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No positions found</p>
                  <p className="text-slate-500 font-medium">Try adjusting your filters or location</p>
                </div>
              </div>
            )}
            {isBaseJobsLoading && filteredJobs.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center gap-4">
                <Loader2 size={36} className="text-indigo-500 animate-spin" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fetching live job listings…</p>
              </div>
            )}
          </div>
          {filteredJobs.length > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-3xl shadow-sm">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.24em]">
                Showing {visibleJobsCount} of {filteredJobs.length} matches
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className={cn(
                    "rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    currentPage <= 1 ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  )}
                >
                  Prev
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className={cn(
                    "rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                    currentPage >= totalPages ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const JobCard = ({ job, index, status, isSaved, onToggleSave, onChangeStatus, userCountry, preferredCurrency, matchScore }: { job: JobListing, index: number, status: JobStatus, isSaved: boolean, onToggleSave: () => void, onChangeStatus: (status: JobStatus) => void, userCountry: string, preferredCurrency: string, matchScore: number }) => {
  const career = CAREER_PATHS.find(c => c.id === job.careerId);
  const visaBadge = inferVisaBadge(job.location, job.type, userCountry);
  const salaryDisplay = getSalaryDisplay(job, preferredCurrency);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group bg-white border-2 border-transparent hover:border-indigo-100 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col gap-6 relative"
    >
      <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
          <Avatar name={job.company} src={job.logo} size={56} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm group-hover:bg-white transition-colors" />
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">
              {job.title}
            </h3>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2 mt-1">
              {job.company} <CheckCircle2 size={12} className="text-emerald-500" />
            </p>
            <p className="text-[10px] text-slate-400 mt-1" title={job.postedAt}>{formatRelativeDate(job.postedAt)}</p>
          </div>
        </div>
        <div className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
           {job.type}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <MapPin size={18} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location</p>
              <p className="text-xs font-black text-slate-900">{job.location}</p>
            </div>
          </div>
          <div className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]",
            visaBadge.color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : visaBadge.color === 'blue' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'
          )}>
            <span>{visaBadge.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Salary Estimate</p>
            <p className="text-xs font-black text-slate-900">
              {salaryDisplay.primary}
            </p>
            {salaryDisplay.secondary && (
              <p className="text-[9px] text-slate-500 mt-1">{salaryDisplay.secondary}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-600" aria-label={`Match score ${Math.round(matchScore)} percent`}>
            <Sparkles size={12} className="text-slate-500" /> {Math.round(matchScore)}% Match
          </div>
          {JOB_STATUS_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onChangeStatus(option)}
              className={cn(
                "text-[10px] font-black uppercase tracking-[0.24em] rounded-full px-3 py-2 transition-all",
                status === option
                  ? option === 'Rejected'
                    ? 'bg-rose-500 text-white'
                    : option === 'Interviewing'
                      ? 'bg-amber-500 text-white'
                      : option === 'Applied'
                        ? 'bg-sky-600 text-white'
                        : 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-between">
          <button 
            onClick={onToggleSave}
            className={cn(
              "p-2 rounded-xl transition-all active:scale-90",
              isSaved ? "text-rose-600 bg-rose-50 hover:bg-rose-100" : "text-slate-400 hover:text-rose-500 hover:bg-slate-50"
            )}
          >
             <Bookmark size={20} className={isSaved ? "fill-rose-600" : ""} />
          </button>
          <a 
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-600/20"
          >
            View Details <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

