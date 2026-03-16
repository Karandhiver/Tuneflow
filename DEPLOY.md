# 🚀 Wave Music — Complete Deployment Guide

## Prerequisites
- GitHub account
- Supabase account (free)
- Vercel account (free)
- Google Cloud Console account (free)

---

## Step 1 — Run Database Schema in Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project → **SQL Editor** → **New Query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run** ✅

---

## Step 2 — Configure Google OAuth

### In Google Cloud Console:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Find your OAuth 2.0 Client (ID: `542388251754-...`)
4. Under **Authorized redirect URIs**, add:
   ```
   https://qzqrskoycaktqlbtgygf.supabase.co/auth/v1/callback
   ```
5. Save

### In Supabase Dashboard:
1. Go to **Authentication → Providers → Google**
2. Toggle **Enable**
3. Paste your **Client ID** and **Client Secret**
4. Save

---

## Step 3 — Push to GitHub

```bash
# In the wave-music folder:
git init
git add .
git commit -m "feat: Wave Music v1.0"
git branch -M main

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/wave-music.git
git push -u origin main
```

---

## Step 4 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com/new)
2. **Import** your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add these **Environment Variables**:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qzqrskoycaktqlbtgygf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (your full anon key) |
| `NEXT_PUBLIC_APP_URL` | `https://wave-music-xxx.vercel.app` ← set after deploy |

5. Click **Deploy**
6. Note your live URL (e.g. `https://wave-music-xyz.vercel.app`)

---

## Step 5 — Wire up Supabase Redirect URLs

1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `https://wave-music-xyz.vercel.app`
3. **Redirect URLs**: `https://wave-music-xyz.vercel.app/api/auth/callback`
4. Save

---

## Step 6 — Generate PWA Icons (optional but recommended)

```bash
npm install  # install deps first
npm run icons  # generates icon-192.png, icon-512.png, apple-touch-icon.png
git add public/
git commit -m "feat: add PWA icons"
git push  # Vercel auto-redeploys
```

---

## Step 7 — Add to iPhone Home Screen

1. Open your Vercel URL in **Safari** on iPhone
2. Tap **Share** (square with arrow)
3. Scroll down → **Add to Home Screen** → **Add**
4. Launch from home screen — full native app experience! 🎉

---

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Fill in your Supabase values in .env.local
npm run dev
# Open http://localhost:3000
```

---

## Keyboard Shortcuts (Desktop)

| Key | Action |
|---|---|
| `Space` | Play / Pause |
| `⌘ →` | Next track |
| `⌘ ←` | Previous track |
| `⌘ ↑` | Volume up |
| `⌘ ↓` | Volume down |
| `⌘ S` | Toggle shuffle |
| `⌘ R` | Cycle repeat |

