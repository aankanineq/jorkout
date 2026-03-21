'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/run', label: 'Run', icon: RunIcon },
  { href: '/gym', label: 'Gym', icon: GymIcon },
  { href: '/input', label: 'Input', icon: InputIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <>
      {/* 데스크탑: 상단 고정 바 */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-12 items-center px-6 gap-6 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <Link href="/" className="font-bold text-sm tracking-widest mr-4"
          style={{ color: 'var(--text)' }}>
          JO
        </Link>
        {LINKS.slice(1).map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="text-xs font-medium transition-colors"
              style={{ color: active ? 'var(--text)' : 'var(--text-dim)' }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 모바일: 하단 탭 바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-14 border-t"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          const color = active ? 'var(--text)' : 'var(--text-muted)'
          return (
            <Link key={href} href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color }}>
              <Icon size={18} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

// ============================================================
// 아이콘 (인라인 SVG)
// ============================================================

function HomeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function RunIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="1" />
      <path d="m9 20 3-6 2 3 2-3 3 6" />
      <path d="m6 8 2 4h4l2-4" />
    </svg>
  )
}

function GymIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11" />
      <path d="M6.5 17.5h11" />
      <path d="M3 9.5v5" />
      <path d="M21 9.5v5" />
      <path d="M6.5 6.5v11" />
      <path d="M17.5 6.5v11" />
      <path d="M1 9.5v5" />
      <path d="M23 9.5v5" />
    </svg>
  )
}

function InputIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function SettingsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
