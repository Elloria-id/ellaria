'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  MessageCircle,
  Bookmark,
  User,
} from 'lucide-react'

const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    label: 'Discover',
    href: '/search',
    icon: Search,
  },
  {
    label: 'Community',
    href: '/community',
    icon: MessageCircle,
  },
  {
    label: 'Library',
    href: '/bookmark',
    icon: Bookmark,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        border-t
        border-white/10
        bg-[#05070a]/90
        backdrop-blur-xl
        md:hidden
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="mx-auto flex h-[68px] max-w-md items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon

          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                relative
                flex
                h-full
                min-w-[58px]
                flex-1
                flex-col
                items-center
                justify-center
                gap-1
                transition-all
                duration-200
                ${
                  isActive
                    ? 'text-[#42A5F5]'
                    : 'text-white/45 hover:text-white/80'
                }
              `}
            >
              {isActive && (
                <span
                  className="
                    absolute
                    top-0
                    h-[2px]
                    w-8
                    rounded-full
                    bg-[#42A5F5]
                    shadow-[0_0_12px_#42A5F5]
                  "
                />
              )}

              <div
                className={`
                  flex
                  h-9
                  w-12
                  items-center
                  justify-center
                  rounded-xl
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? 'bg-[#42A5F5]/10'
                      : 'bg-transparent'
                  }
                `}
              >
                <Icon
                  size={21}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
              </div>

              <span
                className={`
                  text-[10px]
                  font-medium
                  tracking-wide
                  ${
                    isActive
                      ? 'text-[#42A5F5]'
                      : 'text-white/45'
                  }
                `}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
