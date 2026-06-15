# CareerVision AI — Application Features & Usage

## Overview
CareerVision AI is a career planning and education intelligence platform that combines user profile data, global labor market signals, educational content discovery, funding opportunities, interview preparation, and visa guidance.

The application supports:
- Personalized career path discovery and recommendations
- AI-powered job, institution, and study material search
- Funding and scholarship matching
- Interview practice and feedback tracking
- Global market intelligence and migration-aware guidance
- Email and Google authentication with password reset support

## Primary Use Cases

### 1. Career Planning and Discovery
Use CareerVision AI to explore high-demand careers, compare career paths, and get actionable milestones for growth.
- Search careers by title, category, or interest
- Analyze top global career paths with AI-generated milestone plans
- Get career-specific skill gap assessments and salary trajectory projections

### 2. Study Material Research
Discover learning resources from multiple sources to support your next career move.
- Search curated study materials across local catalog and external content providers
- Query Boclips, YouTube, Coursera, Udemy, and MIT OpenCourseWare
- Filter by skill level, region, language, provider, and rating

### 3. Institution Selection and Education Planning
Evaluate institutions and education programs based on career goals.
- Browse cached institution profiles by country, city, or type
- Receive AI institution recommendations that match your profile and target career
- Generate tailored cover letters for applications

### 4. Financial & Funding Guidance
Find scholarships, grants, and cost-aware funding opportunities.
- Search funding opportunities by category and type
- Compare cost, eligibility, and deadlines
- Match scholarships based on user profile and goals

### 5. Interview Training and Feedback
Prepare for interviews with structured practice and feedback recording.
- Browse interview questions by tier, category, or company
- Record interview sessions and score performance
- Save answer feedback, confidence, and sentiment data

### 6. Global Market Intelligence & Migration Support
Gain market insights and migration-aware advice for international career moves.
- Cache and retrieve city/country career hub intelligence
- Get market insights for career roles by country
- Receive visa guidance for target location and career goals
- Use global context insights to shape strategy across regions

## Authentication & Account Management

### Supported authentication methods
- Email/password registration and login
- Google sign-in via Firebase authentication

### Password reset flow
- Request token: `POST /api/users/auth/password/forgot`
- Reset password: `POST /api/users/auth/password/reset`
- Reset tokens are valid for 1 hour and marked used after successful reset
- In development, the generated token is returned in the response for testing

## Core API Endpoints

### User and auth
- `GET /api/users` — List users
- `GET /api/users/:id` — Get user profile
- `POST /api/users/auth/register` — Create a new email/password user
- `POST /api/users/auth/login` — Authenticate user with email/password
- `POST /api/users/auth/password/forgot` — Generate reset token
- `POST /api/users/auth/password/reset` — Reset password with token

### Career and education
- `GET /api/careers` — List career paths
- `GET /api/careers/:id` — Career details with milestones
- `GET /api/careers/top` — Cached top global careers
- `POST /api/careers/bulk` — Bulk save AI-generated careers and milestones
- `GET /api/institutions` — List institutions with filters
- `GET /api/materials` — List study materials with filters
- `GET /api/funding` — List funding opportunities

### Interview system
- `GET /api/interviews/questions` — Browse interview questions
- `POST /api/interviews/sessions` — Create a practice session
- `GET /api/interviews/sessions/user/:userId` — Get user sessions
- `POST /api/interviews/feedbacks` — Save feedback on a response

### Market and caching
- `GET /api/market/career-hub/:city/:country` — Fetch cached hub intelligence
- `POST /api/market/career-hub` — Save hub intelligence cache
- `GET /api/market/job-insights/:careerId/:country` — Fetch cached job insights
- `POST /api/market/job-insights` — Save job market insights
- `GET /api/market/study-materials/:careerId` — Fetch cached study materials
- `GET /api/market/institutions` — Fetch cached institutions by region

### LLM / AI-powered services
- `POST /api/llm/generate` — Generate text from LLM prompt
- `POST /api/llm/batch` — Batch LLM generation
- `GET /api/llm/cost` — Retrieve LLM usage cost summary
- `POST /api/llm/clear-cache` — Flush cached LLM responses

### Career AI endpoints
- `POST /api/careers-ai/search-study-materials`
- `POST /api/careers-ai/search-jobs`
- `POST /api/careers-ai/search-institutions`
- `POST /api/careers-ai/job-suggestions`
- `POST /api/careers-ai/institution-recommendations`
- `POST /api/careers-ai/market-insights`
- `POST /api/careers-ai/career-advice`
- `POST /api/careers-ai/visa-guidance`
- `POST /api/careers-ai/generate-cover-letter`
- `POST /api/careers-ai/match-scholarships`
- `POST /api/careers-ai/recommended-courses`
- `POST /api/careers-ai/latest-career-news`

## AI provider design
- Primary LLM provider is DeepSeek via `server/src/services/deepseekService.ts`
- On DeepSeek billing failures (`402 Insufficient balance`), requests fall back to OpenAI
- LLM responses are cached and cost-tracked in memory
- The system supports off-peak/max token tuning with `OFF_PEAK_HOURS`

## Data & persistence
- PostgreSQL backend managed through `server/src/db/database.ts`
- Automatic migration runner at startup via `server/src/migrations/runMigrations.ts`
- Password reset tokens stored in `password_reset_tokens`
- Cached market intelligence stored in `cache_metadata` and related tables
- Study materials, institutions, and funding data are persisted for reuse

## Deployment and setup

### Backend
- Install dependencies: `cd server && npm install`
- Run the server: `npm run dev`
- Run migrations: `npm run migrate`
- Environment variables include `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `CORS_ORIGIN`, `DEEPSEEK_API_KEY`, and optionally `OPENAI_API_KEY` for fallback.

### Frontend
- Run the React/Vite frontend with `npm run dev` from workspace root
- Frontend communicates with backend through `VITE_API_URL`

## Recommended user workflows

### Student preparing for a global career transition
1. Register or sign in with Google/email
2. Build a profile with target career, budget, and interests
3. Explore `Top Global Careers` and compare milestones
4. Search study materials and institution recommendations
5. Review visa guidance and funding opportunities
6. Practice interview sessions and gather feedback

### Career switcher seeking AI/tech roles
1. Use `AI job suggestions` and `career advice` endpoints
2. Generate a targeted cover letter for institution applications
3. Use skill gap analysis to prioritize certifications
4. Track progress against `3/6/12 month` career roadmaps

### International applicant focused on migration intelligence
1. Query market insights by country and career
2. Save career hub intelligence for the city/country pair
3. Use visa guidance to understand sponsorship likelihood
4. Compare institutions by cost, ranking, and application deadlines

## Notes for developers
- `server/src/index.ts` ensures automatic migration execution before startup
- `server/src/routes/users.ts` contains email password auth and reset handling
- `server/src/services/deepseekService.ts` contains LLM provider fallback logic
- `src/components/Auth.tsx` handles UI state for login, password reset, and token input
- `src/services/authService.ts` implements backend requests for auth flows

## Glossary
- `Career Hub Intelligence` — cached city/country insights for local opportunity analysis
- `Skill Gap` — inferred training needs for a target career path
- `Study Materials` — curated learning resources from internal and external providers
- `Funding Opportunities` — scholarships, grants, and loans matched to profile goals
- `LLM Fallback` — automatic switch from DeepSeek to OpenAI during billing/availability issues
