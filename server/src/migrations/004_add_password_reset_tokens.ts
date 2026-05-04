import { db } from "../db/database.js";

export async function up() {
  const sql = `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
  `;

  try {
    await db.none(sql);
    console.log("✓ Added password_reset_tokens table");
  } catch (error) {
    console.error("✗ Failed to create password_reset_tokens table:", error);
    throw error;
  }
}

export async function down() {
  const sql = `
    DROP TABLE IF EXISTS password_reset_tokens;
  `;

  try {
    await db.none(sql);
    console.log("✓ Dropped password_reset_tokens table");
  } catch (error) {
    console.error("✗ Failed to drop password_reset_tokens table:", error);
    throw error;
  }
}
