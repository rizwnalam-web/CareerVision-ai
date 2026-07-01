import { Router, Request, Response } from "express";
import * as careerAiService from "../services/careerAiService.js";
import type { UserProfile } from "../types/career";

const router = Router();

router.post("/search-study-materials", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });
    const results = await careerAiService.aiSearchStudyMaterials(query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Search study materials error:", error);
    res.status(500).json({ error: "Failed to search study materials" });
  }
});

router.post("/search-jobs", async (req: Request, res: Response) => {
  try {
    const { query, location } = req.body;
    if (!query || !location) {
      return res.status(400).json({ error: "query and location are required" });
    }
    const results = await careerAiService.aiSearchJobs(query, location);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Search jobs error:", error);
    res.status(500).json({ error: "Failed to search jobs" });
  }
});

router.post("/search-institutions", async (req: Request, res: Response) => {
  try {
    const { query, profile } = req.body;
    if (!query || !profile) {
      return res.status(400).json({ error: "query and profile are required" });
    }
    const results = await careerAiService.aiSearchInstitutions(query, profile);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Search institutions error:", error);
    res.status(500).json({ error: "Failed to search institutions" });
  }
});

router.post("/job-suggestions", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "profile is required" });
    }
    const results = await careerAiService.getAiJobSuggestions(profile);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Job suggestions error:", error);
    res.status(500).json({ error: "Failed to fetch job suggestions" });
  }
});

router.post("/institution-recommendations", async (req: Request, res: Response) => {
  try {
    const { profile, careerTitle } = req.body;
    if (!profile || !careerTitle) {
      return res.status(400).json({ error: "profile and careerTitle are required" });
    }
    const results = await careerAiService.getAiInstitutionRecommendations(profile, careerTitle);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Institution recommendations error:", error);
    res.status(500).json({ error: "Failed to fetch institution recommendations" });
  }
});

router.post("/proactive-job-recommendations", async (req: Request, res: Response) => {
  try {
    const { profile, savedJobs } = req.body;
    if (!profile || !Array.isArray(savedJobs)) {
      return res.status(400).json({ error: "profile and savedJobs are required" });
    }
    const results = await careerAiService.getAiProactiveJobRecommendations(profile, savedJobs);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Proactive job recommendations error:", error);
    res.status(500).json({ error: "Failed to fetch proactive job recommendations" });
  }
});

router.post("/market-insights", async (req: Request, res: Response) => {
  try {
    const { careerId, country } = req.body;
    if (!careerId || !country) {
      return res.status(400).json({ error: "careerId and country are required" });
    }
    const result = await careerAiService.getMarketInsights(careerId, country);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Market insights error:", error);
    res.status(500).json({ error: "Failed to fetch market insights" });
  }
});

router.get("/top-careers", async (req: Request, res: Response) => {
  try {
    const results = await careerAiService.getTopGlobalCareers();
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Get top careers error:", error);
    res.status(500).json({ error: "Failed to get top careers" });
  }
});

router.post("/search-career-paths", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });
    const results = await careerAiService.aiSearchCareerPaths(query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Search career paths error:", error);
    res.status(500).json({ error: "Failed to search career paths" });
  }
});

router.post("/dynamic-institutions", async (req: Request, res: Response) => {
  try {
    const { profile, careerId, targetLocation } = req.body;
    if (!profile || !careerId || !targetLocation) {
      return res
        .status(400)
        .json({ error: "profile, careerId, and targetLocation are required" });
    }
    const results = await careerAiService.getDynamicInstitutions(profile, careerId, targetLocation);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Get dynamic institutions error:", error);
    res.status(500).json({ error: "Failed to get dynamic institutions" });
  }
});

router.post("/dynamic-study-materials", async (req: Request, res: Response) => {
  try {
    const { careerId, skillLevel, region } = req.body;
    if (!careerId || !skillLevel || !region) {
      return res.status(400).json({ error: "careerId, skillLevel, and region are required" });
    }
    const results = await careerAiService.getDynamicStudyMaterials(careerId, skillLevel, region);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Get dynamic study materials error:", error);
    res.status(500).json({ error: "Failed to get dynamic study materials" });
  }
});

router.get("/career-hub/:city/:country", async (req: Request, res: Response) => {
  try {
    const { city, country } = req.params;
    const result = await careerAiService.getCareerHubIntelligence(city, country);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get career hub error:", error);
    res.status(500).json({ error: "Failed to get career hub intelligence" });
  }
});

router.post("/search-career-hubs", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "query is required" });
    const results = await careerAiService.aiSearchCareerHubs(query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Search career hubs error:", error);
    res.status(500).json({ error: "Failed to search career hubs" });
  }
});

router.post("/dashboard-intelligence", async (req: Request, res: Response) => {
  try {
    const { profile, primaryCareerId } = req.body;
    if (!profile || !primaryCareerId) {
      return res.status(400).json({ error: "profile and primaryCareerId are required" });
    }
    const result = await careerAiService.getDashboardIntelligence(profile, primaryCareerId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get dashboard intelligence error:", error);
    res.status(500).json({ error: "Failed to get dashboard intelligence" });
  }
});

router.post("/skill-gap", async (req: Request, res: Response) => {
  try {
    const { profile, careerTitle } = req.body;
    if (!profile || !careerTitle) {
      return res.status(400).json({ error: "profile and careerTitle are required" });
    }
    const result = await careerAiService.getCareerSkillGap(profile, careerTitle);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get skill gap error:", error);
    res.status(500).json({ error: "Failed to get skill gap" });
  }
});

router.post("/career-advice", async (req: Request, res: Response) => {
  try {
    const { prompt, profile, additionalContext } = req.body;
    if (!prompt || !profile) {
      return res.status(400).json({ error: "prompt and profile are required" });
    }
    const result = await careerAiService.getCareerAdvice(prompt, profile, additionalContext || {});
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get career advice error:", error);
    res.status(500).json({ error: "Failed to get career advice" });
  }
});

router.post("/deepseek-cost", (req: Request, res: Response) => {
  try {
    const {
      monthlyActiveUsers,
      avgRoadmapsPerUser,
      avgInputTokens,
      avgOutputTokens,
      model,
      cacheHitRate,
      batchSize,
    } = req.body;

    if (typeof monthlyActiveUsers !== "number" || typeof avgRoadmapsPerUser !== "number") {
      return res.status(400).json({
        error: "monthlyActiveUsers and avgRoadmapsPerUser are required and must be numbers",
      });
    }

    const estimate = careerAiService.estimateDeepSeekCost(
      {
        monthlyActiveUsers,
        avgRoadmapsPerUser,
        avgInputTokens: typeof avgInputTokens === "number" ? avgInputTokens : undefined,
        avgOutputTokens: typeof avgOutputTokens === "number" ? avgOutputTokens : undefined,
      },
      { model, cacheHitRate, batchSize }
    );

    res.json({ success: true, data: estimate });
  } catch (error) {
    console.error("DeepSeek cost estimate error:", error);
    res.status(500).json({ error: "Failed to estimate DeepSeek cost" });
  }
});

router.post("/career-advice/batch", async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;
    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: "requests must be a non-empty array" });
    }
    const results = await careerAiService.getCareerAdviceBatch(requests);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Get career advice batch error:", error);
    res.status(500).json({ error: "Failed to get career advice batch" });
  }
});

router.post("/match-scholarships", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "profile is required" });
    }
    const result = await careerAiService.matchScholarships(profile);
    res.json({ success: true, data: result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isRateLimit = /429|rate.?limit|too many requests/i.test(msg);
    console.error("Match scholarships error:", msg);
    res
      .status(isRateLimit ? 503 : 500)
      .set(isRateLimit ? { 'Retry-After': '60' } : {})
      .json({ error: isRateLimit ? "LLM providers are temporarily rate-limited. Please retry in ~60 seconds." : "Failed to match scholarships" });
  }
});

router.post("/recommended-courses", async (req: Request, res: Response) => {
  try {
    const { sector } = req.body;
    if (!sector) {
      return res.status(400).json({ error: "sector is required" });
    }
    const result = await careerAiService.getRecommendedCourses(sector);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get recommended courses error:", error);
    res.status(500).json({ error: "Failed to get recommended courses" });
  }
});

router.post("/generate-cover-letter", async (req: Request, res: Response) => {
  try {
    const { institution, userProfile, highlights } = req.body;
    if (!institution || !userProfile || !highlights) {
      return res.status(400).json({ error: "institution, userProfile, and highlights are required" });
    }
    const result = await careerAiService.generateCoverLetter(institution, userProfile, highlights);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Generate cover letter error:", error);
    res.status(500).json({ error: "Failed to generate cover letter" });
  }
});

router.post("/latest-career-news", async (req: Request, res: Response) => {
  try {
    const { preferredCountry } = req.body;
    const result = await careerAiService.getLatestCareerNews(preferredCountry);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get latest career news error:", error);
    res.status(500).json({ error: "Failed to get latest career news" });
  }
});

router.post("/visa-guidance", async (req: Request, res: Response) => {
  try {
    const { profile, targetCountry, targetCareer, institution } = req.body;
    if (!profile || !targetCountry || !targetCareer) {
      return res.status(400).json({ error: "profile, targetCountry, and targetCareer are required" });
    }
    const result = await careerAiService.getVisaGuidance(profile, targetCountry, targetCareer, institution);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get visa guidance error:", error);
    res.status(500).json({ error: "Failed to get visa guidance" });
  }
});

router.post("/global-context-insights", async (req: Request, res: Response) => {
  try {
    const { targetLocation, interests, targetCareerId } = req.body;
    if (!targetLocation || !interests || !targetCareerId) {
      return res.status(400).json({ error: "targetLocation, interests, and targetCareerId are required" });
    }
    const result = await careerAiService.getGlobalContextInsights(targetLocation, interests, targetCareerId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Get global context insights error:", error);
    res.status(500).json({ error: "Failed to get global context insights" });
  }
});

router.post("/career-directories", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "profile is required" });
    }
    const result = await careerAiService.getCareerDirectories(profile);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Career directories error:", error);
    res.status(500).json({ error: "Failed to get career directories" });
  }
});

router.post("/careers-by-country", async (req: Request, res: Response) => {
  try {
    const { country, profile, forceRefresh } = req.body;
    if (!country) {
      return res.status(400).json({ error: "country is required" });
    }
    const result = await careerAiService.getCareersByCountry(
      country,
      profile || {},
      Boolean(forceRefresh)
    );
    res.json({ success: true, data: result, cached: !forceRefresh });
  } catch (error) {
    console.error("Careers by country error:", error);
    res.status(500).json({ error: "Failed to get careers by country" });
  }
});

router.post("/milestones", async (req: Request, res: Response) => {
  try {
    const { careerTitle, userAge, userEducation, country } = req.body;
    if (!careerTitle) {
      return res.status(400).json({ error: "careerTitle is required" });
    }
    const milestones = await careerAiService.getCareerMilestones(
      careerTitle,
      Number(userAge) || 22,
      String(userEducation || ""),
      String(country || "Global")
    );
    res.json({ success: true, data: milestones });
  } catch (error) {
    console.error("Milestones error:", error);
    res.status(500).json({ error: "Failed to generate milestones" });
  }
});

router.post("/job-directory", async (req: Request, res: Response) => {
  try {
    const { country, profile } = req.body;
    if (!country) return res.status(400).json({ error: "country is required" });
    const result = await careerAiService.getJobDirectory(decodeURIComponent(country), profile);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Job directory error:", error);
    res.status(500).json({ error: "Failed to get job directory" });
  }
});

router.post("/career-requirements", async (req: Request, res: Response) => {
  try {
    const { careerTitle, country } = req.body;
    if (!careerTitle || !country) {
      return res.status(400).json({ error: "careerTitle and country are required" });
    }
    const result = await careerAiService.getCareerRequirements(decodeURIComponent(careerTitle), decodeURIComponent(country));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Career requirements error:", error);
    res.status(500).json({ error: "Failed to get career requirements" });
  }
});

// ─── Network & Community Routes ───────────────────────────────────────────────

router.post("/network-communities", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: "profile is required" });
    const results = await careerAiService.getNetworkCommunities(profile);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Network communities error:", error);
    res.status(500).json({ error: "Failed to fetch communities" });
  }
});

router.post("/network-mentors", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: "profile is required" });
    const results = await careerAiService.getNetworkMentors(profile);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Network mentors error:", error);
    res.status(500).json({ error: "Failed to fetch mentors" });
  }
});

router.post("/network-resume-reviews", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: "profile is required" });
    const results = await careerAiService.getNetworkResumeReviews(profile);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Network resume reviews error:", error);
    res.status(500).json({ error: "Failed to fetch resume reviews" });
  }
});

router.post("/network-referrals", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) return res.status(400).json({ error: "profile is required" });
    const results = await careerAiService.getNetworkReferrals(profile);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Network referrals error:", error);
    res.status(500).json({ error: "Failed to fetch referrals" });
  }
});

router.post("/network-companies", async (req: Request, res: Response) => {
  try {
    const { profile, query } = req.body;
    if (!profile) return res.status(400).json({ error: "profile is required" });
    const results = await careerAiService.getNetworkCompanies(profile, query);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Network companies error:", error);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// ─── Network Q&A Posts ────────────────────────────────────────────────────────

/**
 * GET /qa-posts?career=civil-engineer&country=USA&limit=30
 * Returns posts from the DB for the given career/country context.
 * If the table is empty for this career, seeds with AI-generated posts.
 */
router.get("/qa-posts", async (req: Request, res: Response) => {
  try {
    const career = String(req.query.career || 'career').replace(/-/g, ' ');
    const country = String(req.query.country || 'Global');
    const limit = Math.min(50, parseInt(String(req.query.limit || '30'), 10));

    const { db } = await import("../db/database.js");

    const rows = await db.manyOrNone(
      `SELECT id, author, avatar, role, career_tag, country_tag, title, body, tags, votes,
              answers, top_answer, top_answer_author, created_at
       FROM network_qa_posts
       WHERE career_tag ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [`%${career}%`, limit]
    );

    // If no posts exist yet, seed the table with AI-generated ones
    if (rows.length === 0) {
      const seeded = await careerAiService.generateQAPosts(career, country);
      if (seeded.length > 0) {
        for (const p of seeded) {
          await db.none(
            `INSERT INTO network_qa_posts
               (id, author, avatar, role, career_tag, country_tag, title, body, tags, votes, answers, top_answer, top_answer_author)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.author, p.avatar, p.role, career, country,
             p.title, p.body || '', p.tags || [], p.votes || 0, p.answers || 0,
             p.topAnswer || null, p.topAnswerAuthor || null]
          );
        }
        const fresh = await db.manyOrNone(
          `SELECT id, author, avatar, role, career_tag, country_tag, title, body, tags, votes,
                  answers, top_answer, top_answer_author, created_at
           FROM network_qa_posts WHERE career_tag ILIKE $1 ORDER BY created_at DESC LIMIT $2`,
          [`%${career}%`, limit]
        );
        return res.json({ success: true, data: mapQARows(fresh) });
      }
    }

    res.json({ success: true, data: mapQARows(rows) });
  } catch (error) {
    console.error("Q&A fetch error:", error);
    res.status(500).json({ error: "Failed to fetch Q&A posts" });
  }
});

/**
 * POST /qa-posts
 * Body: { author, avatar?, role?, careerTag, countryTag, title, body?, tags? }
 */
router.post("/qa-posts", async (req: Request, res: Response) => {
  try {
    const { author, avatar, role, careerTag, countryTag, title, body, tags } = req.body;
    if (!author || !title || !careerTag) {
      return res.status(400).json({ error: "author, title, and careerTag are required" });
    }

    const { db } = await import("../db/database.js");
    const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const row = await db.one(
      `INSERT INTO network_qa_posts
         (id, author, avatar, role, career_tag, country_tag, title, body, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, author, avatar, role, career_tag, country_tag, title, body, tags,
                 votes, answers, top_answer, top_answer_author, created_at`,
      [id, author, avatar || '🙋', role || 'Member',
       careerTag, countryTag || 'Global', title, body || '',
       tags || []]
    );

    res.status(201).json({ success: true, data: mapQARow(row) });
  } catch (error) {
    console.error("Q&A create error:", error);
    res.status(500).json({ error: "Failed to create Q&A post" });
  }
});

/**
 * POST /qa-posts/:id/vote
 * Body: { direction: 'up' | 'down' }
 */
router.post("/qa-posts/:id/vote", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const direction = req.body.direction === 'down' ? -1 : 1;

    const { db } = await import("../db/database.js");
    await db.none(
      `UPDATE network_qa_posts SET votes = votes + $1 WHERE id = $2`,
      [direction, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Q&A vote error:", error);
    res.status(500).json({ error: "Failed to vote" });
  }
});

function mapQARow(row: any) {
  return {
    id: row.id,
    author: row.author,
    avatar: row.avatar,
    role: row.role,
    careerTag: row.career_tag,
    countryTag: row.country_tag,
    title: row.title,
    body: row.body,
    tags: Array.isArray(row.tags) ? row.tags : [],
    votes: row.votes,
    answers: row.answers,
    topAnswer: row.top_answer || undefined,
    topAnswerAuthor: row.top_answer_author || undefined,
    createdAt: row.created_at,
    voted: false,
    answered: false,
  };
}

function mapQARows(rows: any[]) {
  return rows.map(mapQARow);
}

// ─── Open Internships ─────────────────────────────────────────────────────────
router.post("/open-internships", async (req: Request, res: Response) => {
  try {
    const { homeCountry, targetCountry, careerTitle, interests } = req.body;
    if (!homeCountry || !careerTitle) {
      return res.status(400).json({ error: "homeCountry and careerTitle are required" });
    }
    const results = await careerAiService.getOpenInternships({
      homeCountry,
      targetCountry: targetCountry || homeCountry,
      careerTitle,
      interests,
    });
    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[careers-ai] open-internships error:", error);
    res.status(500).json({ error: "Failed to fetch internships" });
  }
});

// ─── Learning Trajectories ────────────────────────────────────────────────────

router.post("/learning-trajectories", async (req: Request, res: Response) => {
  try {
    const { profile, careerTitle, skillGaps } = req.body;
    if (!profile || !careerTitle || !skillGaps) {
      return res.status(400).json({ error: "profile, careerTitle, and skillGaps are required" });
    }
    const result = await careerAiService.getLearningTrajectories(profile, careerTitle, skillGaps);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[careers-ai] learning-trajectories error:", error);
    res.status(500).json({ error: "Failed to generate learning trajectories" });
  }
});

// ─── Networking Copilot ───────────────────────────────────────────────────────

router.post("/networking-copilot", async (req: Request, res: Response) => {
  try {
    const { profile, targetCompany, targetRole, existingApplicationId } = req.body;
    if (!profile || !targetCompany || !targetRole) {
      return res.status(400).json({ error: "profile, targetCompany, and targetRole are required" });
    }
    const result = await careerAiService.getNetworkingCopilot(profile, targetCompany, targetRole, existingApplicationId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("[careers-ai] networking-copilot error:", error);
    res.status(500).json({ error: "Failed to generate networking plan" });
  }
});

export default router;

