import { ai, Type } from "../lib/gemini";
import { FUNDING_OPPORTUNITIES, STUDY_MATERIALS } from "../constants/mockData";
import { FundingOpportunity, UserProfile, CareerPath, StudyMaterial, JobListing, Institution, MarketInsights, CareerHubIntelligence } from "../types/career";
import { getCachedCareerHub, saveCachedCareerHub, getCachedInstitutions, saveCachedInstitutions, getCachedStudyMaterialsByCareer, saveCachedStudyMaterials } from "./cacheService";

// ... existing functions ...

export async function aiSearchStudyMaterials(query: string): Promise<StudyMaterial[]> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are Spark.E, a Global Career Academy Librarian. 
  The user is searching for study materials. 
  1. Analyze the query: "${query}".
  2. If the query matches existing local materials, suggest them.
  3. If not, synthesize 2-3 REAL, high-quality global resources (from YouTube, Coursera, MIT OpenCourseWare, etc.) that would help the user.
  4. Return the result in a valid JSON array of StudyMaterial objects.
  
  StudyMaterial Schema:
  {
    "id": "string",
    "title": "string",
    "type": "video" | "audio" | "course" | "article",
    "provider": "string",
    "url": "string (valid URL)",
    "careerId": "string (best fit)",
    "duration": "string",
    "thumbnail": "string (use high quality Unsplash URL: https://images.unsplash.com/photo-...)",
    "region": "Global",
    "language": "English",
    "rating": number (4.0 - 5.0),
    "skillLevel": "Beginner" | "Intermediate" | "Advanced",
    "description": "string",
    "tags": ["string"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Search for materials matching: ${query}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Search Failed:", error);
    return [];
  }
}

export async function aiSearchJobs(query: string, location: string): Promise<JobListing[]> {
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

    const results = JSON.parse(response.text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Job Search Failed:", error);
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

    const results = JSON.parse(response.text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Job Suggestions Failed:", error);
    return [];
  }
}

export async function getAiInstitutionRecommendations(profile: UserProfile, selectedPathId: string): Promise<{ institution: Institution, rationale: string }[]> {
  const model = "gemini-2.0-flash";
  
  const systemInstruction = `You are Spark.E, a Global Admissions Strategist.
  Analyze this user profile: ${JSON.stringify(profile)} and selected career path: ${selectedPathId}.
  
  1. Recommend 3 elite or highly relevant institutions/programs globally or in their country: ${profile.country}.
  2. For each, provide a "rationale" explaining why it's perfect for their specific academic background and career goals.
  3. Ensure the institutions exist and are known for the target field.
  
  Return a valid JSON array of objects: { "institution": Institution, "rationale": "string" }.
  
  Institution Schema:
  {
    "id": "string",
    "name": "string",
    "location": "string",
    "type": "University" | "Vocational" | "Polytechnic" | "Medical School" | "Business School",
    "avgCost": number (annual fees),
    "programs": ["string"],
    "ranking": number,
    "image": "https://images.unsplash.com/photo-...",
    "applicationDeadline": "YYYY-MM-DD",
    "website": "string",
    "allowsInternationalStudents": boolean,
    "visaSupport": "Full" | "Partial" | "None",
    "coordinates": { "lat": number, "lng": number },
    "city": "string",
    "country": "string",
    "costOfLivingIndex": number
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: "Recommend the best institutions for my career choice." }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const results = JSON.parse(response.text);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("AI Institution Recommendations Failed:", error);
    return [];
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

    const results = JSON.parse(response.text);
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

    return JSON.parse(response.text);
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

    const matches = JSON.parse(response.text);
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

    return JSON.parse(response.text);
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

    return response.text;
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

    return response.text;
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

    return JSON.parse(response.text);
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
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Career Strategist specializing in the 2026 global job market.
    Your task is to identify the TOP 10 highest-growth, most impactful global career paths for 2026.
    
    Output Format:
    Return an array of 10 objects following this strict JSON schema:
    [{
      "id": "slug-id",
      "title": "Full Career Title",
      "description": "Short, punchy 1-2 sentence description",
      "growth": "high" | "medium" | "stable",
      "category": "Technology & Digital" | "Healthcare & Life Sciences" | "Business, Finance & Management" | "Engineering, Science & Environment" | "Arts, Design & Media" | "Education, Law & Public Service" | "Skilled Trades & Technical Services",
      "subCategory": "The specific field (e.g. Data & AI, Clinical Practice, etc.)",
      "workType": "Remote" | "On-site" | "Hybrid" | "Mobile",
      "tags": ["AI Integration", "Green Transition", "Remote Economy", "Global Demand"],
      "milestones": [
        {
          "ageRange": "e.g. 13-17",
          "title": "Exploratory Phase",
          "description": "What to do at this age",
          "requirements": ["Skill 1", "Skill 2"]
        },
        ... (provide 3-4 milestones per path)
      ]
    }]
  `;

  const prompt = "Generate the top 10 global career paths for 2026 accurately following the schema. Ensure categories match the defined industry sectors.";

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
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              growth: { type: Type.STRING, enum: ["high", "medium", "stable"] },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              workType: { type: Type.STRING, enum: ["Remote", "On-site", "Hybrid", "Mobile"] },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ageRange: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["ageRange", "title", "description", "requirements"]
                }
              }
            },
            required: ["id", "title", "description", "growth", "category", "milestones"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    if (error?.message?.includes("429") || error?.status === "RESOURCE_EXHAUSTED") {
      console.warn("Gemini Quota Exceeded (429) for Careers. Using static dataset fallback.");
    } else {
      console.error("Fetch Careers Error:", error);
    }
    // Fallback to locally defined mock data if API fails or quota hit
    return [];
  }
}

export async function aiSearchCareerPaths(query: string): Promise<CareerPath[]> {
  const model = "gemini-3.1-pro-preview";
  const systemInstruction = `
    You are an AI Career Strategist. The user is searching for global career paths.
    Analyze the query: "${query}".
    Return up to 8 high-quality career paths that match the query and the global job market in 2026.
    Use the exact JSON schema below and nothing else.

    CareerPath Schema:
    [{
      "id": "slug-id",
      "title": "Full Career Title",
      "description": "Short, punchy 1-2 sentence description",
      "growth": "high" | "medium" | "stable",
      "category": "Technology & Digital" | "Healthcare & Life Sciences" | "Business, Finance & Management" | "Engineering, Science & Environment" | "Arts, Design & Media" | "Education, Law & Public Service" | "Skilled Trades & Technical Services",
      "subCategory": "The specific field (e.g. Data & AI, Clinical Practice, etc.)",
      "workType": "Remote" | "On-site" | "Hybrid" | "Mobile",
      "tags": ["string"],
      "milestones": [
        {
          "ageRange": "e.g. 13-17",
          "title": "Exploratory Phase",
          "description": "What to do at this age",
          "requirements": ["Skill 1", "Skill 2"]
        }
      ]
    }]
  `;

  const prompt = `Provide AI-powered global career paths matching: ${query}. Return valid JSON only.`;

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
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              growth: { type: Type.STRING, enum: ["high", "medium", "stable"] },
              category: { type: Type.STRING },
              subCategory: { type: Type.STRING },
              workType: { type: Type.STRING, enum: ["Remote", "On-site", "Hybrid", "Mobile"] },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              milestones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    ageRange: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["ageRange", "title", "description", "requirements"]
                }
              }
            },
            required: ["id", "title", "description", "growth", "category", "milestones"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("AI Career Search Error:", error);
    return [];
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

    const institutions = JSON.parse(response.text);
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

    const materials = JSON.parse(response.text);
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
  
  const systemInstruction = `You are an expert immigration consultant specializing in student visas and work permits.
  Provide comprehensive, realistic visa guidance based on student profile and target location.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{
          text: `Visa Guidance for:
Home Country: ${profile.citizenCountry || profile.country}
Target Country: ${targetCountry}
Career: ${targetCareer}
Education: ${profile.education}
Budget: $${profile.budget}

Return JSON with: recommendedVisaTypes[], processingTimeline, estimatedCost, requirements[], sponsorshipLikelihood (High/Medium/Low), nextSteps[], processingLocation`
        }]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const visaInfo = JSON.parse(response.text);
    return visaInfo;
  } catch (error) {
    console.error("Visa Guidance Error:", error);
    return {
      recommendedVisaTypes: ['Student Visa'],
      processingTimeline: '2-4 months',
      estimatedCost: 1500,
      requirements: ['Valid Passport', 'Acceptance Letter', 'Proof of Funds', 'Medical Clearance'],
      sponsorshipLikelihood: 'Medium',
      nextSteps: ['Apply to institutions', 'Gather required documents', 'Schedule consulate appointment'],
      processingLocation: 'Home Country Embassy'
    };
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

  const systemInstruction = `You are Spark.E, a Global Career Market Intelligence Specialist.
  Provide comprehensive market insights for job markets in specific cities.
  Return a valid JSON object with city, country, intensity (0-100), topCareers array, marketHealthScore, averageSalaryRange, costOfLiving, visaOpenness, hiringTrends, requiredSkills array, topEmployers array, internshipOpportunities, and remoteWorkPercentage.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{
        role: "user",
        parts: [{
          text: `Analyze the job market for ${city}, ${country}. Provide 2026 market insights including: Top 4-5 in-demand careers with demand scores and salary ranges (entry, mid, senior), Job market intensity (0-100), Cost of living index, Required technical skills with demand scores, Visa sponsorship openness (High/Medium/Low), Current hiring trends, Top 5 employers, Internship availability count, Remote work percentage (0-100), and Market health score (0-100).`
        }]
      }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const hubData = JSON.parse(response.text);
    const result = {
      ...hubData,
      city,
      country
    };

    // Step 2: Save to database for caching on success
    await saveCachedCareerHub(result).catch(err => 
      console.warn("Failed to cache career hub data (non-blocking):", err)
    );

    return result;
  } catch (error) {
    console.error("Career Hub Intelligence Error:", error);
    // Return structured fallback data
    return {
      city,
      country,
      intensity: 75,
      topCareers: [
        {
          title: "Software Engineer",
          demandScore: 95,
          avgSalary: { entry: 60000, mid: 100000, senior: 150000, currency: "USD" },
          jobGrowth: 12,
          openings: 500
        },
        {
          title: "Data Scientist",
          demandScore: 90,
          avgSalary: { entry: 70000, mid: 110000, senior: 160000, currency: "USD" },
          jobGrowth: 15,
          openings: 300
        }
      ],
      marketHealthScore: 78,
      averageSalaryRange: { min: 55000, max: 180000, currency: "USD" },
      costOfLiving: 1.1,
      requiredSkills: [
        { skill: "Python", demand: 90 },
        { skill: "Cloud Platforms", demand: 85 },
        { skill: "System Design", demand: 80 }
      ],
      visaOpenness: "Medium",
      hiringTrends: "Tech roles dominating the market with strong emphasis on AI/ML and Cloud Computing",
      topEmployers: ["Tech Giants", "Startups", "Finance Firms", "Consulting"],
      internshipOpportunities: 200,
      remoteWorkPercentage: 45
    };
  }
}
