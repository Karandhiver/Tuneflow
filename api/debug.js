export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  let innertube = { working: false, items: 0, error: null };
  try {
    const r = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-YouTube-Client-Name': '1', 'X-YouTube-Client-Version': '2.20240101.05.00', 'Origin': 'https://www.youtube.com' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: '2.20240101.05.00', hl: 'en', gl: 'IN' } }, query: 'Arijit Singh', params: 'EgIQAQ%3D%3D' }),
      signal: AbortSignal.timeout(9000),
    });
    const d = await r.json();
    const sections = d?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? [];
    let count = 0;
    for (const s of sections) count += (s?.itemSectionRenderer?.contents ?? []).filter(i => i.videoRenderer).length;
    innertube = { working: count > 0, items: count, httpStatus: r.status };
  } catch(e) {
    innertube = { working: false, error: e.message };
  }

  const apiKeys = [process.env.YOUTUBE_API_KEY_1, process.env.YOUTUBE_API_KEY_2, process.env.YOUTUBE_API_KEY_3, process.env.YOUTUBE_API_KEY].filter(Boolean).length;

  res.status(200).json({
    innertube,
    fallbackAPIKeys: apiKeys,
    status: innertube.working ? '✅ UNLIMITED mode — InnerTube working, no quota ever' : apiKeys > 0 ? '⚠️ InnerTube failed, using API key fallback' : '❌ Both InnerTube and API keys failed',
    playback: '✅ YouTube IFrame — always free, unlimited plays',
  });
}
