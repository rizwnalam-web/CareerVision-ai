import type { WorkPreferences } from "../types/jobMatch";

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001"
).replace(/\/+$/g, "");

export interface CreditWallet {
  userIdentifier: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  userIdentifier: string;
  direction: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  source: string;
  referenceKey: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreditsSummary {
  wallet: CreditWallet;
  transactions: CreditTransaction[];
}

export async function getCreditsSummary(userId: string): Promise<CreditsSummary> {
  const res = await fetch(`${API_BASE}/api/credits/${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch credits");
  }
  return {
    wallet: data.wallet,
    transactions: data.transactions || [],
  };
}

export async function completeInitialSetupAndClaimCredits(
  userId: string,
  preferences: Partial<WorkPreferences>
): Promise<{
  setupCompletedAt: string;
  creditsAwarded: number;
  alreadyClaimed: boolean;
  wallet: CreditWallet;
}> {
  const res = await fetch(`${API_BASE}/api/credits/setup/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, preferences }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to complete setup");
  }
  return {
    setupCompletedAt: data.setupCompletedAt,
    creditsAwarded: data.creditsAwarded,
    alreadyClaimed: data.alreadyClaimed,
    wallet: data.wallet,
  };
}
