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
    <section className="px-4 py-5">
      <div className="mx-auto max-w-7xl">

        <h2 className="mb-4 text-lg font-bold">
          Genres
        </h2>

        <div className="flex flex-wrap gap-2">

          {genres.length === 0 ? (
            <p className="text-sm text-gray-500">
              Belum ada genre.
            </p>
          ) : (
            genres.map(genre => (
              <a
                key={genre.id}
                href={`/search?genre=${genre.slug}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-300 transition hover:border-[#42A5F5] hover:text-[#42A5F5]"
              >
                {genre.name}
              </a>
            ))
          )}

        </div>

      </div>
    </section>
  )
}
