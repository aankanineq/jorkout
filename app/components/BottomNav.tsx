'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/stats', label: '통계', icon: '📊' },
  { href: '/history', label: '기록', icon: '📅' },
  { href: '/settings', label: '설정', icon: '⚙️' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border flex justify-around items-center h-16 z-50">
      {tabs.map((tab) => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-medium transition-colors ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
