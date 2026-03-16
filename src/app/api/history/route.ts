import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: true }) // silently skip if not logged in

  const body = await req.json()
  const { videoId, title, artist, thumbnail } = body

  // Insert (keep last 200 entries per user)
  await supabase.from('listen_history').insert({
    user_id: user.id,
    video_id: videoId,
    title,
    artist,
    thumbnail,
  })

  // Trim old entries
  const { data: old } = await supabase
    .from('listen_history')
    .select('id')
    .eq('user_id', user.id)
    .order('listened_at', { ascending: false })
    .range(200, 9999)

  if (old && old.length > 0) {
    await supabase
      .from('listen_history')
      .delete()
      .in('id', old.map((r: any) => r.id))
  }

  return NextResponse.json({ ok: true })
}
