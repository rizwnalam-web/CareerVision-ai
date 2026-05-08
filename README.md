<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1de9baab-91e1-4f5d-9ef4-6a2ac06156d7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. No client-side Gemini key is required. The app now routes all LLM requests through the backend.

## DeepSeek Backend Integration

Add the following variables to your backend `.env` file before starting the server:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
LLM_PROVIDER=deepseek
LLM_MODEL=deepseek-v4-flash
OFF_PEAK_HOURS=23-7
PORT=8080
LLM_GATEWAY_URL=https://api.deepseek.com/v1
```

New backend endpoints:

- `POST /api/llm/batch` — batch generate DeepSeek LLM responses with cache-first behavior
- `GET /api/llm/cost` — retrieve aggregated LLM usage and cost summary
- `POST /api/llm/clear-cache` — clear the DeepSeek response cache

If you are using the server package directly, run `cd server && npm install` after updating dependencies.
3. Run the app:
   `npm run dev`
