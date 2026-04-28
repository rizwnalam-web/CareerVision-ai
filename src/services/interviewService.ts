import { ai, Type } from "../lib/gemini";
import { InterviewQuestion, QuestionTier, STARScore, InterviewFeedback, EtiquetteInsight } from "../types/interview";

// Remove local initialization
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getLocalizedEtiquette(location: string, role: string): Promise<EtiquetteInsight[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Professional Etiquette Expert.
    Provide 3-4 specific interview etiquette insights for the following location: ${location}.
    Tailor them slightly for the role: ${role} if relevant (e.g., technical vs client-facing).
    
    Focus on:
    - Punctuality
    - Dress Code
    - Communication Style
    - Cultural Nuances

    Output Format:
    Return an array of objects following the EtiquetteInsight schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Generate etiquette insights.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              insight: { type: Type.STRING },
              importance: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
            },
            required: ["category", "insight", "importance"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Etiquette Error:", error);
    return [
      { category: "Punctuality", insight: "Standard professional punctuality is expected.", importance: "High" },
      { category: "Dress Code", insight: "Business professional attire is recommended unless specified otherwise.", importance: "Medium" }
    ];
  }
}

export async function generateInterviewQuestions(role: string, company?: string): Promise<InterviewQuestion[]> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Hiring Manager.
    Generate 5 high-impact interview questions for the following role: ${role}${company ? ` at ${company}` : ""}.
    
    Structure the output as precisely 5 questions:
    - 2 Behavioral (Tier 1)
    - 2 Role-Specific (Tier 2)
    - 1 Company-Specific (Tier 3) - if company is not provided, make it a high-level vision question for the industry.

    Output Format:
    Return an array of objects following the InterviewQuestion schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Generate interview questions.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              text: { type: Type.STRING },
              tier: { type: Type.STRING, enum: Object.values(QuestionTier) },
              category: { type: Type.STRING },
              tips: { type: Type.ARRAY, items: { type: Type.STRING } },
              targetKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "text", "tier", "category", "targetKeywords"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Question Generation Error:", error);
    return [
      { id: "1", text: "Tell me about a time you handled a difficult situation within a team.", tier: QuestionTier.BEHAVIORAL, category: "Soft Skills" },
      { id: "2", text: "How do you stay updated with the latest trends in your field?", tier: QuestionTier.ROLE_SPECIFIC, category: "Professional Growth" }
    ];
  }
}

export async function evaluateInterviewAnswer(question: string, answer: string): Promise<InterviewFeedback> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are an AI Interview Coach.
    Evaluate the user's answer to the question using the STAR (Situation, Task, Action, Result) method.
    
    Analyze:
    1. STAR Completion: Did they address all four components?
    2. Confidence: Based on text structure and tone.
    3. Sentiment: Tone of the response.
    4. Filler Words: Identify common filler words used in the text.
    5. Improvement: Provide a suggested better version of the answer.

    Question: ${question}
    
    Output Format:
    Return a single JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `User Answer: ${answer}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            starScore: {
              type: Type.OBJECT,
              properties: {
                situation: { type: Type.NUMBER },
                task: { type: Type.NUMBER },
                action: { type: Type.NUMBER },
                result: { type: Type.NUMBER },
                overall: { type: Type.NUMBER },
                feedback: { type: Type.STRING }
              }
            },
            confidenceScore: { type: Type.NUMBER },
            fillerWords: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Needs Improvement"] },
            suggestedAnswer: { type: Type.STRING },
            matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text);
    return {
      questionId: "active",
      answerText: answer,
      ...parsed
    };
  } catch (error) {
    console.error("Answer Evaluation Error:", error);
    throw error;
  }
}
