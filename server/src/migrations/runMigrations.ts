import { db, closeConnection, testConnection } from "../db/database.js";
import * as migration001 from "./001_initial_schema.js";
import * as migration002 from "./002_add_password_field.js";
import * as migration003 from "./002_add_market_data_tables.js";

const migrations = [
  {
    name: "001_initial_schema",
    module: migration001,
  },
  {
    name: "002_add_password_field",
    module: migration002,
  },
  {
    name: "003_add_market_data_tables",
    module: migration003,
  },
];

async function runMigrations() {
  const connected = await testConnection();
  if (!connected) {
    console.error("Cannot proceed without database connection");
    process.exit(1);
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
      try {
        await migration.module.up();
        await db.none("INSERT INTO migrations (name) VALUES ($1)", [
          migration.name,
        ]);
        console.log(`✓ Completed: ${migration.name}`);
      } catch (error) {
        console.error(`✗ Failed: ${migration.name}`, error);
        process.exit(1);
      }
    } else {
      console.log(`⏭️  Skipped (already run): ${migration.name}`);
    }
  }

  console.log("\n✓ All migrations completed successfully!");
  await closeConnection();
}

runMigrations().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
