'use client'

export default function Announcement() {
  return (
    <div className="overflow-hidden border-b border-white/10 bg-[#080d14]">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
        <span className="shrink-0 text-xs font-semibold text-[#42A5F5]">
          ANNOUNCEMENT
        </span>

        <div className="overflow-hidden">
          <p className="whitespace-nowrap text-xs text-gray-400">
            Selamat datang di Ellaria. Nikmati manga,
            manhwa, manhua, novel, dan one shot favoritmu.
          </p>
        </div>
      </div>
    </div>
  )
}
