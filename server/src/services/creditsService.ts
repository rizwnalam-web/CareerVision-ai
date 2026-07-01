import { db } from "../db/database.js";
import type { ITask } from "pg-promise";

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

export interface CreditPack {
  id: string;
  name: string;
  applicationCredits: number;
  priceCents: number;
  currency: string;
  description: string;
  stripePriceId?: string;
  active: boolean;
}

const INITIAL_SETUP_CREDITS = 30;
const INITIAL_SETUP_REFERENCE = "initial_job_setup_v1";

const CREDIT_PACKS: CreditPack[] = [
  {
    id: "starter",
    name: "Starter Application Pack",
    applicationCredits: 25,
    priceCents: 900,
    currency: "usd",
    description: "25 AI-assisted application credits for focused job hunts.",
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_STARTER || undefined,
    active: true,
  },
  {
    id: "growth",
    name: "Growth Application Pack",
    applicationCredits: 75,
    priceCents: 2400,
    currency: "usd",
    description: "75 application credits with better value per application.",
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_GROWTH || undefined,
    active: true,
  },
  {
    id: "pro",
    name: "Pro Application Pack",
    applicationCredits: 200,
    priceCents: 5600,
    currency: "usd",
    description: "200 credits for high-volume application campaigns.",
    stripePriceId: process.env.STRIPE_PRICE_CREDITS_PRO || undefined,
    active: true,
  },
];

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

export function listCreditPacks(): CreditPack[] {
  return CREDIT_PACKS.filter(pack => pack.active).map(pack => ({ ...pack }));
}

export function getCreditPackById(packId: string): CreditPack | null {
  const normalized = packId.trim().toLowerCase();
  const found = CREDIT_PACKS.find(pack => pack.id === normalized && pack.active);
  return found ? { ...found } : null;
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
    await ensureCreditSetupSchema(t);

    const prefs = input.preferences || {};

    const existingPreferences = await t.oneOrNone(
      `SELECT user_identifier, setup_completed_at
       FROM user_work_preferences
       WHERE user_identifier = $1`,
      [input.userIdentifier]
    );

    if (existingPreferences) {
      await t.none(
        `UPDATE user_work_preferences
         SET work_type_preference   = $2,
             min_salary             = $3,
             max_salary             = $4,
             salary_currency        = $5,
             preferred_locations    = $6,
             preferred_industries   = $7,
             target_role            = $8,
             setup_completed_at     = COALESCE(setup_completed_at, NOW()),
             updated_at             = NOW()
         WHERE user_identifier = $1`,
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
    } else {
      await t.none(
        `INSERT INTO user_work_preferences
           (user_identifier, work_type_preference, min_salary, max_salary, salary_currency,
            preferred_locations, preferred_industries, target_role, setup_completed_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
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
    }

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
       SELECT $1, 'credit', $2, $3, 'onboarding_setup_bonus', $4, $5
       WHERE NOT EXISTS (
         SELECT 1
         FROM credit_transactions
         WHERE user_identifier = $1
           AND source = 'onboarding_setup_bonus'
           AND ((reference_key IS NULL AND $4 IS NULL) OR reference_key = $4)
       )
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

async function ensureCreditSetupSchema(t: ITask<{}>) {
  await t.none(`
    CREATE TABLE IF NOT EXISTS user_work_preferences (
      user_identifier        TEXT PRIMARY KEY,
      work_type_preference   VARCHAR(20) NOT NULL DEFAULT 'any'
                               CHECK (work_type_preference IN ('remote','hybrid','onsite','any')),
      min_salary             INTEGER,
      max_salary             INTEGER,
      salary_currency        VARCHAR(10) DEFAULT 'USD',
      preferred_locations    TEXT[] DEFAULT '{}',
      preferred_industries   TEXT[] DEFAULT '{}',
      target_role            TEXT,
      setup_completed_at     TIMESTAMPTZ,
      updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_credits (
      user_identifier   TEXT PRIMARY KEY,
      balance           INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
      lifetime_earned   INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
      lifetime_spent    INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_spent >= 0),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_identifier  TEXT NOT NULL,
      direction        VARCHAR(10) NOT NULL CHECK (direction IN ('credit','debit')),
      amount           INTEGER NOT NULL CHECK (amount > 0),
      balance_after    INTEGER NOT NULL CHECK (balance_after >= 0),
      source           VARCHAR(60) NOT NULL,
      reference_key    VARCHAR(120),
      metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_transactions_reference
      ON credit_transactions(user_identifier, source, reference_key);
  `);
}

export async function awardCreditPackPurchase(input: {
  userIdentifier: string;
  packId: string;
  referenceKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  wallet: CreditWallet;
  transaction: CreditTransaction | null;
  creditsAwarded: number;
  alreadyProcessed: boolean;
}> {
  const pack = getCreditPackById(input.packId);
  if (!pack) {
    throw new Error("invalid credit pack");
  }

  return db.tx(async t => {
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

    const nextBalance = Number(lockedWallet.balance || 0) + pack.applicationCredits;

    const inserted = await t.oneOrNone(
      `INSERT INTO credit_transactions
         (user_identifier, direction, amount, balance_after, source, reference_key, metadata)
       VALUES ($1,'credit',$2,$3,'stripe_credit_pack',$4,$5)
       ON CONFLICT (user_identifier, source, reference_key) DO NOTHING
       RETURNING id, user_identifier, direction, amount, balance_after, source, reference_key, metadata, created_at`,
      [
        input.userIdentifier,
        pack.applicationCredits,
        nextBalance,
        input.referenceKey,
        {
          ...(input.metadata || {}),
          packId: pack.id,
          packName: pack.name,
          applicationCredits: pack.applicationCredits,
          priceCents: pack.priceCents,
          currency: pack.currency,
        },
      ]
    );

    if (inserted) {
      await t.none(
        `UPDATE user_credits
         SET balance = $2,
             lifetime_earned = lifetime_earned + $3,
             updated_at = NOW()
         WHERE user_identifier = $1`,
        [input.userIdentifier, nextBalance, pack.applicationCredits]
      );
    }

    const walletRow = await t.one(
      `SELECT user_identifier, balance, lifetime_earned, lifetime_spent, updated_at
       FROM user_credits
       WHERE user_identifier = $1`,
      [input.userIdentifier]
    );

    return {
      wallet: mapWallet(walletRow),
      transaction: inserted ? mapTransaction(inserted) : null,
      creditsAwarded: inserted ? pack.applicationCredits : 0,
      alreadyProcessed: !inserted,
    };
  });
}
