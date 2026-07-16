import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { subscribeToGlobalIntelFeed } from '../services/globalIntelService';
import type {
  CuratedInsight,
  GlobalIntelFeed,
  GlobalIntelFeedItem,
  InsightCategory,
  InsightColor,
  InsightRegion,
  InsightTimeWindow,
} from '../types/globalIntel';

const COLOR_MAP: Record<InsightColor, { pill: string; dot: string }> = {
  emerald: { pill: 'bg-emerald-500 text-white', dot: 'bg-emerald-400' },
  indigo: { pill: 'bg-indigo-500 text-white', dot: 'bg-indigo-400' },
  amber: { pill: 'bg-amber-500 text-white', dot: 'bg-amber-400' },
  rose: { pill: 'bg-rose-500 text-white', dot: 'bg-rose-400' },
  purple: { pill: 'bg-purple-500 text-white', dot: 'bg-purple-400' },
};

const AI_HIRING_LINES: CuratedInsight[] = [
  {
    flag: '🇺🇸',
    city: 'SILICON VALLEY',
    stat: 'AI SKILL REQUIREMENTS REACHED 75% OF ALL U.S. TECH JOB POSTINGS THIS MONTH',
    category: 'ai-hiring',
    color: 'emerald',
  },
  {
    flag: '🇬🇧',
    city: 'LONDON',
    stat: 'TECH JOB OPENINGS RISE 30% IN EARLY 2026 AS ENGINEERING ROLES LEAD THE MARKET REBOUND',
    category: 'ai-hiring',
    color: 'indigo',
  },
  {
    flag: '🇨🇦',
    city: 'TORONTO',
    stat: '90% OF TECH WORKERS NATIONWIDE ARE NOW REPORTING INTEGRATION OF AI INTO DAILY WORKFLOWS',
    category: 'ai-hiring',
    color: 'amber',
  },
  {
    flag: '🇸🇬',
    city: 'SINGAPORE',
    stat: 'COMPANIES DEPLOYING CENTRALIZED AI HUBS SEE A 25% BOOST IN INDIVIDUAL PRODUCTIVITY',
    category: 'ai-hiring',
    color: 'purple',
  },
];

const ENTRY_LEVEL_LINES: CuratedInsight[] = [
  {
    flag: '🇩🇪',
    city: 'BERLIN',
    stat: 'EMPLOYERS REPORT 85% HIGHER ENGAGEMENT RATES FOR GRADUATES WITH PORTFOLIOS OVER TRADITIONAL RESUMES',
    category: 'entry-level',
    color: 'rose',
  },
  {
    flag: '🇮🇳',
    city: 'MUMBAI',
    stat: '92% OF RECENT GRADUATES IN INDIA EXPRESS HIGH VALUE IN EXPERIENTIAL, SIMULATED WORK PROJECTS',
    category: 'entry-level',
    color: 'amber',
  },
  {
    flag: '🇦🇺',
    city: 'SYDNEY',
    stat: 'COMPANIES PRIORITIZING RESUME SKILL ALIGNMENT REPORT A 45% DROP IN INITIAL TIME-TO-HIRE',
    category: 'entry-level',
    color: 'emerald',
  },
  {
    flag: '🌍',
    city: 'GLOBAL',
    stat: 'PwC REPORTS AI IS CREATING A TWO-TRACK LABOUR MARKET REWARDING PRACTICAL JUDGMENT AND LEADERSHIP',
    category: 'entry-level',
    color: 'indigo',
  },
];

const ATS_SUCCESS_LINES: CuratedInsight[] = [
  {
    flag: '🇺🇸',
    city: 'NEW YORK',
    stat: 'RECRUITERS ESTIMATE THAT 70% OF GENERIC RESUMES ARE DISCARDED BY PARSING ALGORITHMS BEFORE HUMAN REVIEW',
    category: 'ats-success',
    color: 'rose',
  },
  {
    flag: '🌍',
    city: 'GLOBAL',
    stat: 'APPLICANTS REPORT A 3X HIGHER RESPONSE RATE WHEN SUBMITTING TAILORED, SINGLE-COLUMN ATS-FRIENDLY RESUMES',
    category: 'ats-success',
    color: 'emerald',
  },
  {
    flag: '🇬🇧',
    city: 'LONDON',
    stat: 'NEARLY 60% OF RECRUITERS ARE NOW UTILIZING GENERATIVE AI TO SPEED UP INITIAL RESUME SCREENING',
    category: 'ats-success',
    color: 'indigo',
  },
];

const DEFAULT_LABEL = 'Global Intel';
const DEFAULT_ROTATION_MS = 4200;
const FEED_URL = ((import.meta as any).env?.VITE_GLOBAL_INTEL_FEED_URL || '/global-intel.json') as string;

function normalizeCategory(category: InsightCategory, items: IntelFeedItem[] | undefined, fallback: CuratedInsight[]): CuratedInsight[] {
  if (!Array.isArray(items) || items.length === 0) return fallback;

  const normalized = items
    .filter(item => item?.flag && item?.city && item?.stat)
    .map(item => ({
      flag: item.flag!.trim(),
      city: item.city!.trim().toUpperCase(),
      stat: item.stat!.trim().toUpperCase(),
      category,
      color: item.color && item.color in COLOR_MAP ? item.color : fallback[0]?.color || 'indigo',
      regions: Array.isArray(item.regions) ? item.regions : undefined,
      timeWindows: Array.isArray(item.timeWindows) ? item.timeWindows : undefined,
      priority: typeof item.priority === 'number' ? item.priority : 0,
    }));

  return normalized.length > 0 ? normalized : fallback;
}

function inferRegion(country?: string): InsightRegion {
  const normalized = (country || '').trim().toLowerCase();
  if (['usa', 'us', 'united states', 'canada', 'mexico', 'brazil', 'argentina'].includes(normalized)) return 'americas';
  if (['uk', 'united kingdom', 'england', 'germany', 'france', 'spain', 'italy', 'netherlands', 'sweden'].includes(normalized)) return 'europe';
  if (['india', 'singapore', 'china', 'japan', 'south korea', 'uae', 'united arab emirates'].includes(normalized)) return 'asia';
  if (['nigeria', 'kenya', 'south africa', 'ghana', 'egypt'].includes(normalized)) return 'africa';
  if (['australia', 'new zealand'].includes(normalized)) return 'oceania';

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
  if (tz.includes('america')) return 'americas';
  if (tz.includes('europe')) return 'europe';
  if (tz.includes('asia')) return 'asia';
  if (tz.includes('africa')) return 'africa';
  if (tz.includes('australia') || tz.includes('pacific')) return 'oceania';
  return 'global';
}

function inferTimeWindow(date = new Date()): InsightTimeWindow {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function pickScheduledItem(
  items: CuratedInsight[],
  region: InsightRegion,
  timeWindow: InsightTimeWindow,
  rotation: number,
  useRegionScheduling: boolean,
  useTimeScheduling: boolean,
): CuratedInsight {
  const eligible = items.filter((item) => {
    const regionOk = !useRegionScheduling || !item.regions?.length || item.regions.includes('global') || item.regions.includes(region);
    const timeOk = !useTimeScheduling || !item.timeWindows?.length || item.timeWindows.includes(timeWindow);
    return regionOk && timeOk;
  });

  const pool = eligible.length > 0 ? eligible : items;
  const ordered = [...pool].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return ordered[rotation % ordered.length];
}

export const NewsFlash = ({ country }: { country: string }) => {
  const [rotation, setRotation] = useState(0);
  const [label, setLabel] = useState(DEFAULT_LABEL);
  const [rotationMs, setRotationMs] = useState(DEFAULT_ROTATION_MS);
  const [useRegionScheduling, setUseRegionScheduling] = useState(true);
  const [useTimeScheduling, setUseTimeScheduling] = useState(true);
  const [aiHiringLines, setAiHiringLines] = useState<CuratedInsight[]>(AI_HIRING_LINES);
  const [entryLevelLines, setEntryLevelLines] = useState<CuratedInsight[]>(ENTRY_LEVEL_LINES);
  const [atsSuccessLines, setAtsSuccessLines] = useState<CuratedInsight[]>(ATS_SUCCESS_LINES);
  const [now, setNow] = useState(() =>
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );

  useEffect(() => {
    let cancelled = false;

    const applyFeed = (feed: GlobalIntelFeed | null) => {
      if (!feed || cancelled) return;
      setLabel(typeof feed.label === 'string' && feed.label.trim() ? feed.label.trim() : DEFAULT_LABEL);
      setRotationMs(typeof feed.rotationMs === 'number' && feed.rotationMs >= 2000 ? feed.rotationMs : DEFAULT_ROTATION_MS);
      setUseRegionScheduling(feed.scheduling?.useRegionScheduling !== false);
      setUseTimeScheduling(feed.scheduling?.useTimeScheduling !== false);
      setAiHiringLines(normalizeCategory('ai-hiring', feed.categories?.['ai-hiring'], AI_HIRING_LINES));
      setEntryLevelLines(normalizeCategory('entry-level', feed.categories?.['entry-level'], ENTRY_LEVEL_LINES));
      setAtsSuccessLines(normalizeCategory('ats-success', feed.categories?.['ats-success'], ATS_SUCCESS_LINES));
    };

    const loadFeed = async () => {
      try {
        const res = await fetch(FEED_URL, { cache: 'no-store' });
        if (!res.ok) return;

        applyFeed((await res.json()) as GlobalIntelFeed);
      } catch {
        // Keep curated fallback content when the feed is unavailable or malformed.
      }
    };

    loadFeed();
    const unsubscribe = subscribeToGlobalIntelFeed(
      (feed) => applyFeed(feed),
      () => {
        // Firestore may be unavailable for public clients; keep JSON/fallback path active.
      }
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setRotation(i => i + 1);
    }, rotationMs);
    return () => clearInterval(timer);
  }, [rotationMs]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().toISOString().slice(0, 16).replace('T', ' '));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const region = inferRegion(country);
  const timeWindow = inferTimeWindow();

  const visible = useMemo(
    () => [
      pickScheduledItem(aiHiringLines, region, timeWindow, rotation, useRegionScheduling, useTimeScheduling),
      pickScheduledItem(atsSuccessLines, region, timeWindow, rotation, useRegionScheduling, useTimeScheduling),
      pickScheduledItem(entryLevelLines, region, timeWindow, rotation, useRegionScheduling, useTimeScheduling),
    ],
    [aiHiringLines, atsSuccessLines, entryLevelLines, region, rotation, timeWindow, useRegionScheduling, useTimeScheduling]
  );

  return (
    <div className="bg-slate-800 border-b border-slate-700 shrink-0 z-30 overflow-hidden">
      <div className="px-6 py-2.5 flex items-center justify-between gap-4">

        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] hidden sm:block">
            {label}
          </span>
          <span className="w-px h-4 bg-slate-600 hidden sm:block" />
        </div>

        {/* Cycling pills */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden min-w-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map(item => {
              const c = COLOR_MAP[item.color] ?? COLOR_MAP.indigo;
              return (
                <motion.div
                  key={`${item.category}-${item.city}-${item.stat}`}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="flex items-center gap-2 shrink-0 min-w-0"
                >
                  <span className="text-sm leading-none select-none">{item.flag}</span>
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide hidden md:block whitespace-nowrap">
                    {item.city}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide ${c.pill} max-w-[42vw] lg:max-w-none truncate lg:whitespace-nowrap`}>
                    {item.stat}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Timestamp + Live badge */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium hidden lg:block tabular-nums">
            {now} UTC
          </span>
          <div className="flex items-center gap-1.5 bg-emerald-500 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
