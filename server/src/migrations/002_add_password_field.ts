import { db } from "../db/database.js";

export async function up() {
  try {
    // Add password_hash column to users table if it doesn't exist
    await db.none(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
    console.log("✓ Added password_hash column");
    
    // Add registration_method column to track how user registered
    await db.none(`ALTER TABLE users ADD COLUMN IF NOT EXISTS registration_method VARCHAR(50) DEFAULT 'email' CHECK (registration_method IN ('email', 'google', 'firebase'))`);
    console.log("✓ Added registration_method column");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

export async function down() {
  const sql = `
    -- Rollback: remove added columns
    ALTER TABLE users 
    DROP COLUMN IF EXISTS password_hash;

    ALTER TABLE users 
    DROP COLUMN IF EXISTS registration_method;
  `;

  await db.none(sql);
}
