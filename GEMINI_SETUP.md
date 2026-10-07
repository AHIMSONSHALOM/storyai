# Google Gemini API Setup Guide for StoryForge AI

This guide explains how to configure your Google Gemini API key and model settings for **StoryForge AI**.

---

## 1. Obtain a Google Gemini API Key

1. Visit **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account.
3. Click on **"Get API key"** in the sidebar.
4. Click **"Create API key"** (or select an existing Google Cloud project).
5. Copy your generated API key (it starts with `AIzaSy...`).

---

## 2. Configure Environment Variables

In your `.env` file (or Render dashboard):

```env
GEMINI_API_KEY=AIzaSyYourActualKeyHere
GEMINI_MODEL=gemini-1.5-flash
```

### Configurable Model Name (`GEMINI_MODEL`)
- `GEMINI_MODEL` is fully configurable.
- Default model: `gemini-1.5-flash`.
- Other supported models: `gemini-2.5-flash`, `gemini-2.0-flash`.
- Never hardcoded in the codebase.

---

## 3. High-Capacity Resilience & Graceful 503 Handling

StoryForge AI includes built-in resilience against temporary model capacity limits (HTTP 503 / `MODEL_CAPACITY_EXHAUSTED`):

1. **Exponential Backoff Retries**: Automatically retries failed requests with increasing delays.
2. **Dynamic Fallback Models**: If the primary model experiences a capacity limit, the backend automatically tries alternative available Flash-class Gemini models.
3. **Graceful JSON Error Response**: If all retries are exhausted, the backend returns a clean status code 503 response without crashing:
   ```json
   {
     "success": false,
     "error": "The AI service is temporarily busy. Please try again shortly."
   }
   ```

---

## 4. API Security Architecture

```
User Browser (HTML / JS)
       │
       ▼  (POST /api/generate-story with Bearer Token)
Flask Backend (app.py)
       │
       ▼  (Uses backend GEMINI_API_KEY & GEMINI_MODEL securely)
Google Gemini API
       │
       ▼  (Returns generated story JSON)
Flask Backend
       │
       ▼  (Stores story in Supabase PostgreSQL & returns to frontend)
User Browser
```

Key Security Highlights:
- The `GEMINI_API_KEY` **never** leaves the server.
- Browser JavaScript never calls Google Gemini directly.
- All requests are authenticated via Supabase JWT Bearer Tokens.
