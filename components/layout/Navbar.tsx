'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Search,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  ChevronDown,
  BookOpen,
  Flame,
  Trophy,
  Users,
  ShoppingBag,
  Bookmark,
  History,
  Wallet,
  Crown,
  Settings,
} from 'lucide-react'

export interface NavbarProps {
  homeMode?: boolean
  hideOnHome?: boolean
}

export function Navbar({ homeMode = false, hideOnHome = false }: NavbarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const [isOpen, setIsOpen] = useState(false)
  const [browseOpen, setBrowseOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    if (!session) {
      setUnreadNotifications(0)
      return
    }

    fetch('/api/notifications?unread=true&limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUnreadNotifications(
            data.data.notifications?.length ?? 0
          )
        }
      })
      .catch(() => {
        setUnreadNotifications(0)
      })
  }, [session])

  if (hideOnHome && pathname === '/') {
    return null
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }

    return pathname.startsWith(href)
  }

  const closeMenus = () => {
    setIsOpen(false)
    setBrowseOpen(false)
    setProfileOpen(false)
  }

  return (
    <nav
      className={`${
        homeMode ? 'relative' : 'sticky left-0 right-0 top-0'
      } z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? 'border-b border-white/10 bg-[#05070a]/95 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl'
          : 'bg-gradient-to-b from-[#05070a]/90 to-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-[68px] items-center justify-between">

          {/* LOGO */}
          <Link
            href="/"
            onClick={closeMenus}
            className="group flex shrink-0 items-center gap-2"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-[#42A5F5]/20 blur-xl transition group-hover:bg-[#42A5F5]/40" />

              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#42A5F5]/30 bg-[#0b1016]">
                <span className="font-bold text-[#42A5F5]">
                  エ
                </span>
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="font-cinzel text-lg font-bold tracking-wide text-white">
                ELLARIA
              </div>

              <div className="text-[9px] tracking-[0.28em] text-[#42A5F5]">
                エラリアワールド
              </div>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-1 md:flex">

            <NavLink
              href="/"
              active={isActive('/')}
              label="Home"
            />

            {/* BROWSE */}
            <div className="relative">
              <button
                onClick={() => {
                  setBrowseOpen(!browseOpen)
                  setProfileOpen(false)
                }}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  browseOpen ||
                  pathname.startsWith('/search')
                    ? 'bg-[#42A5F5]/10 text-[#42A5F5]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Browse
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    browseOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {browseOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016]/98 p-2 shadow-2xl backdrop-blur-xl">

                  <MenuLabel>
                    Browse
                  </MenuLabel>

                  <DropdownLink
                    href="/search?type=manga"
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Manga"
                    description="Japanese comics"
                    onClick={closeMenus}
                  />

                  <DropdownLink
                    href="/search?type=manhwa"
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Manhwa"
                    description="Korean comics"
                    onClick={closeMenus}
                  />

                  <DropdownLink
                    href="/search?type=manhua"
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Manhua"
                    description="Chinese comics"
                    onClick={closeMenus}
                  />

                  <DropdownLink
                    href="/search?type=novel"
                    icon={<BookOpen className="h-4 w-4" />}
                    title="Novel"
                    description="Novel collection"
                    onClick={closeMenus}
                  />

                  <div className="my-2 border-t border-white/10" />

                  <DropdownLink
                    href="/search?sort=latest"
                    icon={<Flame className="h-4 w-4" />}
                    title="Latest"
                    description="Newest releases"
                    onClick={closeMenus}
                  />

                  <DropdownLink
                    href="/search?sort=popular"
                    icon={<Flame className="h-4 w-4" />}
                    title="Popular"
                    description="Most popular titles"
                    onClick={closeMenus}
                  />

                  <DropdownLink
                    href="/search"
                    icon={<Search className="h-4 w-4" />}
                    title="All Comics"
                    description="Browse everything"
                    onClick={closeMenus}
                  />
                </div>
              )}
            </div>

            <NavLink
              href="/leaderboard"
              active={isActive('/leaderboard')}
              label="Leaderboard"
              icon={<Trophy className="h-4 w-4" />}
            />

            <NavLink
              href="/community"
              active={isActive('/community')}
              label="Community"
              icon={<Users className="h-4 w-4" />}
            />
          </div>

          {/* DESKTOP ACTIONS */}
          <div className="hidden items-center gap-2 md:flex">

            {/* SEARCH */}
            <Link
              href="/search"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:border-[#42A5F5]/30 hover:bg-[#42A5F5]/10"
              aria-label="Search"
            >
              <Search className="h-4.5 w-4.5 text-white/70 transition group-hover:text-[#42A5F5]" />
            </Link>

            {/* NOTIFICATION */}
            {session && (
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:border-[#42A5F5]/30 hover:bg-[#42A5F5]/10"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5 text-white/70" />

                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#42A5F5] px-1 text-[9px] font-bold text-black">
                    {unreadNotifications > 9
                      ? '9+'
                      : unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            {/* SHOP */}
            <Link
              href="/shop"
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                isActive('/shop')
                  ? 'border-[#42A5F5]/40 bg-[#42A5F5]/15 text-[#42A5F5]'
                  : 'border-[#42A5F5]/30 bg-[#42A5F5]/10 text-[#42A5F5] hover:bg-[#42A5F5]/20'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Shop
            </Link>

            {/* PROFILE */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileOpen(!profileOpen)
                    setBrowseOpen(false)
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 transition hover:border-[#42A5F5]/30 hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#42A5F5]/15">
                    {session.user?.avatar ? (
                      <img
                        src={session.user.avatar}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-[#42A5F5]" />
                    )}
                  </div>

                  <span className="max-w-24 truncate text-sm font-medium text-white/80">
                    {session.user?.username || 'User'}
                  </span>

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-white/40 transition ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016]/98 p-2 shadow-2xl backdrop-blur-xl">

                    <div className="mb-2 border-b border-white/10 px-3 pb-3 pt-2">
                      <p className="truncate font-semibold text-white">
                        {session.user?.username}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-white/40">
                        {session.user?.email}
                      </p>

                      <div className="mt-2 flex gap-2 text-[10px]">
                        <span className="rounded-md bg-[#42A5F5]/10 px-2 py-1 text-[#42A5F5]">
                          Lv. {session.user?.level ?? 1}
                        </span>

                        <span className="rounded-md bg-yellow-400/10 px-2 py-1 text-yellow-300">
                          {session.user?.coins ?? 0} Coin
                        </span>
                      </div>
                    </div>

                    <DropdownLink
                      href="/profile"
                      icon={<User className="h-4 w-4" />}
                      title="Profile"
                      description="Your Ellaria profile"
                      onClick={closeMenus}
                    />

                    <DropdownLink
                      href="/bookmark"
                      icon={<Bookmark className="h-4 w-4" />}
                      title="Bookmark"
                      description="Saved series"
                      onClick={closeMenus}
                    />

                    <DropdownLink
                      href="/history"
                      icon={<History className="h-4 w-4" />}
                      title="Reading History"
                      description="Continue reading"
                      onClick={closeMenus}
                    />

                    <DropdownLink
                      href="/shop"
                      icon={<Wallet className="h-4 w-4" />}
                      title="Wallet & Shop"
                      description="Coin and purchases"
                      onClick={closeMenus}
                    />

                    <DropdownLink
                      href="/vip"
                      icon={<Crown className="h-4 w-4" />}
                      title="VIP"
                      description="VIP membership"
                      onClick={closeMenus}
                    />

                    <DropdownLink
                      href="/settings"
                      icon={<Settings className="h-4 w-4" />}
                      title="Settings"
                      description="Account settings"
                      onClick={closeMenus}
                    />

                    {(session.user?.role === 'ADMIN' ||
                      session.user?.role === 'FOUNDER') && (
                      <>
                        <div className="my-2 border-t border-white/10" />

                        <DropdownLink
                          href="/admin/dashboard"
                          icon={<Settings className="h-4 w-4" />}
                          title="Admin Panel"
                          description="Manage Ellaria"
                          onClick={closeMenus}
                        />
                      </>
                    )}

                    <div className="my-2 border-t border-white/10" />

                    <button
                      onClick={() => {
                        closeMenus()
                        signOut()
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-red-500/10"
                    >
                      <LogOut className="h-4 w-4 text-red-400" />

                      <div>
                        <p className="text-sm font-medium text-red-400">
                          Logout
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-xl border border-[#42A5F5]/30 bg-[#42A5F5]/10 px-5 py-2.5 text-sm font-semibold text-[#42A5F5] transition hover:bg-[#42A5F5]/20"
              >
                Login
              </Link>
            )}
          </div>

          {/* MOBILE ACTIONS */}
          <div className="flex items-center gap-2 md:hidden">

            <Link
              href="/search"
              onClick={closeMenus}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
            >
              <Search className="h-5 w-5 text-white/80" />
            </Link>

            {session && (
              <Link
                href="/notifications"
                onClick={closeMenus}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
              >
                <Bell className="h-5 w-5 text-white/80" />

                {unreadNotifications > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#42A5F5]" />
                )}
              </Link>
            )}

            <button
              onClick={() => {
                setIsOpen(!isOpen)
                setBrowseOpen(false)
                setProfileOpen(false)
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5"
              aria-label="Menu"
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isOpen && (
          <div className="border-t border-white/10 py-4 md:hidden">

            <div className="space-y-1">

              <MobileLink
                href="/"
                label="Home"
                active={isActive('/')}
                onClick={closeMenus}
              />

              <MobileLink
                href="/search"
                label="Browse & Search"
                active={isActive('/search')}
                onClick={closeMenus}
              />

              <MobileLink
                href="/leaderboard"
                label="Leaderboard"
                active={isActive('/leaderboard')}
                onClick={closeMenus}
              />

              <MobileLink
                href="/community"
                label="Community"
                active={isActive('/community')}
                onClick={closeMenus}
              />

              <MobileLink
                href="/shop"
                label="Shop"
                active={isActive('/shop')}
                onClick={closeMenus}
              />

              <div className="my-3 border-t border-white/10" />

              {session ? (
                <>
                  <MobileLink
                    href="/profile"
                    label="Profile"
                    active={isActive('/profile')}
                    onClick={closeMenus}
                  />

                  <MobileLink
                    href="/bookmark"
                    label="Bookmark"
                    active={isActive('/bookmark')}
                    onClick={closeMenus}
                  />

                  <MobileLink
                    href="/history"
                    label="Reading History"
                    active={isActive('/history')}
                    onClick={closeMenus}
                  />

                  <MobileLink
                    href="/vip"
                    label="VIP"
                    active={isActive('/vip')}
                    onClick={closeMenus}
                  />

                  <MobileLink
                    href="/settings"
                    label="Settings"
                    active={isActive('/settings')}
                    onClick={closeMenus}
                  />

                  {(session.user?.role === 'ADMIN' ||
                    session.user?.role === 'FOUNDER') && (
                    <MobileLink
                      href="/admin/dashboard"
                      label="Admin Panel"
                      active={isActive('/admin')}
                      onClick={closeMenus}
                    />
                  )}

                  <button
                    onClick={() => {
                      closeMenus()
                      signOut()
                    }}
                    className="mt-2 w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenus}
                  className="mt-2 block rounded-xl bg-[#42A5F5] px-4 py-3 text-center text-sm font-semibold text-black"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function NavLink({
  href,
  label,
  active,
  icon,
}: {
  href: string
  label: string
  active: boolean
  icon?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-[#42A5F5]/10 text-[#42A5F5]'
          : 'text-white/70 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function MenuLabel({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
      {children}
    </div>
  )
}

function DropdownLink({
  href,
  icon,
  title,
  description,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description?: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#42A5F5]/10"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#42A5F5]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-white">
          {title}
        </p>

        {description && (
          <p className="truncate text-[11px] text-white/40">
            {description}
          </p>
        )}
      </div>
    </Link>
  )
}

function MobileLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? 'bg-[#42A5F5]/10 text-[#42A5F5]'
          : 'text-white/70 hover:bg-white/5 hover:text-white'
      }`}
    >
      {label}
    </Link>
  )
}
