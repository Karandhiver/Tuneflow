# 🎵 Wave Music

A full-stack Apple Music-style PWA with YouTube-powered music & Indian podcast streaming.

## Features

- 🎵 Search & stream any song via YouTube InnerTube (unlimited, no API key)
- 🎙️ Indian Podcasts — Nikhil Kamath, Study IQ, Ankit Agrawal, Raj Shamani, BeerBiceps & more
- 📱 Apple Music UI — works on iPhone Safari, Mac, Android Chrome
- 📲 PWA — Add to Home Screen for a native app experience
- 🔒 Google Sign-In via Supabase Auth
- ❤️ Liked songs, listening history, playlists (synced via Supabase)
- 🎛️ Lock screen controls via Media Session API
- 🔀 Shuffle, repeat, queue, track options

---

## 🚀 Deployment Guide (Step by Step)

### Step 1 — Run the Database Schema in Supabase

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your project → **SQL Editor** → **New Query**
3. Paste the contents of `supabase-schema.sql` and click **Run**

### Step 2 — Configure Google OAuth in Supabase

1. In Supabase Dashboard → **Authentication → Providers → Google**
2. Enable Google and enter:
   - **Client ID**: `542388251754-7j2v6cee6uu6upkgra5gdea40ts971ai.apps.googleusercontent.com`
   - **Client Secret**: Get from Google Cloud Console → Credentials
3. In **Google Cloud Console** → your OAuth client → **Authorized redirect URIs**, add:
   ```
   https://qzqrskoycaktqlbtgygf.supabase.co/auth/v1/callback
   ```

### Step 3 — Push to GitHub

```bash
git init
git add .
git commit -m "feat: Wave Music initial release"
git branch -M main
# Create repo on GitHub.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/wave-music.git
git push -u origin main
```

### Step 4 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo
2. In **Environment Variables**, add these three:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://qzqrskoycaktqlbtgygf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your full anon key) |
| `NEXT_PUBLIC_APP_URL` | `https://your-project-name.vercel.app` |

3. Click **Deploy** ✅

### Step 5 — Add Vercel URL back to Supabase

After deployment, go to Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://your-project-name.vercel.app`
- **Redirect URLs**: `https://your-project-name.vercel.app/api/auth/callback`

---

## 📱 Add to iPhone Home Screen (PWA)

1. Open your Vercel URL in **Safari** on iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down → **Add to Home Screen** → Add
4. The app opens full-screen with no browser UI, just like a native app!

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.local.example .env.local
# Edit .env.local and fill in your Supabase values

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
wave-music/
├── supabase-schema.sql          ← Run this in Supabase SQL Editor
├── vercel.json                  ← Vercel deployment config
├── .env.local.example           ← Copy to .env.local for local dev
│
└── src/
    ├── middleware.ts             ← Supabase session refresh
    ├── app/
    │   ├── layout.tsx            ← Root layout with PWA tags
    │   ├── page.tsx              ← Home (trending + podcasts)
    │   ├── loading.tsx           ← Skeleton loader
    │   ├── error.tsx             ← Error boundary
    │   ├── not-found.tsx         ← 404 page
    │   ├── search/               ← Real-time YouTube search
    │   ├── library/              ← Liked songs + playlists
    │   ├── podcasts/             ← Podcast list + episode pages
    │   └── api/
    │       ├── search/           ← InnerTube music/podcast search
    │       ├── stream/           ← Get direct audio stream URL
    │       ├── trending/         ← India charts
    │       ├── podcasts/         ← YouTube RSS feeds
    │       └── auth/callback/    ← Supabase OAuth callback
    │
    ├── components/
    │   ├── player/
    │   │   ├── AudioEngine.tsx   ← Invisible HTML5 audio + MediaSession
    │   │   ├── MiniPlayer.tsx    ← Bottom bar player
    │   │   └── FullscreenPlayer.tsx ← Apple Music expanded view
    │   ├── music/
    │   │   ├── TrackRow.tsx      ← Track list item with options
    │   │   ├── AlbumCard.tsx     ← Horizontal scroll card
    │   │   └── TrackOptionsSheet.tsx ← Like/queue/share bottom sheet
    │   ├── podcast/
    │   │   └── PodcastCard.tsx
    │   ├── layout/
    │   │   └── Sidebar.tsx       ← Desktop sidebar + mobile tab bar
    │   └── ui/
    │       └── SectionHeader.tsx
    │
    ├── hooks/
    │   ├── useAuth.ts            ← Google auth hook
    │   └── usePlaylists.ts       ← Supabase playlists CRUD
    │
    ├── lib/
    │   ├── store.ts              ← Zustand player + library state
    │   ├── supabase/             ← Client + server helpers
    │   └── youtube/
    │       └── innertube.ts      ← YouTube InnerTube (unlimited access)
    │
    └── types/index.ts            ← Types + Indian podcaster list
```
