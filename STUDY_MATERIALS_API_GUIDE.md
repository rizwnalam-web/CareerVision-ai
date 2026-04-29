# Study Materials API Integration Guide

## Overview
CareerVision Study Materials now includes curated links to educational content from multiple external providers. No hosting is required - we link directly to source content.

## Supported Providers

### 1. **Boclips** (1.7M+ Educational Videos)
- **URL**: https://boclips.com
- **Free Tier**: Developer account available
- **Setup**:
  ```
  BOCLIPS_API_KEY=your_boclips_api_key
  ```

### 2. **YouTube Data API** (Verified Educational Channels)
- **URL**: https://developers.google.com/youtube/v3
- **Setup**:
  ```
  YOUTUBE_API_KEY=your_youtube_api_key
  ```
- **Features**: Searches trusted educational channels (TED-Ed, Crash Course, Kurzgesagt, etc.)

### 3. **Coursera** (Affiliate Program)
- **URL**: https://www.coursera.org
- **Setup** (with affiliate earnings):
  ```
  COURSERA_API_KEY=your_coursera_api_key
  COURSERA_AFFILIATE_TOKEN=your_affiliate_token
  ```
- **Free to use**: Public search available without API key

### 4. **Udemy** (Affiliate Program)
- **URL**: https://www.udemy.com
- **Setup** (with affiliate earnings):
  ```
  UDEMY_AFFILIATE_ID=your_affiliate_id
  ```
- **Free to use**: Public search available

### 5. **MIT OpenCourseWare** (100% Free)
- **URL**: https://ocw.mit.edu
- **No authentication needed**: Public API
- **Features**: 2000+ free MIT courses

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Backend API Base URL
VITE_API_URL=http://localhost:3000/api

# Video Material APIs
BOCLIPS_API_KEY=
YOUTUBE_API_KEY=
COURSERA_API_KEY=
COURSERA_AFFILIATE_TOKEN=
UDEMY_AFFILIATE_ID=

# Optional: Database URL (if using external database)
DATABASE_URL=postgresql://user:password@localhost:5432/careervision
```

## Installation & Setup

### 1. Install Dependencies

```bash
# In server directory
cd server
npm install axios

# In root directory (already installed)
npm install
```

### 2. Get API Keys

**Boclips**:
- Visit https://boclips.com/developer
- Sign up for free developer account
- Get API key from dashboard

**YouTube Data API**:
- Go to https://console.cloud.google.com
- Create new project
- Enable YouTube Data API v3
- Create API key

**Coursera** (optional, for affiliate links):
- Apply at https://www.coursera.org/about/careers/partnerships/affiliates
- Get affiliate token after approval

**Udemy** (optional, for affiliate links):
- Join Udemy Affiliate Program
- Get affiliate ID from dashboard

## API Endpoints

### Frontend Service Methods

```typescript
// Search all external sources
materialsService.searchAllSources({
  query: "Machine Learning",
  skillLevel: "Beginner",
  limit: 20
})

// Search specific providers
materialsService.searchBoclips({ query, skillLevel, limit })
materialsService.searchYouTube({ query, skillLevel, limit })
materialsService.searchCoursera({ query, skillLevel, limit })
materialsService.searchUdemy({ query, skillLevel, limit })
materialsService.searchMITOpenCourseWare({ query, skillLevel, limit })

// Get materials by career
materialsService.getMaterialsByCareer(careerId)

// Track views for recommendations
materialsService.trackMaterialView(materialId)
```

### Backend REST Endpoints

```
GET /api/materials/search/all?query=...&skillLevel=...
GET /api/materials/search/boclips?query=...&skillLevel=...
GET /api/materials/search/youtube?query=...&skillLevel=...
GET /api/materials/search/coursera?query=...&skillLevel=...
GET /api/materials/search/udemy?query=...&skillLevel=...
GET /api/materials/search/mit-ocw?query=...&skillLevel=...
```

## Features

### 🔗 Link-Based Architecture
- No hosting of video/audio files
- Direct links to source content
- Affiliate links support (Coursera, Udemy)
- MIT OCW free content highlighted

### 🤖 AI-Powered Search
- Gemini AI for intelligent material recommendations
- Combined search across all providers
- Context-aware filtering

### 📊 Content Filtering
- By skill level (Beginner, Intermediate, Advanced)
- By type (video, audio, course, article)
- By career path alignment
- By language
- By provider source

### ⭐ Quality Ratings
- Aggregate ratings from sources
- MIT OCW: 4.8/5 (vetted academic content)
- YouTube: 4.4/5 (verified educational channels)
- Coursera: 4.6/5 (peer-reviewed courses)
- Udemy: 4.3/5 (marketplace rating)
- Boclips: 4.5/5 (curated educational videos)

### 📱 User Experience
- Recently viewed materials history
- Responsive grid/list view modes
- External source badges
- Direct "Open" links with tracking

## Pricing

| Provider | Cost | Videos | Courses | Setup Time |
|----------|------|--------|---------|------------|
| Boclips | Free (dev) / Paid | 1.7M+ | - | 5 min |
| YouTube | Free | Unlimited | - | 10 min |
| MIT OCW | **Free** | - | 2000+ | 0 min |
| Coursera | Free search | - | 10000+ | 5 min |
| Udemy | Free search | - | 50000+ | 5 min |

## Security Notes

- API keys are server-side only
- No sensitive data in frontend
- Each API has rate limiting
- Affiliate tokens encrypted in environment
- Direct links bypass proxy (faster loading)

## Troubleshooting

### "No results from Boclips"
- Check `BOCLIPS_API_KEY` is set
- Verify API key is not expired
- Check age range matches query content

### "YouTube search returning no results"
- Verify `YOUTUBE_API_KEY` is set
- Check YouTube API quota (100 requests/day default)
- Educational channels filter may be too restrictive

### "Slow response times"
- Run searches in parallel (automatically done in `searchAllSources`)
- Consider caching results
- Increase timeout in service calls if needed

### "Affiliate links not working"
- Verify `COURSERA_AFFILIATE_TOKEN` format
- Check `UDEMY_AFFILIATE_ID` is correct
- Affiliate URLs are tested before deployment

## API Rate Limits

- **Boclips**: 100 req/hour (free)
- **YouTube**: 100 req/day (free quota)
- **MIT OCW**: No limit
- **Coursera**: No limit (public search)
- **Udemy**: No limit (public search)

## Future Enhancements

- [ ] Edx integration
- [ ] Khan Academy integration
- [ ] LinkedIn Learning affiliate links
- [ ] Material download tracking
- [ ] User-submitted material links
- [ ] Content transcription caching
- [ ] Recommendation engine based on completion

## Support

For issues with specific providers:
- **Boclips**: support@boclips.com
- **YouTube API**: developers.google.com/youtube/support
- **MIT OCW**: [ocw-support](https://ocw.mit.edu/contact-us)
- **Coursera**: coursera.org/support
- **Udemy**: udemy.com/support
