import { db } from "../db/database.js";

export async function up() {
  const sql = `
    -- Career Hub Market Intelligence Table
    CREATE TABLE IF NOT EXISTS career_hubs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      city VARCHAR(100) NOT NULL,
      country VARCHAR(100) NOT NULL,
      intensity INTEGER CHECK (intensity >= 0 AND intensity <= 100),
      market_health_score INTEGER CHECK (market_health_score >= 0 AND market_health_score <= 100),
      average_salary_min DECIMAL(12, 2),
      average_salary_max DECIMAL(12, 2),
      currency VARCHAR(10),
      cost_of_living DECIMAL(5, 2),
      visa_openness VARCHAR(50) CHECK (visa_openness IN ('High', 'Medium', 'Low')),
      hiring_trends TEXT,
      remote_work_percentage INTEGER,
      internship_opportunities INTEGER,
      top_employers TEXT,
      market_data JSONB,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(city, country)
    );

    -- Top Careers by Hub Table
    CREATE TABLE IF NOT EXISTS hub_top_careers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      hub_id UUID NOT NULL,
      career_title VARCHAR(255) NOT NULL,
      demand_score INTEGER CHECK (demand_score >= 0 AND demand_score <= 100),
      entry_salary DECIMAL(12, 2),
      mid_salary DECIMAL(12, 2),
      senior_salary DECIMAL(12, 2),
      job_growth_percentage DECIMAL(5, 2),
      estimated_openings INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hub_id) REFERENCES career_hubs(id) ON DELETE CASCADE
    );

    -- Required Skills Table
    CREATE TABLE IF NOT EXISTS hub_required_skills (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      hub_id UUID NOT NULL,
      skill_name VARCHAR(255) NOT NULL,
      demand_score INTEGER CHECK (demand_score >= 0 AND demand_score <= 100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hub_id) REFERENCES career_hubs(id) ON DELETE CASCADE
    );

    -- Job Market Insights Cache Table
    CREATE TABLE IF NOT EXISTS job_market_insights (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      career_id UUID,
      country VARCHAR(100),
      salary_entry DECIMAL(12, 2),
      salary_mid DECIMAL(12, 2),
      salary_senior DECIMAL(12, 2),
      currency VARCHAR(10),
      growth_percentage DECIMAL(5, 2),
      growth_trend VARCHAR(50) CHECK (growth_trend IN ('rising', 'stable', 'declining')),
      growth_description TEXT,
      in_demand_skills JSONB,
      top_hiring_companies TEXT,
      market_data JSONB,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(career_id, country)
    );

    -- Data Cache Metadata Table (for managing refresh intervals)
    CREATE TABLE IF NOT EXISTS cache_metadata (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      cache_key VARCHAR(255) NOT NULL UNIQUE,
      entity_type VARCHAR(100),
      entity_id UUID,
      cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      ttl_hours INTEGER DEFAULT 168,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_career_hubs_city_country ON career_hubs(city, country);
    CREATE INDEX IF NOT EXISTS idx_career_hubs_cached_at ON career_hubs(cached_at);
    CREATE INDEX IF NOT EXISTS idx_hub_top_careers_hub_id ON hub_top_careers(hub_id);
    CREATE INDEX IF NOT EXISTS idx_hub_skills_hub_id ON hub_required_skills(hub_id);
    CREATE INDEX IF NOT EXISTS idx_job_market_career_country ON job_market_insights(career_id, country);
    CREATE INDEX IF NOT EXISTS idx_cache_metadata_key ON cache_metadata(cache_key);
    CREATE INDEX IF NOT EXISTS idx_cache_metadata_expires ON cache_metadata(expires_at);
  `;

  try {
    await db.none(sql);
    console.log("✓ Migration 002: Market data tables created successfully");
  } catch (error) {
    console.error("✗ Migration 002 failed:", error);
    throw error;
  }
}

export async function down() {
  const sql = `
    DROP INDEX IF EXISTS idx_cache_metadata_expires;
    DROP INDEX IF EXISTS idx_cache_metadata_key;
    DROP INDEX IF EXISTS idx_job_market_career_country;
    DROP INDEX IF EXISTS idx_hub_skills_hub_id;
    DROP INDEX IF EXISTS idx_hub_top_careers_hub_id;
    DROP INDEX IF EXISTS idx_career_hubs_cached_at;
    DROP INDEX IF EXISTS idx_career_hubs_city_country;
    DROP TABLE IF EXISTS cache_metadata;
    DROP TABLE IF EXISTS job_market_insights;
    DROP TABLE IF EXISTS hub_required_skills;
    DROP TABLE IF EXISTS hub_top_careers;
    DROP TABLE IF EXISTS career_hubs;
  `;

  try {
    await db.none(sql);
    console.log("✓ Migration 002: Market data tables dropped");
  } catch (error) {
    console.error("✗ Migration 002 rollback failed:", error);
    throw error;
  }
}
