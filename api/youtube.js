// TuneFlow YouTube API — Multiple fallback strategies
// 1. InnerTube (YouTube's own API, no key needed)
// 2. YouTube Data API v3 (official, uses key if set)

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

const CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.09.00',
    hl: 'en', gl: 'IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  },
};

// Server-side cache — reduces API calls significantly
const CACHE = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

const POOLS = {
  trending:   ['Top Bollywood songs 2025','New Hindi hits 2025','Popular Hindi songs 2025','Hindi trending 2025'],
  hindi:      ['Best Hindi film songs 2025','Bollywood superhits 2025','Latest Hindi songs 2025','New Bollywood 2025'],
  punjabi:    ['New Punjabi song 2025','Diljit Dosanjh 2025','AP Dhillon songs 2025','Punjabi hits 2025'],
  bhojpuri:   ['Bhojpuri hit song 2025','Pawan Singh new song','Khesari Lal 2025','New Bhojpuri 2025'],
  gujarati:   ['Gujarati garba 2025','New Gujarati songs 2025','Gujarati folk music','Gujarati film songs 2025'],
  indie:      ['Hindi indie songs 2025','Indian independent music','Non-film Hindi songs','Underground Hindi 2025'],
  chill:      ['Chill Hindi songs 2025','Soft Bollywood acoustic','Lofi Hindi beats','Relaxing Hindi music'],
  party:      ['Party songs Hindi 2025','Dance Bollywood hits','DJ Hindi songs 2025','Club Bollywood'],
  sad:        ['Sad Hindi songs 2025','Heartbreak Bollywood','Emotional Hindi songs','Arijit Singh sad 2025'],
  romantic:   ['Romantic Hindi songs 2025','Love songs Bollywood','Arijit Singh romantic','Bollywood love songs'],
  english:    ['Top English songs 2025','Pop hits 2025','Billboard chart 2025','English trending songs'],
  devotional: ['Bhakti songs 2025','Hanuman Chalisa 2025','Morning aarti songs','Shiv bhajan 2025'],
  retro:      ['90s Hindi songs classic','Kumar Sanu hits','Udit Narayan songs','Old Bollywood songs'],
  workout:    ['Gym workout Hindi songs','Energetic Bollywood 2025','High energy Hindi','Workout motivation Hindi'],
  haryanvi:   ['New Haryanvi song 2025','Renuka Panwar 2025','Popular Haryanvi songs','Haryanvi hits 2025'],
  search:     [],
};

const CHANNELS = {
  ankitagrawal: 'Ankit Agrawal Study IQ current affairs 2025',
  studyiq:      'Study IQ Education current affairs analysis 2025',
  rajshamani:   'Raj Shamani podcast latest episode',
  nikhilkamath: 'Nikhil Kamath WTF podcast',
  beerbiceps:   'BeerBiceps Ranveer Allahbadia podcast',
};

// Minimal block list — only truly non-music content
const BLOCK_EXACT = ['full movie','web series','full episode','complete series','full drama'];

function isBlocked(title) {
  if (!title) return true;
  const t = title.toLowerCase();
  return BLOCK_EXACT.some(w => t.includes(w));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'search', channel = '', maxResults = 15 } = req.query;
  const max = Math.min(parseInt(maxResults) || 15, 20);

  // Build query
  let query = '';
  let isChannel = false;

  const tab = req.query.tab || 'videos';
  if (type === 'channel' && channel) {
    if (tab === 'shorts') {
      query = (CHANNELS[channel] || channel) + ' shorts';
    } else {
      query = CHANNELS[channel] || channel;
    }
    isChannel = true;
  } else if (type === 'search' && q) {
    query = q;
  } else if (POOLS[type]) {
    const pool = POOLS[type];
    query = pool[Math.floor(Math.random() * pool.length)];
  } else {
    return res.status(200).json([]);
  }

  if (!query) return res.status(200).json([]);

  // Check cache
  const cacheKey = `${type}:${query}:${max}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  // Try InnerTube first
  let songs = [];
  try {
    songs = await searchInnerTube(query, max, isChannel);
  } catch(e) {
    console.error('InnerTube failed:', e.message);
  }

  // Fallback to YouTube Data API
  if (!songs.length) {
    const keys = [
      process.env.YOUTUBE_API_KEY_1,
      process.env.YOUTUBE_API_KEY_2,
      process.env.YOUTUBE_API_KEY_3,
      process.env.YOUTUBE_API_KEY,
    ].filter(Boolean);

    for (const key of keys) {
      try {
        songs = await searchYouTubeAPI(query, max, isChannel, key);
        if (songs.length) break;
      } catch(e) {
        console.error('YT API failed:', e.message);
      }
    }
  }

  // Cache and return
  if (songs.length) {
    CACHE.set(cacheKey, { data: songs, ts: Date.now() });
    if (CACHE.size > 500) CACHE.delete(CACHE.keys().next().value);
  }

  console.log(`[${type}] query="${query}" → ${songs.length} results`);
  return res.status(200).json(songs);
}

// ─── InnerTube ────────────────────────────────────────────────
async function searchInnerTube(query, max, isChannel) {
  const r = await fetch(INNERTUBE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': '2.20240101.09.00',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      context: CONTEXT,
      query,
      params: isChannel ? undefined : 'EgIQAQ%3D%3D', // video filter
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!r.ok) throw new Error(`InnerTube HTTP ${r.status}`);
  const data = await r.json();
  return parseInnerTube(data, max, isChannel);
}

function parseInnerTube(data, max, isChannel) {
  const results = [];
  try {
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer
          ?.primaryContents?.sectionListRenderer?.contents ?? [];

    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents ?? [];
      for (const item of items) {
        const v = item?.videoRenderer;
        if (!v?.videoId) continue;

        const title = getT(v.title);
        if (!title || isBlocked(title)) continue;

        const durText = v.lengthText?.simpleText || '';
        const durSecs = parseDurStr(durText);

        if (!isChannel) {
          if (durSecs > 0 && durSecs < 60) continue;  // skip very short
          if (durSecs > 1200) continue; // skip very long (>20min)
        }

        const thumbs = v.thumbnail?.thumbnails ?? [];
        const thumb = thumbs.find(t => t.width >= 320)?.url
          || thumbs.at(-1)?.url
          || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

        const artist = getT(v.ownerText || v.shortBylineText)
          .replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim();

        results.push({
          videoId: v.videoId,
          title: clean(decode(title)),
          artist: decode(artist) || 'Unknown',
          thumbnail: thumb,
          duration: durText || '3:30',
          durationSecs: durSecs,
          isChannel,
        });

        if (results.length >= max) return results;
      }
    }
  } catch (e) { console.error('parseInnerTube:', e.message); }
  return results;
}

function getT(node) {
  if (!node) return '';
  if (node.simpleText) return node.simpleText;
  if (node.runs) return node.runs.map(r => r.text || '').join('');
  return '';
}

// ─── YouTube Data API ─────────────────────────────────────────
async function searchYouTubeAPI(query, max, isChannel, KEY) {
  const p = new URLSearchParams({
    part: 'snippet', q: query, type: 'video',
    maxResults: String(max), regionCode: 'IN', key: KEY,
  });
  if (!isChannel) {
    p.set('videoCategoryId', '10');
    p.set('videoDuration', 'medium');
  }

  const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`,
    { signal: AbortSignal.timeout(8000) });
  const sd = await sr.json();
  if (sd.error) throw new Error(`YT API: ${sd.error.message}`);
  if (!sd.items?.length) return [];

  // Get durations
  const ids = sd.items.map(i => i.id.videoId).join(',');
  const dr = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`);
  const dd = await dr.json();
  const dm = {};
  (dd.items || []).forEach(v => {
    dm[v.id] = {
      dur: parseDurISO(v.contentDetails.duration),
      secs: parseDurISOSecs(v.contentDetails.duration),
    };
  });

  return sd.items
    .filter(i => !isBlocked(i.snippet.title))
    .map(i => ({
      videoId: i.id.videoId,
      title: clean(decode(i.snippet.title)),
      artist: decode(i.snippet.channelTitle
        .replace(/ - Topic$/i, '').replace(/VEVO$/i, '').trim()),
      thumbnail: i.snippet.thumbnails.high?.url
        || i.snippet.thumbnails.medium?.url || '',
      duration: dm[i.id.videoId]?.dur || '3:30',
      durationSecs: dm[i.id.videoId]?.secs || 210,
      isChannel,
    }))
    .filter(s => isChannel || (s.durationSecs >= 60 && s.durationSecs <= 1200));
}

// ─── Utils ────────────────────────────────────────────────────
function parseDurStr(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
  if (p.length === 2) return p[0]*60 + p[1];
  return 0;
}
function parseDurISO(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '3:30';
  const h=+m[1]||0,mn=+m[2]||0,s=+m[3]||0,p=n=>String(n).padStart(2,'0');
  return h ? `${h}:${p(mn)}:${p(s)}` : `${mn}:${p(s)}`;
}
function parseDurISOSecs(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+m[1]||0)*3600 + (+m[2]||0)*60 + (+m[3]||0) : 210;
}
function decode(s) {
  return (s||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<')
    .replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}
function clean(t) {
  return t
    .replace(/\(Official[^)]*\)/gi,'').replace(/\[Official[^)]*\]/gi,'')
    .replace(/\(Audio[^)]*\)/gi,'').replace(/\[Audio[^)]*\]/gi,'')
    .replace(/\(Lyric[^)]*\)/gi,'').replace(/\[Lyric[^)]*\]/gi,'')
    .replace(/\(Full Video[^)]*\)/gi,'').replace(/\|.*$/,'')
    .replace(/\s{2,}/g,' ').trim();
}
