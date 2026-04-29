# Data Persistence & Caching System Documentation

## Overview
CareerVision implements a **cache-first architecture** for managing market intelligence data, institutions, and study materials. This system:

1. **Reduces API costs** by caching LLM responses in PostgreSQL
2. **Improves performance** by serving cached data instead of making repeated API calls
3. **Provides data persistence** across user sessions and browser reloads
4. **Enables offline-like experiences** when cache is available

## Architecture

### Data Flow
```
Frontend Request
    ↓
Try to fetch from Database Cache
    ↓
    ├─→ Cache Hit: Return cached data
    │
    └─→ Cache Miss: Call Gemini/LLM API
         ↓
      Generate Response
         ↓
      Save to Database (async, non-blocking)
         ↓
      Return to Frontend
```

## Database Tables

### 1. `career_hubs`
Stores Career Hub Intelligence for job markets in cities.

**Columns:**
- `id` (UUID): Primary key
- `city` (VARCHAR): City name
- `country` (VARCHAR): Country name
- `intensity` (INTEGER 0-100): Market activity level
- `market_health_score` (INTEGER 0-100): Overall market health
- `average_salary_min/max` (DECIMAL): Salary range
- `currency` (VARCHAR): Currency code (e.g., "USD")
- `cost_of_living` (DECIMAL): Cost of living index (1.0 = average)
- `visa_openness` (VARCHAR): "High" | "Medium" | "Low"
- `hiring_trends` (TEXT): Description of hiring trends
- `remote_work_percentage` (INTEGER): % of remote jobs
- `internship_opportunities` (INTEGER): Count of internships
- `top_employers` (TEXT): JSON array of employer names
- `market_data` (JSONB): Full market data object
- `cached_at` (TIMESTAMP): When data was cached
- `expires_at` (TIMESTAMP): When cache expires (7 days by default)

**Unique Constraint:** `(city, country)`

### 2. `hub_top_careers`
Top careers in each hub with salary and demand data.

**Columns:**
- `hub_id` (UUID FK): References `career_hubs`
- `career_title` (VARCHAR): Job title (e.g., "Software Engineer")
- `demand_score` (INTEGER 0-100): Market demand for this role
- `entry_salary`, `mid_salary`, `senior_salary` (DECIMAL): Salary levels
- `job_growth_percentage` (DECIMAL): Annual growth projection
- `estimated_openings` (INTEGER): Approx number of job openings

### 3. `hub_required_skills`
Required skills for jobs in each hub.

**Columns:**
- `hub_id` (UUID FK): References `career_hubs`
- `skill_name` (VARCHAR): Skill name (e.g., "Python", "Cloud Computing")
- `demand_score` (INTEGER 0-100): How in-demand this skill is

### 4. `job_market_insights`
Stores detailed market insights per career and country.

**Columns:**
- `career_id` (UUID): Career identifier
- `country` (VARCHAR): Country for market data
- `salary_entry`, `salary_mid`, `salary_senior` (DECIMAL): Salary benchmarks
- `currency` (VARCHAR): Currency code
- `growth_percentage` (DECIMAL): Growth forecast
- `growth_trend` (VARCHAR): "rising" | "stable" | "declining"
- `growth_description` (TEXT): Market trend description
- `in_demand_skills` (JSONB): Array of skill objects
- `top_hiring_companies` (JSON B): Array of company names
- `market_data` (JSONB): Full market insights object
- `cached_at` (TIMESTAMP): When cached
- `expires_at` (TIMESTAMP): Cache expiration

**Unique Constraint:** `(career_id, country)`

### 5. `cache_metadata`
Tracks cache entry metadata and TTL (Time To Live).

**Columns:**
- `cache_key` (VARCHAR UNIQUE): Unique cache identifier
- `entity_type` (VARCHAR): Type of cached entity
- `entity_id` (UUID): ID of the entity being cached
- `cached_at` (TIMESTAMP): When cached
- `expires_at` (TIMESTAMP): When cache expires
- `ttl_hours` (INTEGER): Time-to-live in hours (default: 168 = 7 days)

## Backend Implementation

### API Endpoints

#### 1. Career Hub Intelligence
```
GET  /api/market/career-hub/:city/:country
POST /api/market/career-hub
```

**GET Response:**
```json
{
  "source": "cache" | "not-cached",
  "data": { CareerHubIntelligence object }
}
```

**POST Request:**
```json
{
  "city": "Silicon Valley",
  "country": "USA",
  "intensity": 95,
  "marketHealthScore": 85,
  "topCareers": [...],
  "requiredSkills": [...]
}
```

#### 2. Job Market Insights
```
GET  /api/market/job-insights/:careerId/:country
POST /api/market/job-insights
```

#### 3. Institutions
```
POST /api/market/save-institutions
GET  /api/market/institutions?country=USA&city=Seattle
```

Bulk save institutions and retrieve cached institutions by location.

#### 4. Study Materials
```
POST /api/market/save-study-materials
GET  /api/market/study-materials/:careerId
```

Bulk save study materials and retrieve by career ID.

### Database Helper Functions (`server/src/db/marketCache.ts`)

#### `saveCareerHub(hubData)`
Saves career hub intelligence to database, including top careers and required skills.

#### `getCareerHubFromDb(city, country)`
Retrieves cached career hub data if available and not expired.

#### `saveJobMarketInsights(careerId, country, insightsData)`
Persists job market insights to `job_market_insights` table.

#### `getJobMarketInsightsFromDb(careerId, country)`
Fetches cached market insights.

#### `setCacheMetadata(cacheKey, entityType, entityId, ttlHours)`
Records cache entry metadata for TTL tracking.

#### `isCacheValid(cacheKey)`
Checks if cache entry is still valid (not expired).

#### `expireCache(entityType, entityId)`
Manually marks cache entries as expired.

## Frontend Implementation

### Service: `cacheService.ts`

#### Functions

**`getCachedCareerHub(city, country)`**
- Makes GET request to `/api/market/career-hub/:city/:country`
- Returns cached data if available, `null` otherwise

**`saveCachedCareerHub(hubData)`**
- Makes POST request to save career hub data
- Non-blocking (fires and forgets)
- Returns boolean success/failure

**`getCachedInstitutions(country, city?)`**
- Retrieves institutions for a location from cache

**`saveCachedInstitutions(institutions)`**
- Bulk saves institutions to database

**`getCachedStudyMaterialsByCareer(careerId)`**
- Fetches study materials for a career from cache

**`saveCachedStudyMaterials(materials, careerId)`**
- Bulk saves study materials to database

### Integration with Gemini Service

The `geminiService.ts` implements cache-first logic:

```typescript
export async function getCareerHubIntelligence(city, country) {
  // Step 1: Check cache first
  const cachedData = await getCachedCareerHub(city, country);
  if (cachedData) return cachedData;

  // Step 2: Call LLM if not cached
  const response = await ai.models.generateContent({ ... });
  const result = JSON.parse(response.text);

  // Step 3: Save to cache (async, non-blocking)
  await saveCachedCareerHub(result).catch(err => 
    console.warn("Cache save failed (non-blocking):", err)
  );

  return result;
}
```

## Cache Expiration

All cache entries have a **7-day TTL (Time To Live)** by default.

After expiration, the next request will:
1. Detect cache is expired
2. Call Gemini/LLM API for fresh data
3. Update database with new data
4. Reset `expires_at` timestamp

### Manual Cache Expiration

To invalidate cache and force fresh data:

```typescript
import { expireCache } from "../db/marketCache";

// Expire all career hubs
await expireCache("career_hub");

// Expire specific career hub
await expireCache("career_hub", hubId);
```

## Data Flow Examples

### Example 1: Career Hub Heatmap Load

**First Load (No Cache):**
1. Frontend: `getCareerHubIntelligence("Silicon Valley", "USA")`
2. Service: Check database cache → cache miss
3. Service: Call Gemini API → get market data
4. Service: Save to database (background, async)
5. Frontend: Display data with "Data synchronized" message

**Second Load (With Cache):**
1. Frontend: `getCareerHubIntelligence("Silicon Valley", "USA")`
2. Service: Check database cache → cache hit
3. Frontend: Display cached data instantly with "Using local cache" message
4. No API call made

### Example 2: Study Materials Fetch

```typescript
// In Components/MaterialsView or App.tsx
const materials = await getDynamicStudyMaterials(careerId, "Intermediate", "Global");
// If cached, returns from DB immediately
// If not cached, calls Gemini, saves to DB, returns
```

## Benefits

| Benefit | Impact |
|---------|--------|
| **Reduced API Costs** | Avoids repeated Gemini API calls for same data |
| **Faster Response Times** | Database queries (~50ms) vs API calls (~2-3s) |
| **Better User Experience** | Instant data load on second visit |
| **Scalability** | Supports more concurrent users without API rate limits |
| **Data Freshness Control** | 7-day TTL ensures data doesn't go too stale |
| **Graceful Degradation** | If API fails, cached data still available |

## Monitoring & Maintenance

### Check Cache Hit Rate
```sql
SELECT COUNT(*) as total_requests,
       SUM(CASE WHEN cached_at > NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as recent_hits
FROM cache_metadata;
```

### Find Expired Cache
```sql
SELECT * FROM career_hubs WHERE expires_at < NOW();
```

### Clear Old Cache
```sql
DELETE FROM career_hubs WHERE expires_at < NOW() - INTERVAL '30 days';
DELETE FROM cache_metadata WHERE expires_at < NOW() - INTERVAL '30 days';
```

### Monitor Cache Table Sizes
```sql
SELECT pg_size_pretty(pg_total_relation_size('career_hubs')) as hub_size,
       pg_size_pretty(pg_total_relation_size('hub_top_careers')) as careers_size,
       pg_size_pretty(pg_total_relation_size('hub_required_skills')) as skills_size;
```

## Future Enhancements

1. **Implement cache warming** - Pre-fetch and cache popular locations on app startup
2. **Add cache invalidation webhooks** - Trigger cache refresh when market data changes
3. **User-specific caching** - Cache personalized recommendations per user
4. **Compression** - Compress large JSONB data for faster queries
5. **Read replicas** - Use read-only database copies for cache retrieval to reduce primary load
6. **Cache layer (Redis)** - Add in-memory cache layer for even faster lookups

## Troubleshooting

### Cache Not Saving
Check server logs for errors in `/api/market/*` endpoints. Verify database credentials and ensure migrations have run.

### Stale Data in UI
If cache is too old, manually expire it via `expireCache()` or wait for 7-day TTL to expire.

### Database Growing Too Large
Run cache cleanup queries above or implement automated job to delete data older than 30-60 days.

### API Still Being Called Despite Cache
Verify `getCachedCareerHub()` is being called before `ai.models.generateContent()` in the service layer.
