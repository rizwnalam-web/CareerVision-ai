import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check, Zap, Users, Building2, Star, ArrowRight,
  Crown, Sparkles, Shield, Globe, X, Loader2, CheckCircle2,
} from "lucide-react";
import { usePlans, useSubscription } from "../hooks/useSubscription";
import {
  fetchAffiliatePartners,
  trackAffiliateClick,
  type Plan,
  type PlanSlug,
  type AffiliatePartner,
} from "../services/subscriptionService";
import { STRIPE_ENABLED, startStripeCheckout } from "../services/stripeService";

// ── Partner brand colours ─────────────────────────────────────────────────────
const PARTNER_META: Record<string, { color: string; emoji: string }> = {
  "linkedin-jobs": { color: "#0A66C2", emoji: "💼" },
  indeed:          { color: "#2164F3", emoji: "🔍" },
  glassdoor:       { color: "#0CAA41", emoji: "🪟" },
  coursera:        { color: "#0056D3", emoji: "🎓" },
  udemy:           { color: "#A435F0", emoji: "📚" },
  ziprecruiter:    { color: "#1AAE30", emoji: "⚡" },
  upwork:          { color: "#14A800", emoji: "🔗" },
  toptal:          { color: "#204ECF", emoji: "💎" },
};

// ── Per-plan card styling ─────────────────────────────────────────────────────
const PLAN_META: Record<PlanSlug, {
  gradient: string; border: string; glow: string;
  icon: React.ReactNode; accentColor: string;
  badge?: string; badgeColor?: string;
  cta: string;
}> = {
  free: {
    gradient: "from-slate-700 to-slate-800",
    border: "border-slate-600/70",
    glow: "",
    icon: <Globe className="w-5 h-5 text-slate-200" />,
    accentColor: "text-slate-300",
    cta: "bg-slate-500 hover:bg-slate-400 text-white font-bold",
  },
  pro: {
    gradient: "from-indigo-800 to-violet-800",
    border: "border-indigo-400/60",
    glow: "shadow-2xl shadow-indigo-800/70",
    badge: "Most Popular",
    badgeColor: "bg-indigo-500 text-white",
    icon: <Zap className="w-5 h-5 text-indigo-200" />,
    accentColor: "text-indigo-200",
    cta: "bg-gradient-to-r from-indigo-400 to-violet-500 hover:from-indigo-300 hover:to-violet-400 text-white shadow-lg shadow-indigo-900/60",
  },
  team: {
    gradient: "from-emerald-800 to-teal-800",
    border: "border-emerald-400/50",
    glow: "shadow-xl shadow-emerald-800/50",
    icon: <Users className="w-5 h-5 text-emerald-200" />,
    accentColor: "text-emerald-200",
    cta: "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white shadow-lg shadow-emerald-900/50",
  },
  enterprise: {
    gradient: "from-amber-800 to-orange-800",
    border: "border-amber-400/50",
    glow: "shadow-xl shadow-amber-800/40",
    badge: "Custom Pricing",
    badgeColor: "bg-amber-500 text-white",
    icon: <Building2 className="w-5 h-5 text-amber-200" />,
    accentColor: "text-amber-200",
    cta: "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-white shadow-lg shadow-amber-900/40",
  },
};

const CHECK_COLOR: Record<PlanSlug, string> = {
  free: "text-slate-300",
  pro: "text-indigo-300",
  team: "text-emerald-300",
  enterprise: "text-amber-300",
};

interface PricingPageProps {
  userId: string;
  onNavigate?: (view: string) => void;
}

export default function PricingPage({ userId, onNavigate }: PricingPageProps) {
  const { plans, isLoading: plansLoading } = usePlans();
  const { planSlug, isLoading: subLoading, upgrade } = useSubscription(userId);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [upgrading, setUpgrading] = useState<PlanSlug | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [tableOpen, setTableOpen] = useState(false);

  useEffect(() => {
    fetchAffiliatePartners().then(setPartners).catch(() => {});
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpgrade = async (plan: Plan) => {
    const slug = plan.slug as PlanSlug;
    if (slug === planSlug) return;
    if (slug === "enterprise") { onNavigate?.("enterprise"); return; }
    setUpgrading(slug);
    try {
      if (STRIPE_ENABLED) {
        // Redirect to Stripe Checkout — webhook will activate the subscription
        const checkoutUrl = await startStripeCheckout(userId, slug, billing);
        window.location.href = checkoutUrl;
        return; // don't clear upgrading state — page is redirecting
      }
      // Stripe off: activate directly (dev / demo mode)
      await upgrade(slug, billing);
      showToast(`🎉 Upgraded to ${plan.name}! Enjoy your new features.`, true);
    } catch (e: any) {
      showToast(e.message || "Upgrade failed — please try again.", false);
    } finally {
      if (!STRIPE_ENABLED) setUpgrading(null);
    }
  };

  const displayedPrice = (plan: Plan) =>
    billing === "annual" ? plan.priceAnnual / 12 : plan.priceMonthly;

  const yearSaving = (plan: Plan) =>
    plan.priceMonthly > 0
      ? Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)
      : 0;

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-5 left-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-sm font-semibold border ${
              toast.ok
                ? "bg-emerald-950 border-emerald-500/40 text-emerald-200"
                : "bg-red-950 border-red-500/40 text-red-200"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-10 left-1/4 w-[300px] h-[200px] bg-violet-600/10 blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 pt-10 pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 mb-6"
          >
            <Crown className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-indigo-600 text-xs font-semibold uppercase tracking-widest">Plans & Pricing</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight"
          >
            Invest in your <span className="text-indigo-500 italic">career</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-base max-w-lg mx-auto mb-8"
          >
            From free exploration to enterprise-scale career solutions
          </motion.p>
          {/* Billing toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            {(["monthly", "annual"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  billing === b ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
                {b === "annual" && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    billing === "annual" ? "bg-emerald-400/20 text-emerald-300" : "bg-slate-100 text-slate-500"
                  }`}>−17%</span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Plan cards ──────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan, i) => {
            const slug = plan.slug as PlanSlug;
            const meta = PLAN_META[slug];
            const isCurrent = slug === planSlug;
            const price = displayedPrice(plan);
            const save = yearSaving(plan);
            const isUpgrading = upgrading === slug;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex flex-col rounded-2xl bg-gradient-to-b ${meta.gradient} border ${meta.border} p-6 backdrop-blur-sm ${meta.glow}`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    ✓ Current
                  </div>
                )}
                {meta.badge && !isCurrent && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${meta.badgeColor} text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md`}>
                    <Star className="w-2.5 h-2.5 fill-current" />{meta.badge}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div className={`w-10 h-10 rounded-xl border ${meta.border} flex items-center justify-center bg-white/5`}>
                    {meta.icon}
                  </div>
                  <div>
                    <div className="text-white font-black text-lg leading-tight">{plan.name}</div>
                    <div className={`text-xs font-medium ${meta.accentColor} leading-tight`}>{plan.tagline}</div>
                  </div>
                </div>
                <div className="mb-5 pb-5 border-b border-white/10">
                  {slug === "enterprise" ? (
                    <div className="text-3xl font-black text-white">Custom</div>
                  ) : price === 0 ? (
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black text-white">Free</span>
                      <span className="text-slate-400 text-sm mb-0.5">forever</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-white">${price.toFixed(0)}</span>
                        <span className="text-slate-400 text-sm mb-1">/mo</span>
                      </div>
                      {billing === "annual" && save > 0 && (
                        <div className="text-emerald-400 text-xs font-semibold mt-1">Billed ${plan.priceAnnual}/yr · Save {save}%</div>
                      )}
                      {billing === "monthly" && (
                        <div className="text-slate-500 text-xs mt-1">${plan.priceAnnual}/yr billed annually</div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={isCurrent || isUpgrading}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 mb-5 ${
                    isCurrent ? "bg-white/5 text-slate-500 cursor-default border border-white/10" : meta.cta
                  }`}
                >
                  {isUpgrading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Your plan</>
                  ) : slug === "enterprise" ? (
                    <>Contact Sales <ArrowRight className="w-4 h-4" /></>
                  ) : slug === "free" ? (
                    "Downgrade to Free"
                  ) : (
                    <>Upgrade to {plan.name} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${CHECK_COLOR[slug]}`} />
                      <span className="text-slate-300 leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Trust strip ─────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mb-14">
        <div className="grid grid-cols-3 gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          {[
            { icon: <Shield className="w-4 h-4 text-emerald-500" />, text: "Cancel anytime — no lock-in" },
            { icon: <Check className="w-4 h-4 text-emerald-500" />, text: "No hidden fees or surprises" },
            { icon: <Zap className="w-4 h-4 text-emerald-500" />, text: "Instant plan activation" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-2 text-xs text-slate-600 font-medium">
              {item.icon}
              <span className="hidden sm:inline">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-4">
          <button
            onClick={() => setTableOpen(!tableOpen)}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-500 text-sm font-semibold transition-colors border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-5 py-2.5 rounded-xl"
          >
            {tableOpen ? "Hide" : "Show"} full feature comparison
            <motion.span animate={{ rotate: tableOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </button>
        </div>
        <AnimatePresence>
          {tableOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <FeatureComparisonTable plans={plans} currentPlan={planSlug} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Partner Network ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 mb-3">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-widest">Partner Network</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Career Partner Network</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Top job boards and learning platforms — tracked and optimised for your career goals
          </p>
        </div>
        {partners.length === 0 ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {partners.map((partner, i) => {
              const pm = PARTNER_META[partner.slug] ?? { color: "#4f46e5", emoji: "🔗" };
              return (
                <motion.button
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={async () => {
                    try { await trackAffiliateClick(partner.id, userId, "pricing"); } catch {}
                    window.open(partner.affiliateUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="group relative overflow-hidden bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl shadow-sm"
                >
                  <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: pm.color }} />
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-md"
                      style={{ background: pm.color }}
                    >
                      {pm.emoji}
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors mt-1" />
                  </div>
                  <div className="text-slate-900 font-bold text-sm leading-snug">{partner.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">{partner.category.replace("_", " ")}</div>
                  {partner.description && (
                    <div className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{partner.description}</div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom CTA ───────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-3xl border border-indigo-500/20 p-10 text-center"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 to-violet-950/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_70%)]" />
          <div className="relative">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white mb-2">Not sure which plan?</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Start free — no credit card required. Upgrade anytime as your career grows.
            </p>
            <button
              onClick={() => onNavigate?.("enterprise")}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Building2 className="w-4 h-4" />
              Explore Enterprise →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Feature comparison table ───────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: "Career roadmaps",             free: true,  pro: true,  team: true,  enterprise: true  },
  { label: "Job board access",             free: true,  pro: true,  team: true,  enterprise: true  },
  { label: "AI interview sessions/month",  free: "5",   pro: "∞",   team: "∞",   enterprise: "∞"   },
  { label: "Resume templates",             free: "1",   pro: "12+", team: "12+", enterprise: "∞"   },
  { label: "AI career analyses/month",     free: "3",   pro: "∞",   team: "∞",   enterprise: "∞"   },
  { label: "Job matches",                  free: "10",  pro: "∞",   team: "∞",   enterprise: "∞"   },
  { label: "Market trend reports",         free: false, pro: true,  team: true,  enterprise: true  },
  { label: "Career prediction analytics",  free: false, pro: true,  team: true,  enterprise: true  },
  { label: "Company insights",             free: false, pro: true,  team: true,  enterprise: true  },
  { label: "Team seats",                   free: false, pro: false, team: "10",  enterprise: "∞"   },
  { label: "Team analytics dashboard",     free: false, pro: false, team: true,  enterprise: true  },
  { label: "Priority support",             free: false, pro: true,  team: true,  enterprise: true  },
  { label: "SSO / LDAP",                   free: false, pro: false, team: false, enterprise: true  },
  { label: "Dedicated account manager",    free: false, pro: false, team: false, enterprise: true  },
  { label: "Custom AI model tuning",       free: false, pro: false, team: false, enterprise: true  },
  { label: "API access",                   free: false, pro: false, team: false, enterprise: true  },
];

function CellValue({ val }: { val: boolean | string }) {
  if (val === true)  return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (val === false) return <X className="w-4 h-4 text-slate-300 mx-auto" />;
  return <span className="text-sm text-slate-700 font-medium">{val}</span>;
}

function FeatureComparisonTable({ plans, currentPlan }: { plans: Plan[]; currentPlan: PlanSlug }) {
  const slugs: PlanSlug[] = ["free", "pro", "team", "enterprise"];
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-700/50 border-b border-slate-600/50">
            <th className="text-left px-5 py-4 text-slate-600 font-semibold w-52">Feature</th>
            {slugs.map((s) => (
              <th key={s} className={`text-center px-4 py-4 font-bold ${s === currentPlan ? "text-indigo-600" : "text-slate-900"}`}>
                <div className="capitalize">{plans.find((p) => p.slug === s)?.name ?? s}</div>
                {s === currentPlan && <div className="text-[10px] text-emerald-400 font-normal">← you</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map((row, i) => (
            <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? "" : "bg-slate-50/60"}`}>
              <td className="px-5 py-3.5 text-slate-700">{row.label}</td>
              {slugs.map((s) => (
                <td key={s} className="px-4 py-3.5 text-center">
                  <CellValue val={row[s as PlanSlug]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
