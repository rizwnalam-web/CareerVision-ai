import { db, closeConnection, testConnection } from "../db/database.js";
import * as migration001 from "./001_initial_schema.js";
import * as migration002 from "./002_add_password_field.js";
import * as migration003 from "./002_add_market_data_tables.js";
import * as migration004 from "./004_add_password_reset_tokens.js";
import * as migration005 from "./005_add_top_careers_cache.js";
import * as migration006 from "./006_add_country_careers_cache.js";

const migrations = [
  { name: "001_initial_schema",        module: migration001 },
  { name: "002_add_password_field",    module: migration002 },
  { name: "003_add_market_data_tables",module: migration003 },
  { name: "004_add_password_reset_tokens", module: migration004 },
  { name: "005_add_top_careers_cache", module: migration005 },
  { name: "006_add_country_careers_cache", module: migration006 },
];

export async function runMigrations() {
  const connected = await testConnection();
  if (!connected) {
    throw new Error("Cannot proceed without database connection");
  }

  // Create migrations table if not exists
  await db.none(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const migration of migrations) {
    const exists = await db.oneOrNone(
      "SELECT * FROM migrations WHERE name = $1",
      [migration.name]
    );

    if (!exists) {
      console.log(`\n🔄 Running migration: ${migration.name}`);
      await migration.module.up();
      await db.none("INSERT INTO migrations (name) VALUES ($1)", [
        migration.name,
      ]);
      console.log(`✓ Completed: ${migration.name}`);
    } else {
      console.log(`⏭️  Skipped (already run): ${migration.name}`);
    }
  }

  console.log("\n✓ All migrations completed successfully!");
}

if (import.meta.url === process.argv[1] || import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runMigrations().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
