import { useState, useEffect, useCallback } from "react";
import {
  fetchUserSubscription,
  fetchPlans,
  activateSubscription,
  cancelSubscription,
  checkFeatureAccess,
  planHasFeature,
  type Plan,
  type UserSubscription,
  type PlanSlug,
  type FeatureKey,
} from "../services/subscriptionService";

interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  plan: Plan | null;
  planSlug: PlanSlug;
  isLoading: boolean;
  isFree: boolean;
  isPro: boolean;
  isTeam: boolean;
  isEnterprise: boolean;
  canAccess: (requiredPlan: PlanSlug) => boolean;
  checkFeature: (featureKey: FeatureKey) => Promise<{ allowed: boolean; used: number; limit: number }>;
  upgrade: (planSlug: PlanSlug, billingPeriod?: "monthly" | "annual") => Promise<void>;
  cancel: () => Promise<void>;
  reload: () => void;
}

export function useSubscription(userId: string | undefined): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    fetchUserSubscription(userId)
      .then((sub) => { if (!cancelled) setSubscription(sub); })
      .catch(() => { /* no-op – treat as free */ })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [userId, tick]);

  const planSlug: PlanSlug = (subscription?.plan.slug as PlanSlug) ?? "free";

  const canAccess = useCallback(
    (required: PlanSlug) => planHasFeature(planSlug, required),
    [planSlug]
  );

  const checkFeature = useCallback(
    async (featureKey: FeatureKey) => {
      if (!userId) return { allowed: false, used: 0, limit: 0 };
      return checkFeatureAccess(userId, featureKey);
    },
    [userId]
  );

  const upgrade = useCallback(
    async (targetSlug: PlanSlug, billingPeriod: "monthly" | "annual" = "monthly") => {
      if (!userId) throw new Error("Not authenticated");
      const sub = await activateSubscription(userId, targetSlug, billingPeriod);
      setSubscription(sub);
    },
    [userId]
  );

  const cancel = useCallback(async () => {
    if (!userId) return;
    await cancelSubscription(userId);
    setTick((t) => t + 1);
  }, [userId]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return {
    subscription,
    plan: subscription?.plan ?? null,
    planSlug,
    isLoading,
    isFree: planSlug === "free",
    isPro: planSlug === "pro",
    isTeam: planSlug === "team",
    isEnterprise: planSlug === "enterprise",
    canAccess,
    checkFeature,
    upgrade,
    cancel,
    reload,
  };
}

/** Standalone hook for all plan definitions (for pricing page) */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { plans, isLoading };
}
