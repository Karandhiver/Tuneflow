export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=180');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { q, type = 'search', maxResults = 15 } = req.query;
  const KEY = process.env.YOUTUBE_API_KEY;
  if (!KEY) return res.status(500).json({ error: 'Not configured' });
  const GQ = {
    trending:['Top Bollywood songs 2025','Hindi hits 2025','New Bollywood 2025','Arijit Singh 2025'],
    hindi:['Best Hindi songs 2025','Bollywood romantic 2025','Kumar Sanu Udit Narayan','Hindi filmy gaane'],
    punjabi:['Punjabi hits 2025','Diljit Dosanjh songs','Ap Dhillon 2025','Shubh Punjabi new'],
    bhojpuri:['Bhojpuri hits 2025','Pawan Singh songs','Khesari Lal 2025','New Bhojpuri songs'],
    chill:['Chill Hindi songs','Soft Bollywood acoustic','Lofi Hindi beats','Evening Hindi songs'],
    party:['Party Hindi 2025','Dance Bollywood remix','Badshah party songs','DJ Hindi 2025'],
    sad:['Sad Hindi songs 2025','Heartbreak Bollywood','Emotional Arijit','Sad love songs Hindi'],
    romantic:['Romantic Bollywood 2025','Love songs Hindi','Arijit romantic','Best love Bollywood'],
    english:['Top English songs 2025','Pop hits 2025','Billboard hits 2025','Ed Sheeran new'],
    devotional:['Bhakti songs 2025','Morning aarti','Hanuman Chalisa new','Ganesh bhajan 2025'],
    retro:['90s Hindi songs classic','Kumar Sanu 90s','Old Bollywood gold','Lata Rafi classics'],
    workout:['Gym Hindi songs','Energetic Bollywood workout','Running songs Hindi','Power Bollywood'],
  };
  try {
    let qs = q;
    if (type !== 'search') { const p=GQ[type]||GQ.trending; qs=p[Math.floor(Math.random()*p.length)]; }
    const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(qs)}&type=video&videoCategoryId=10&videoDuration=medium&maxResults=${maxResults}&regionCode=IN&key=${KEY}`);
    const sd = await sr.json();
    if (!sd.items?.length) return res.status(200).json([]);
    const ids = sd.items.map(i=>i.id.videoId).join(',');
    const dr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${KEY}`);
    const dd = await dr.json();
    const dm={};
    (dd.items||[]).forEach(v=>{dm[v.id]={dur:parseDur(v.contentDetails.duration),secs:parseSecs(v.contentDetails.duration)};});
    const songs = sd.items.map(i=>({
      videoId:i.id.videoId,
      title:cleanTitle(i.snippet.title),
      artist:i.snippet.channelTitle.replace(/ - Topic$/i,'').replace(/VEVO$/i,'').replace(/Official$/i,'').trim(),
      thumbnail:i.snippet.thumbnails.high?.url||i.snippet.thumbnails.medium?.url||'',
      duration:dm[i.id.videoId]?.dur||'3:30',
      durationSecs:dm[i.id.videoId]?.secs||210,
    })).filter(s=>s.durationSecs>=90&&s.durationSecs<=900);
    return res.status(200).json(songs);
  } catch(e) { return res.status(500).json({error:'Server error'}); }
}
function cleanTitle(t){return t.replace(/\(Official[^)]*\)/gi,'').replace(/\[Official[^)]*\]/gi,'').replace(/\(Audio[^)]*\)/gi,'').replace(/\[Audio[^)]*\]/gi,'').replace(/\(Lyric[^)]*\)/gi,'').replace(/\[Lyric[^)]*\]/gi,'').replace(/\(Full[^)]*\)/gi,'').replace(/\|.*$/,'').replace(/\s{2,}/g,' ').trim();}
function parseDur(iso){const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);if(!m)return'3:30';const h=+m[1]||0,mn=+m[2]||0,s=+m[3]||0,p=n=>String(n).padStart(2,'0');return h?`${h}:${p(mn)}:${p(s)}`:`${mn}:${p(s)}`;}
function parseSecs(iso){const m=iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);return m?(+m[1]||0)*3600+(+m[2]||0)*60+(+m[3]||0):210;}
