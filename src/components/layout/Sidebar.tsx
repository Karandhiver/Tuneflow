'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Radio, Music2, LogIn, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { DesktopNowPlaying } from '@/components/player/DesktopNowPlaying'

const NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/podcasts', icon: Radio, label: 'Podcasts' },
]

const MOBILE_NAV = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/podcasts', icon: Radio, label: 'Podcasts' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) =>
      setUser(s?.user ?? null)
    )
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-56 h-full glass border-r border-apple-border shrink-0">
        {/* Logo */}
        <div className="px-5 pt-8 pb-6 flex items-center gap-2.5">
          <div className="w-8 h-8 apple-gradient rounded-xl flex items-center justify-center shadow-lg">
            <Music2 size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Wave</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-apple-surface2 text-white'
                    : 'text-apple-text-secondary hover:text-white hover:bg-apple-surface'
                }`}
              >
                <Icon size={18} className={active ? 'text-apple-red' : ''} />
                {label}
              </Link>
            )
          })}

          {/* Divider */}
          <div className="border-t border-apple-border my-2" />

          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive('/settings')
                ? 'bg-apple-surface2 text-white'
                : 'text-apple-text-secondary hover:text-white hover:bg-apple-surface'
            }`}
          >
            <Settings size={18} className={isActive('/settings') ? 'text-apple-red' : ''} />
            Settings
          </Link>
        </nav>

        {/* Desktop now playing widget */}
        <div className="px-4 pb-2">
          <DesktopNowPlaying />
        </div>

        {/* User */}
        <div className="p-4 border-t border-apple-border">
          {user ? (
            <div className="flex items-center gap-3">
              <img
                src={
                  user.user_metadata?.avatar_url ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
                }
                className="w-8 h-8 rounded-full object-cover ring-1 ring-apple-border"
                alt="avatar"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-[11px] text-apple-text-secondary hover:text-apple-red transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-apple-text-secondary hover:text-white hover:bg-apple-surface transition-all"
            >
              <LogIn size={18} />
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-apple-border flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
                active ? 'text-apple-red' : 'text-apple-text-secondary'
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
