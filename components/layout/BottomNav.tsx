'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, ShoppingBag, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

  const items = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Library', href: '/bookmark', icon: Library },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    { label: 'Profile', href: '/profile', icon: User },
  ]

  // Hide on admin pages
  if (pathname.startsWith('/admin')) return null

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-400/95 backdrop-blur-md border-t border-glass-border">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center space-y-1 p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
