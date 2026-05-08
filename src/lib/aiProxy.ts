const API_BASE = (import.meta as any).env?.VITE_API_BASE || "http://localhost:3001/api/llm";

export const ai = {
  models: {
    generateContent: async ({ model, contents, config }: any) => {
      const response = await fetch(`${API_BASE}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, contents, config }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`LLM proxy failed: ${response.status} ${errorText}`);
      }

      return response.json();
    },
  },
};

export const Type = {
  ARRAY: "array",
  OBJECT: "object",
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  INTEGER: "integer",
};
