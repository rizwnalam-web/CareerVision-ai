import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Zap, Check, ArrowRight, Crown, Loader2, Lock, Star,
} from "lucide-react";
import { useSubscription } from "../hooks/useSubscription";
import type { PlanSlug } from "../services/subscriptionService";
import { PLAN_COLORS } from "../services/subscriptionService";

export interface UpgradeModalProps {
  /** Feature being gated, e.g. "Premium resume templates" */
  featureName: string;
  /** Minimum plan required to unlock, default 'pro' */
  requiredPlan?: PlanSlug;
  /** Current user id */
  userId: string;
  onClose: () => void;
  /** Navigate to full pricing page */
  onViewPricing?: () => void;
}

const PLAN_PITCH: Record<PlanSlug, { tagline: string; highlights: string[] }> = {
  free: {
    tagline: "Basic career tools",
    highlights: [],
  },
  pro: {
    tagline: "Unlock the full AI power of CareerVision",
    highlights: [
      "Unlimited AI interview practice sessions",
      "12+ premium resume templates",
      "Advanced AI career analysis",
      "Market trend reports & predictions",
      "Company-specific insights",
      "Priority support",
    ],
  },
  team: {
    tagline: "Collaborate and grow together",
    highlights: [
      "Everything in Pro",
      "Up to 10 team seats",
      "Team analytics dashboard",
      "Manager reporting tools",
      "Bulk interview sessions",
    ],
  },
  enterprise: {
    tagline: "Enterprise-scale career solutions",
    highlights: [
      "Unlimited seats across your organisation",
      "SSO / LDAP integration",
      "Dedicated account manager",
      "Custom AI model tuning",
      "SLA guarantees & compliance reporting",
      "White-label branding option",
    ],
  },
};

export default function UpgradeModal({
  featureName,
  requiredPlan = "pro",
  userId,
  onClose,
  onViewPricing,
}: UpgradeModalProps) {
  const { planSlug, upgrade, isLoading } = useSubscription(userId);
  const [upgrading, setUpgrading] = useState(false);
  const [done, setDone] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  const pitch = PLAN_PITCH[requiredPlan];

  const PRICES: Record<PlanSlug, { monthly: number; annual: number }> = {
    free:       { monthly: 0,  annual: 0   },
    pro:        { monthly: 19, annual: 190 },
    team:       { monthly: 49, annual: 490 },
    enterprise: { monthly: 0,  annual: 0   },
  };

  const prices = PRICES[requiredPlan];
  const monthlyDisplay = billing === "annual"
    ? (prices.annual / 12).toFixed(0)
    : prices.monthly.toFixed(0);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await upgrade(requiredPlan, billing);
      setDone(true);
      setTimeout(onClose, 2000);
    } catch (e: any) {
      // silently handle — user stays in modal
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
        aria-hidden="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          className="w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Gradient header */}
          <div className={`bg-gradient-to-r ${PLAN_COLORS[requiredPlan]} p-6 relative`}>
            <button
              onClick={onClose}
              aria-label="Close upgrade modal"
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center" aria-hidden="true">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <Crown className="w-5 h-5 text-yellow-300" aria-hidden="true" />
            </div>
            <h2 id="upgrade-modal-title" className="text-xl font-bold text-white mb-1">
              Unlock {featureName}
            </h2>
            <p className="text-white/70 text-sm">{pitch.tagline}</p>
          </div>

          {/* Body */}
          <div className="p-6">
            {done ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-white font-bold text-lg">Upgrade successful!</div>
                <div className="text-slate-400 text-sm mt-1">Enjoy your new features.</div>
              </motion.div>
            ) : (
              <>
                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {pitch.highlights.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Price + billing toggle */}
                {requiredPlan !== "enterprise" && prices.monthly > 0 && (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setBilling("monthly")}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          billing === "monthly"
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                            : "border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBilling("annual")}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          billing === "annual"
                            ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                            : "border-slate-700 text-slate-400 hover:text-white"
                        }`}
                      >
                        Annual
                        <span className="ml-1 text-emerald-400">(save 17%)</span>
                      </button>
                    </div>
                    <div className="text-center mb-5">
                      <span className="text-3xl font-bold text-white">${monthlyDisplay}</span>
                      <span className="text-slate-400 text-sm">/mo</span>
                      {billing === "annual" && (
                        <div className="text-xs text-emerald-400 mt-0.5">
                          Billed ${prices.annual}/year
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* CTA */}
                {requiredPlan === "enterprise" ? (
                  <button
                    onClick={() => { onViewPricing?.(); onClose(); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm hover:from-amber-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2"
                  >
                    Contact Sales
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading || isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {upgrading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
                      </>
                    )}
                  </button>
                )}

                {/* View pricing link */}
                {onViewPricing && (
                  <button
                    onClick={() => { onViewPricing(); onClose(); }}
                    className="w-full mt-3 text-center text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    View all plans →
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Feature Gate wrapper ───────────────────────────────────────────────────────

interface FeatureGateProps {
  featureName: string;
  requiredPlan?: PlanSlug;
  userId: string;
  currentPlanSlug: PlanSlug;
  onViewPricing?: () => void;
  children: React.ReactNode;
}

/**
 * Wraps children with an upgrade prompt overlay when the user lacks the required plan.
 * Children are rendered but blurred behind the gate to give a preview.
 */
export function FeatureGate({
  featureName,
  requiredPlan = "pro",
  userId,
  currentPlanSlug,
  onViewPricing,
  children,
}: FeatureGateProps) {
  const [showModal, setShowModal] = useState(false);
  const planOrder: PlanSlug[] = ["free", "pro", "team", "enterprise"];
  const hasAccess = planOrder.indexOf(currentPlanSlug) >= planOrder.indexOf(requiredPlan);

  if (hasAccess) return <>{children}</>;

  return (
    <>
      <div className="relative">
        <div className="pointer-events-none select-none filter blur-sm opacity-40 max-h-64 overflow-hidden">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/70 rounded-xl">
          <div className="text-center p-6">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="text-white font-semibold mb-1">{featureName}</div>
            <div className="text-slate-400 text-sm mb-4">
              Requires{" "}
              <span className="text-indigo-400 font-medium capitalize">{requiredPlan}</span> plan
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center gap-2 mx-auto"
            >
              <Star className="w-4 h-4" />
              Unlock now
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <UpgradeModal
            featureName={featureName}
            requiredPlan={requiredPlan}
            userId={userId}
            onClose={() => setShowModal(false)}
            onViewPricing={onViewPricing}
          />
        )}
      </AnimatePresence>
    </>
  );
}
