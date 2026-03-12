export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { q, type = 'search' } = req.query;
  const KEY = process.env.YOUTUBE_API_KEY;

  if (!KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    if (type === 'trending') {
      const query = q || 'Top Bollywood Hindi songs 2025';
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=15&regionCode=IN&key=${KEY}`
      );
      const d = await r.json();
      if (!d.items) return res.status(200).json([]);

      const ids = d.items.map(i => i.id.videoId).join(',');
      const dr = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`
      );
      const dd = await dr.json();
      const durMap = {};
      (dd.items || []).forEach(v => { durMap[v.id] = parseDur(v.contentDetails.duration); });

      const songs = d.items.map(i => ({
        videoId: i.id.videoId,
        title: cleanTitle(i.snippet.title),
        artist: i.snippet.channelTitle.replace(' - Topic', '').replace('VEVO', '').trim(),
        thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.default?.url,
        duration: durMap[i.id.videoId] || '0:00'
      }));
      return res.status(200).json(songs);
    }

    if (type === 'search' && q) {
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&videoCategoryId=10&maxResults=15&regionCode=IN&key=${KEY}`
      );
      const d = await r.json();
      if (!d.items) return res.status(200).json([]);

      const ids = d.items.map(i => i.id.videoId).join(',');
      const dr = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`
      );
      const dd = await dr.json();
      const durMap = {};
      (dd.items || []).forEach(v => { durMap[v.id] = parseDur(v.contentDetails.duration); });

      const songs = d.items.map(i => ({
        videoId: i.id.videoId,
        title: cleanTitle(i.snippet.title),
        artist: i.snippet.channelTitle.replace(' - Topic', '').replace('VEVO', '').trim(),
        thumbnail: i.snippet.thumbnails.high?.url || i.snippet.thumbnails.default?.url,
        duration: durMap[i.id.videoId] || '0:00'
      }));
      return res.status(200).json(songs);
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}

function cleanTitle(t) {
  return t
    .replace(/\(Official[^)]*\)/gi, '')
    .replace(/\[Official[^)]*\]/gi, '')
    .replace(/\(Audio[^)]*\)/gi, '')
    .replace(/\(Lyric[^)]*\)/gi, '')
    .replace(/\(Full[^)]*\)/gi, '')
    .replace(/\|.*$/, '')
    .trim();
}

function parseDur(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '0:00';
  const h = +m[1] || 0, mn = +m[2] || 0, s = +m[3] || 0;
  const pad = n => String(n).padStart(2, '0');
  return h ? `${h}:${pad(mn)}:${pad(s)}` : `${mn}:${pad(s)}`;
}
