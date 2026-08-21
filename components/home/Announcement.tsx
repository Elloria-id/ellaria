'use client'

export default function Announcement() {
  const announcementText = "Selamat datang di Ellaria. Nikmati manga, manhwa, manhua, novel, dan one shot favoritmu."

  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-[#080d14]/80 backdrop-blur-md">
      {/* Subtle Aurora Glow */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#080d14] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#080d14] to-transparent z-10 pointer-events-none"></div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="shrink-0 text-xs font-bold tracking-wider text-[#42A5F5] uppercase px-2 py-0.5 rounded bg-[#42A5F5]/10 border border-[#42A5F5]/20 shadow-sm z-20">
          Info
        </span>

        <div className="relative w-full overflow-hidden flex items-center">
          <div className="flex w-max animate-ticker items-center space-x-12">
            <span className="text-xs sm:text-sm text-gray-300 font-medium">
              {announcementText}
            </span>
            <span className="text-xs sm:text-sm text-gray-300 font-medium" aria-hidden="true">
              {announcementText}
            </span>
            <span className="text-xs sm:text-sm text-gray-300 font-medium" aria-hidden="true">
              {announcementText}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
