import { db } from "../db/database.js";

export interface WorkPreferencesInput {
  workTypePreference?: "remote" | "hybrid" | "onsite" | "any";
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryCurrency?: string;
  preferredLocations?: string[];
  preferredIndustries?: string[];
  targetRole?: string | null;
}

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

const INITIAL_SETUP_CREDITS = 30;
const INITIAL_SETUP_REFERENCE = "initial_job_setup_v1";

function mapWallet(row: any): CreditWallet {
  return {
    userIdentifier: row.user_identifier,
    balance: row.balance,
    lifetimeEarned: row.lifetime_earned,
    lifetimeSpent: row.lifetime_spent,
    updatedAt: row.updated_at?.toISOString?.() ?? new Date().toISOString(),
  };
}

function mapTransaction(row: any): CreditTransaction {
  return {
    id: row.id,
    userIdentifier: row.user_identifier,
    direction: row.direction,
    amount: row.amount,
    balanceAfter: row.balance_after,
    source: row.source,
    referenceKey: row.reference_key,
    metadata: row.metadata ?? {},
    createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
  };
}

export async function getOrCreateCreditWallet(userIdentifier: string): Promise<CreditWallet> {
  await db.none(
    `INSERT INTO user_credits (user_identifier)
     VALUES ($1)
     ON CONFLICT (user_identifier) DO NOTHING`,
    [userIdentifier]
  );

  const row = await db.one(
    `SELECT user_identifier, balance, lifetime_earned, lifetime_spent, updated_at
     FROM user_credits
     WHERE user_identifier = $1`,
    [userIdentifier]
  );

  return mapWallet(row);
}

export async function listCreditTransactions(
  userIdentifier: string,
  limit = 20
): Promise<CreditTransaction[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const rows = await db.manyOrNone(
    `SELECT id, user_identifier, direction, amount, balance_after, source, reference_key, metadata, created_at
     FROM credit_transactions
     WHERE user_identifier = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userIdentifier, safeLimit]
  );
  return rows.map(mapTransaction);
}

export async function applyCreditTransaction(input: {
  userIdentifier: string;
  direction: "credit" | "debit";
  amount: number;
  source: string;
  metadata?: Record<string, unknown>;
  referenceKey?: string | null;
}): Promise<{ wallet: CreditWallet; transaction: CreditTransaction }> {
  const amount = Math.max(0, Math.floor(input.amount));
  if (!amount) throw new Error("amount must be greater than 0");

  return db.tx(async t => {
    await t.none(
      `INSERT INTO user_credits (user_identifier)
       VALUES ($1)
       ON CONFLICT (user_identifier) DO NOTHING`,
      [input.userIdentifier]
    );

    const current = await t.one(
      `SELECT user_identifier, balance, lifetime_earned, lifetime_spent, updated_at
       FROM user_credits
       WHERE user_identifier = $1
       FOR UPDATE`,
      [input.userIdentifier]
    );

    const currentBalance = Number(current.balance || 0);
    const nextBalance = input.direction === "credit"
      ? currentBalance + amount
      : currentBalance - amount;

    if (nextBalance < 0) {
      throw new Error("insufficient credits");
    }

    const transaction = await t.one(
      `INSERT INTO credit_transactions
         (user_identifier, direction, amount, balance_after, source, reference_key, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, user_identifier, direction, amount, balance_after, source, reference_key, metadata, created_at`,
      [
        input.userIdentifier,
        input.direction,
        amount,
        nextBalance,
        input.source,
        input.referenceKey ?? null,
        input.metadata ?? {},
      ]
    );

    await t.none(
      `UPDATE user_credits
       SET balance = $2,
           lifetime_earned = lifetime_earned + $3,
           lifetime_spent = lifetime_spent + $4,
           updated_at = NOW()
       WHERE user_identifier = $1`,
      [
        input.userIdentifier,
        nextBalance,
        input.direction === "credit" ? amount : 0,
        input.direction === "debit" ? amount : 0,
      ]
    );

    const walletRow = await t.one(
      `SELECT user_identifier, balance, lifetime_earned, lifetime_spent, updated_at
       FROM user_credits
       WHERE user_identifier = $1`,
      [input.userIdentifier]
    );

    return {
      wallet: mapWallet(walletRow),
      transaction: mapTransaction(transaction),
    };
  });
}

export async function completeInitialSetupAndAwardCredits(input: {
  userIdentifier: string;
  preferences: WorkPreferencesInput;
}): Promise<{
  setupCompletedAt: string;
  creditsAwarded: number;
  alreadyClaimed: boolean;
  wallet: CreditWallet;
}> {
  return db.tx(async t => {
    const prefs = input.preferences || {};

    await t.none(
      `INSERT INTO user_work_preferences
         (user_identifier, work_type_preference, min_salary, max_salary, salary_currency,
          preferred_locations, preferred_industries, target_role, setup_completed_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       ON CONFLICT (user_identifier) DO UPDATE SET
         work_type_preference = EXCLUDED.work_type_preference,
         min_salary           = EXCLUDED.min_salary,
         max_salary           = EXCLUDED.max_salary,
         salary_currency      = EXCLUDED.salary_currency,
         preferred_locations  = EXCLUDED.preferred_locations,
         preferred_industries = EXCLUDED.preferred_industries,
         target_role          = EXCLUDED.target_role,
         setup_completed_at   = COALESCE(user_work_preferences.setup_completed_at, NOW()),
         updated_at           = NOW()`,
      [
        input.userIdentifier,
        prefs.workTypePreference ?? "any",
        prefs.minSalary ?? null,
        prefs.maxSalary ?? null,
        prefs.salaryCurrency ?? "USD",
        Array.isArray(prefs.preferredLocations) ? prefs.preferredLocations : [],
        Array.isArray(prefs.preferredIndustries) ? prefs.preferredIndustries : [],
        prefs.targetRole ?? null,
      ]
    );

    await t.none(
      `INSERT INTO user_credits (user_identifier)
       VALUES ($1)
       ON CONFLICT (user_identifier) DO NOTHING`,
      [input.userIdentifier]
    );

    const lockedWallet = await t.one(
      `SELECT user_identifier, balance, lifetime_earned, lifetime_spent, updated_at
       FROM user_credits
       WHERE user_identifier = $1
       FOR UPDATE`,
      [input.userIdentifier]
    );

    const nextBalance = Number(lockedWallet.balance || 0) + INITIAL_SETUP_CREDITS;

    const inserted = await t.oneOrNone(
      `INSERT INTO credit_transactions
         (user_identifier, direction, amount, balance_after, source, reference_key, metadata)
       VALUES ($1,'credit',$2,$3,'onboarding_setup_bonus',$4,$5)
       ON CONFLICT (user_identifier, source, reference_key) DO NOTHING
       RETURNING id`,
      [
        input.userIdentifier,
        INITIAL_SETUP_CREDITS,
        nextBalance,
        INITIAL_SETUP_REFERENCE,
        { reason: "Initial setup completed" },
      ]
    );

    let creditsAwarded = 0;
    if (inserted) {
      creditsAwarded = INITIAL_SETUP_CREDITS;
      await t.none(
        `UPDATE user_credits
         SET balance = $2,
             lifetime_earned = lifetime_earned + $3,
             updated_at = NOW()
         WHERE user_identifier = $1`,
        [input.userIdentifier, nextBalance, INITIAL_SETUP_CREDITS]
      );
    }

    const [walletRow, prefRow] = await Promise.all([
      t.one(
        `SELECT user_identifier, balance, lifetime_earned, lifetime_spent, updated_at
         FROM user_credits
         WHERE user_identifier = $1`,
        [input.userIdentifier]
      ),
      t.one(
        `SELECT setup_completed_at
         FROM user_work_preferences
         WHERE user_identifier = $1`,
        [input.userIdentifier]
      ),
    ]);

    return {
      setupCompletedAt: prefRow.setup_completed_at?.toISOString?.() ?? new Date().toISOString(),
      creditsAwarded,
      alreadyClaimed: !inserted,
      wallet: mapWallet(walletRow),
    };
  });
}
