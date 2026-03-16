/**
 * TuneFlow Intelligence Engine v1.0
 * ──────────────────────────────────
 * Tracks listening patterns, detects mood, builds a taste profile,
 * reshuffles the home page, and optionally uses Claude AI for deep analysis.
 * 100% client-side — all data stays in localStorage.
 */

const TI = (() => {

  // ── Storage keys ──────────────────────────────────────────
  const K = {
    profile:   'tf_intel_profile',
    history:   'tf_intel_history',
    skips:     'tf_intel_skips',
    sessions:  'tf_intel_sessions',
    apiKey:    'tf_claude_key',
  }

  // ── Mood / genre keyword maps ─────────────────────────────
  const MOOD_KEYWORDS = {
    romantic:   ['ishq','pyaar','mohabbat','dil','love','tere','teri','dard','yaad','judai','bewafa','intezaar','aankhon','kahan','aashiqui','sanam','rabba','tujhe'],
    sad:        ['dard','rona','aansu','alvida','judai','tanha','akela','bichhad','zindagi','maut','wapas'],
    happy:      ['khushi','dance','party','dhamaal','masti','dhoom','rang','holi','celebration','naach','josh'],
    energetic:  ['rap','bhangra','pump','bass','fire','swag','hustle','bounce','beat','banger','anthem'],
    chill:      ['lofi','slow','calm','peaceful','rain','coffee','night','relax','sleep','acoustic','unplugged','sufi'],
    devotional: ['bhajan','aarti','om','shiva','ganesh','krishna','ram','hanuman','durga','devi','mantra','kirtan'],
    patriotic:  ['desh','bharat','india','vande','tiranga','azaadi','hindustani','jai hind'],
    item:       ['item','baby','hookah','sheila','munni','fevicol','chikni','lungi'],
  }

  const GENRE_KEYWORDS = {
    bollywood:  ['t-series','zee music','tips official','sony music india','saregama','yrf','dharma'],
    punjabi:    ['punjab','punjabi','bhangra','dhol','jatt','patiala','chandigarh','amritsar'],
    bhojpuri:   ['bhojpuri','bhojwood','bhojpuria','pawan','khesari','nirahua'],
    gujarati:   ['gujarati','garba','dandiya','gujarat'],
    haryanvi:   ['haryanvi','haryana','desi haryanvi'],
    sufi:       ['sufi','qawwali','ghazal','dargah','fakir'],
    classical:  ['raag','classical','hindustani','carnatic','tabla','sitar','veena'],
  }

  // ── In-memory state ───────────────────────────────────────
  let _profile = null
  let _sessionStart = Date.now()
  let _currentPlayStart = null
  let _currentTrack = null

  // ── Load / save helpers ───────────────────────────────────
  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback } catch { return fallback }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
  }

  // ── Default profile ───────────────────────────────────────
  function defaultProfile() {
    return {
      totalPlays: 0,
      totalMinutes: 0,
      topArtists: {},      // artist → play count
      topGenres: {},       // genre → play count
      topMoods: {},        // mood → play count
      skipRate: {},        // trackId → skips
      completionRate: {},  // trackId → completions
      hourlyPattern: new Array(24).fill(0),  // plays per hour
      dayPattern: new Array(7).fill(0),      // plays per weekday
      recentMoods: [],     // last 20 moods played
      recentArtists: [],   // last 20 artists
      recentGenres: [],    // last 20 genres
      tasteTags: [],       // derived: your top 5 taste descriptors
      lastUpdated: Date.now(),
      version: 1,
    }
  }

  function getProfile() {
    if (!_profile) _profile = load(K.profile, defaultProfile())
    // Ensure all keys exist (migration)
    const d = defaultProfile()
    for (const k of Object.keys(d)) {
      if (_profile[k] === undefined) _profile[k] = d[k]
    }
    return _profile
  }

  function saveProfile() {
    _profile.lastUpdated = Date.now()
    _profile.tasteTags = deriveTasteTags(_profile)
    save(K.profile, _profile)
  }

  // ── Mood / genre detection ────────────────────────────────
  function detectMood(track) {
    const text = `${track.title} ${track.artist}`.toLowerCase()
    const scores = {}
    for (const [mood, words] of Object.entries(MOOD_KEYWORDS)) {
      scores[mood] = words.filter(w => text.includes(w)).length
    }
    // Duration hint: under 3min often energetic/item, over 5min often sufi/classical
    if (track.durSec > 0) {
      if (track.durSec < 180) scores.energetic = (scores.energetic || 0) + 1
      if (track.durSec > 300) scores.chill = (scores.chill || 0) + 1
    }
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])
    return top[0]?.[1] > 0 ? top[0][0] : 'bollywood'
  }

  function detectGenre(track) {
    const text = `${track.title} ${track.artist}`.toLowerCase()
    for (const [genre, words] of Object.entries(GENRE_KEYWORDS)) {
      if (words.some(w => text.includes(w))) return genre
    }
    return 'bollywood'
  }

  function detectEnergy(track) {
    const mood = detectMood(track)
    const highEnergy = ['energetic', 'happy', 'item', 'patriotic']
    const lowEnergy  = ['chill', 'sad', 'devotional', 'sufi']
    if (highEnergy.includes(mood)) return 'high'
    if (lowEnergy.includes(mood)) return 'low'
    return 'medium'
  }

  // ── Derive taste tags from profile ────────────────────────
  function deriveTasteTags(profile) {
    const tags = []
    const topMood  = topKey(profile.topMoods)
    const topGenre = topKey(profile.topGenres)
    const topArtist = topKey(profile.topArtists)

    if (topMood)   tags.push(topMood)
    if (topGenre && topGenre !== topMood) tags.push(topGenre)
    if (topArtist) tags.push(`fan of ${topArtist.split(' ')[0]}`)

    const h = new Date().getHours()
    const hourPlays = profile.hourlyPattern
    const peakHour = hourPlays.indexOf(Math.max(...hourPlays))
    if (peakHour >= 22 || peakHour <= 5)  tags.push('night owl')
    else if (peakHour >= 6 && peakHour <= 9) tags.push('morning listener')
    else if (peakHour >= 12 && peakHour <= 14) tags.push('lunch vibes')

    if (profile.totalMinutes > 120) tags.push('power listener')
    return tags.slice(0, 6)
  }

  function topKey(obj) {
    const entries = Object.entries(obj || {})
    if (!entries.length) return null
    return entries.sort((a, b) => b[1] - a[1])[0][0]
  }

  // ── Track a play event ────────────────────────────────────
  function onPlay(track) {
    _currentTrack = track
    _currentPlayStart = Date.now()

    const p = getProfile()
    const now = new Date()
    const mood  = detectMood(track)
    const genre = detectGenre(track)

    // Artist
    p.topArtists[track.artist] = (p.topArtists[track.artist] || 0) + 1
    // Genre
    p.topGenres[genre] = (p.topGenres[genre] || 0) + 1
    // Mood
    p.topMoods[mood] = (p.topMoods[mood] || 0) + 1
    // Hour / day
    p.hourlyPattern[now.getHours()]++
    p.dayPattern[now.getDay()]++
    // Total plays
    p.totalPlays++
    // Recents
    p.recentMoods = [mood, ...p.recentMoods].slice(0, 20)
    p.recentArtists = [track.artist, ...p.recentArtists.filter(a => a !== track.artist)].slice(0, 20)
    p.recentGenres = [genre, ...p.recentGenres.filter(g => g !== genre)].slice(0, 20)

    saveProfile()

    // Append to play history
    const hist = load(K.history, [])
    hist.unshift({
      videoId: track.videoId,
      title: track.title,
      artist: track.artist,
      mood, genre,
      ts: Date.now(),
      hour: now.getHours(),
      day: now.getDay(),
    })
    save(K.history, hist.slice(0, 500))
  }

  // ── Track a skip event ────────────────────────────────────
  function onSkip(track) {
    if (!track) return
    const elapsed = _currentPlayStart ? (Date.now() - _currentPlayStart) / 1000 : 0
    const p = getProfile()
    // Only count as meaningful skip if played < 20% or under 30s
    const skipFraction = track.durSec > 0 ? elapsed / track.durSec : 0
    if (skipFraction < 0.2 || elapsed < 30) {
      p.skipRate[track.videoId] = (p.skipRate[track.videoId] || 0) + 1
    }
    saveProfile()
    _currentPlayStart = null
  }

  // ── Track a completion event ──────────────────────────────
  function onComplete(track) {
    if (!track) return
    const elapsed = _currentPlayStart ? (Date.now() - _currentPlayStart) / 1000 : 0
    const p = getProfile()
    p.completionRate[track.videoId] = (p.completionRate[track.videoId] || 0) + 1
    p.totalMinutes += elapsed / 60
    saveProfile()
    _currentPlayStart = null
  }

  // ── Smart next-song query ─────────────────────────────────
  function smartNextQuery(currentTrack) {
    const mood  = detectMood(currentTrack)
    const genre = detectGenre(currentTrack)
    const energy = detectEnergy(currentTrack)
    const p = getProfile()

    // Weight: 60% current track mood/feel, 30% user preference, 10% novelty
    const topMood  = topKey(p.topMoods) || mood
    const topArtist = topKey(p.topArtists) || currentTrack.artist

    const strategies = [
      // Same mood, same artist
      `${currentTrack.artist} ${mood} original songs`,
      // Same mood, different top artist
      `${topArtist} ${mood} original songs`,
      // Related genre mood
      `${genre} ${mood} original 2025`,
      // Energy match
      `${energy === 'high' ? 'energetic' : energy === 'low' ? 'relaxing' : ''} hindi original songs`,
    ]

    return strategies[Math.floor(Math.random() * 2)]  // pick from top 2 for variety
  }

  // ── Personalized home section queries ────────────────────
  function personalizedSections() {
    const p = getProfile()
    const h = new Date().getHours()
    const topMood  = topKey(p.topMoods)
    const topGenre = topKey(p.topGenres)
    const topArtist = topKey(p.topArtists)
    const recentMood = p.recentMoods[0]

    // Time-based defaults
    let timeQuery = 'trending hindi original 2025'
    if (h >= 6 && h <= 9)   timeQuery = 'morning fresh hindi original songs'
    if (h >= 12 && h <= 14) timeQuery = 'hindi hits original afternoon'
    if (h >= 18 && h <= 22) timeQuery = 'hindi evening relaxing original songs'
    if (h >= 22 || h <= 4)  timeQuery = 'hindi lofi night chill original'

    const sections = [
      { id: 'row-foryou',   label: '✨ Made For You',    q: topArtist ? `${topArtist} similar songs original` : timeQuery },
      { id: 'row-mood',     label: `🎭 ${capitalize(recentMood || topMood || 'Trending')} Mood`, q: `${recentMood || topMood || 'trending'} hindi original songs 2025` },
      { id: 'row-topartist',label: `🎤 More ${topArtist ? topArtist.split(' ')[0] : 'Arijit Singh'}`, q: topArtist ? `${topArtist} original songs` : 'arijit singh original songs' },
      { id: 'row-topgenre', label: `🎵 Your ${capitalize(topGenre || 'Bollywood')}`, q: `${topGenre || 'bollywood'} original songs 2025` },
      { id: 'row-timebased',label: timeLabel(h), q: timeQuery },
    ]
    return sections
  }

  function timeLabel(h) {
    if (h >= 6 && h <= 9)   return '🌅 Good Morning Picks'
    if (h >= 10 && h <= 11) return '☕ Mid-Morning Vibes'
    if (h >= 12 && h <= 14) return '🌞 Afternoon Energy'
    if (h >= 15 && h <= 17) return '🌤️ Evening Warmup'
    if (h >= 18 && h <= 21) return '🌆 Evening Chill'
    return '🌙 Late Night Vibes'
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  }

  // ── Claude AI Integration (optional) ─────────────────────
  function getClaudeKey() {
    return localStorage.getItem(K.apiKey) || ''
  }
  function setClaudeKey(key) {
    localStorage.setItem(K.apiKey, key.trim())
  }

  async function claudeRecommend(currentTrack, profile) {
    const key = getClaudeKey()
    if (!key) return null

    const topArtists = Object.entries(profile.topArtists || {})
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a]) => a)
    const topMoods = Object.entries(profile.topMoods || {})
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m)
    const recentTitles = (load(K.history, []))
      .slice(0, 8).map(h => `"${h.title}" by ${h.artist}`)

    const prompt = `You are a music recommendation AI for an Indian music app. 
Based on the user's listening data, suggest 3 YouTube search queries to find similar songs.

Currently playing: "${currentTrack.title}" by ${currentTrack.artist}
User's top artists: ${topArtists.join(', ') || 'unknown'}
User's preferred moods: ${topMoods.join(', ') || 'unknown'}  
Recently played: ${recentTitles.join(', ') || 'none'}
Time of day: ${new Date().getHours()}:00

Rules for search queries:
- Each query must be in English
- Include "original" to avoid covers
- Include year (2024 or 2025) for freshness
- Keep it under 8 words each
- Focus on Hindi/Bollywood/Punjabi music

Reply with ONLY a JSON array of 3 strings, nothing else.
Example: ["arijit singh romantic songs 2025 original","vishal mishra love songs original","new hindi sad songs 2025 original"]`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\[[\s\S]*?\]/)
      if (match) {
        const queries = JSON.parse(match[0])
        return Array.isArray(queries) ? queries : null
      }
    } catch (e) {
      console.warn('Claude API error:', e.message)
    }
    return null
  }

  // ── Full AI analysis — called on demand ───────────────────
  async function claudeAnalyzeProfile() {
    const key = getClaudeKey()
    if (!key) return null
    const p = getProfile()
    const hist = load(K.history, []).slice(0, 30)

    const prompt = `Analyze this music listener's profile and give personalized insights.

Profile data:
- Total plays: ${p.totalPlays}
- Total minutes: ${Math.round(p.totalMinutes)}
- Top artists: ${JSON.stringify(Object.entries(p.topArtists || {}).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([a,c])=>({artist:a,plays:c})))}
- Top moods: ${JSON.stringify(p.topMoods || {})}
- Top genres: ${JSON.stringify(p.topGenres || {})}
- Peak listening hour: ${(p.hourlyPattern||[]).indexOf(Math.max(...(p.hourlyPattern||[0])))}:00
- Recent history (last 10): ${hist.slice(0,10).map(h=>`${h.title} by ${h.artist}`).join(', ')}

Give a warm, personal 3-4 sentence analysis of their music taste.
Then give 5 personalized search query recommendations as a JSON array.

Format your response as:
ANALYSIS: [your analysis here]
QUERIES: ["query1","query2","query3","query4","query5"]`

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const analysisMatch = text.match(/ANALYSIS:\s*([\s\S]*?)(?=QUERIES:|$)/)
      const queriesMatch  = text.match(/QUERIES:\s*(\[[\s\S]*?\])/)
      return {
        analysis: analysisMatch?.[1]?.trim() || '',
        queries:  queriesMatch ? JSON.parse(queriesMatch[1]) : [],
      }
    } catch (e) {
      console.warn('Claude analyze error:', e.message)
      return null
    }
  }

  // ── Stats summary for UI ──────────────────────────────────
  function getSummary() {
    const p = getProfile()
    const topArtist  = topKey(p.topArtists)
    const topMood    = topKey(p.topMoods)
    const topGenre   = topKey(p.topGenres)
    const hrs = Math.floor(p.totalMinutes / 60)
    const mins = Math.round(p.totalMinutes % 60)

    return {
      totalPlays: p.totalPlays,
      totalTime: hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`,
      topArtist,
      topMood,
      topGenre,
      tasteTags: p.tasteTags || [],
      topArtists: Object.entries(p.topArtists || {}).sort((a,b)=>b[1]-a[1]).slice(0,5),
      topMoods:   Object.entries(p.topMoods || {}).sort((a,b)=>b[1]-a[1]).slice(0,5),
    }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    onPlay,
    onSkip,
    onComplete,
    smartNextQuery,
    personalizedSections,
    detectMood,
    detectGenre,
    detectEnergy,
    getProfile,
    getSummary,
    getClaudeKey,
    setClaudeKey,
    claudeRecommend,
    claudeAnalyzeProfile,
    topKey,
    capitalize,
  }
})()
