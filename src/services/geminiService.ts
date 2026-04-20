import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getCareerAdvice(prompt: string, userContext: any) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are "Vision", an expert AI Career Mentor for the CareerVision SaaS platform.
    Your goal is to provide highly personalized, data-driven career advice.
    User Profile:
    - Age: ${userContext.age}
    - Education: ${userContext.education}
    - Interests: ${userContext.interests.join(", ")}
    - Budget: $${userContext.budget}
    
    Guidelines:
    1. Be encouraging but realistic about costs and requirements.
    2. Suggest specific paths (e.g., AI Engineering, Renewable Energy) based on their interests.
    3. If they ask about ROI, compare different regions (e.g., Canada vs Germany).
    4. Keep responses concise and use markdown formatting.
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
