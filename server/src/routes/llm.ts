import { Router, Request, Response } from "express";
import { generateDeepSeekBatch, generateDeepSeekResponse, getDeepSeekCostSummary, clearDeepSeekCache } from "../services/geminiService.js";

const router = Router();

function buildPrompt(contents: any, config: any): string {
  const promptParts: string[] = [];

  if (config?.systemInstruction) {
    promptParts.push(String(config.systemInstruction).trim());
  }

  if (typeof contents === "string") {
    promptParts.push(contents.trim());
  } else if (Array.isArray(contents)) {
    contents.forEach((item) => {
      if (!item) return;
      if (typeof item === "string") {
        promptParts.push(item.trim());
        return;
      }
      if (item.parts && Array.isArray(item.parts)) {
        const combined = item.parts
          .map((part: any) => String(part?.text ?? "").trim())
          .filter(Boolean)
          .join(" ");
        if (combined) promptParts.push(combined);
        return;
      }
      if (item.text) {
        promptParts.push(String(item.text).trim());
        return;
      }
      if (item.content) {
        promptParts.push(String(item.content).trim());
        return;
      }
    });
  } else if (contents?.content) {
    promptParts.push(String(contents.content).trim());
  }

  return promptParts.filter(Boolean).join("\n\n");
}

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { model, contents, config } = req.body;

    if (!contents) {
      return res.status(400).json({ error: "contents is required" });
    }

    const prompt = buildPrompt(contents, config);
    const result = await generateDeepSeekResponse(prompt, {
      model,
      temperature: config?.temperature,
      maxTokens: config?.maxOutputTokens || config?.maxTokens,
    });

    return res.json(result);
  } catch (error) {
    console.error("LLM generate error:", error);
    res.status(500).json({ error: "Failed to generate LLM response" });
  }
});

router.post("/batch", async (req: Request, res: Response) => {
  try {
    const { prompts, model, temperature, maxTokens } = req.body;

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: "prompts must be a non-empty array" });
    }

    const cleanPrompts = prompts.map((prompt) => String(prompt).trim()).filter(Boolean);
    if (cleanPrompts.length === 0) {
      return res.status(400).json({ error: "prompts must contain at least one non-empty string" });
    }

    const results = await generateDeepSeekBatch(cleanPrompts, {
      model,
      temperature,
      maxTokens,
    });

    res.json({
      success: true,
      provider: process.env.LLM_PROVIDER || "deepseek",
      model: process.env.LLM_MODEL || "deepseek-v4-flash",
      prompts: cleanPrompts.length,
      results,
      costSummary: getDeepSeekCostSummary(),
    });
  } catch (error) {
    console.error("LLM batch error:", error);
    res.status(500).json({ error: "Failed to generate LLM responses" });
  }
});

router.get("/cost", (_req: Request, res: Response) => {
  res.json({ success: true, costSummary: getDeepSeekCostSummary() });
});

router.post("/clear-cache", (_req: Request, res: Response) => {
  clearDeepSeekCache();
  res.json({ success: true, message: "DeepSeek cache cleared" });
});

export default router;
