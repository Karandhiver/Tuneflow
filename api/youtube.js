// ═══════════════════════════════════════════════════════════════════
// TuneFlow Search API — YouTube InnerTube (unlimited, free, no key)
// InnerTube = YouTube's own internal API used by youtube.com itself
// No API key. No quota. No cost. Works forever.
// Official YT API used only as fallback if env keys are present.
// ═══════════════════════════════════════════════════════════════════

const INNERTUBE_ENDPOINT = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

const CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.05.00',
    hl: 'en',
    gl: 'IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36,gzip(gfe)',
    clientFormFactor: 'UNKNOWN_FORM_FACTOR',
    browserName: 'Chrome',
    browserVersion: '122.0.0.0',
  },
};

// Server-side cache — avoids repeat calls for same query
const CACHE = new Map();
const TTL = 5 * 60 * 60 * 1000; // 5 hours

// Song pools — random pick every reload = fresh songs each time
const POOLS = {
  trending:   ['Top Bollywood songs 2025','New Hindi hits June 2025','Popular Hindi songs 2025','Bollywood chart toppers 2025','Trending Hindi songs 2025'],
  hindi:      ['Best Hindi film songs 2025','Bollywood superhits 2025','Latest Hindi songs 2025','Hindi film hits 2025','Popular Bollywood film 2025'],
  punjabi:    ['Punjabi hits 2025','Diljit Dosanjh new songs','AP Dhillon songs 2025','Shubh Punjabi 2025','Punjabi chart songs 2025'],
  bhojpuri:   ['Bhojpuri superhits 2025','Pawan Singh songs 2025','Khesari Lal Yadav songs','New Bhojpuri songs 2025','Bhojpuri hit songs'],
  gujarati:   ['Gujarati garba songs 2025','New Gujarati songs 2025','Gujarati folk music','Gujarati film songs popular','Garba navratri 2025'],
  indie:      ['Hindi indie songs 2025','Indian independent artists music','Non-film Hindi indie songs','Underground Hindi songs 2025','Indie Bollywood 2025'],
  chill:      ['Chill Hindi songs 2025','Soft Bollywood acoustic','Lofi Hindi beats relax','Relaxing Hindi music','Easy listening Hindi songs'],
  party:      ['Party songs Hindi 2025','Dance Bollywood hits 2025','DJ Hindi remix songs','Bollywood club songs','Badshah party songs 2025'],
  sad:        ['Sad Hindi songs 2025','Heartbreak Bollywood songs','Emotional Arijit Singh songs','Sad love songs Hindi','Breakup songs Hindi 2025'],
  romantic:   ['Romantic Hindi songs 2025','Love songs Bollywood 2025','Arijit Singh romantic songs','Bollywood love songs','Romantic Bollywood 2025'],
  english:    ['Top English songs 2025','Pop hits 2025','Billboard chart songs 2025','Popular English music 2025','English hits June 2025'],
  devotional: ['Bhakti songs 2025','Hanuman Chalisa 2025','Morning aarti songs','Shiv bhajan popular','Ganesh bhajan 2025'],
  retro:      ['90s Hindi songs classic','Kumar Sanu old hits','Udit Narayan songs classic','Old is gold Bollywood','Classic Hindi film songs 90s'],
  workout:    ['Gym workout Hindi songs','Energetic Bollywood motivation','Power songs Hindi 2025','Running songs Hindi','High energy Bollywood'],
};

const CHANNEL_QUERIES = {
  ankitagrawal: 'Ankit Agrawal Study IQ current affairs 2025',
  studyiq:      'Study IQ Education current affairs news analysis',
  rajshamani:   'Raj Shamani podcast business entrepreneurship',
  nikhilkamath: 'Nikhil Kamath WTF podcast conversations',
  beerbiceps:   'BeerBiceps Ranveer Allahbadia podcast',
  joshtalks:    'Josh Talks Hindi inspiration motivation',
  aajtak:       'Aaj Tak Hindi news today latest',
  thinkschool:  'Think School business case study',
  zeenews:      'Zee News Hindi news',
  bbchindi:     'BBC Hindi news report',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'search', channel = '', maxResults = 15 } = req.query;
  const max = Math.min(parseInt(maxResults) || 15, 20);

  // Resolve query
  let query = '';
  let isChannel = false;

  if (type === 'channel' && channel) {
    query = CHANNEL_QUERIES[channel] || channel;
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

  // Cache check
  const cacheKey = `${query}::${max}`;
  const hit = CACHE.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    return res.status(200).json(hit.data);
  }

  // Try InnerTube first (free, unlimited)
  let songs = await innertubeSearch(query, max, isChannel);

  // Fallback to official API if available and InnerTube failed
  if (!songs.length) {
    const apiKeys = [
      process.env.YOUTUBE_API_KEY_1,
      process.env.YOUTUBE_API_KEY_2,
      process.env.YOUTUBE_API_KEY_3,
      process.env.YOUTUBE_API_KEY,
    ].filter(Boolean);

    for (const key of apiKeys) {
      songs = await officialAPISearch(query, max, isChannel, key);
      if (songs.length) break;
    }
  }

  if (songs.length) {
    CACHE.set(cacheKey, { data: songs, ts: Date.now() });
    if (CACHE.size > 400) CACHE.delete(CACHE.keys().next().value);
  }

  return res.status(200).json(songs);
}

// ─── InnerTube Search ───────────────────────────────────────────
async function innertubeSearch(query, max, isChannel) {
  try {
    const body = {
      context: CONTEXT,
      query,
      // EgIQAQ== = video type filter
      params: isChannel ? undefined : 'EgIQAQ%3D%3D',
    };

    const r = await fetch(INNERTUBE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240101.05.00',
        'Origin': 'https://www.youtube.com',
        'Referer': `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) {
      console.error('InnerTube status:', r.status);
      return [];
    }

    const data = await r.json();
    return parseResults(data, max, isChannel);
  } catch (e) {
    console.error('InnerTube error:', e.message);
    return [];
  }
}

function parseResults(data, max, isChannel) {
  const videos = [];

  try {
    const sections =
      data?.contents?.twoColumnSearchResultsRenderer
          ?.primaryContents?.sectionListRenderer?.contents ?? [];

    for (const section of sections) {
      const items = section?.itemSectionRenderer?.contents ?? [];
      for (const item of items) {
        const v = item?.videoRenderer ?? item?.videoWithContextRenderer;
        if (!v) continue;

        const vid = v.videoId;
        if (!vid || vid.length < 5) continue;

        const title = getText(v.title) || getText(v.headline);
        if (!title) continue;

        const artist = getText(v.ownerText || v.shortBylineText)
          .replace(/ - Topic$/i, '')
          .replace(/VEVO$/i, '')
          .replace(/Official$/i, '')
          .trim();

        const durText = v.lengthText?.simpleText || '';
        const durSecs = parseDurText(durText);

        // Skip shorts (< 90s) and very long videos (> 15 min) for music
        if (!isChannel && (durSecs > 0 && durSecs < 90)) continue;
        if (!isChannel && durSecs > 900) continue;

        const thumbs = v.thumbnail?.thumbnails ?? [];
        const thumb = thumbs.find(t => t.width >= 320)?.url
          || thumbs[thumbs.length - 1]?.url
          || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

        videos.push({
          videoId: vid,
          title: clean(decode(title)),
          artist: decode(artist) || 'Unknown Artist',
          thumbnail: thumb,
          duration: durText || '3:30',
          durationSecs: durSecs,
          isChannel,
        });

        if (videos.length >= max) return videos;
      }
    }
  } catch (e) {
    console.error('Parse error:', e.message);
  }

  return videos;
}

function getText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (node.simpleText) return node.simpleText;
  if (node.runs) return node.runs.map(r => r.text || '').join('');
  return '';
}

// ─── Official API fallback ───────────────────────────────────────
async function officialAPISearch(query, max, isChannel, KEY) {
  try {
    const p = new URLSearchParams({ part: 'snippet', q: query, type: 'video', maxResults: String(max), regionCode: 'IN', key: KEY });
    if (!isChannel) { p.set('videoCategoryId', '10'); p.set('videoDuration', 'medium'); }
    const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`);
    const sd = await sr.json();
    if (sd.error || !sd.items?.length) return [];
    const ids = sd.items.map(i => i.id.videoId).join(',');
    const dr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`);
    const dd = await dr.json();
    const dm = {};
    (dd.items || []).forEach(v => { dm[v.id] = { d: parseDurISO(v.contentDetails.duration), s: parseDurISOSecs(v.contentDetails.duration) }; });
    return sd.items.map(i => ({
      videoId: i.id.videoId,
      title: clean(decode(i.snippet.title)),
      artist: decode(i.snippet.channelTitle.replace(/ - Topic$/i,'').replace(/VEVO$/i,'').trim()),
      thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.medium?.url || '',
      duration: dm[i.id.videoId]?.d || '3:30',
      durationSecs: dm[i.id.videoId]?.s || 210,
      isChannel,
    })).filter(s => isChannel ? true : (s.durationSecs >= 90 && s.durationSecs <= 900));
  } catch { return []; }
}

// ─── Utils ──────────────────────────────────────────────────────
function parseDurText(t) {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  if (parts.length === 3) return parts[0]*3600 + parts[1]*60 + parts[2];
  if (parts.length === 2) return parts[0]*60 + parts[1];
  return 0;
}
function parseDurISO(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '3:30';
  const h=+m[1]||0,mn=+m[2]||0,s=+m[3]||0,p=n=>String(n).padStart(2,'0');
  return h?`${h}:${p(mn)}:${p(s)}`:`${mn}:${p(s)}`;
}
function parseDurISOSecs(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+m[1]||0)*3600 + (+m[2]||0)*60 + (+m[3]||0) : 210;
}
function decode(s) {
  return (s||'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}
function clean(t) {
  return t.replace(/\(Official[^)]*\)/gi,'').replace(/\[Official[^)]*\]/gi,'')
    .replace(/\(Audio[^)]*\)/gi,'').replace(/\[Audio[^)]*\]/gi,'')
    .replace(/\(Lyric[^)]*\)/gi,'').replace(/\[Lyric[^)]*\]/gi,'')
    .replace(/\(Full[^)]*\)/gi,'').replace(/\|.*$/,'')
    .replace(/\s{2,}/g,' ').trim();
}
