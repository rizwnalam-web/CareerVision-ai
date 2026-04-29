# API Endpoints Documentation

## Base URL
- **Production**: `http://localhost:3001` (configured for dev)
- **Frontend**: `http://localhost:3000`

## Market Data Endpoints

### Career Hub Intelligence

#### Get Career Hub Data (Check Cache)
```
GET /api/market/career-hub/:city/:country
```

**Response:**
```json
{
  "source": "cache|not-cached",
  "data": {
    "city": "Silicon Valley",
    "country": "USA",
    "intensity": 95,
    "topCareers": [
      {
        "title": "Software Engineer",
        "demandScore": 95,
        "avgSalary": {
          "entry": 120000,
          "mid": 180000,
          "senior": 250000,
          "currency": "USD"
        },
        "jobGrowth": 8,
        "openings": 5000
      }
    ],
    "marketHealthScore": 85,
    "averageSalaryRange": {
      "min": 100000,
      "max": 300000,
      "currency": "USD"
    },
    "costOfLiving": 1.8,
    "requiredSkills": [
      {
        "skill": "Python",
        "demand": 95
      }
    ],
    "visaOpenness": "High",
    "hiringTrends": "Strong demand for AI/ML and distributed systems engineers",
    "topEmployers": ["Google", "Apple", "Meta", "Microsoft", "Nvidia"],
    "internshipOpportunities": 500,
    "remoteWorkPercentage": 35
  }
}
```

**Possible `source` values:**
- `"cache"` - Data retrieved from database cache
- `"not-cached"` - No cached data available (return `data: null`)

---

#### Save Career Hub Data
```
POST /api/market/career-hub
Content-Type: application/json
```

**Request Body:**
```json
{
  "city": "Silicon Valley",
  "country": "USA",
  "intensity": 95,
  "topCareers": [...],
  "marketHealthScore": 85,
  "averageSalaryRange": {...},
  "costOfLiving": 1.8,
  "requiredSkills": [...],
  "visaOpenness": "High",
  "hiringTrends": "...",
  "topEmployers": [...],
  "internshipOpportunities": 500,
  "remoteWorkPercentage": 35
}
```

**Response:**
```json
{
  "success": true,
  "hubId": "uuid-here",
  "message": "Career hub saved successfully",
  "cached": {
    "city": "Silicon Valley",
    "country": "USA",
    "expiresAt": "2025-01-23T10:30:45.123Z"
  }
}
```

**Status Codes:**
- `200 OK` - Data saved successfully
- `400 Bad Request` - Missing required fields
- `500 Server Error` - Database error

---

### Job Market Insights

#### Get Job Insights (Check Cache)
```
GET /api/market/job-insights/:careerId/:country
```

**Response:**
```json
{
  "source": "cache|not-cached",
  "data": {
    "careerId": "uuid",
    "country": "USA",
    "salaryBenchmarks": {
      "entry": 65000,
      "mid": 100000,
      "senior": 150000,
      "currency": "USD"
    },
    "growthForecast": "8-12%",
    "growthTrend": "rising|stable|declining",
    "growthDescription": "Steady growth driven by digital transformation...",
    "inDemandSkills": [
      {
        "skill": "Cloud Computing",
        "demand": 90
      }
    ],
    "topHiringCompanies": ["Company A", "Company B", "Company C"]
  }
}
```

---

#### Save Job Market Insights
```
POST /api/market/job-insights
Content-Type: application/json
```

**Request Body:**
```json
{
  "careerId": "uuid-here",
  "country": "USA",
  "salaryBenchmarks": {...},
  "growthForecast": "8-12%",
  "growthTrend": "rising",
  "growthDescription": "...",
  "inDemandSkills": [...],
  "topHiringCompanies": [...]
}
```

**Response:**
```json
{
  "success": true,
  "insightId": "uuid-here",
  "message": "Job insights saved successfully"
}
```

---

### Institutions

#### Save Multiple Institutions (Bulk)
```
POST /api/market/save-institutions
Content-Type: application/json
```

**Request Body:**
```json
{
  "institutions": [
    {
      "name": "Stanford University",
      "country": "USA",
      "city": "Palo Alto",
      "specializations": ["Computer Science", "AI", "Business"],
      "rankingTier": "Top 10",
      "tuitionRange": "50000-60000",
      "currency": "USD",
      "admissionRate": 3.2,
      "avgSalaryAfterGraduation": 120000,
      "notableAlumni": "Steve Jobs, Sergey Brin, etc.",
      "programsOffered": ["BS", "MS", "PhD"],
      "placementRate": 98,
      "internshipOpportunities": 450
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "saved": 1,
  "skipped": 0,
  "message": "Institutions saved successfully"
}
```

---

#### Get Institutions (By Location)
```
GET /api/market/institutions?country=USA&city=Palo Alto
```

**Query Parameters:**
- `country` (required) - Filter by country
- `city` (optional) - Filter by city

**Response:**
```json
{
  "institutions": [
    {
      "id": "uuid",
      "name": "Stanford University",
      "country": "USA",
      "city": "Palo Alto",
      "specializations": [...],
      "rankingTier": "Top 10",
      "tuitionRange": "50000-60000",
      "currency": "USD",
      "admissionRate": 3.2,
      "avgSalaryAfterGraduation": 120000,
      "notableAlumni": "...",
      "programsOffered": [...],
      "placementRate": 98,
      "internshipOpportunities": 450,
      "cached": true,
      "cachedAt": "2025-01-23T10:30:45.123Z"
    }
  ],
  "count": 1
}
```

---

### Study Materials

#### Save Multiple Study Materials (Bulk)
```
POST /api/market/save-study-materials
Content-Type: application/json
```

**Request Body:**
```json
{
  "materials": [
    {
      "title": "Python Algorithms Mastery",
      "careerId": "uuid",
      "skillLevel": "Intermediate",
      "subject": "Computer Science",
      "resourceType": "Online Course|Book|Tutorial|Documentation",
      "url": "https://example.com/course",
      "duration": "40 hours",
      "costRange": "$0-50",
      "rating": 4.8,
      "reviewCount": 2500,
      "provider": "Udemy",
      "description": "Comprehensive guide to algorithms...",
      "targetAudience": "Backend developers",
      "learningOutcomes": ["Master sorting algorithms", "Understand Big O notation"],
      "prerequisites": "Basic Python knowledge"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "saved": 1,
  "skipped": 0,
  "message": "Study materials saved successfully"
}
```

---

#### Get Study Materials (By Career)
```
GET /api/market/study-materials/:careerId
```

**Query Parameters:**
- `:careerId` (required) - Career path ID

**Response:**
```json
{
  "materials": [
    {
      "id": "uuid",
      "title": "Python Algorithms Mastery",
      "careerId": "uuid",
      "skillLevel": "Intermediate",
      "subject": "Computer Science",
      "resourceType": "Online Course",
      "url": "https://example.com/course",
      "duration": "40 hours",
      "costRange": "$0-50",
      "rating": 4.8,
      "reviewCount": 2500,
      "provider": "Udemy",
      "description": "...",
      "targetAudience": "Backend developers",
      "learningOutcomes": [...],
      "prerequisites": "Basic Python knowledge",
      "savedAt": "2025-01-23T10:30:45.123Z"
    }
  ],
  "count": 1
}
```

---

## Testing with cURL

### Test Career Hub Cache (No Data)
```bash
curl -X GET "http://localhost:3001/api/market/career-hub/Silicon%20Valley/USA"
```

Expected: `{"source": "not-cached", "data": null}`

---

### Test Career Hub Cache (Save Data)
```bash
curl -X POST "http://localhost:3001/api/market/career-hub" \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Silicon Valley",
    "country": "USA",
    "intensity": 95,
    "marketHealthScore": 85,
    "topCareers": [{"title": "Software Engineer", "demandScore": 95, "avgSalary": {"entry": 120000, "mid": 180000, "senior": 250000, "currency": "USD"}, "jobGrowth": 8, "openings": 5000}],
    "averageSalaryRange": {"min": 100000, "max": 300000, "currency": "USD"},
    "costOfLiving": 1.8,
    "requiredSkills": [{"skill": "Python", "demand": 95}],
    "visaOpenness": "High",
    "hiringTrends": "Strong demand for AI/ML and distributed systems engineers",
    "topEmployers": ["Google", "Apple", "Meta", "Microsoft", "Nvidia"],
    "internshipOpportunities": 500,
    "remoteWorkPercentage": 35
  }'
```

---

### Test Career Hub Cache (Retrieve Data)
```bash
curl -X GET "http://localhost:3001/api/market/career-hub/Silicon%20Valley/USA"
```

Expected: `{"source": "cache", "data": {...}}`

---

## Error Responses

### Missing Parameters
```json
{
  "success": false,
  "error": "Missing required field: city"
}
```

### Database Error
```json
{
  "success": false,
  "error": "Failed to save data to database",
  "details": "connection error"
}
```

### Invalid Data
```json
{
  "success": false,
  "error": "Invalid data format",
  "details": "intensity must be between 0 and 100"
}
```

---

## Integration with Frontend Services

The `src/services/cacheService.ts` provides TypeScript wrappers for all these endpoints:

```typescript
import {
  getCachedCareerHub,
  saveCachedCareerHub,
  getCachedJobInsights,
  saveCachedJobInsights,
  getCachedInstitutions,
  saveCachedInstitutions,
  getCachedStudyMaterialsByCareer,
  saveCachedStudyMaterials
} from "./cacheService";

// Use in components
const hubData = await getCachedCareerHub("Silicon Valley", "USA");
if (hubData) {
  setHubs([...hubs, hubData]);
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Future versions should add:
- 100 requests per minute per IP
- 10,000 requests per hour per user

---

## Authentication

Currently all endpoints are public (no auth required). Future versions should implement:
- JWT token validation
- User role-based access control
- API key authentication for external consumers
