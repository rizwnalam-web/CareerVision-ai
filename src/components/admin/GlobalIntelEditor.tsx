import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, Save, Radio, Globe2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { saveGlobalIntelFeed, subscribeToGlobalIntelFeed } from '../../services/globalIntelService';
import type { GlobalIntelFeed } from '../../types/globalIntel';

const DEFAULT_EDITOR_FEED: GlobalIntelFeed = {
  version: 1,
  label: 'Global Intel',
  rotationMs: 4200,
  scheduling: {
    useRegionScheduling: true,
    useTimeScheduling: true,
  },
  categories: {
    'ai-hiring': [],
    'entry-level': [],
    'ats-success': [],
  },
};

function pretty(feed: GlobalIntelFeed) {
  return JSON.stringify(feed, null, 2);
}

export default function GlobalIntelEditor({ adminEmail }: { adminEmail: string }) {
  const [raw, setRaw] = useState(pretty(DEFAULT_EDITOR_FEED));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({ type: 'idle' });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalIntelFeed(
      (feed) => {
        const nextFeed = feed ? stripMeta(feed) : DEFAULT_EDITOR_FEED;
        setRaw(pretty(nextFeed));
        setLastUpdatedAt(feed && typeof (feed as any).updatedAt === 'string' ? (feed as any).updatedAt : null);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setStatus({ type: 'error', message: 'Could not load live ticker feed from Firestore.' });
      }
    );

    return () => unsubscribe();
  }, []);

  const parsed = useMemo(() => {
    try {
      return { value: JSON.parse(raw) as GlobalIntelFeed, error: null as string | null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : 'Invalid JSON' };
    }
  }, [raw]);

  const stats = useMemo(() => {
    const feed = parsed.value;
    return {
      aiHiring: feed?.categories?.['ai-hiring']?.length ?? 0,
      atsSuccess: feed?.categories?.['ats-success']?.length ?? 0,
      entryLevel: feed?.categories?.['entry-level']?.length ?? 0,
      rotationMs: feed?.rotationMs ?? 0,
    };
  }, [parsed.value]);

  const handleSave = async () => {
    if (!parsed.value) {
      setStatus({ type: 'error', message: 'Fix JSON validation errors before saving.' });
      return;
    }

    setSaving(true);
    setStatus({ type: 'idle' });
    try {
      await saveGlobalIntelFeed(stripMeta(parsed.value));
      setStatus({ type: 'success', message: 'Live ticker feed published to Firestore.' });
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      setStatus({ type: 'error', message: error instanceof Error ? error.message : 'Failed to save feed.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Radio size={12} /> Live Header Ticker CMS
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Edit the Firestore-backed JSON feed that powers the public Global Intel ticker. Public users can read it live; only the admin account can publish changes.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Editor</p>
            <p className="text-xs text-slate-300 font-medium">{adminEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
          <InfoCard label="AI / Cloud" value={stats.aiHiring} color="bg-emerald-700 text-emerald-100" />
          <InfoCard label="ATS / Resume" value={stats.atsSuccess} color="bg-indigo-700 text-indigo-100" />
          <InfoCard label="Entry Level" value={stats.entryLevel} color="bg-amber-700 text-amber-100" />
          <InfoCard label="Rotation" value={`${stats.rotationMs || '—'} ms`} color="bg-slate-700 text-slate-200" />
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticker Feed JSON</p>
              {parsed.error ? (
                <span className="text-[10px] text-rose-300 font-bold">Invalid JSON</span>
              ) : (
                <span className="text-[10px] text-emerald-300 font-bold">Valid JSON</span>
              )}
            </div>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[420px] bg-[#0d1526] border border-slate-700 rounded-2xl p-4 text-xs text-slate-100 font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-4">
            <div className="bg-[#0d1526] border border-slate-700 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scheduling Rules</p>
              <div className="space-y-2 text-xs text-slate-300">
                <p><span className="font-bold text-white">Region scheduling:</span> items can target `global`, `americas`, `europe`, `asia`, `africa`, or `oceania`.</p>
                <p><span className="font-bold text-white">Time scheduling:</span> items can target `morning`, `day`, `evening`, or `night`.</p>
                <p><span className="font-bold text-white">Priority:</span> higher `priority` values win inside matching region/time groups.</p>
              </div>
            </div>

            <div className="bg-[#0d1526] border border-slate-700 rounded-2xl p-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Live Path</p>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Globe2 size={13} className="text-indigo-300" />
                <span className="font-mono">siteConfig/globalIntel</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Last published: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : 'Never'}
              </p>
            </div>

            {status.type !== 'idle' && (
              <div className={cn(
                'flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs',
                status.type === 'success'
                  ? 'bg-emerald-900 border-emerald-700 text-emerald-200'
                  : 'bg-rose-900 border-rose-700 text-rose-200'
              )}>
                {status.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                <span>{status.message}</span>
              </div>
            )}

            {parsed.error && (
              <div className="flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs bg-rose-900 border-rose-700 text-rose-200">
                <AlertCircle size={13} />
                <span>{parsed.error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || loading || !!parsed.error}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
              >
                {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                Publish Live Feed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function stripMeta(feed: GlobalIntelFeed): GlobalIntelFeed {
  const { version, label, rotationMs, scheduling, categories } = feed;
  return { version, label, rotationMs, scheduling, categories };
}

function InfoCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#0d1526] border border-slate-700 rounded-xl p-3">
      <p className="text-slate-400 text-[10px] uppercase tracking-widest">{label}</p>
      <p className={cn('font-black mt-1 text-sm inline-flex px-2 py-1 rounded-lg', color)}>{value}</p>
    </div>
  );
}