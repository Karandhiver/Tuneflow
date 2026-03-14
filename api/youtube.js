export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // No cache - fresh results every request
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'search', maxResults = 15, channel = '' } = req.query;
  const KEY = process.env.YOUTUBE_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'Not configured' });

  // Each pool has many queries - pick randomly so every reload is fresh
  const POOLS = {
    trending:   ['Top Bollywood songs 2025','Hindi chart hits June 2025','New Bollywood 2025 latest','Popular Hindi songs this week'],
    hindi:      ['Best Hindi songs 2025','Bollywood superhits 2025','Latest Hindi film songs','Popular Bollywood 2025'],
    punjabi:    ['Punjabi hits 2025 Diljit','New Punjabi songs AP Dhillon','Shubh Punjabi 2025','Punjabi chart toppers 2025'],
    bhojpuri:   ['Bhojpuri superhits 2025','Pawan Singh new songs','Khesari Lal Yadav songs','New Bhojpuri 2025'],
    chill:      ['Chill Hindi lofi songs','Soft Bollywood acoustic 2025','Evening Hindi songs relaxing','Hindi café music'],
    party:      ['Party songs Hindi 2025','Dance Bollywood hits remix','Badshah party anthem 2025','DJ Hindi songs night'],
    sad:        ['Sad Hindi songs 2025 crying','Heartbreak Bollywood arijit','Emotional Hindi songs tears','Sad love songs Bollywood'],
    romantic:   ['Romantic Hindi songs 2025','Love songs Bollywood new','Arijit Singh romantic 2025','Valentine Bollywood songs'],
    english:    ['Top English pop songs 2025','Billboard hits June 2025','New English chart songs','Popular English songs 2025'],
    devotional: ['Morning bhakti songs 2025','Ganesh aarti songs','Hanuman Chalisa 2025','Shiva bhajan popular'],
    retro:      ['90s Hindi classic songs','Kumar Sanu Udit Narayan hits','Old Bollywood gold songs','Lata Rafi timeless songs'],
    workout:    ['Gym workout Hindi songs pump','Energetic Bollywood beats run','Power songs Hindi motivation','High energy Hindi 2025'],
    search:     [],
  };

  // Podcast/Channel queries
  const CHANNELS = {
    studyiq:    'Study IQ Education',
    ranveer:    'The Ranveer Show podcast',
    beerbiceps: 'BeerBiceps podcast Ranveer Allahbadia',
    nikhilkamath:'Nikhil Kamath podcast',
    joshtalks:  'Josh Talks Hindi motivational',
    aajtak:     'Aaj Tak news podcast',
    ndtv:       'NDTV India news',
    bbchindi:   'BBC Hindi news podcast',
    finshots:   'Finshots financial news',
    wap:        'What A Podcast India',
  };

  try {
    let queryStr = q || '';
    let isChannel = false;

    if (type === 'channel' && channel) {
      queryStr = CHANNELS[channel] || channel;
      isChannel = true;
    } else if (type !== 'search') {
      const pool = POOLS[type] || POOLS.trending;
      queryStr = pool[Math.floor(Math.random() * pool.length)];
    }

    if (!queryStr) return res.status(400).json({ error: 'No query' });

    const dur = isChannel ? '' : '&videoDuration=medium';
    const cat = isChannel ? '' : '&videoCategoryId=10';
    const max = isChannel ? 20 : (parseInt(maxResults) || 15);

    const sr = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(queryStr)}&type=video${cat}${dur}&maxResults=${max}&regionCode=IN&key=${KEY}`
    );
    const sd = await sr.json();
    if (sd.error) return res.status(200).json([]);
    if (!sd.items?.length) return res.status(200).json([]);

    const ids = sd.items.map(i => i.id.videoId).join(',');
    const dr = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`
    );
    const dd = await dr.json();
    const dm = {};
    (dd.items || []).forEach(v => {
      dm[v.id] = { dur: parseDur(v.contentDetails.duration), secs: parseSecs(v.contentDetails.duration) };
    });

    const songs = sd.items
      .map(i => ({
        videoId: i.id.videoId,
        title: decodeHtml(cleanTitle(i.snippet.title)),
        artist: decodeHtml(i.snippet.channelTitle.replace(/ - Topic$/i,'').replace(/VEVO$/i,'').replace(/Official$/i,'').trim()),
        thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.medium?.url || i.snippet.thumbnails.default?.url || '',
        duration: dm[i.id.videoId]?.dur || '3:30',
        durationSecs: dm[i.id.videoId]?.secs || 210,
        isChannel: isChannel,
      }))
      .filter(s => isChannel ? true : (s.durationSecs >= 90 && s.durationSecs <= 900));

    return res.status(200).json(songs);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}

function decodeHtml(str) {
  return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ');
}
function cleanTitle(t) {
  return t.replace(/\(Official[^)]*\)/gi,'').replace(/\[Official[^)]*\]/gi,'')
    .replace(/\(Audio[^)]*\)/gi,'').replace(/\[Audio[^)]*\]/gi,'')
    .replace(/\(Lyric[^)]*\)/gi,'').replace(/\[Lyric[^)]*\]/gi,'')
    .replace(/\(Full[^)]*\)/gi,'').replace(/\|.*$/,'')
    .replace(/\s{2,}/g,' ').trim();
}
function parseDur(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '3:30';
  const h=+m[1]||0,mn=+m[2]||0,s=+m[3]||0,p=n=>String(n).padStart(2,'0');
  return h ? `${h}:${p(mn)}:${p(s)}` : `${mn}:${p(s)}`;
}
function parseSecs(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+m[1]||0)*3600 + (+m[2]||0)*60 + (+m[3]||0) : 210;
}
