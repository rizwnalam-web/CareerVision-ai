import { Router, Request, Response } from "express";
import { generateDeepSeekBatch, generateDeepSeekResponse, getDeepSeekCostSummary, clearDeepSeekCache, probeProviders, getActiveProvider, getAllProviders } from "../services/geminiService.js";

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

// ── LLM Health / Provider Discovery ──────────────────────────────────────────
// Returns the currently active provider. If none locked yet, probes all providers.
// The frontend calls this once on login to know which model is in use.
router.get("/health", async (_req: Request, res: Response) => {
  try {
    let active = getActiveProvider();
    if (!active) {
      active = await probeProviders();
    }
    const costSummary = getDeepSeekCostSummary();
    if (!active) {
      return res.status(503).json({
        success: false,
        available: false,
        message: "All LLM providers are currently unavailable.",
        providers: getAllProviders().map(p => ({ name: p.name, label: p.label, available: false })),
      });
    }
    return res.json({
      success: true,
      available: true,
      activeProvider: {
        name: active.name,
        label: active.label,
        model: active.model,
      },
      allProviders: getAllProviders().map(p => ({
        name: p.name,
        label: p.label,
        model: p.model,
        isActive: p.name === active!.name,
        hasKey: !!p.apiKey,
      })),
      costSummary,
    });
  } catch (error) {
    console.error("LLM health check error:", error);
    res.status(500).json({ success: false, available: false, message: "Health check failed" });
  }
});

// Force re-probe all providers (useful after env changes)
router.post("/probe", async (_req: Request, res: Response) => {
  try {
    const provider = await probeProviders();
    if (!provider) {
      return res.status(503).json({ success: false, message: "All providers unavailable" });
    }
    res.json({ success: true, activeProvider: { name: provider.name, label: provider.label, model: provider.model } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Probe failed" });
  }
});

export default router;
