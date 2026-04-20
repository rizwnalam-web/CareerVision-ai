import { GoogleGenAI, Type } from "@google/genai";
import { FUNDING_OPPORTUNITIES } from "../constants/mockData";
import { FundingOpportunity, UserProfile, CareerPath } from "../types/career";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function matchScholarships(profile: UserProfile): Promise<FundingOpportunity[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Scholarship & Funding Matching Specialist.
    Your task is to rank the available funding opportunities (scholarships, grants, loans) for a specific user profile and explain the match.

    Funding Database:
    ${JSON.stringify(FUNDING_OPPORTUNITIES, null, 2)}

    Output Format:
    Return an array of objects for the TOP matching items:
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
  } catch (error) {
    console.error("Funding Matching Error:", error);
    return FUNDING_OPPORTUNITIES;
  }
}

export async function getRecommendedCourses(sector: string): Promise<any[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Educational Curator.
    Your task is to recommend the TOP 10 high-impact online courses for a specific industry sector in 2026.
    
    Output Format:
    Return an array of objects:
    [
      { "title": "Course Title", "provider": "University/Platform", "type": "course", "duration": "e.g. 12 weeks", "reason": "Why this is top-tier in 2026" }
    ]
  `;

  const prompt = `Recommend the top 10 courses for the following sector: ${sector}`;

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
              reason: { type: Type.STRING }
            },
            required: ["title", "provider", "type", "duration", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Course Recommendation Error:", error);
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
  } catch (error) {
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
  } catch (error) {
    console.error("Cover Letter Generation Error:", error);
    return "Failed to generate cover letter. Please try again.";
  }
}

export async function getLatestCareerNews(): Promise<{ career: string, country: string, aiTech: string }[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI News Curator for the year 2026.
    Your task is to provide 5 brief "News Flash" items regarding:
    1. The most in-demand career in a specific country right now.
    2. A brand-new, cutting-edge AI technology that was just launched.
    
    Output Format:
    Return an array of 5 objects:
    [
      { "career": "Cyber-Physical Auditor", "country": "Singapore", "aiTech": "Neural-Link GPT-X" },
      ...
    ]
  `;

  const prompt = "Generate 5 latest global career and AI technology news flashes for 2026.";

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
  } catch (error) {
    console.error("News Flash Error:", error);
    return [
      { career: "AI Systems Architect", country: "United States", aiTech: "Gemini 4.0 Ultra" },
      { career: "Renewable Energy Specialist", country: "Germany", aiTech: "Fusion-Core Logic" }
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
      "category": "Technology" | "Engineering" | "Healthcare" | "Sustainability" | "Economics" | "Creative",
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

  const prompt = "Generate the top 10 global career paths for 2026 accurately following the schema.";

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
  } catch (error) {
    console.error("Fetch Careers Error:", error);
    return [];
  }
}
