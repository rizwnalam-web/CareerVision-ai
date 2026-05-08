import { Router, Request, Response } from "express";
import * as careerAiService from "../services/careerAiService.js";
import type { UserProfile } from "../../src/types/career";

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

router.post("/match-scholarships", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: "profile is required" });
    }
    const result = await careerAiService.matchScholarships(profile);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Match scholarships error:", error);
    res.status(500).json({ error: "Failed to match scholarships" });
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
    const { profile, targetCountry, targetCareer } = req.body;
    if (!profile || !targetCountry || !targetCareer) {
      return res.status(400).json({ error: "profile, targetCountry, and targetCareer are required" });
    }
    const result = await careerAiService.getVisaGuidance(profile, targetCountry, targetCareer);
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

export default router;
