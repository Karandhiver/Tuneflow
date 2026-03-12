# TuneFlow 🎵

Apple Music-style web app powered by YouTube + Supabase.

## Project Structure
```
tuneflow/
├── index.html          ← Main app (no API keys inside)
├── api/
│   └── youtube.js      ← Serverless function (YouTube key lives here, server-side only)
├── vercel.json         ← Routing config
└── README.md
```

## Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "TuneFlow initial"
git remote add origin https://github.com/YOUR_USERNAME/tuneflow.git
git push -u origin main
```

### Step 2 — Import on Vercel
- Go to vercel.com → New Project → Import your repo

### Step 3 — Add Environment Variable (THIS IS HOW THE KEY STAYS HIDDEN)
In Vercel project settings → Environment Variables → add:

| Name | Value |
|------|-------|
| `YOUTUBE_API_KEY` | `AIzaSyDI-1HOw-LWBk9XylhwZ59KT9lbAJrJXcw` |

### Step 4 — Deploy
Click Deploy. Done. The YouTube key is NEVER in the browser.

## How Key Security Works
- Browser calls `/api/youtube?q=song` 
- Vercel runs `api/youtube.js` on the SERVER
- That file reads `process.env.YOUTUBE_API_KEY` (never sent to browser)
- Returns only the song results JSON
- Zero keys visible in browser inspect / network tab
