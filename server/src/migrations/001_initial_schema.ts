import { db } from "../db/database.js";

export async function up() {
  const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      firebase_uid VARCHAR(255) UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      age INTEGER,
      education VARCHAR(255),
      interests TEXT,
      budget DECIMAL(12, 2),
      country VARCHAR(100),
      target_location VARCHAR(100),
      target_career_id UUID,
      gpa DECIMAL(3, 2),
      achievements TEXT,
      annual_income DECIMAL(12, 2),
      current_savings DECIMAL(12, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS career_paths (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      growth VARCHAR(50) CHECK (growth IN ('high', 'medium', 'stable')),
      category VARCHAR(100),
      sub_category VARCHAR(100),
      work_type VARCHAR(50) CHECK (work_type IN ('Remote', 'On-site', 'Hybrid', 'Mobile')),
      tags TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      career_id UUID NOT NULL,
      age_range VARCHAR(50),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      requirements TEXT,
      sequence_order INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (career_id) REFERENCES career_paths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS institutions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      city VARCHAR(100),
      country VARCHAR(100),
      type VARCHAR(50) CHECK (type IN ('University', 'Vocational', 'Polytechnic', 'Medical School', 'Business School')),
      avg_cost DECIMAL(12, 2),
      programs TEXT,
      ranking INTEGER,
      image VARCHAR(500),
      application_deadline DATE,
      website VARCHAR(500),
      allows_international_students BOOLEAN DEFAULT true,
      visa_support VARCHAR(50) CHECK (visa_support IN ('Full', 'Partial', 'None')),
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      cost_of_living_index DECIMAL(5, 2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_materials (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      type VARCHAR(50) CHECK (type IN ('video', 'audio', 'course', 'article')),
      provider VARCHAR(100),
      url VARCHAR(500),
      career_id UUID NOT NULL,
      duration VARCHAR(100),
      thumbnail VARCHAR(500),
      region VARCHAR(50) CHECK (region IN ('Global', 'NA', 'EU', 'ASIA', 'UK')),
      language VARCHAR(50),
      rating DECIMAL(3, 2),
      skill_level VARCHAR(50) CHECK (skill_level IN ('Beginner', 'Intermediate', 'Advanced')),
      tags TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (career_id) REFERENCES career_paths(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS funding_opportunities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      provider VARCHAR(255),
      amount DECIMAL(12, 2),
      deadline DATE,
      eligibility_criteria TEXT,
      description TEXT,
      category VARCHAR(50) CHECK (category IN ('Merit', 'Need', 'Interest', 'Geographic')),
      type VARCHAR(50) CHECK (type IN ('Scholarship', 'Grant', 'Loan')),
      terms TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      text TEXT NOT NULL,
      tier VARCHAR(50) CHECK (tier IN ('Behavioral', 'Role-Specific', 'Company-Specific')),
      category VARCHAR(100),
      company VARCHAR(255),
      tips TEXT,
      target_keywords TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      role VARCHAR(255),
      company VARCHAR(255),
      total_score DECIMAL(5, 2),
      session_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS interview_feedbacks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID NOT NULL,
      question_id UUID NOT NULL,
      answer_text TEXT,
      star_score DECIMAL(5, 2),
      confidence_score DECIMAL(5, 2),
      sentiment VARCHAR(50) CHECK (sentiment IN ('Positive', 'Neutral', 'Needs Improvement')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES interview_questions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_career_growth ON career_paths(growth);
    CREATE INDEX IF NOT EXISTS idx_career_category ON career_paths(category);
    CREATE INDEX IF NOT EXISTS idx_materials_type ON study_materials(type);
    CREATE INDEX IF NOT EXISTS idx_materials_career ON study_materials(career_id);
    CREATE INDEX IF NOT EXISTS idx_institutions_type ON institutions(type);
    CREATE INDEX IF NOT EXISTS idx_institutions_country ON institutions(country);
    CREATE INDEX IF NOT EXISTS idx_institutions_city ON institutions(city);
    CREATE INDEX IF NOT EXISTS idx_funding_deadline ON funding_opportunities(deadline);
    CREATE INDEX IF NOT EXISTS idx_questions_tier ON interview_questions(tier);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON interview_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_session ON interview_feedbacks(session_id);

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_career_paths_updated_at BEFORE UPDATE ON career_paths
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_study_materials_updated_at BEFORE UPDATE ON study_materials
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_funding_opportunities_updated_at BEFORE UPDATE ON funding_opportunities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    await db.none(sql);
    console.log("✓ Migration completed: Initial schema created");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    throw error;
  }
}

export async function down() {
  const sql = `
    DROP TRIGGER IF EXISTS update_funding_opportunities_updated_at ON funding_opportunities;
    DROP TRIGGER IF EXISTS update_study_materials_updated_at ON study_materials;
    DROP TRIGGER IF EXISTS update_institutions_updated_at ON institutions;
    DROP TRIGGER IF EXISTS update_career_paths_updated_at ON career_paths;
    DROP TRIGGER IF EXISTS update_users_updated_at ON users;
    
    DROP FUNCTION IF EXISTS update_updated_at_column();
    
    DROP TABLE IF EXISTS interview_feedbacks CASCADE;
    DROP TABLE IF EXISTS interview_sessions CASCADE;
    DROP TABLE IF EXISTS interview_questions CASCADE;
    DROP TABLE IF EXISTS funding_opportunities CASCADE;
    DROP TABLE IF EXISTS study_materials CASCADE;
    DROP TABLE IF EXISTS institutions CASCADE;
    DROP TABLE IF EXISTS milestones CASCADE;
    DROP TABLE IF EXISTS career_paths CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `;

  try {
    await db.none(sql);
    console.log("✓ Migration rollback completed");
  } catch (error) {
    console.error("✗ Migration rollback failed:", error);
    throw error;
  }
}
