/**
 * TuneFlow Auth — Supabase Google OAuth
 * All credentials are the public anon key (safe to expose in browser)
 */

const TUNEAUTH = (() => {

  const SUPABASE_URL  = 'https://qzqrskoycaktqlbtgygf.supabase.co'
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cXJza295Y2FrdHFsYnRneWdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTE2NzEsImV4cCI6MjA4ODg4NzY3MX0.9qEKBKArABNrpIsLOOm6AWBhCpt1vdeSFQ3OrF_KDAQ'

  let _sb   = null   // supabase client
  let _user = null   // current user
  let _onAuthChange = []

  // ── Init Supabase client ────────────────────────────────────
  function init() {
    if (_sb) return _sb
    if (!window.supabase) { console.warn('Supabase SDK not loaded'); return null }
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    })
    // Listen for auth state changes
    _sb.auth.onAuthStateChange((event, session) => {
      _user = session?.user ?? null
      _onAuthChange.forEach(fn => fn(_user, event))
      if (event === 'SIGNED_IN')  handleSignIn(_user)
      if (event === 'SIGNED_OUT') handleSignOut()
    })
    // Restore existing session
    _sb.auth.getUser().then(({ data }) => {
      _user = data?.user ?? null
      _onAuthChange.forEach(fn => fn(_user, 'INITIAL'))
    })
    return _sb
  }

  // ── Google OAuth ────────────────────────────────────────────
  async function signInWithGoogle() {
    const sb = init()
    if (!sb) return { error: 'Supabase not loaded' }
    const redirectTo = window.location.origin + window.location.pathname
    const { data, error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'select_account' }
      }
    })
    return { data, error }
  }

  async function signOut() {
    const sb = init()
    if (!sb) return
    await sb.auth.signOut()
  }

  function getUser() { return _user }

  function onAuthChange(fn) { _onAuthChange.push(fn) }

  // ── Handle sign-in: sync liked songs & history ──────────────
  async function handleSignIn(user) {
    if (!user) return
    // Pull liked songs from Supabase into local state
    await syncFromCloud()
  }

  function handleSignOut() {
    // Keep local data but mark as unauthenticated
    localStorage.removeItem('tf_cloud_synced')
  }

  // ── Cloud sync: liked songs ─────────────────────────────────
  async function syncLikedToCloud(likedSongs) {
    const sb = init()
    const user = getUser()
    if (!sb || !user || !likedSongs.length) return false
    try {
      const rows = likedSongs.map(t => ({
        user_id:   user.id,
        video_id:  t.videoId,
        title:     t.title,
        artist:    t.artist,
        thumbnail: t.thumb,
        duration:  t.dur || '',
      }))
      const { error } = await sb.from('liked_songs')
        .upsert(rows, { onConflict: 'user_id,video_id', ignoreDuplicates: true })
      return !error
    } catch { return false }
  }

  async function syncFromCloud() {
    const sb = init()
    const user = getUser()
    if (!sb || !user) return []
    try {
      const { data } = await sb.from('liked_songs')
        .select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      return (data || []).map(r => ({
        videoId: r.video_id,
        title:   r.title,
        artist:  r.artist,
        thumb:   r.thumbnail || '',
        dur:     r.duration  || '',
        durSec:  0,
      }))
    } catch { return [] }
  }

  async function removeLikedFromCloud(videoId) {
    const sb = init()
    const user = getUser()
    if (!sb || !user) return
    try {
      await sb.from('liked_songs')
        .delete().eq('user_id', user.id).eq('video_id', videoId)
    } catch {}
  }

  // ── Cloud sync: history (fire-and-forget) ──────────────────
  async function addHistoryToCloud(track) {
    const sb = init()
    const user = getUser()
    if (!sb || !user) return
    try {
      await sb.from('listen_history').insert({
        user_id:   user.id,
        video_id:  track.videoId,
        title:     track.title,
        artist:    track.artist,
        thumbnail: track.thumb,
      })
    } catch {}
  }

  // ── User profile data from Supabase ─────────────────────────
  async function getProfile() {
    const sb = init()
    const user = getUser()
    if (!sb || !user) return null
    try {
      const { data } = await sb.from('profiles')
        .select('*').eq('id', user.id).single()
      return data
    } catch { return null }
  }

  async function updateProfile(updates) {
    const sb = init()
    const user = getUser()
    if (!sb || !user) return false
    try {
      const { error } = await sb.from('profiles')
        .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      return !error
    } catch { return false }
  }

  async function getListenStats() {
    const sb = init()
    const user = getUser()
    if (!sb || !user) return null
    try {
      const { count: likedCount } = await sb.from('liked_songs')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      const { count: histCount } = await sb.from('listen_history')
        .select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      return { likedCount: likedCount || 0, histCount: histCount || 0 }
    } catch { return null }
  }

  return {
    init,
    signInWithGoogle,
    signOut,
    getUser,
    onAuthChange,
    syncLikedToCloud,
    syncFromCloud,
    removeLikedFromCloud,
    addHistoryToCloud,
    getProfile,
    updateProfile,
    getListenStats,
  }
})()
