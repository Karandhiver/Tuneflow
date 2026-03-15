// ═══════════════════════════════════════════════════════════════
// TuneFlow — InnerTube API (free, unlimited, no key needed)
// Strict music filtering — no reviews, no reactions, no compilations
// ═══════════════════════════════════════════════════════════════

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

const CONTEXT = {
  client: {
    clientName: 'WEB',
    clientVersion: '2.20240101.05.00',
    hl: 'en', gl: 'IN',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36,gzip(gfe)',
    clientFormFactor: 'UNKNOWN_FORM_FACTOR',
    browserName: 'Chrome', browserVersion: '122.0.0.0',
  },
};

const CACHE = new Map();
const TTL = 4 * 60 * 60 * 1000;

// Blocked words — filter out non-music content
const BLOCK = [
  'review', 'reaction', 'react to', 'top 10', 'top 5', 'top 100',
  'compilation', 'all songs', 'jukebox', 'mashup playlist', 'best of playlist',
  'interview', 'behind the scenes', 'making of', 'trailer', 'teaser',
  'vlog', 'comedy', 'roast', 'podcast episode', 'news', 'current affairs',
  'episode ', ' ep.', ' ep ', 'season ', 'series ', 'documentary',
  'full movie', 'short film', 'web series',
];

// Only music section query pools
const POOLS = {
  trending:   ['Top Bollywood songs 2025 official','New Hindi music video 2025','Popular Bollywood song 2025','Hindi hit song 2025 official audio'],
  hindi:      ['Best Hindi songs 2025 official','Bollywood new song 2025','Latest Hindi film song 2025','New Hindi song 2025'],
  punjabi:    ['New Punjabi song 2025 official','Diljit Dosanjh new song 2025','AP Dhillon latest song','Shubh new Punjabi song 2025'],
  bhojpuri:   ['New Bhojpuri song 2025 official','Pawan Singh new song 2025','Khesari Lal new song 2025','Bhojpuri hit song 2025'],
  gujarati:   ['New Gujarati song 2025 official','Gujarati garba song 2025','Gujarati folk song new','Gujarati film song 2025'],
  indie:      ['Hindi indie song 2025 official','Independent Hindi artist song','Non-film Hindi song 2025','Indie Hindi music 2025 official audio'],
  chill:      ['Chill Hindi song 2025 official','Soft Bollywood song acoustic','Lofi Hindi song official','Relaxing Hindi music 2025'],
  party:      ['Party Hindi song 2025 official','Dance Bollywood song 2025','DJ Hindi song 2025 official','Bollywood party song 2025'],
  sad:        ['Sad Hindi song 2025 official','Heartbreak Hindi song 2025','Emotional Bollywood song 2025','Arijit Singh new sad song 2025'],
  romantic:   ['Romantic Hindi song 2025 official','Love song Bollywood 2025','Arijit Singh romantic song 2025','Hindi love song new 2025'],
  english:    ['Top English pop song 2025 official','New English hit song 2025','Billboard song 2025 official audio','Popular English song 2025'],
  devotional: ['Bhakti song 2025 official','Hanuman Chalisa new version 2025','Shiv bhajan official 2025','Morning aarti song 2025'],
  retro:      ['90s Hindi classic song official','Kumar Sanu old Hindi song','Udit Narayan classic Bollywood','Old is gold Hindi song 90s official'],
  workout:    ['Gym workout Hindi song 2025','Energetic Bollywood song 2025 official','High energy Hindi song 2025','Workout motivation Hindi song'],
};

const CHANNEL_QUERIES = {
  ankitagrawal: 'Ankit Agrawal Study IQ current affairs 2025',
  studyiq:      'Study IQ Education current affairs today',
  rajshamani:   'Raj Shamani podcast new episode',
  nikhilkamath: 'Nikhil Kamath WTF Is Up podcast',
  beerbiceps:   'BeerBiceps Ranveer Allahbadia podcast',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'search', channel = '', maxResults = 15 } = req.query;
  const max = Math.min(parseInt(maxResults) || 15, 20);

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

  const cacheKey = `${query}::${max}`;
  const hit = CACHE.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL) {
    return res.status(200).json(hit.data);
  }

  let songs = await innertubeSearch(query, max, isChannel);

  // Fallback to official API
  if (!songs.length) {
    const apiKeys = [
      process.env.YOUTUBE_API_KEY_1, process.env.YOUTUBE_API_KEY_2,
      process.env.YOUTUBE_API_KEY_3, process.env.YOUTUBE_API_KEY,
    ].filter(Boolean);
    for (const key of apiKeys) {
      songs = await officialSearch(query, max, isChannel, key);
      if (songs.length) break;
    }
  }

  if (songs.length) {
    CACHE.set(cacheKey, { data: songs, ts: Date.now() });
    if (CACHE.size > 400) CACHE.delete(CACHE.keys().next().value);
  }

  return res.status(200).json(songs);
}

function isBlocked(title) {
  const t = title.toLowerCase();
  return BLOCK.some(w => t.includes(w));
}

async function innertubeSearch(query, max, isChannel) {
  try {
    const body = {
      context: CONTEXT, query,
      params: isChannel ? undefined : 'EgIQAQ%3D%3D',
    };
    const r = await fetch(INNERTUBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-YouTube-Client-Name': '1',
        'X-YouTube-Client-Version': '2.20240101.05.00',
        'Origin': 'https://www.youtube.com',
        'Referer': `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-IN,en;q=0.9',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return parseResults(data, max, isChannel);
  } catch (e) {
    console.error('InnerTube:', e.message);
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
        if (!v?.videoId || v.videoId.length < 5) continue;

        const title = getText(v.title) || getText(v.headline);
        if (!title) continue;

        // Block non-music content
        if (!isChannel && isBlocked(title)) continue;

        const artist = getText(v.ownerText || v.shortBylineText)
          .replace(/ - Topic$/i,'').replace(/VEVO$/i,'').replace(/Official$/i,'').trim();

        const durText = v.lengthText?.simpleText || '';
        const durSecs = parseDurText(durText);

        // Skip shorts < 90s and very long > 15min for music
        if (!isChannel && durSecs > 0 && durSecs < 90) continue;
        if (!isChannel && durSecs > 900) continue;

        const thumbs = v.thumbnail?.thumbnails ?? [];
        const thumb = thumbs.find(t => t.width >= 320)?.url
          || thumbs[thumbs.length - 1]?.url
          || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

        videos.push({
          videoId: v.videoId,
          title: clean(decode(title)),
          artist: decode(artist) || 'Unknown',
          thumbnail: thumb,
          duration: durText || '3:30',
          durationSecs: durSecs,
          isChannel,
        });

        if (videos.length >= max) return videos;
      }
    }
  } catch (e) { console.error('Parse:', e.message); }
  return videos;
}

function getText(node) {
  if (!node) return '';
  if (node.simpleText) return node.simpleText;
  if (node.runs) return node.runs.map(r => r.text || '').join('');
  return '';
}

async function officialSearch(query, max, isChannel, KEY) {
  try {
    const p = new URLSearchParams({
      part:'snippet', q:query, type:'video',
      maxResults:String(max), regionCode:'IN', key:KEY,
    });
    if (!isChannel) { p.set('videoCategoryId','10'); p.set('videoDuration','medium'); }
    const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`);
    const sd = await sr.json();
    if (sd.error || !sd.items?.length) return [];
    const ids = sd.items.map(i => i.id.videoId).join(',');
    const dr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`);
    const dd = await dr.json();
    const dm = {};
    (dd.items||[]).forEach(v=>{dm[v.id]={d:parseDurISO(v.contentDetails.duration),s:parseSecs(v.contentDetails.duration)};});
    return sd.items
      .filter(i => !isChannel && !isBlocked(i.snippet.title) || isChannel)
      .map(i => ({
        videoId: i.id.videoId,
        title: clean(decode(i.snippet.title)),
        artist: decode(i.snippet.channelTitle.replace(/ - Topic$/i,'').replace(/VEVO$/i,'').trim()),
        thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.medium?.url || '',
        duration: dm[i.id.videoId]?.d || '3:30',
        durationSecs: dm[i.id.videoId]?.s || 210,
        isChannel,
      }))
      .filter(s => isChannel ? true : (s.durationSecs >= 90 && s.durationSecs <= 900));
  } catch { return []; }
}

function parseDurText(t) {
  if (!t) return 0;
  const p = t.split(':').map(Number);
  if (p.length === 3) return p[0]*3600+p[1]*60+p[2];
  if (p.length === 2) return p[0]*60+p[1];
  return 0;
}
function parseDurISO(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '3:30';
  const h=+m[1]||0,mn=+m[2]||0,s=+m[3]||0,p=n=>String(n).padStart(2,'0');
  return h?`${h}:${p(mn)}:${p(s)}`:`${mn}:${p(s)}`;
}
function parseSecs(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m?(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0):210;
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
