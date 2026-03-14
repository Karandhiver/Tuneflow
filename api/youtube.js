export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'search', channel = '', maxResults = 15 } = req.query;
  const KEY = process.env.YOUTUBE_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'Not configured' });

  const POOLS = {
    trending:   ['Top Bollywood songs 2025','New Hindi chartbusters 2025','Popular Bollywood 2025','Hindi hits this week'],
    hindi:      ['Best Hindi film songs 2025','Bollywood superhits 2025','Latest Hindi songs 2025','Popular Hindi 2025'],
    punjabi:    ['Punjabi hits 2025 Diljit','AP Dhillon new songs 2025','Shubh Punjabi 2025','Punjabi chart 2025'],
    bhojpuri:   ['Bhojpuri superhits 2025','Pawan Singh new songs','Khesari Lal 2025','New Bhojpuri 2025'],
    gujarati:   ['Gujarati garba songs 2025','New Gujarati songs 2025','Gujarati folk music 2025','Gujarati film songs popular'],
    indie:      ['Indian independent artists music 2025','Hindi indie non-film songs','Spotify India emerging artists','indie Hindi underground 2025'],
    chill:      ['Chill Hindi lofi evening','Soft Bollywood acoustic 2025','Hindi cafe music relaxing','Lofi Bollywood beats'],
    party:      ['Party songs Hindi 2025','Dance Bollywood remix','Badshah party 2025','DJ Hindi dance songs'],
    sad:        ['Sad Hindi songs 2025','Heartbreak Bollywood Arijit','Sad love songs Hindi','Emotional Hindi songs'],
    romantic:   ['Romantic Hindi songs 2025','Love songs Bollywood','Arijit Singh romantic 2025','Valentine Bollywood'],
    english:    ['Top English pop songs 2025','Billboard hits 2025','New English chart 2025','Popular English trending'],
    devotional: ['Morning bhakti songs 2025','Hanuman Chalisa 2025','Shiv bhajan popular','Ganesh aarti collection'],
    retro:      ['90s Hindi songs Kumar Sanu','Udit Narayan old Bollywood','Lata Mangeshkar songs','Old gold Hindi 90s'],
    workout:    ['Gym workout Hindi songs','Energetic Bollywood motivation','Power songs Hindi 2025','High energy Hindi'],
    search:     [],
  };

  const CHANNELS = {
    ankitagrawal:  'Ankit Agrawal Study IQ current affairs 2025',
    studyiq:       'Study IQ Education current affairs news analysis',
    rajshamani:    'Raj Shamani podcast business',
    nikhilkamath:  'Nikhil Kamath WTF podcast',
    beerbiceps:    'BeerBiceps Ranveer Allahbadia podcast',
    joshtalks:     'Josh Talks Hindi inspirational',
    aajtak:        'Aaj Tak Hindi news latest',
    thinkschool:   'Think School business case study',
    zeenews:       'Zee News Hindi',
    bbchindi:      'BBC Hindi news podcast',
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

    const durFilter = isChannel ? '' : '&videoDuration=medium';
    const catFilter = isChannel ? '' : '&videoCategoryId=10';
    const max = parseInt(maxResults) || 15;

    const sr = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(queryStr)}&type=video${catFilter}${durFilter}&maxResults=${max}&regionCode=IN&key=${KEY}`
    );
    const sd = await sr.json();
    if (sd.error || !sd.items?.length) return res.status(200).json([]);

    const ids = sd.items.map(i => i.id.videoId).join(',');
    const dr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`);
    const dd = await dr.json();
    const dm = {};
    (dd.items || []).forEach(v => { dm[v.id] = { dur: parseDur(v.contentDetails.duration), secs: parseSecs(v.contentDetails.duration) }; });

    const songs = sd.items
      .map(i => ({
        videoId: i.id.videoId,
        title: decodeHtml(cleanTitle(i.snippet.title)),
        artist: decodeHtml(i.snippet.channelTitle.replace(/ - Topic$/i,'').replace(/VEVO$/i,'').replace(/Official$/i,'').trim()),
        thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.medium?.url || i.snippet.thumbnails.default?.url || '',
        duration: dm[i.id.videoId]?.dur || '3:30',
        durationSecs: dm[i.id.videoId]?.secs || 210,
        isChannel,
      }))
      .filter(s => isChannel ? true : (s.durationSecs >= 90 && s.durationSecs <= 900));

    return res.status(200).json(songs);
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}

function decodeHtml(str) {
  return str.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}
function cleanTitle(t) {
  return t.replace(/\(Official[^)]*\)/gi,'').replace(/\[Official[^)]*\]/gi,'').replace(/\(Audio[^)]*\)/gi,'').replace(/\[Audio[^)]*\]/gi,'').replace(/\(Lyric[^)]*\)/gi,'').replace(/\|.*$/,'').replace(/\s{2,}/g,' ').trim();
}
function parseDur(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '3:30';
  const h=+m[1]||0,mn=+m[2]||0,s=+m[3]||0,p=n=>String(n).padStart(2,'0');
  return h?`${h}:${p(mn)}:${p(s)}`:`${mn}:${p(s)}`;
}
function parseSecs(iso) {
  const m = iso?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? (+m[1]||0)*3600 + (+m[2]||0)*60 + (+m[3]||0) : 210;
}
