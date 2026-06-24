import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, Clock, DollarSign, ExternalLink, RefreshCw, ChevronRight, Zap, Globe, Home } from 'lucide-react';
import { getOpenInternships, type OpenInternship } from '../services/geminiService';
import type { UserProfile } from '../types/career';

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Type badge ───────────────────────────────────────────────────────────────
const TYPE_STYLES: Record<string, string> = {
  Remote: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Hybrid: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'On-site': 'bg-amber-50 text-amber-700 border-amber-200',
};

// ─── Country tag badge ────────────────────────────────────────────────────────
function CountryBadge({ tag }: { tag: string }) {
  const isHome = /home/i.test(tag);
  const isTarget = /target/i.test(tag);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border',
        isHome && 'bg-blue-50 text-blue-700 border-blue-200',
        isTarget && 'bg-purple-50 text-purple-700 border-purple-200',
        !isHome && !isTarget && 'bg-slate-50 text-slate-500 border-slate-200',
      )}
    >
      {isHome ? <Home size={8} /> : isTarget ? <Globe size={8} /> : null}
      {tag}
    </span>
  );
}

// ─── Single card ──────────────────────────────────────────────────────────────
function InternshipCard({ item, index }: { item: OpenInternship; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="relative bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md shadow-sm transition-all group p-4"
    >
      {item.isNew && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[7px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-1.5 py-0.5">
          <Zap size={7} /> New
        </span>
      )}

      {/* Company + title */}
      <div className="pr-10 mb-2">
        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">{item.company}</p>
        <h4 className="text-sm font-black text-slate-800 leading-snug">{item.title}</h4>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <CountryBadge tag={item.countryTag} />
        <span className={cn('text-[8px] font-black border rounded-full px-1.5 py-0.5', TYPE_STYLES[item.type] ?? TYPE_STYLES.Hybrid)}>
          {item.type}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-3">
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
          <MapPin size={9} className="text-slate-400 shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
          <Clock size={9} className="text-slate-400 shrink-0" />
          {item.duration}
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
          <DollarSign size={9} className="text-slate-400 shrink-0" />
          {item.stipend}
        </div>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
          <Briefcase size={9} className="text-slate-400 shrink-0" />
          {item.deadline === 'Rolling' ? 'Rolling deadline' : `Due ${item.deadline}`}
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {item.skills.map(skill => (
          <span key={skill} className="text-[8px] font-bold bg-slate-100 text-slate-600 rounded-md px-1.5 py-0.5">
            {skill}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mb-3">{item.description}</p>

      {/* Apply CTA */}
      <a
        href={item.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest transition-colors group-hover:shadow-md"
      >
        Apply Now <ExternalLink size={9} />
      </a>
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function InternshipSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2 animate-pulse">
      <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
      <div className="h-4 w-48 bg-slate-100 rounded-full" />
      <div className="flex gap-1.5">
        <div className="h-3.5 w-16 bg-slate-100 rounded-full" />
        <div className="h-3.5 w-12 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-2.5 bg-slate-100 rounded-full" />)}
      </div>
      <div className="h-7 bg-slate-100 rounded-xl" />
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────
interface Props {
  profile: UserProfile;
  onNavigateToJobs?: () => void;
}

type Filter = 'all' | 'home' | 'target' | 'remote';

export default function InternshipWidget({ profile, onNavigateToJobs }: Props) {
  const [internships, setInternships] = useState<OpenInternship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [lastFetch, setLastFetch] = useState<number>(0);

  const homeCountry = profile.country || 'United Kingdom';
  const targetCountry = profile.targetLocation || profile.country || 'United Kingdom';
  const careerTitle = profile.targetCareer || profile.targetCareerId || 'Technology';

  const fetch = useCallback(async (force = false) => {
    // Debounce: don't re-fetch within 5 minutes unless forced
    if (!force && Date.now() - lastFetch < 5 * 60 * 1000 && internships.length > 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOpenInternships({
        homeCountry,
        targetCountry,
        careerTitle,
        interests: profile.interests ?? [],
      });
      setInternships(data);
      setLastFetch(Date.now());
    } catch (err) {
      console.error('[InternshipWidget] fetch error:', err);
      setError('Could not load internships. Check that the server is running or try again.');
    } finally {
      setLoading(false);
    }
  }, [homeCountry, targetCountry, careerTitle, profile.interests, lastFetch, internships.length]);

  useEffect(() => { fetch(); }, [homeCountry, targetCountry, careerTitle]); // eslint-disable-line

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = internships.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'home') return /home/i.test(i.countryTag);
    if (filter === 'target') return /target/i.test(i.countryTag);
    if (filter === 'remote') return i.type === 'Remote';
    return true;
  });

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'home', label: homeCountry },
    { key: 'target', label: targetCountry === homeCountry ? 'Target' : targetCountry },
    { key: 'remote', label: 'Remote' },
  ];

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-5 h-5 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Briefcase size={11} className="text-white" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Open Internships</h3>
            {internships.length > 0 && (
              <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
                {filtered.length} listings
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-medium ml-7">
            {homeCountry}{targetCountry !== homeCountry ? ` · ${targetCountry}` : ''} · matched to your profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetch(true)}
            disabled={loading}
            className="flex items-center gap-1 text-[9px] font-black text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {onNavigateToJobs && (
            <button
              onClick={onNavigateToJobs}
              className="flex items-center gap-1 text-[9px] font-black text-slate-500 hover:text-indigo-600 transition-colors"
            >
              All Jobs <ChevronRight size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {internships.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all',
                filter === f.key
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading && internships.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <InternshipSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-10 text-center bg-white rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
            <RefreshCw size={16} className="text-amber-500" />
          </div>
          <p className="text-sm font-black text-slate-700 mb-1">Internships unavailable</p>
          <p className="text-[10px] text-slate-400 font-medium mb-4 max-w-xs">{error}</p>
          <button
            onClick={() => fetch(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filtered.length === 0 && internships.length > 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm text-slate-400 font-medium">No internships match this filter.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {filtered.map((item, i) => (
              <InternshipCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
