'use client'
import { useState, useEffect } from 'react'
import { usePlayerStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import {
  Moon, Volume2, Info, LogIn, LogOut,
  Smartphone, Bell, ChevronRight, Check,
  Timer, Music2,
} from 'lucide-react'
import { toast } from '@/components/ui/Toast'

type SleepTimer = 'off' | '15' | '30' | '45' | '60'

export default function SettingsPage() {
  const { volume, setVolume } = usePlayerStore()
  const { user, signInWithGoogle, signOut } = useAuth()
  const [sleepTimer, setSleepTimer] = useState<SleepTimer>('off')
  const [sleepTimeout, setSleepTimeout] = useState<NodeJS.Timeout | null>(null)
  const [sleepRemaining, setSleepRemaining] = useState<number>(0)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)

  useEffect(() => {
    setIsPWAInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
    )
  }, [])

  const handleSleepTimer = (val: SleepTimer) => {
    // Clear existing timer
    if (sleepTimeout) {
      clearTimeout(sleepTimeout)
      setSleepTimeout(null)
      setSleepRemaining(0)
    }

    setSleepTimer(val)

    if (val === 'off') {
      toast.info('Sleep timer off')
      return
    }

    const minutes = parseInt(val)
    const ms = minutes * 60 * 1000
    setSleepRemaining(minutes)

    toast.success(`Sleep timer set for ${minutes} min`)

    // Countdown display
    const interval = setInterval(() => {
      setSleepRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 60_000)

    const timeout = setTimeout(() => {
      usePlayerStore.getState().pause()
      setSleepTimer('off')
      setSleepRemaining(0)
      clearInterval(interval)
      toast.info('Sleep timer ended — music paused')
    }, ms)

    setSleepTimeout(timeout)
  }

  const SLEEP_OPTIONS: { label: string; value: SleepTimer }[] = [
    { label: 'Off', value: 'off' },
    { label: '15 min', value: '15' },
    { label: '30 min', value: '30' },
    { label: '45 min', value: '45' },
    { label: '60 min', value: '60' },
  ]

  return (
    <div className="page-enter min-h-screen">
      {/* Header */}
      <div className="px-5 pt-14 md:pt-10 pb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-4 space-y-6 pb-10">

        {/* Account */}
        <section>
          <p className="text-xs font-semibold text-apple-text-secondary uppercase tracking-wider mb-2 px-1">Account</p>
          <div className="bg-apple-surface rounded-2xl overflow-hidden">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-4 border-b border-apple-border">
                  <img
                    src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`}
                    className="w-10 h-10 rounded-full object-cover"
                    alt="avatar"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-apple-text-secondary truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={async () => { await signOut(); toast.info('Signed out') }}
                  className="flex items-center gap-3 w-full px-4 py-3.5 text-left"
                >
                  <LogOut size={18} className="text-apple-red" />
                  <span className="text-sm text-apple-red font-medium">Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-3 w-full px-4 py-4 text-left"
              >
                <div className="w-10 h-10 rounded-full bg-apple-surface2 flex items-center justify-center">
                  <LogIn size={18} className="text-apple-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Sign In with Google</p>
                  <p className="text-xs text-apple-text-secondary">Sync liked songs & playlists</p>
                </div>
                <ChevronRight size={16} className="text-apple-text-secondary ml-auto" />
              </button>
            )}
          </div>
        </section>

        {/* Playback */}
        <section>
          <p className="text-xs font-semibold text-apple-text-secondary uppercase tracking-wider mb-2 px-1">Playback</p>
          <div className="bg-apple-surface rounded-2xl overflow-hidden divide-y divide-apple-border">

            {/* Volume */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Volume2 size={18} className="text-apple-text-secondary" />
                  <span className="text-sm font-medium">Volume</span>
                </div>
                <span className="text-sm text-apple-text-secondary">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-full progress-bar"
                style={{ '--progress': `${volume * 100}%` } as any}
              />
            </div>

            {/* Sleep Timer */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <Timer size={18} className="text-apple-text-secondary" />
                <span className="text-sm font-medium">Sleep Timer</span>
                {sleepTimer !== 'off' && sleepRemaining > 0 && (
                  <span className="ml-auto text-xs text-apple-red font-medium">
                    {sleepRemaining}m left
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {SLEEP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSleepTimer(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      sleepTimer === opt.value
                        ? 'bg-apple-red text-white'
                        : 'bg-apple-surface2 text-apple-text-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* App */}
        <section>
          <p className="text-xs font-semibold text-apple-text-secondary uppercase tracking-wider mb-2 px-1">App</p>
          <div className="bg-apple-surface rounded-2xl overflow-hidden divide-y divide-apple-border">

            {/* PWA install */}
            <div className="flex items-center gap-3 px-4 py-4">
              <Smartphone size={18} className="text-apple-text-secondary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Add to Home Screen</p>
                <p className="text-xs text-apple-text-secondary mt-0.5">
                  {isPWAInstalled
                    ? 'Wave is installed as an app ✅'
                    : 'In Safari → Share → Add to Home Screen'}
                </p>
              </div>
              {isPWAInstalled && <Check size={16} className="text-green-400 shrink-0" />}
            </div>

            {/* Keyboard shortcuts */}
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-apple-text-secondary text-base">⌨️</span>
                <p className="text-sm font-medium">Keyboard Shortcuts</p>
              </div>
              <div className="space-y-2">
                {[
                  ['Space', 'Play / Pause'],
                  ['⌘ →', 'Next track'],
                  ['⌘ ←', 'Previous track'],
                  ['⌘ ↑', 'Volume up'],
                  ['⌘ ↓', 'Volume down'],
                  ['⌘ S', 'Toggle shuffle'],
                  ['⌘ R', 'Cycle repeat'],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-apple-text-secondary">{action}</span>
                    <kbd className="text-[11px] bg-apple-surface2 text-white px-2 py-0.5 rounded-md font-mono">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <p className="text-xs font-semibold text-apple-text-secondary uppercase tracking-wider mb-2 px-1">About</p>
          <div className="bg-apple-surface rounded-2xl overflow-hidden divide-y divide-apple-border">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-9 h-9 apple-gradient rounded-xl flex items-center justify-center shrink-0">
                <Music2 size={16} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Wave Music</p>
                <p className="text-xs text-apple-text-secondary">Version 1.0.0</p>
              </div>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-xs text-apple-text-secondary leading-relaxed">
                Powered by YouTube InnerTube API via youtubei.js. Built with Next.js, Supabase, and Tailwind CSS.
                Music and podcasts streamed from YouTube. This app is for personal use only.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
