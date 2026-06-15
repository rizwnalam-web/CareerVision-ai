import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { getGlobalContextInsights, GlobalInsight } from '../services/geminiService';

const COLOR_MAP: Record<GlobalInsight['color'], { pill: string }> = {
  emerald: { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  indigo:  { pill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' },
  amber:   { pill: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  rose:    { pill: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
  purple:  { pill: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
};

const FALLBACK: GlobalInsight[] = [
  { flag: '🇩🇪', city: 'BERLIN', country: 'Germany', stat: 'AI +24%', category: 'AI', color: 'emerald' },
  { flag: '🇸🇬', city: 'SINGAPORE', country: 'Singapore', stat: 'TECH +31%', category: 'Tech', color: 'indigo' },
  { flag: '🇬🇧', city: 'LONDON', country: 'UK', stat: 'FINTECH +18%', category: 'FinTech', color: 'amber' },
  { flag: '🇺🇸', city: 'NYC', country: 'USA', stat: 'AI ROLES +32%', category: 'AI', color: 'rose' },
  { flag: '🇦🇪', city: 'DUBAI', country: 'UAE', stat: 'CLOUD +28%', category: 'Cloud', color: 'purple' },
  { flag: '🇨🇦', city: 'TORONTO', country: 'Canada', stat: 'HIRING +21%', category: 'Tech', color: 'emerald' },
];

export const NewsFlash = ({ country }: { country: string }) => {
  const [insights, setInsights] = useState<GlobalInsight[]>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [now, setNow] = useState(() =>
    new Date().toISOString().slice(0, 16).replace('T', ' ')
  );

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      const data = await getGlobalContextInsights(
        country || 'Global',
        ['Technology', 'AI', 'Finance', 'Cloud'],
        'technology'
      );
      if (!cancelled && data.length > 0) setInsights(data);
      if (!cancelled) setLoading(false);
    };
    fetch();
    return () => { cancelled = true; };
  }, [country]);

  // Cycle visible insights every 3.5 s
  useEffect(() => {
    if (insights.length <= 4) return;
    const timer = setInterval(() => {
      setActiveIdx(i => (i + 1) % Math.max(1, insights.length - 3));
    }, 3500);
    return () => clearInterval(timer);
  }, [insights.length]);

  // Live clock (updates every minute)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().toISOString().slice(0, 16).replace('T', ' '));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Show 4 at a time
  const visible = insights.slice(activeIdx, activeIdx + 4);

  return (
    <div className="bg-slate-950 border-b border-white/[0.06] shrink-0 z-30 overflow-hidden">
      <div className="px-6 py-2 flex items-center justify-between gap-4">

        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] hidden sm:block">
            Global Intel
          </span>
        </div>

        {/* Cycling pills */}
        <div className="flex-1 flex items-center gap-3 overflow-hidden min-w-0">
          {loading ? (
            [0, 1, 2, 3].map(i => (
              <div key={i} className="h-6 w-28 rounded-full bg-white/5 animate-pulse shrink-0" />
            ))
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map(item => {
                const c = COLOR_MAP[item.color] ?? COLOR_MAP.indigo;
                return (
                  <motion.div
                    key={`${item.city}-${item.stat}`}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="flex items-center gap-1.5 shrink-0 max-w-[220px]"
                  >
                    <span className="text-base leading-none select-none">{item.flag}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden md:block truncate" title={item.city}>
                      {item.city}:
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap truncate ${c.pill}`} title={item.stat}>
                      {item.stat}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Timestamp + Live badge */}
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
