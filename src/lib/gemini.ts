import { GoogleGenAI, Type } from "@google/genai";
import Groq from "groq-sdk";

/**
 * Unified AI Provider with Automatic Fallback.
 * Primary: Google Gemini (Pro/Flash)
 * Secondary: Groq (Llama 3/3.3)
 */

const GEMINI_USER_KEY = "AIzaSyBX4hI2RvtsbGN_z_xej34H-rQ3jrmz064";
const GEMINI_ENV_KEY = process.env.GEMINI_API_KEY;
const GEMINI_KEY = GEMINI_USER_KEY || GEMINI_ENV_KEY || "";

// Groq Key provided by user
const GROQ_USER_KEY = "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";
const GROQ_ENV_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY;
const GROQ_KEY = GROQ_USER_KEY || GROQ_ENV_KEY || "";

const gemini = new GoogleGenAI({ apiKey: GEMINI_KEY });
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true }) : null;

export const ai = {
  models: {
    generateContent: async ({ model, contents, config }: any) => {
      try {
        // Attempt Gemini Primary using the modern SDK pattern
        return await gemini.models.generateContent({
          model: model || "gemini-2.0-flash",
          contents,
          config
        });
      } catch (error: any) {
        console.warn("AI Fallback Triggered: Gemini encountered an issue.", error.message);
        
        // If it's a quota error or something we can recover from with Groq
        if (groq) {
          try {
            console.info("Switching to Groq Llama-3.3-70b-versatile...");
            
            const systemContent = config?.systemInstruction || "You are a specialized career advisor AI.";
            const userContent = typeof contents === 'string' ? contents : JSON.stringify(contents);
            
            // Groq requires the word "json" to be in the messages if responding in json_object mode
            const isJsonMode = config?.responseMimeType === "application/json";
            const finalSystemContent = isJsonMode && !systemContent.toLowerCase().includes("json") 
              ? `${systemContent} Respond in JSON format.`
              : systemContent;

            const groqResponse = await groq.chat.completions.create({
              messages: [
                { role: "system", content: finalSystemContent },
                { role: "user", content: userContent }
              ],
              model: "llama-3.3-70b-versatile",
              temperature: config?.temperature ?? 0.7,
              response_format: isJsonMode ? { type: "json_object" } : { type: "text" },
            });

            return { text: groqResponse.choices[0]?.message?.content || "" };
          } catch (groqError: any) {
            console.error("Groq Fallback also failed:", groqError.message);
            throw groqError;
          }
        }

        throw error;
      }
    }
  }
};

export { Type };
