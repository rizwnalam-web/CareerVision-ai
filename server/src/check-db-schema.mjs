import { db } from "./db/database.js";

(async () => {
  try {
    const tables = ["user_work_preferences", "user_credits", "credit_transactions", "deep_resume_shares"];
    for (const table of tables) {
      const exists = await db.oneOrNone(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );
      console.log(table, exists ? "FOUND" : "MISSING");
      if (exists) {
        const cols = await db.any(
          `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
          [table]
        );
        console.log(table, cols);
        const idx = await db.any(
          `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1`,
          [table]
        );
        console.log(table, idx);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
})();
