import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ liked: [] })

  const { data } = await supabase
    .from('liked_songs')
    .select('*')
    .eq('user_id', user.id)
    .order('liked_at', { ascending: false })

  return NextResponse.json({ liked: data || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { videoId, title, artist, thumbnail, durationText, durationSeconds } = body

  const { error } = await supabase.from('liked_songs').upsert(
    { user_id: user.id, video_id: videoId, title, artist, thumbnail, duration_text: durationText, duration_seconds: durationSeconds },
    { onConflict: 'user_id,video_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { videoId } = await req.json()
  await supabase.from('liked_songs').delete().eq('user_id', user.id).eq('video_id', videoId)
  return NextResponse.json({ success: true })
}
