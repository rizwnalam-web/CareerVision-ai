import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Globe, Lock, Unlock, TrendingUp, Star, Filter,
  Briefcase, ChevronRight, Loader2, Building2, MapPin,
  Zap, Award, RefreshCw, X, ArrowUpRight, Users, DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types/career';
import {
  getCareerDirectories,
  CareerDirectoryEntry,
  CareerDirectoryResult,
} from '../services/geminiService';

// ─── Constants ────────────────────────────────────────────────────────────────
const GROWTH_COLOR: Record<string, string> = {
  high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  stable: 'bg-blue-50 text-blue-700 border-blue-200',
};

const WORK_TYPE_COLOR: Record<string, string> = {
  Remote: 'bg-indigo-50 text-indigo-700',
  'On-site': 'bg-slate-100 text-slate-700',
  Hybrid: 'bg-purple-50 text-purple-700',
  Mobile: 'bg-rose-50 text-rose-700',
};

type Tab = 'top10' | 'home' | 'target';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 p-5 animate-pulse space-y-3">
    <div className="h-4 w-2/3 bg-slate-100 rounded-xl" />
    <div className="h-3 w-1/3 bg-slate-50 rounded-xl" />
    <div className="flex gap-2 mt-4">
      <div className="h-6 w-16 bg-slate-100 rounded-lg" />
      <div className="h-6 w-20 bg-slate-100 rounded-lg" />
    </div>
    <div className="h-3 w-full bg-slate-50 rounded-xl mt-2" />
    <div className="h-3 w-4/5 bg-slate-50 rounded-xl" />
  </div>
);

interface EntryCardProps {
  entry: CareerDirectoryEntry;
  rank?: number;
  onSelect: (entry: CareerDirectoryEntry) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, rank, onSelect }) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.25 }}
    onClick={() => onSelect(entry)}
    className="bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 p-5 text-left transition-all group w-full"
  >
    {/* Header row */}
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {rank !== undefined && (
          <span className={cn(
            'shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black',
            rank === 0 ? 'bg-amber-400 text-white' :
            rank === 1 ? 'bg-slate-300 text-slate-700' :
            rank === 2 ? 'bg-orange-300 text-white' :
            'bg-slate-100 text-slate-500'
          )}>
            {rank + 1}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900 tracking-tight leading-tight truncate group-hover:text-indigo-700 transition-colors">
            {entry.title}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
            {entry.sector} · {entry.country}
          </p>
        </div>
      </div>

      {/* Visibility badge */}
      <div className={cn(
        'shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider',
        entry.visibility === 'public'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      )}>
        {entry.visibility === 'public'
          ? <><Unlock size={9} />Public</>
          : <><Lock size={9} />Private</>}
      </div>
    </div>

    {/* Match score bar */}
    <div className="mb-3">
      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
        <span>Goal Match</span>
        <span className="text-indigo-600">{entry.matchScore}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${entry.matchScore}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            entry.matchScore >= 80 ? 'bg-indigo-500' :
            entry.matchScore >= 60 ? 'bg-amber-400' : 'bg-slate-300'
          )}
        />
      </div>
    </div>

    {/* Stats row */}
    <div className="flex items-center gap-2 flex-wrap mb-3">
      <span className={cn('px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider', GROWTH_COLOR[entry.growth])}>
        {entry.growth} growth
      </span>
      <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider', WORK_TYPE_COLOR[entry.workType] ?? 'bg-slate-100 text-slate-600')}>
        {entry.workType}
      </span>
      {entry.visaFriendly && (
        <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-wider">
          Visa ✓
        </span>
      )}
    </div>

    {/* Salary + demand */}
    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
      <span className="flex items-center gap-1">
        <DollarSign size={10} className="text-emerald-500" />
        {entry.avgSalaryUSD > 0 ? `~$${Math.round(entry.avgSalaryUSD / 1000)}k / yr` : 'Varies'}
      </span>
      <span className="flex items-center gap-1">
        <Zap size={9} className="text-indigo-400" />
        Demand {entry.demandScore}/100
      </span>
    </div>

    {/* Match reason */}
    {entry.matchReason && (
      <p className="text-[9px] text-slate-400 italic mt-2 leading-relaxed line-clamp-2">
        "{entry.matchReason}"
      </p>
    )}
  </motion.button>
);

// ─── Detail Drawer ────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  entry: CareerDirectoryEntry;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ entry, onClose }) => (
  <motion.div
    initial={{ opacity: 0, x: 40 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 40 }}
    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
    className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
  >
    {/* Header */}
    <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mb-2',
          entry.visibility === 'public' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        )}>
          {entry.visibility === 'public' ? <Unlock size={9} /> : <Lock size={9} />}
          {entry.visibility}
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{entry.title}</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
          {entry.category} · {entry.country}
        </p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
      >
        <X size={14} />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Match score */}
      <div className="bg-indigo-50 rounded-2xl p-4">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-700 mb-2">
          <span>Goal Match Score</span>
          <span>{entry.matchScore}%</span>
        </div>
        <div className="h-2 bg-indigo-100 rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${entry.matchScore}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-indigo-500 rounded-full"
          />
        </div>
        {entry.matchReason && (
          <p className="text-[10px] text-indigo-700/70 italic leading-relaxed">"{entry.matchReason}"</p>
        )}
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Avg Salary', value: entry.avgSalaryUSD > 0 ? `$${Math.round(entry.avgSalaryUSD / 1000)}k/yr` : 'Varies', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Demand Score', value: `${entry.demandScore}/100`, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Growth', value: entry.growth.charAt(0).toUpperCase() + entry.growth.slice(1), icon: Zap, color: 'text-amber-600 bg-amber-50' },
          { label: 'Work Mode', value: entry.workType, icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cn('rounded-2xl p-3', stat.color.split(' ')[1])}>
              <Icon size={14} className={stat.color.split(' ')[0]} />
              <p className="text-[8px] font-black uppercase tracking-wider text-slate-500 mt-1">{stat.label}</p>
              <p className="text-sm font-black text-slate-800">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Visa friendly */}
      <div className={cn(
        'flex items-center gap-2 p-3 rounded-2xl text-sm font-bold',
        entry.visaFriendly ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'
      )}>
        <Globe size={14} />
        {entry.visaFriendly ? 'Visa-friendly role — international candidates welcomed' : 'Local hiring preference — visa may be required'}
      </div>

      {/* Top Skills */}
      {entry.topSkills.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Skills Required</p>
          <div className="flex flex-wrap gap-2">
            {entry.topSkills.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Companies */}
      {entry.topCompanies.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Hiring Companies</p>
          <div className="space-y-2">
            {entry.topCompanies.map((company, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                <Building2 size={12} className="text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-700">{company}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {entry.tags.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile;
}

export const CareerDirectoryView: React.FC<Props> = ({ profile }) => {
  const [data, setData] = useState<CareerDirectoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(profile.targetLocation ? 'target' : 'top10');
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [growthFilter, setGrowthFilter] = useState<'all' | 'high' | 'medium' | 'stable'>('all');
  const [selected, setSelected] = useState<CareerDirectoryEntry | null>(null);

  const homeCountry = profile.country || 'Global';
  const targetCountry = profile.targetLocation || homeCountry;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCareerDirectories(profile);
      setData(result);
    } catch (err) {
      setError('Failed to load career directories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [profile.country, profile.targetLocation, profile.targetCareerId]);

  // Collect all countries across active dataset for filter dropdown
  const activeEntries: CareerDirectoryEntry[] = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'top10') return data.top10;
    if (activeTab === 'home') return data.homeCountry;
    return data.targetCountry;
  }, [data, activeTab]);

  const allCountries = useMemo(() => {
    const set = new Set(activeEntries.map(e => e.country));
    return ['All', ...Array.from(set).sort()];
  }, [activeEntries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return activeEntries.filter(e => {
      const matchSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        e.sector.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q));
      const matchCountry = countryFilter === 'All' || e.country === countryFilter;
      const matchVis = visibilityFilter === 'all' || e.visibility === visibilityFilter;
      const matchGrowth = growthFilter === 'all' || e.growth === growthFilter;
      return matchSearch && matchCountry && matchVis && matchGrowth;
    });
  }, [activeEntries, search, countryFilter, visibilityFilter, growthFilter]);

  const tabs: { key: Tab; label: string; count: number | undefined }[] = [
    { key: 'top10', label: `Top 10 Matches`, count: data?.top10.length },
    { key: 'home', label: `Home · ${homeCountry}`, count: data?.homeCountry.length },
    { key: 'target', label: `Target · ${targetCountry}`, count: data?.targetCountry.length },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none mb-1.5">
            Career Directory
          </h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">
            {homeCountry} · {targetCountry} · AI-personalised
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Country + Visibility context pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
          <MapPin size={10} />Home: {homeCountry}
        </span>
        {targetCountry !== homeCountry && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider">
            <Globe size={10} />Target: {targetCountry}
          </span>
        )}
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
          <Unlock size={10} />Public = Global demand
        </span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
          <Lock size={10} />Private = Local/Niche
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-full max-w-xl">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setCountryFilter('All'); }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === tab.key
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-md text-[8px]',
                activeTab === tab.key ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search careers, sectors, tags…"
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X size={10} />
            </button>
          )}
        </div>

        {/* Country filter */}
        <div className="relative">
          <MapPin size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={countryFilter}
            onChange={e => setCountryFilter(e.target.value)}
            className="pl-6 pr-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 focus:outline-none focus:border-indigo-400 transition-colors appearance-none cursor-pointer"
          >
            {allCountries.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Visibility filter */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'public', 'private'] as const).map(v => (
            <button
              key={v}
              onClick={() => setVisibilityFilter(v)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all',
                visibilityFilter === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {v === 'all' ? 'All' : v === 'public' ? <span className="flex items-center gap-1"><Unlock size={8} />Public</span> : <span className="flex items-center gap-1"><Lock size={8} />Private</span>}
            </button>
          ))}
        </div>

        {/* Growth filter */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'high', 'medium', 'stable'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGrowthFilter(g)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all',
                growthFilter === g
                  ? g === 'high' ? 'bg-emerald-500 text-white shadow-sm'
                    : g === 'medium' ? 'bg-amber-400 text-white shadow-sm'
                    : g === 'stable' ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {g === 'all' ? 'All Growth' : g}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-sm font-bold text-rose-700">
          {error}
          <button onClick={fetchData} className="ml-auto text-[10px] underline">Retry</button>
        </div>
      )}

      {/* Results count */}
      {!isLoading && !error && (
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          {search && ` for "${search}"`}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Filter size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No careers match your filters</p>
          <button
            onClick={() => { setSearch(''); setCountryFilter('All'); setVisibilityFilter('all'); setGrowthFilter('all'); }}
            className="mt-3 text-[10px] font-black text-indigo-500 hover:underline uppercase tracking-widest"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((entry, i) => (
              <EntryCard
                key={entry.id + activeTab}
                entry={entry}
                rank={activeTab === 'top10' ? i : undefined}
                onSelect={setSelected}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail drawer overlay */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40"
              onClick={() => setSelected(null)}
            />
            <DetailDrawer entry={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
