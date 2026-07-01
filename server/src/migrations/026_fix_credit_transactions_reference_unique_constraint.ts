import { db } from "../db/database.js";

export async function up() {
  await db.none(`
    -- Ensure the credit transaction uniqueness constraint exists for ON CONFLICT.
    CREATE UNIQUE INDEX IF NOT EXISTS ux_credit_transactions_reference
      ON credit_transactions(user_identifier, source, reference_key);
  `);
}

export async function down() {
  await db.none(`
    DROP INDEX IF EXISTS ux_credit_transactions_reference;
  `);
}
