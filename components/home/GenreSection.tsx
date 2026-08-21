type Genre = {
  id: string
  name: string
  slug: string
}

export default function GenreSection({
  genres = [],
}: {
  genres?: Genre[]
}) {
  return (
    <section className="px-4 py-5 relative">
      {/* Subtle Blue Aurora Glow di background section */}
      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-64 h-32 bg-[#42A5F5]/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="mx-auto max-w-7xl relative z-10">

        <h2 className="mb-4 text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-1.5 h-5 bg-[#42A5F5] rounded-full"></span>
          Genres
        </h2>

        {genres.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gray-950/60 backdrop-blur-md p-6 sm:p-8 text-center shadow-xl">
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#42A5F5]/10 rounded-full blur-2xl pointer-events-none"></div>
            <p className="text-sm font-medium text-gray-300">Daftar genre belum tersedia saat ini.</p>
            <p className="text-xs text-gray-500 mt-1">Kategori genre akan otomatis muncul di sini setelah diunggah.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {genres.map(genre => (
              <a
                key={genre.id}
                href={`/search?genre=${genre.slug}`}
                className="rounded-full border border-white/10 bg-gray-900/60 backdrop-blur-md px-4 py-2 text-xs sm:text-sm text-gray-300 transition-all duration-300 hover:border-[#42A5F5] hover:text-[#42A5F5] hover:bg-gray-900/90 shadow-sm"
              >
                {genre.name}
              </a>
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
