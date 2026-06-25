// Frontend wrapper re-exporting all functions from the server-side backend proxy
export {
  aiSearchStudyMaterials,
  aiSearchJobs,
  aiSearchInstitutions,
  getTopGlobalCareers,
  aiSearchCareerPaths,
  getDynamicInstitutions,
  getDynamicStudyMaterials,
  getCareerHubIntelligence,
  aiSearchCareerHubs,
  getDashboardIntelligence,
  getCareerSkillGap,
  getCareerAdvice,
  getCareerAdviceBatch,
  matchScholarships,
  getRecommendedCourses,
  generateCoverLetter,
  getLatestCareerNews,
  getVisaGuidance,
  getGlobalContextInsights,
  getAiJobSuggestions,
  getAiInstitutionRecommendations,
  getAiProactiveJobRecommendations,
  getMarketInsights,
  getCareerDirectories,
  getCareersByCountry,
  getCareerMilestones,
  getJobDirectory,
  getCareerRequirements,
  getNetworkCommunities,
  getNetworkMentors,
  getNetworkResumeReviews,
  getNetworkReferrals,
  getNetworkCompanies,
  getQAPosts,
  createQAPost,
  voteQAPost,
  getOpenInternships,
} from "./careerAiProxy.js";

export type { GlobalInsight, CareerDirectoryEntry, CareerDirectoryResult, CountryCareerEntry, CareerMilestone, JobDirectory, JobDirectorySector, JobDirectoryCategory, CareerRequirements, EligibilityCriterion, SelectionStage, KeyExam, ArtifactItem, ArtifactCategory, PreparationPhase, OpenInternship, QAPostPayload } from "./careerAiProxy.js";
/*
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are Spark.E, a Global Career Academy Recruiter. 
  The user is searching for jobs. 
  1. Analyze the query: "${query}" in location: "${location}".
  2. Research and synthesize 3-4 REAL, high-quality job opportunities from major portals (LinkedIn, Indeed, Glassdoor, etc.).
  3. Ensure the "url" leads to a valid search page or job portal (e.g., https://www.linkedin.com/jobs/search/?keywords=...).
  4. Return the result in a valid JSON array of JobListing objects.
  
  JobListing Schema:
  {
    "id": "string",
    "title": "string",
    "company": "string",
    "location": "string",
    "salary": {
      "min": number,
      "max": number,
      "currency": "string",
      "period": "yearly" | "monthly"
    },
    "type": "Full-time" | "Part-time" | "Contract" | "Remote" | "Hybrid",
    "postedAt": "Just now" | "1d ago" | etc,
    "url": "string (Direct link to search or portal)",
    "careerId": "string (best fit from ID list)",
    "description": "string (catchy summary)",
    "logo": "string (high quality company logo or Unsplash: https://images.unsplash.com/photo-...)"
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Find jobs for: ${query} in ${location}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text ?? "");
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Job Search Failed:", error);
    return [];
  }
}

export async function aiSearchInstitutions(query: string, profile: UserProfile): Promise<Institution[]> {
  const model = "gemini-2.0-flash";

  const systemInstruction = `You are Spark.E, an elite Global Admissions Intelligence Engine.
The user is performing a GLOBAL institutional search with this natural language query: "${query}".
Their profile: country=${profile.country}, budget=$${profile.budget}/yr, career=${profile.targetCareerId || 'undecided'}, interests=${profile.interests?.join(', ')}.

Your task:
1. Interpret the query semantically (e.g. "affordable engineering in Europe", "top medical schools Asia", "online MBA Canada").
2. Find 4-6 REAL, globally recognized institutions that best match the query and the user's profile.
3. Prioritize institutions that exist in reality — include accurate coordinates, real websites, and real programs.
4. Vary the results across regions if the query allows.
5. Ensure "image" is a high-quality Unsplash URL representing the institution's city/campus.

Return a valid JSON array of Institution objects with this exact schema:
{
  "id": "ai-<unique-slug>",
  "name": "string",
  "location": "string",
  "type": "University" | "Vocational" | "Polytechnic" | "Medical School" | "Business School",
  "avgCost": number,
  "programs": ["string"],
  "ranking": number,
  "image": "https://images.unsplash.com/photo-XXXXXXXXXX-XXXXXXXXXX?w=800&q=80",
  "applicationDeadline": "YYYY-MM-DD",
  "website": "https://...",
  "allowsInternationalStudents": true,
  "visaSupport": "Full" | "Partial" | "None",
  "coordinates": { "lat": number, "lng": number },
  "city": "string",
  "country": "string",
  "costOfLivingIndex": number
}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Search globally for institutions matching: "${query}"` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const raw = typeof response.text === 'string' ? response.text : JSON.stringify(response.text);
    const results = JSON.parse(raw);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Institution Search Failed:", error);
    return [];
  }
}

export async function getAiJobSuggestions(profile: UserProfile): Promise<JobListing[]> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are Spark.E, a Global Career Academy AI Career Scout.
  Analyze this user profile: ${JSON.stringify(profile)}.
  
  1. Identify the user's core skills, career goal, and country.
  2. Synthesize 4 highly personalized job recommendations based on their profile and 2026 global market trends.
  3. One recommendation should be an "Ambition Move" (higher salary/level).
  4. One should be a "Perfect Match" (alignment with current skills).
  5. Use realistic job names and companies (local to their country: ${profile.country} or Global Remote).
  
  Return a valid JSON array of JobListing objects. Use the same schema as aiSearchJobs.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Suggest jobs for me based on my profile." }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text ?? "");
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Job Suggestions Failed:", error);
    return [];
  }
}

export async function getAiInstitutionRecommendations(
  profile: UserProfile,
  careerTitle: string
): Promise<{ institution: Institution; rationale: string }[]> {
  const model = "gemini-2.0-flash";

  const systemInstruction = `You are Spark.E, a Global Admissions Strategist for 2026. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Recommend exactly 3 real, globally recognised institutions or training programs for this user.

User profile:
- Name: ${profile.name || "Student"}
- Target career: ${careerTitle || "Technology"}
- Education level: ${profile.education || "High School"}
- Home country: ${profile.country || "Global"}
- Target location: ${profile.targetLocation || profile.country || "Global"}
- Annual budget: $${profile.budget || 20000}
- Interests: ${Array.isArray(profile.interests) ? profile.interests.join(", ") : "technology"}
- GPA: ${profile.academicPerformance?.gpa ?? "not specified"}

Rules:
- Institutions must be real and known for "${careerTitle}"
- Prioritise institutions in or relevant to "${profile.targetLocation || profile.country || "Global"}"
- Provide a personalised rationale for each (2-3 sentences) explaining why it suits this specific user
- "image" must be a valid https://images.unsplash.com/photo-... URL
- "website" must be a real institution URL
- "applicationDeadline" must be a future date in YYYY-MM-DD format

Return a JSON array of exactly 3 objects:
[{
  "institution": {
    "id": "kebab-slug",
    "name": "Institution Name",
    "location": "City, Country",
    "city": "City",
    "country": "Country",
    "type": "University" | "Vocational" | "Polytechnic" | "Medical School" | "Business School",
    "avgCost": 25000,
    "programs": ["Program 1", "Program 2"],
    "ranking": 50,
    "image": "https://images.unsplash.com/photo-1562774053-701939374585?w=400",
    "applicationDeadline": "2027-01-15",
    "website": "https://www.institution.edu",
    "allowsInternationalStudents": true,
    "visaSupport": "Full" | "Partial" | "None",
    "coordinates": { "lat": 0.0, "lng": 0.0 },
    "costOfLivingIndex": 65
  },
  "rationale": "Why this institution is perfect for this specific user and their career goal."
}]`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              institution: {
                type: Type.OBJECT,
                properties: {
                  id:                          { type: Type.STRING },
                  name:                        { type: Type.STRING },
                  location:                    { type: Type.STRING },
                  city:                        { type: Type.STRING },
                  country:                     { type: Type.STRING },
                  type:                        { type: Type.STRING },
                  avgCost:                     { type: Type.NUMBER },
                  programs:                    { type: Type.ARRAY, items: { type: Type.STRING } },
                  ranking:                     { type: Type.NUMBER },
                  image:                       { type: Type.STRING },
                  applicationDeadline:         { type: Type.STRING },
                  website:                     { type: Type.STRING },
                  allowsInternationalStudents: { type: Type.BOOLEAN },
                  visaSupport:                 { type: Type.STRING, enum: ["Full", "Partial", "None"] },
                  coordinates: {
                    type: Type.OBJECT,
                    properties: {
                      lat: { type: Type.NUMBER },
                      lng: { type: Type.NUMBER },
                    },
                    required: ["lat", "lng"],
                  },
                  costOfLivingIndex: { type: Type.NUMBER },
                },
                required: ["id", "name", "location", "city", "country", "type", "avgCost", "programs", "ranking", "image", "website", "allowsInternationalStudents", "visaSupport"],
              },
              rationale: { type: Type.STRING },
            },
            required: ["institution", "rationale"],
          },
        },
        temperature: 0.2,
        maxOutputTokens: 2000,
      },
    });

    const raw = typeof response.text === "string" ? response.text : JSON.stringify(response.text);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("[AI Curated Programs] Failed:", error);
    throw error;
  }
}

export async function getAiProactiveJobRecommendations(profile: UserProfile, savedJobs: JobListing[]): Promise<JobListing[]> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are Spark.E, a Career Growth Engine. 
  The user has saved these jobs: ${JSON.stringify(savedJobs)}.
  Their career path is: ${profile.targetCareerId}.
  
  1. Analyze the themes of saved jobs (seniority, industry, tech stack, company type).
  2. Source 4 FRESH proactive job recommendations that logically follow these interests.
  3. One should be a "Next Level" role (e.g. if they saved Senior/Med, suggest Lead).
  4. Ensure URLs lead to valid portal searches.
  
  Return a valid JSON array of JobListing objects.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Based on my saved jobs, what else should I look at?" }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text ?? "");
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Proactive Search Failed:", error);
    return [];
  }
}

export async function getMarketInsights(careerId: string, country: string): Promise<MarketInsights | null> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are Spark.E, a Global Market Analyst.
  Provide deep market insights for career ID: "${careerId}" in country: "${country}".
  
  1. Salary Benchmarks: Real 2026 projections for Entry, Mid, and Senior levels.
  2. Growth Forecast: 2-year growth percentage and trend.
  3. In-Demand Skills: Top 5 skills and their importance score (0-100).
  4. Top Hiring Companies: List of major employers in this field for the specified country.
  
  Return a valid JSON object matching the MarketInsights schema.
  
  Schema:
  {
    "careerId": "string",
    "salaryBenchmarks": { "entry": number, "mid": number, "senior": number, "currency": "string" },
    "growthForecast": { "percentage": number, "trend": "rising" | "stable" | "declining", "description": "string" },
    "inDemandSkills": [ { "name": "string", "importance": number } ],
    "topHiringCompanies": ["string"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Provide market data for ${careerId} in ${country}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text ?? "");
  } catch (error) {
    console.error("Market Insights Failed:", error);
    return null;
  }
}

export async function matchScholarships(profile: UserProfile): Promise<FundingOpportunity[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Scholarship & Funding Matching Specialist.
    Your task is to rank the available funding opportunities (scholarships, grants, loans) for a specific user profile and explain the match.

    Funding Database:
    ${JSON.stringify(FUNDING_OPPORTUNITIES, null, 2)}

    Output Format:
    Return a JSON array of objects for the TOP matching items:
    [
      { "id": "sch-id", "matchScore": 0-100, "matchReasoning": "short explanation" }
    ]
  `;

  const prompt = `
    User Profile:
    - Age: ${profile.age}
    - Education: ${profile.education}
    - Interests: ${profile.interests.join(", ")}
    - GPA: ${profile.academicPerformance?.gpa || "N/A"}
    - Achievements: ${profile.academicPerformance?.achievements.join(", ") || "None"}
    - Financial Needs: Based on target career and $${profile.budget} buffer.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              matchScore: { type: Type.NUMBER },
              matchReasoning: { type: Type.STRING }
            },
            required: ["id", "matchScore", "matchReasoning"]
          }
        }
      }
    });

    const matches = JSON.parse(response.text ?? "");
    return FUNDING_OPPORTUNITIES.map(opp => {
      const match = matches.find((m: any) => m.id === opp.id);
      if (match) {
        return { ...opp, matchScore: match.matchScore, matchReasoning: match.matchReasoning };
      }
      return opp;
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("Gemini Quota Exceeded (429) for Funding. Using static database.");
    } else {
      console.error("Funding Matching Error:", error);
    }
    return FUNDING_OPPORTUNITIES;
  }
}

export async function getRecommendedCourses(sector: string): Promise<any[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Educational Curator.
    Your task is to recommend the TOP 10 high-impact online courses for a specific industry sector in 2026.
    
    Output Format:
    Return a JSON array of objects:
    [
      { 
        "title": "Course Title", 
        "provider": "University/Platform", 
        "type": "course", 
        "duration": "e.g. 12 weeks", 
        "reason": "Why this is top-tier in 2026",
        "institution": {
          "name": "Full Institution Name",
          "globalRanking": "e.g. top 50",
          "location": "City, Country"
        }
      }
    ]
  `;

  const prompt = `Recommend the top 10 courses for the following sector: ${sector}. For each course, provide brief intelligence about the providing institution.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              provider: { type: Type.STRING },
              type: { type: Type.STRING },
              duration: { type: Type.STRING },
              reason: { type: Type.STRING },
              institution: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  globalRanking: { type: Type.STRING },
                  location: { type: Type.STRING }
                }
              }
            },
            required: ["title", "provider", "type", "duration", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text ?? "");
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("Gemini Quota Exceeded (429) for Courses. Using empty cache.");
    } else {
      console.error("Course Recommendation Error:", error);
    }
    return [];
  }
}

export async function getCareerAdvice(prompt: string, userContext: any, additionalContext: { resume?: string, linkedIn?: string } = {}) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are "Vision", an expert AI Career Mentor for the CareerVision 2026 SaaS platform.
    Your goal is to provide highly personalized, data-driven career advice that balances ambition with practical geospatial and financial realities.

    User Context:
    - Age: ${userContext.age}
    - Education: ${userContext.education}
    - Primary Interests: ${userContext.interests.join(", ")}
    - Financial Buffer: $${userContext.budget}
    ${additionalContext.resume ? `- Resume Content: ${additionalContext.resume}` : ""}
    ${additionalContext.linkedIn ? `- LinkedIn Profile: ${additionalContext.linkedIn}` : ""}

    Core Advice Parameters:
    1. PATH ANALYSIS: Identify 2-3 emerging high-growth career paths (2026 focus) that intersect with the user's interests.
    2. CERTIFICATION BLUEPRINT: Suggest 2 recognized industry certifications (e.g., AWS Certified AI, Google Career Certs, CompTIA) that are appropriate for someone of age ${userContext.age}.
    3. PORTFOLIO BUILDER: Propose one specific "Hero Project" the user can build to demonstrate competence. Tailor the project complexity to their current education level.
    4. GEOSPATIAL INTELLIGENCE: Mention specific global "Career Hubs" (cities/regions) where their chosen path is currently peaking in demand.
    5. ROI & BUDGET: Calibrate suggestions based on their $${userContext.budget} buffer. Advise on whether they should focus on local vs. international institutions.

    Tone & Formatting:
    - Supportive, authoritative, and futuristic.
    - Use Markdown: Headings, bold text for key terms, and bullet points.
    - INTERACTIVE BLOCKS: If you mention growth percentages or skill distributions, wrap a JSON data structure in a code block with the language label \`career-data\`.
      Examples:
      \`\`\`career-data
      { "type": "growth", "data": [ { "year": 2024, "val": 10 }, { "year": 2026, "val": 25 } ] }
      \`\`\`
      \`\`\`career-data
      { "type": "skills", "data": [ { "name": "Python", "val": 90 }, { "name": "AI Ops", "val": 75 } ] }
      \`\`\`
    - Keep responses around 300-400 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text ?? "";
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("Gemini Quota Exceeded (429) for Advisor. Providing cached logic.");
      return "I'm currently operating in offline mode due to high demand. Based on your profile, I recommend focusing on core AI literacy and specialized certifications from the 'Learning Hub' section until my full reasoning engine is back online.";
    }
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
}

export async function generateCoverLetter(institution: any, userProfile: UserProfile, highlights: string): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Admissions Consultant.
    Your task is to write a highly compelling, personalized cover letter for a student applying to a specific institution.
    
    The letter should:
    1. Be addressed to the admissions committee of the institution.
    2. Reference the institution's key focus areas and programs.
    3. Seamlessly integrate the user's educational background, interests, and the specific projects/roles they want to highlight.
    4. Maintain a professional, enthusiastic, and ambitious tone.
    5. Be formatted in Markdown.
    6. Be around 350-400 words.
  `;

  const prompt = `
    Institution: ${institution.name} in ${institution.city}, ${institution.country}.
    Programs: ${institution.programs.join(", ")}
    Type: ${institution.type}
    
    User Profile:
    - Name: ${userProfile.name}
    - Education: ${userProfile.education}
    - Interests: ${userProfile.interests.join(", ")}
    - GPA: ${userProfile.academicPerformance?.gpa || "N/A"}
    
    User's Highlight Requests:
    ${highlights}
    
    Please generate the cover letter now.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text ?? "";
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("Gemini Quota Exceeded (429) for Documents. Using template.");
      return "Failed to generate custom document due to capacity limits. Please try again later.";
    }
    console.error("Cover Letter Generation Error:", error);
    return "Failed to generate cover letter. Please try again.";
  }
}

export async function getLatestCareerNews(preferredCountry?: string): Promise<{ career: string, country: string, aiTech: string }[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI News Curator for the year 2026.
    Your task is to provide 5 brief "News Flash" items in JSON format regarding:
    1. The most in-demand career in a specific country right now.
    2. A brand-new, cutting-edge AI technology that was just launched.
    
    Output Format:
    Return a JSON array of 5 objects:
    [
      { "career": "Cyber-Physical Auditor", "country": "Singapore", "aiTech": "Neural-Link GPT-X" },
      ...
    ]
  `;

  const prompt = preferredCountry 
    ? `Generate 5 latest global career and AI technology news flashes for 2026. Prioritize news for ${preferredCountry}.`
    : "Generate 5 latest global career and AI technology news flashes for 2026.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              career: { type: Type.STRING },
              country: { type: Type.STRING },
              aiTech: { type: Type.STRING }
            },
            required: ["career", "country", "aiTech"]
          }
        }
      }
    });

    return JSON.parse(response.text ?? "");
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("Gemini Quota Exceeded (429) for News Flash. Using localized intelligence fallback.");
    } else {
      console.error("News Flash Error:", error);
    }
    return [
      { career: "AI Systems Architect", country: "United States", aiTech: "Gemini 4.0 Ultra" },
      { career: "Renewable Energy Specialist", country: "Germany", aiTech: "Fusion-Core Logic" },
      { career: "Quantum Cryptographer", country: "Singapore", aiTech: "Neural-Link GPT-X" },
      { career: "Cyber-Physical Auditor", country: "South Korea", aiTech: "Blue-Sense V2" },
      { career: "Clean-Tech Engineer", country: "Norway", aiTech: "Solaris Prime" }
    ];
  }
}

export async function getTopGlobalCareers(): Promise<CareerPath[]> {
  // ── 1. DB cache check (avoids AI call when data is fresh) ────────────────
  const cached = await getCachedTopCareers();
  if (cached && cached.length >= 10) {
    console.log(`[Careers] Serving ${cached.length} paths from DB cache`);
    return cached as CareerPath[];
  }

  // ── 2. AI fetch (only when cache is empty or stale) ──────────────────────
  const model = "gemini-2.0-flash";

  const systemInstruction = `You are an AI Career Strategist for the 2026 global job market. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `Generate exactly 10 of the highest-growth, most in-demand global career paths for 2026.

Return a JSON array of exactly 10 objects with this schema:
[{
  "id": "kebab-case-slug",
  "title": "Full Career Title",
  "description": "Punchy 1-2 sentence description of the role and its impact",
  "growth": "high",
  "category": "Technology & Digital" | "Healthcare & Life Sciences" | "Business, Finance & Management" | "Engineering, Science & Environment" | "Arts, Design & Media" | "Education, Law & Public Service" | "Skilled Trades & Technical Services",
  "subCategory": "e.g. Data & AI",
  "workType": "Remote" | "On-site" | "Hybrid" | "Mobile",
  "tags": ["tag1", "tag2", "tag3"],
  "milestones": [
    { "ageRange": "13-17", "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] },
    { "ageRange": "18-22", "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] },
    { "ageRange": "23-27", "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] },
    { "ageRange": "28+",   "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] }
  ]
}]

Rules:
- Exactly 10 careers, varied across sectors (min 4 different categories)
- All growth values must be "high"
- Each career must have exactly 4 milestones
- Use 2026 job market data — prioritize AI, Climate, Health, FinTech, Cybersecurity, Biotech roles
- Milestones must be age-appropriate and progressively build on each other`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 3000,
      },
    });

    const raw = typeof response.text === "string" ? response.text : JSON.stringify(response.text);
    const careers: CareerPath[] = JSON.parse(raw);

    if (!Array.isArray(careers) || careers.length === 0) return [];

    // ── 3. Persist to DB cache (non-blocking, 24-hour TTL) ──────────────────
    saveCachedTopCareers(careers).catch((err) =>
      console.warn("[Careers] Cache save failed (non-blocking):", err)
    );

    console.log(`[Careers] Fetched ${careers.length} paths from AI and queued DB cache save`);
    return careers;
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("[Careers] Gemini quota hit — returning empty list");
    } else {
      console.error("[Careers] AI fetch failed:", error);
    }
    return [];
  }
}

export async function aiSearchCareerPaths(query: string): Promise<CareerPath[]> {
  const model = "gemini-2.0-flash"; // use the reliable fast model

  const systemInstruction = `You are an AI Career Strategist for 2026. Return ONLY valid JSON — no markdown, no explanation.`;

  const prompt = `The user searched for: "${query}"

Generate exactly 10 highly relevant career paths for 2026 that match this search. If the query mentions a specific country or region, tailor the careers to reflect the actual job market demand in that location.

Return a JSON array of exactly 10 objects:
[{
  "id": "kebab-case-slug",
  "title": "Full Career Title",
  "description": "Punchy 1-2 sentence description of the role and its impact",
  "growth": "high" | "medium" | "stable",
  "category": "Technology & Digital" | "Healthcare & Life Sciences" | "Business, Finance & Management" | "Engineering, Science & Environment" | "Arts, Design & Media" | "Education, Law & Public Service" | "Skilled Trades & Technical Services",
  "subCategory": "e.g. Data & AI",
  "workType": "Remote" | "On-site" | "Hybrid" | "Mobile",
  "tags": ["tag1", "tag2", "tag3"],
  "milestones": [
    { "ageRange": "13-17", "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] },
    { "ageRange": "18-22", "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] },
    { "ageRange": "23-27", "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] },
    { "ageRange": "28+",   "title": "Phase title", "description": "What to do", "requirements": ["req1", "req2"] }
  ]
}]

Rules:
- Return exactly 10 careers — no more, no less
- Each career must have exactly 4 milestones
- growth must be one of: "high", "medium", "stable"
- workType must be one of: "Remote", "On-site", "Hybrid", "Mobile"
- If a country is mentioned, prioritise careers with high hiring demand in that country in 2026`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id:          { type: Type.STRING },
              title:       { type: Type.STRING },
              description: { type: Type.STRING },
              growth:      { type: Type.STRING, enum: ["high", "medium", "stable"] },
              category:    { type: Type.STRING },
              subCategory: { type: Type.STRING },
              workType:    { type: Type.STRING, enum: ["Remote", "On-site", "Hybrid", "Mobile"] },
              tags:        { type: Type.ARRAY, items: { type: Type.STRING } },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ageRange:     { type: Type.STRING },
                    title:        { type: Type.STRING },
                    description:  { type: Type.STRING },
                    requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ["ageRange", "title", "description", "requirements"],
                },
              },
            },
            required: ["id", "title", "description", "growth", "category", "milestones"],
          },
        },
        temperature: 0.2,
        maxOutputTokens: 3000,
      },
    });

    const raw = typeof response.text === "string" ? response.text : JSON.stringify(response.text);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("[CareerSearch] Gemini quota hit");
    } else {
      console.error("[CareerSearch] AI search failed:", error);
    }
    throw error; // propagate so caller can show a real error message
  }
}

// NEW: Get Dynamic Institutions Based on Profile & Career
export async function getDynamicInstitutions(profile: UserProfile, careerId: string, targetLocation: string, roadmapFocus?: string): Promise<Institution[]> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are an expert global education consultant. Recommend top 20 institutions matching the student's profile and career goals.
  Return valid JSON array of Institution objects with realistic data.`;

  try {
        // Step 1: Check if institutions are cached for this location
        const cachedInstitutions = await getCachedInstitutions(targetLocation);
        if (cachedInstitutions && cachedInstitutions.length > 0) {
          return cachedInstitutions as Institution[];
        }

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{
          text: `Find top 20 institutions for:
Career: ${careerId}
Target Location: ${targetLocation}
Budget: $${profile.budget}/year
Home Country: ${profile.country}
Education Level: ${profile.education}
GPA: ${profile.academicPerformance?.gpa || 3.5}
${roadmapFocus ? `Roadmap Focus: ${roadmapFocus}` : ''}

Return JSON array with fields: id, name, country, city, type, programs[], avgCost, ranking, visaSupport, allowsInternationalStudents, website, applicationDeadline, costOfLivingIndex. Include 20 diverse institutions from different countries.`
        }]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const institutions = JSON.parse(response.text ?? "");
      const result = Array.isArray(institutions) ? institutions.slice(0, 20) : [];

      // Step 2: Save to database for caching on success
      if (result.length > 0) {
        await saveCachedInstitutions(result).catch(err => 
          console.warn("Failed to cache institutions (non-blocking):", err)
        );
      }

      return result;
  } catch (error) {
    console.error("Get Dynamic Institutions Error:", error);
    return [];
  }
}

// NEW: Get Dynamic Study Materials Based on Career & Level
export async function getDynamicStudyMaterials(careerId: string, skillLevel: string, region: string): Promise<StudyMaterial[]> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are a learning curator. Find real, high-quality study materials from platforms like Coursera, edX, MIT OpenCourseWare, YouTube, Udemy.
  Return valid JSON array of StudyMaterial objects.`;

  try {
        // Step 1: Check if study materials are cached for this career
        const cachedMaterials = await getCachedStudyMaterialsByCareer(careerId);
        if (cachedMaterials && cachedMaterials.length > 0) {
          return cachedMaterials as StudyMaterial[];
        }

    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{
          text: `Find top 12 study materials for:
Career: ${careerId}
Skill Level: ${skillLevel}
Region: ${region}

Return JSON array with: id, title, type (video|course|article|interactive), provider, url, duration, rating, language, description, tags`
        }]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const materials = JSON.parse(response.text ?? "");
      const result = Array.isArray(materials) ? materials.slice(0, 12) : [];

      // Step 2: Save to database for caching on success
      if (result.length > 0) {
        await saveCachedStudyMaterials(result, careerId).catch(err => 
          console.warn("Failed to cache study materials (non-blocking):", err)
        );
      }

      return result;
  } catch (error) {
    console.error("Get Dynamic Materials Error:", error);
    return [];
  }
}

// NEW: Get Visa Guidance
export async function getVisaGuidance(profile: UserProfile, targetCountry: string, targetCareer: string): Promise<any> {
  const model = "gemini-2.0-flash";

  const homeCountry = profile.citizenCountry || profile.country || 'Unknown';
  const visaType = profile.targetVisaType || 'Student Visa';

  const systemInstruction = `You are a certified immigration attorney. Return ONLY a valid JSON object — no markdown, no explanation, no code fences. Use real, country-specific data for ${homeCountry} → ${targetCountry}.`;

  const userPrompt = `Return a JSON object for visa guidance:
Home: ${homeCountry}, Target: ${targetCountry}, Career: ${targetCareer}, Education: ${profile.education}, Budget: $${profile.budget}, VisaType: ${visaType}

Required JSON fields:
- recommendedVisaTypes: array of {name, code, description, maxDuration, workRights}
- processingTimeline: {totalTimeline, documentCollection, applicationSubmission, visaProcessing, earliestApplyBeforeCourseStart}
- estimatedCost: {visaApplicationFee, biometricsFee, healthSurcharge, medicalExamEstimate, totalEstimate, currency}
- requiredDocuments: array of {name, description, issuedBy, mandatory, notes}
- languageAndAcademicTests: array of {testName, minimumScore, alternativeTests, purpose, validity, waivable}
- financialRequirements: {proofOfFundsAmount, currency, description, acceptedEvidence}
- sponsorshipLikelihood: "High" or "Medium" or "Low"
- sponsorshipNotes: string
- embassyInfo: {processingLocation, officialPortalUrl, appointmentBookingUrl}
- postArrivalRequirements: array of strings
- nextSteps: array of strings
- importantDeadlines: string
- countrySpecificNotes: string`;

  // Race the AI call against a 25-second timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Visa guidance request timed out')), 25000)
  );

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048
        }
      }),
      timeoutPromise
    ]);

    const raw = typeof (response as any).text === 'string'
      ? (response as any).text
      : JSON.stringify((response as any).text);

    if (!raw || raw === 'null' || raw === 'undefined') {
      throw new Error('Empty response from AI');
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error("Visa Guidance Error:", error);
    return null;
  }
}

// NEW: Get Career Hub Intelligence - Market data for job markets in cities
export async function getCareerHubIntelligence(city: string, country: string): Promise<any> {
  const model = "gemini-2.0-flash";

  // Step 1: Check if data is cached in database
  const cachedData = await getCachedCareerHub(city, country);
  if (cachedData) {
    console.log("✓ Using cached career hub data for:", city, country);
    return cachedData;
  }

  const systemInstruction = `You are Spark.E, a Global Career Market Intelligence Specialist for 2026. Return ONLY valid JSON — no markdown, no explanation.`;

  const userPrompt = `Analyze the real 2026 job market for ${city}, ${country}. Return a JSON object:
{
  "city": "${city}",
  "country": "${country}",
  "intensity": number (0-100 market heat),
  "marketHealthScore": number (0-100),
  "topCareers": [{ "title": string, "demandScore": number, "avgSalary": { "entry": number, "mid": number, "senior": number, "currency": "USD" }, "jobGrowth": number, "openings": number }],
  "averageSalaryRange": { "min": number, "max": number, "currency": "USD" },
  "costOfLiving": number (1.0 = global avg),
  "visaOpenness": "High" | "Medium" | "Low",
  "hiringTrends": string (2-3 sentences of real current trends),
  "requiredSkills": [{ "skill": string, "demand": number }],
  "topEmployers": [string],
  "internshipOpportunities": number,
  "remoteWorkPercentage": number
}
Use real salary data, real employer names, and real 2026 market conditions for ${city}.`;

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Hub intelligence request timed out')), 20000)
  );

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 1024
        }
      }),
      timeoutPromise
    ]);

    const raw = typeof (response as any).text === 'string' ? (response as any).text : JSON.stringify((response as any).text);
    const hubData = JSON.parse(raw);
    const result = { ...hubData, city, country };

    // Save to database for caching on success
    await saveCachedCareerHub(result).catch(err =>
      console.warn("Failed to cache career hub data (non-blocking):", err)
    );

    return result;
  } catch (error) {
    console.error("Career Hub Intelligence Error:", error);
    return null; // Return null so UI can show error state per hub
  }
}

export async function aiSearchCareerHubs(query: string): Promise<{ city: string; country: string }[]> {
  const model = "gemini-2.0-flash";

  const systemInstruction = `You are a Global Career Intelligence Engine. Return ONLY valid JSON — no markdown, no explanation.`;

  const userPrompt = `The user is searching for career hubs with this query: "${query}".
Identify 4-6 real global cities that best match this query (e.g. "tech jobs Europe", "best AI hubs", "finance cities Asia", "affordable coding hubs").
Return a JSON array: [{ "city": string, "country": string }]
Only use real cities with well-known job markets. Vary regions when possible.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 256
      }
    });

    const raw = typeof response.text === 'string' ? response.text : JSON.stringify(response.text);
    const results = JSON.parse(raw);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Career Hub Search Error:", error);
    return [];
  }
}

export async function getDashboardIntelligence(
  profile: UserProfile,
  primaryCareerId: string
): Promise<DashboardIntelligence | null> {
  const model = "gemini-2.0-flash";

  const systemInstruction = `You are Spark.E, a precision career analytics engine. Return ONLY valid JSON — no markdown, no explanation, no code fences.`;

  const userPrompt = `Analyze this user profile and return a comprehensive dashboard intelligence object.

User profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Education: ${profile.education}
- Interests: ${profile.interests.join(', ')}
- Country: ${profile.country}
- Target Location: ${profile.targetLocation || profile.country}
- Target Career: ${primaryCareerId}
- GPA: ${profile.academicPerformance?.gpa ?? 'N/A'}
- Achievements: ${profile.academicPerformance?.achievements?.join(', ') || 'None'}
- Completed milestones: ${profile.completedMilestones?.length ?? 0}

Return EXACTLY this JSON structure (no extra fields, all required):
{
  "readiness": {
    "overall": <integer 0-100 based on profile completeness, milestones, education, experience>,
    "skills": <integer 0-100 match between interests/education and ${primaryCareerId} skill requirements>,
    "education": <integer 0-100 based on education level and GPA for ${primaryCareerId}>,
    "experience": <integer 0-100 based on age, milestones completed, and achievements>
  },
  "nextActions": [
    {
      "title": "<specific actionable task tailored to the profile and ${primaryCareerId}>",
      "impact": "<+X% Readiness or descriptive outcome>",
      "type": "<learn|build|practice>",
      "urgent": <true|false>
    }
  ],
  "sectors": [
    {
      "name": "<sector name relevant to ${profile.targetLocation || profile.country} 2026 market>",
      "trend": "<+XX%>",
      "score": <integer 0-100>,
      "status": "<Hot|Rising|Stable|Emerging>",
      "color": "<hex color e.g. #f87171>",
      "spark": [{"v": <int>}, {"v": <int>}, {"v": <int>}, {"v": <int>}, {"v": <int>}, {"v": <int>}],
      "news": ["<real 2026 market headline>", "<real 2026 market headline>"]
    }
  ],
  "salaryTrajectory": [
    {"y": "22", "v": <integer USD annual>},
    {"y": "23", "v": <integer>},
    {"y": "24", "v": <integer>},
    {"y": "25", "v": <integer>},
    {"y": "26", "v": <integer>},
    {"y": "27", "v": <integer projected>}
  ]
}

Rules:
- nextActions: exactly 3 items, tailored to the actual profile — reference real skills needed for ${primaryCareerId}
- sectors: exactly 4 sectors relevant to ${profile.targetLocation || profile.country} and the user's interests
- salaryTrajectory: realistic USD salary progression for ${primaryCareerId} from 2022-2027
- spark values: 6 integers showing the sector score trend over the past 6 periods (earlier → later)
- All data must be realistic for 2026`;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Dashboard intelligence timed out')), 20000)
  );

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 1200,
        },
      }),
      timeout,
    ]);

    const raw = typeof (response as any).text === 'string'
      ? (response as any).text
      : JSON.stringify((response as any).text);

    return JSON.parse(raw) as DashboardIntelligence;
  } catch (error) {
    console.error("Dashboard Intelligence Error:", error);
    return null;
  }
}

export async function getCareerSkillGap(
  profile: UserProfile,
  careerTitle: string
): Promise<CareerSkillGap[]> {
  const model = "gemini-2.0-flash";

  const education = profile.education || "Not specified";
  const interests = Array.isArray(profile.interests) && profile.interests.length > 0
    ? profile.interests.join(", ")
    : "general technology";
  const milestoneCount = profile.completedMilestones?.length ?? 0;

  const systemInstruction = `You are a career skills analyst. Return ONLY valid JSON — no markdown, no explanation.`;

  const userPrompt = `Analyze the skill gap for this user targeting "${careerTitle}".

User profile:
- Education: ${education}
- Interests: ${interests}
- Completed milestones: ${milestoneCount}

Return a JSON array of exactly 4 skill objects. Each object must have:
- "skill": the skill name (string, required for ${careerTitle})
- "owned": true if the user's interests or education clearly covers this skill, false otherwise
- "demand": integer 0-100, market demand score for this skill in ${careerTitle} in 2026

Pick the 4 most critical skills for "${careerTitle}". Example format:
[{"skill":"Python","owned":true,"demand":95},{"skill":"MLOps","owned":false,"demand":88},{"skill":"LLM Fine-tuning","owned":false,"demand":92},{"skill":"System Design","owned":true,"demand":85}]`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skill:   { type: Type.STRING },
              owned:   { type: Type.BOOLEAN },
              demand:  { type: Type.INTEGER },
            },
            required: ["skill", "owned", "demand"],
          },
        },
        temperature: 0.1,
        maxOutputTokens: 400,
      },
    });

    const raw = typeof response.text === "string" ? response.text : JSON.stringify(response.text);

    // Handle both array and object-wrapped responses from Gemini
    let parsed: any = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      // Try to unwrap if Gemini returned {skills: [...]} or {data: [...]}
      const inner = parsed?.skills ?? parsed?.data ?? parsed?.skillGap ?? Object.values(parsed)[0];
      parsed = Array.isArray(inner) ? inner : [];
    }

    // Validate shape and clamp demand to [0, 100]
    const result: CareerSkillGap[] = parsed
      .filter((s: any) => s && typeof s.skill === "string")
      .slice(0, 4)
      .map((s: any) => ({
        skill: s.skill,
        owned: Boolean(s.owned),
        demand: Math.min(100, Math.max(0, Number(s.demand) || 75)),
      }));

    if (result.length === 0) throw new Error("Empty skill gap response");
    return result;
  } catch (error) {
    console.error("Career Skill Gap Error:", error);
    // Return an error sentinel so callers know to show retry
    throw error;
  }
}

export interface GlobalInsight {
  flag: string;
  city: string;
  country: string;
  stat: string;
  category: string;
  color: 'emerald' | 'indigo' | 'amber' | 'rose' | 'purple';
}

export async function getGlobalContextInsights(
  targetLocation: string,
  interests: string[],
  targetCareerId: string
): Promise<GlobalInsight[]> {
  const model = "gemini-2.0-flash";

  const systemInstruction = `You are a real-time global career market intelligence feed for 2026. Return ONLY valid JSON — no markdown, no explanation.`;

  const userPrompt = `Generate 6 live global market insight tags for a career professional dashboard bar.
Context: user targets "${targetLocation}", interests: ${interests.slice(0, 4).join(', ')}, career: ${targetCareerId}.

Return a JSON array of exactly 6 objects:
[
  {
    "flag": "<country flag emoji>",
    "city": "<CITY NAME IN CAPS>",
    "country": "<Country>",
    "stat": "<SHORT STAT max 20 chars, e.g. 'AI +24%' or 'FINTECH +18%' or 'HIRING UP'>",
    "category": "<sector, e.g. AI, FinTech, BioTech, Cloud>",
    "color": "<one of: emerald | indigo | amber | rose | purple>"
  }
]

Rules:
- First insight MUST be for ${targetLocation || 'a major tech city'}
- Use real 2026 market data: job growth rates, hiring surges, salary trends
- Each city must be different; vary regions (EU, Asia, Americas, MENA)
- stat must be under 20 chars — no arrows (use + or % only)
- colors: emerald for positive/growth, rose for hot demand, indigo for tech, amber for finance, purple for emerging`;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Global insights timed out')), 12000)
  );

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 400,
        },
      }),
      timeout,
    ]);

    const raw = typeof (response as any).text === 'string'
      ? (response as any).text
      : JSON.stringify((response as any).text);
    const result = JSON.parse(raw);
    return Array.isArray(result) ? result.slice(0, 6) : [];
  } catch (error) {
    console.error("Global Context Insights Error:", error);
    // Graceful fallback with real 2026 data
    return [
      { flag: '🇩🇪', city: 'BERLIN', country: 'Germany', stat: 'AI +24%', category: 'AI', color: 'emerald' },
      { flag: '🇸🇬', city: 'SINGAPORE', country: 'Singapore', stat: 'TECH +31%', category: 'Tech', color: 'indigo' },
      { flag: '🇬🇧', city: 'LONDON', country: 'UK', stat: 'FINTECH +18%', category: 'FinTech', color: 'amber' },
      { flag: '🇺🇸', city: 'NYC', country: 'USA', stat: 'AI ROLES +32%', category: 'AI', color: 'rose' },
      { flag: '🇦🇪', city: 'DUBAI', country: 'UAE', stat: 'CLOUD +28%', category: 'Cloud', color: 'purple' },
      { flag: '🇨🇦', city: 'TORONTO', country: 'Canada', stat: 'HIRING +21%', category: 'Tech', color: 'emerald' },
    ];
  }
}*/
