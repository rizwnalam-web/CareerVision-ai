import { db, closeConnection, testConnection } from "../db/database.js";
import * as migration001 from "./001_initial_schema.js";
import * as migration002 from "./002_add_password_field.js";
import * as migration003 from "./002_add_market_data_tables.js";
import * as feedbackMigration from "./003_feedback_table.js"; // Assuming this is the correct import for your feedback table
import * as migration004 from "./004_add_password_reset_tokens.js";
import * as migration005 from "./005_add_top_careers_cache.js";
import * as migration006 from "./006_add_country_careers_cache.js";
import * as migration007 from "./007_add_milestones_cache.js";
import * as migration008 from "./008_add_hub_search_cache.js";
import * as migration009 from "./009_add_ai_caches.js";
import * as migration010 from "./010_add_ai_response_cache.js";
import * as migration011 from "./011_add_resume_tables.js";
import * as migration012 from "./012_resume_use_text_identifier.js";
import * as migration013 from "./013_add_job_match_tables.js";
import * as migration014 from "./014_interview_prep_tables.js";
import * as migration015 from "./015_analytics_tables.js";
import * as migration016 from "./016_push_subscriptions.js";
import * as migration017 from "./017_monetization_tables.js";
import * as migration018 from "./018_feedback_status.js";
import * as migration019 from "./019_network_qa_posts.js";
import * as migration020 from "./020_add_job_applications.js";
import * as migration021 from "./021_add_user_credits.js";
import * as migration022 from "./022_job_aggregation_indexes.js";
import * as migration023 from "./023_add_submission_tracking_to_job_applications.js";
import * as migration024 from "./024_add_deep_resume_sharing_and_history.js";
import * as migration025 from "./025_fix_deep_resume_shares_slug_unique_constraint.js";

const migrations = [
  { name: "001_initial_schema",        module: migration001 },
  { name: "002_add_password_field",    module: migration002 },
  { name: "003_add_market_data_tables",module: migration003 },
  { name: "003_feedback_table",        module: feedbackMigration }, // Add your feedback migration here
  { name: "004_add_password_reset_tokens", module: migration004 },
  { name: "005_add_top_careers_cache", module: migration005 },
  { name: "006_add_country_careers_cache", module: migration006 },
  { name: "007_add_milestones_cache",  module: migration007 },
  { name: "008_add_hub_search_cache",  module: migration008 },
  { name: "009_add_ai_caches",         module: migration009 },
  { name: "010_add_ai_response_cache", module: migration010 },
  { name: "011_add_resume_tables",           module: migration011 },
  { name: "012_resume_use_text_identifier",   module: migration012 },
  { name: "013_add_job_match_tables",          module: migration013 },
  { name: "014_interview_prep_tables",          module: migration014 },
  { name: "015_analytics_tables",               module: migration015 },
  { name: "016_push_subscriptions",              module: migration016 },
  { name: "017_monetization_tables",              module: migration017 },
  { name: "018_feedback_status",                  module: migration018 },
  { name: "019_network_qa_posts",                  module: migration019 },
  { name: "020_add_job_applications",               module: migration020 },
  { name: "021_add_user_credits",                    module: migration021 },
  { name: "022_job_aggregation_indexes",              module: migration022 },
  { name: "023_add_submission_tracking_to_job_applications", module: migration023 },
  { name: "024_add_deep_resume_sharing_and_history", module: migration024 },
  { name: "025_fix_deep_resume_shares_slug_unique_constraint", module: migration025 },
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
      await migration.module.up(db); // Pass the 'db' object here
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
