'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Search, Menu, X, User, LogOut, Settings, Bell } from 'lucide-react'

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)

    // Fetch unread notifications
    if (session) {
      fetch('/api/notifications?unread=true&limit=1')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUnreadNotifications(data.data.notifications.length)
          }
        })
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [session])

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Browse', href: '/search' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Community', href: '/community' },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? 'bg-dark-400/95 backdrop-blur-md border-b border-glass-border'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-cinzel text-gradient font-bold">
              ELLARIA
            </span>
            <span className="text-xl font-cinzel text-primary">エル</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href ? 'text-primary' : 'text-gray-300'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/search">
              <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </Link>
            {session && (
              <Link href="/notifications" className="relative">
                <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </Link>
            )}
            <Link href="/shop">
              <button className="btn-primary text-sm">Shop</button>
            </Link>
            {session ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    {session.user?.avatar ? (
                      <img
                        src={session.user.avatar}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 glass rounded-lg shadow-xl hidden group-hover:block">
                  <div className="p-2">
                    <Link href={`/profile/${session.user?.username}`}>
                      <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                        Profile
                      </button>
                    </Link>
                    {(session.user?.role === 'ADMIN' || session.user?.role === 'FOUNDER') && (
                      <Link href="/admin/dashboard">
                        <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                          Admin
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-red-400"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link href="/login">
                <button className="btn-secondary text-sm">Login</button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-glass-border">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/search" onClick={() => setIsOpen(false)}>
                <div className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                  Search
                </div>
              </Link>
              <Link href="/shop" onClick={() => setIsOpen(false)}>
                <div className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                  Shop
                </div>
              </Link>
              {session ? (
                <>
                  <Link href={`/profile/${session.user?.username}`} onClick={() => setIsOpen(false)}>
                    <div className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                      Profile
                    </div>
                  </Link>
                  {(session.user?.role === 'ADMIN' || session.user?.role === 'FOUNDER') && (
                    <Link href="/admin/dashboard" onClick={() => setIsOpen(false)}>
                      <div className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                        Admin
                      </div>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut()
                      setIsOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-red-400"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsOpen(false)}>
                  <div className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-primary">
                    Login
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
