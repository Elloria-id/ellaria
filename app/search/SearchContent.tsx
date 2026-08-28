'use client'

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  BookOpen,
  Languages,
  User,
  Users,
  Eye,
} from 'lucide-react'

type SearchType =
  | 'all'
  | 'series'
  | 'translator'
  | 'creator'
  | 'user'
  | 'community'

type SeriesItem = {
  id: string
  title: string
  slug: string
  cover: string | null
  type: string
  status: string
  label: string
  rating: number
  views: number
  readingCount: number
  is18Plus: boolean
  isPremium: boolean
  genres: {
    id: string
    name: string
    slug: string
  }[]
}

type UserItem = {
  id: string
  username: string
  avatar: string | null
  role: string
  level: number
}

type TranslatorItem = {
  id: string
  userId: string
  displayName: string | null
  bio: string | null
  languages: string[]
  user: {
    username: string
    avatar: string | null
  }
}

type CreatorItem = {
  id: string
  userId: string
  displayName: string | null
  bio: string | null
  user: {
    username: string
    avatar: string | null
  }
}

type CommunityItem = {
  id: string
  name: string
  description: string | null
  type: string
  avatar: string | null
}

type GenreItem = {
  id: string
  name: string
  slug: string
  description: string | null
}

type SearchResponse = {
  success: boolean
  message?: string
  data: {
    results: unknown[]
    series: SeriesItem[]
    users: UserItem[]
    translators: TranslatorItem[]
    creators: CreatorItem[]
    communities: CommunityItem[]
    genres: GenreItem[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

const tabs: {
  value: SearchType
  label: string
  icon: typeof Search
}[] = [
  {
    value: 'all',
    label: 'Semua',
    icon: Search,
  },
  {
    value: 'series',
    label: 'Series',
    icon: BookOpen,
  },
  {
    value: 'translator',
    label: 'Translator',
    icon: Languages,
  },
  {
    value: 'creator',
    label: 'Creator',
    icon: User,
  },
  {
    value: 'user',
    label: 'User',
    icon: Users,
  },
  {
    value: 'community',
    label: 'Community',
    icon: Users,
  },
]

const typeOptions = [
  {
    value: '',
    label: 'Semua Tipe',
  },
  {
    value: 'MANGA',
    label: 'Manga',
  },
  {
    value: 'MANHWA',
    label: 'Manhwa',
  },
  {
    value: 'MANHUA',
    label: 'Manhua',
  },
  {
    value: 'NOVEL',
    label: 'Novel',
  },
  {
    value: 'ONE_SHOT',
    label: 'One Shot',
  },
]

const statusOptions = [
  {
    value: '',
    label: 'Semua Status',
  },
  {
    value: 'ONGOING',
    label: 'Ongoing',
  },
  {
    value: 'COMPLETED',
    label: 'Completed',
  },
  {
    value: 'HIATUS',
    label: 'Hiatus',
  },
]

const sortOptions = [
  {
    value: 'latest',
    label: 'Terbaru',
  },
  {
    value: 'popular',
    label: 'Terpopuler',
  },
  {
    value: 'rating',
    label: 'Rating',
  },
  {
    value: 'a-z',
    label: 'A - Z',
  },
  {
    value: 'z-a',
    label: 'Z - A',
  },
]

function getInitialType(value: string | null): SearchType {
  if (
    value === 'all' ||
    value === 'series' ||
    value === 'translator' ||
    value === 'creator' ||
    value === 'user' ||
    value === 'community'
  ) {
    return value
  }

  return 'all'
}

function formatNumber(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return String(value)
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'MANGA':
      return 'Manga'
    case 'MANHWA':
      return 'Manhwa'
    case 'MANHUA':
      return 'Manhua'
    case 'NOVEL':
      return 'Novel'
    case 'ONE_SHOT':
      return 'One Shot'
    default:
      return type
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'ONGOING':
      return 'Ongoing'
    case 'COMPLETED':
      return 'Completed'
    case 'HIATUS':
      return 'Hiatus'
    default:
      return status
  }
}

export default function SearchContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get('q') || ''
  const initialType = getInitialType(searchParams.get('type'))
  const initialGenre = searchParams.get('genre') || ''
  const initialStatus = searchParams.get('status') || ''
  const initialContentType =
    searchParams.get('contentType') || ''
  const initialSort =
    searchParams.get('sort') || 'latest'

  const [query, setQuery] = useState(initialQuery)
  const [type, setType] =
    useState<SearchType>(initialType)

const [genre, setGenre] =
  useState<string[]>(
    initialGenre
      ? initialGenre.split(',').filter(Boolean)
      : []
  )

const toggleGenre = (slug: string) => {
  setGenre((current) =>
    current.includes(slug)
      ? current.filter((item) => item !== slug)
      : [...current, slug]
  )
}

  const [genreSearch, setGenreSearch] =
    useState('')

  const [status, setStatus] =
    useState(initialStatus)

  const [contentType, setContentType] =
    useState(initialContentType)

  const [sort, setSort] =
    useState(initialSort)

  const [series, setSeries] =
    useState<SeriesItem[]>([])

  const [users, setUsers] =
    useState<UserItem[]>([])

  const [translators, setTranslators] =
    useState<TranslatorItem[]>([])

  const [creators, setCreators] =
    useState<CreatorItem[]>([])

  const [communities, setCommunities] =
    useState<CommunityItem[]>([])

  const [genres, setGenres] =
    useState<GenreItem[]>([])

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] =
    useState(0)

  const [total, setTotal] = useState(0)

  const [loading, setLoading] =
    useState(false)

  const [genresLoading, setGenresLoading] =
    useState(true)

  const [showFilters, setShowFilters] =
    useState(false)

  const updateUrl = useCallback(
    (nextPage = 1) => {
      const params = new URLSearchParams()

      if (query.trim()) {
        params.set('q', query.trim())
      }

      if (type !== 'all') {
        params.set('type', type)
      }

      if (genre.length > 0) {
  params.set('genre', genre.join(','))
}

      if (status) {
        params.set('status', status)
      }

      if (contentType) {
        params.set(
          'contentType',
          contentType
        )
      }

      if (sort !== 'latest') {
        params.set('sort', sort)
      }

      if (nextPage > 1) {
        params.set(
          'page',
          String(nextPage)
        )
      }

      const queryString =
        params.toString()

      router.replace(
        queryString
          ? `${pathname}?${queryString}`
          : pathname,
        {
          scroll: false,
        }
      )
    },
    [
      contentType,
      genre,
      pathname,
      query,
      router,
      sort,
      status,
      type,
    ]
  )

  const fetchGenres = useCallback(
    async () => {
      try {
        setGenresLoading(true)

        const response = await fetch(
          '/api/search?type=all&limit=1',
          {
            cache: 'no-store',
          }
        )

        const data =
          (await response.json()) as SearchResponse

        if (
          response.ok &&
          data.success
        ) {
          setGenres(
            data.data.genres || []
          )
        } else {
          setGenres([])
        }
      } catch {
        setGenres([])
      } finally {
        setGenresLoading(false)
      }
    },
    []
  )

  const performSearch = useCallback(
    async (requestedPage = 1) => {
      setLoading(true)

      try {
        const params =
          new URLSearchParams()

        params.set('type', type)
        params.set(
          'page',
          String(requestedPage)
        )
        params.set('limit', '20')

        if (query.trim()) {
          params.set(
            'q',
            query.trim()
          )
        }

        if (genre.length > 0) {
  params.set('genre', genre.join(','))
}

        if (status) {
          params.set(
            'status',
            status
          )
        }

        if (contentType) {
          params.set(
            'contentType',
            contentType
          )
        }

        if (sort) {
          params.set('sort', sort)
        }

        const response =
          await fetch(
            `/api/search?${params.toString()}`,
            {
              cache: 'no-store',
            }
          )

        const data =
          (await response.json()) as SearchResponse

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              'Search failed'
          )
        }

        setSeries(
          data.data.series || []
        )

        setUsers(
          data.data.users || []
        )

        setTranslators(
          data.data.translators || []
        )

        setCreators(
          data.data.creators || []
        )

        setCommunities(
          data.data.communities || []
        )

        const nextPage =
          data.data.pagination
            ?.page ||
          requestedPage

        setPage(nextPage)

        setTotalPages(
          data.data.pagination
            ?.pages || 0
        )

        setTotal(
          data.data.pagination
            ?.total || 0
        )

        updateUrl(nextPage)
      } catch {
        setSeries([])
        setUsers([])
        setTranslators([])
        setCreators([])
        setCommunities([])
        setTotal(0)
        setTotalPages(0)
      } finally {
        setLoading(false)
      }
    },
    [
      contentType,
      genre,
      query,
      sort,
      status,
      type,
      updateUrl,
    ]
  )

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  useEffect(() => {
    const currentPage =
      Number(
        searchParams.get(
          'page'
        ) || '1'
      )

    performSearch(
      Number.isFinite(
        currentPage
      )
        ? currentPage
        : 1
    )
  }, [
    type,
    genre,
    status,
    contentType,
    sort,
  ])

  const handleSearch = (
    event: FormEvent
  ) => {
    event.preventDefault()

    performSearch(1)
  }

  const handleTabChange = (
    nextType: SearchType
  ) => {
    setType(nextType)
    setPage(1)

    if (
      nextType !== 'series' &&
      nextType !== 'all'
    ) {
      setGenre([])
      setStatus('')
      setContentType('')
      setSort('latest')
    }
  }

  const clearFilters = () => {
    setGenre([])
    setStatus('')
    setContentType('')
    setSort('latest')
    setPage(1)
  }

  const hasFilters =
    genre.length > 0
    Boolean(status) ||
    Boolean(contentType) ||
    sort !== 'latest'

  const hasResults =
    series.length > 0 ||
    users.length > 0 ||
    translators.length > 0 ||
    creators.length > 0 ||
    communities.length > 0

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-16 lg:px-8 lg:pt-8">

        {/* HEADER */}
        <section className="mb-6 sm:mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-7 w-1 rounded-full bg-[#42A5F5] sm:h-8" />

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Pencarian
            </h1>
          </div>

          <p className="max-w-2xl pl-4 text-sm leading-6 text-white/45 sm:text-base">
            Cari manga, manhwa, manhua,
            novel, translator, creator,
            user, atau community di
            Ellaria.
          </p>
        </section>

        {/* SEARCH BAR */}
        <section className="mb-5">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(
                    event.target.value
                  )
                }
                placeholder="Cari series, translator, creator, user..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#0a1019]/90 pl-12 pr-4 text-sm text-white shadow-sm outline-none transition placeholder:text-white/25 focus:border-[#42A5F5]/50 focus:ring-2 focus:ring-[#42A5F5]/10 sm:h-13"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#42A5F5] px-6 text-sm font-semibold text-black transition hover:bg-[#42A5F5]/90 disabled:cursor-wait disabled:opacity-60 sm:h-13 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              <span>
                Cari
              </span>
            </button>
          </form>
        </section>

        {/* SEARCH TABS */}
        <section className="mb-5">
          <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => {
                const Icon =
                  tab.icon

                const active =
                  type ===
                  tab.value

                return (
                  <button
                    key={
                      tab.value
                    }
                    type="button"
                    onClick={() =>
                      handleTabChange(
                        tab.value
                      )
                    }
                    className={[
                      'flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium transition',
                      active
                        ? 'bg-[#42A5F5]/15 text-[#42A5F5] ring-1 ring-[#42A5F5]/20'
                        : 'bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white',
                    ].join(
                      ' '
                    )}
                  >
                    <Icon className="h-4 w-4" />

                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* FILTERS */}
        <section className="mb-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090f18]/80 shadow-sm">
          <div className="p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">

              {(type === 'series' ||
                type === 'all') && (
                <>
                  <FilterSelect
                    value={
                      contentType
                    }
                    onChange={
                      setContentType
                    }
                    options={
                      typeOptions
                    }
                  />

                  <FilterSelect
                    value={
                      status
                    }
                    onChange={
                      setStatus
                    }
                    options={
                      statusOptions
                    }
                  />

                  {/* GENRE */}
<div className="w-full rounded-2xl border border-white/[0.08] bg-[#0c131d] p-3 sm:p-4">
  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[#42A5F5]" />
        <h3 className="text-sm font-semibold text-white">
          Genre
        </h3>
      </div>

      <p className="mt-1 text-xs text-white/35">
        Pilih genre untuk mempersempit hasil series.
      </p>
    </div>

    <span className="text-xs text-white/30">
      {genresLoading
        ? 'Memuat...'
        : `${genres.length} genre`}
    </span>
  </div>

  {!genresLoading && genres.length > 0 && (
    <>
      {/* SEARCH GENRE */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />

        <input
          type="search"
          value={genreSearch}
          onChange={(event) =>
            setGenreSearch(event.target.value)
          }
          placeholder="Cari genre..."
          className="h-10 w-full rounded-xl border border-white/10 bg-[#080d14] pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#42A5F5]/40"
        />
      </div>

      {/* GENRE CHIPS */}
      <div className="max-h-52 overflow-y-auto pr-1">
        <div className="flex flex-wrap gap-2">
          {/* ALL */}
          <button
            type="button"
            onClick={() => setGenre([])}
            className={[
              'rounded-xl px-3 py-2 text-xs font-medium transition',
              !genre
                ? 'bg-[#42A5F5] text-black shadow-[0_0_18px_rgba(66,165,245,0.15)]'
                : 'border border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white',
            ].join(' ')}
          >
            Semua
          </button>

          {genres
            .filter((item) =>
              item.name
                .toLowerCase()
                .includes(
                  genreSearch
                    .trim()
                    .toLowerCase()
                )
            )
            .map((item) => {
              const active =
                genre.includes(item.slug)

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleGenre(item.slug)}
                    )
                  }
                  className={[
                    'rounded-xl px-3 py-2 text-xs font-medium transition',
                    active
                      ? 'bg-[#42A5F5] text-black shadow-[0_0_18px_rgba(66,165,245,0.15)]'
                      : 'border border-white/10 bg-white/[0.04] text-white/55 hover:border-[#42A5F5]/30 hover:bg-[#42A5F5]/10 hover:text-[#42A5F5]',
                  ].join(' ')}
                >
                  {item.name}
                </button>
              )
            })}
        </div>
      </div>

      {/* SELECTED GENRE */}
{genre.length > 0 && (
  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
    <span className="text-xs text-white/30">
      Dipilih:
    </span>

    {genre.map((slug) => {
      const selectedGenre = genres.find(
        (item) => item.slug === slug
      )

      return (
        <button
          key={slug}
          type="button"
          onClick={() => toggleGenre(slug)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#42A5F5]/10 px-2.5 py-1.5 text-xs font-medium text-[#42A5F5]"
        >
          {selectedGenre?.name || slug}
          <X className="h-3 w-3" />
        </button>
      )
    })}
  </div>
)}

  {!genresLoading &&
    genres.length === 0 && (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center">
        <p className="text-sm text-white/40">
          Genre belum tersedia.
        </p>
      </div>
    )}

  {genresLoading && (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <div
            key={index}
            className="h-9 w-20 animate-pulse rounded-xl bg-white/[0.06]"
          />
        )
      )}
    </div>
  )}
</div>

                  <FilterSelect
                    value={
                      sort
                    }
                    onChange={
                      setSort
                    }
                    options={
                      sortOptions
                    }
                  />
                </>
              )}

              {/* MORE FILTER */}
              <button
                type="button"
                onClick={() =>
                  setShowFilters(
                    !showFilters
                  )
                }
                className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white/55 transition hover:bg-white/[0.08] hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4" />

                <span>
                  Filter
                </span>

                <ChevronDown
                  className={[
                    'h-3.5 w-3.5 transition',
                    showFilters
                      ? 'rotate-180'
                      : '',
                  ].join(
                    ' '
                  )}
                />
              </button>

              {/* RESET */}
              {hasFilters && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />

                  Reset
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-3 border-t border-white/[0.08] pt-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-white/40">
                  <span>
                    {genresLoading
                      ? 'Memuat daftar genre...'
                      : `${genres.length} genre tersedia`}
                  </span>

                  {!genresLoading &&
                    genres.length >
                      0 && (
                      <span>
                        Pilih genre
                        untuk
                        mempersempit
                        hasil series.
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RESULT INFO */}
        {!loading && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0 text-sm text-white/40">
              {query.trim() ? (
                <>
                  Hasil untuk{' '}
                  <span className="font-medium text-white/75">
                    "{query.trim()}"
                  </span>

                  {total >
                    0 && (
                    <span>
                      {' '}
                      ·{' '}
                      {total}{' '}
                      hasil
                    </span>
                  )}
                </>
              ) : (
                <span>
                  {type ===
                  'series'
                    ? 'Series'
                    : type ===
                        'all'
                      ? 'Pencarian'
                      : tabs.find(
                          (
                            item
                          ) =>
                            item.value ===
                            type
                        )?.label ||
                        'Hasil'}
                </span>
              )}
            </div>

            {!loading &&
              total > 0 && (
                <span className="shrink-0 rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-white/35">
                  {total}
                </span>
              )}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#090f18]/70 py-20 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-[#42A5F5]/20 border-t-[#42A5F5]" />

            <p className="text-sm text-white/40">
              Mencari...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !hasResults && (
            <div className="rounded-2xl border border-white/[0.08] bg-[#090f18]/70 px-5 py-16 text-center sm:py-20">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#42A5F5]/10">
                <Search className="h-6 w-6 text-[#42A5F5]/60" />
              </div>

              <h2 className="text-base font-semibold text-white sm:text-lg">
                Tidak ada hasil
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
                Coba gunakan kata
                kunci lain atau ubah
                filter pencarian.
              </p>
            </div>
          )}

        {/* RESULTS */}
        {!loading && (
          <div className="space-y-9">

            {/* SERIES */}
            {series.length >
              0 && (
              <ResultSection
                title="Series"
                count={
                  series.length
                }
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
                  {series.map(
                    (
                      item
                    ) => (
                      <SeriesCard
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                      />
                    )
                  )}
                </div>
              </ResultSection>
            )}

            {/* TRANSLATORS */}
            {translators.length >
              0 && (
              <ResultSection
                title="Translator"
                count={
                  translators.length
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {translators.map(
                    (
                      item
                    ) => (
                      <PersonCard
                        key={
                          item.id
                        }
                        href={`/profile/${item.user.username}`}
                        avatar={
                          item
                            .user
                            .avatar
                        }
                        name={
                          item.displayName ||
                          item.user
                            .username
                        }
                        username={
                          item.displayName
                            ? `@${item.user.username}`
                            : undefined
                        }
                        description={
                          item.bio
                        }
                        meta={
                          item.languages
                            .length >
                          0
                            ? item.languages.join(
                                ' · '
                              )
                            : 'Translator'
                        }
                      />
                    )
                  )}
                </div>
              </ResultSection>
            )}

            {/* CREATORS */}
            {creators.length >
              0 && (
              <ResultSection
                title="Creator"
                count={
                  creators.length
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {creators.map(
                    (
                      item
                    ) => (
                      <PersonCard
                        key={
                          item.id
                        }
                        href={`/profile/${item.user.username}`}
                        avatar={
                          item
                            .user
                            .avatar
                        }
                        name={
                          item.displayName ||
                          item.user
                            .username
                        }
                        username={
                          item.displayName
                            ? `@${item.user.username}`
                            : undefined
                        }
                        description={
                          item.bio
                        }
                        meta="Creator"
                      />
                    )
                  )}
                </div>
              </ResultSection>
            )}

            {/* USERS */}
            {users.length >
              0 && (
              <ResultSection
                title="User"
                count={
                  users.length
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map(
                    (
                      item
                    ) => (
                      <PersonCard
                        key={
                          item.id
                        }
                        href={`/profile/${item.username}`}
                        avatar={
                          item.avatar
                        }
                        name={
                          item.username
                        }
                        meta={`Level ${item.level}`}
                      />
                    )
                  )}
                </div>
              </ResultSection>
            )}

            {/* COMMUNITY */}
            {communities.length >
              0 && (
              <ResultSection
                title="Community"
                count={
                  communities.length
                }
              >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {communities.map(
                    (
                      item
                    ) => (
                      <CommunityCard
                        key={
                          item.id
                        }
                        item={
                          item
                        }
                      />
                    )
                  )}
                </div>
              </ResultSection>
            )}
          </div>
        )}

        {/* PAGINATION */}
        {!loading &&
          totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={
                  page <= 1
                }
                onClick={() =>
                  performSearch(
                    page - 1
                  )
                }
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                Sebelumnya
              </button>

              <div className="flex h-10 items-center rounded-xl bg-[#42A5F5]/10 px-4 text-sm font-medium text-[#42A5F5]">
                {page}
                <span className="mx-1.5 text-[#42A5F5]/40">
                  /
                </span>
                {totalPages}
              </div>

              <button
                type="button"
                disabled={
                  page >=
                  totalPages
                }
                onClick={() =>
                  performSearch(
                    page + 1
                  )
                }
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                Berikutnya
              </button>
            </div>
          )}
      </div>
    </main>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (
    value: string
  ) => void
  options: {
    value: string
    label: string
  }[]
}) {
  return (
    <div className="relative max-w-full">
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="h-10 max-w-full appearance-none rounded-xl border border-white/10 bg-[#111820] px-3 pr-9 text-sm text-white outline-none transition focus:border-[#42A5F5]/50"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
    </div>
  )
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-[#42A5F5] sm:h-7" />

          <h2 className="text-lg font-bold text-white sm:text-xl">
            {title}
          </h2>

          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-xs text-white/35">
            {count}
          </span>
        </div>
      </div>

      {children}
    </section>
  )
}

function SeriesCard({
  item,
}: {
  item: SeriesItem
}) {
  return (
    <Link
      href={`/series/${item.slug}`}
      className="group min-w-0"
    >
      <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#090f18] transition duration-200 hover:-translate-y-0.5 hover:border-[#42A5F5]/25 hover:bg-[#0b121d]">

        {/* COVER */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#111820]">
          {item.cover ? (
            <img
              src={item.cover}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-8 w-8 text-white/15" />
            </div>
          )}

          {/* OVERLAY */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

          {/* TYPE */}
          <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 text-[10px] font-medium text-white/85 backdrop-blur-sm">
            {getTypeLabel(
              item.type
            )}
          </span>

          {/* PREMIUM */}
          {item.isPremium && (
            <span className="absolute right-2 top-2 rounded-md bg-amber-400/90 px-2 py-1 text-[10px] font-semibold text-black">
              Premium
            </span>
          )}

          {/* 18+ */}
          {item.is18Plus && (
            <span className="absolute bottom-2 left-2 rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-semibold text-white">
              18+
            </span>
          )}
        </div>

        {/* INFO */}
        <div className="p-3">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-white transition group-hover:text-[#42A5F5]">
            {item.title}
          </h3>

          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/35">
            <span className="truncate">
              {getStatusLabel(
                item.status
              )}
            </span>

            <span className="flex shrink-0 items-center gap-1">
              <Star className="h-3 w-3 fill-current text-amber-400/80" />
              {item.rating.toFixed(
                1
              )}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] text-white/25">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(
                item.views
              )}
            </span>

            {item.readingCount >
              0 && (
              <>
                <span>
                  ·
                </span>

                <span>
                  {formatNumber(
                    item.readingCount
                  )}{' '}
                  baca
                </span>
              </>
            )}
          </div>

          {/* GENRES */}
          {item.genres &&
            item.genres.length >
              0 && (
              <div className="mt-2 flex gap-1 overflow-hidden">
                {item.genres
                  .slice(0, 2)
                  .map(
                    (
                      itemGenre
                    ) => (
                      <span
                        key={
                          itemGenre.id
                        }
                        className="truncate rounded-md bg-white/[0.04] px-1.5 py-1 text-[9px] text-white/35"
                      >
                        {
                          itemGenre.name
                        }
                      </span>
                    )
                  )}

                {item.genres
                  .length >
                  2 && (
                  <span className="shrink-0 rounded-md bg-white/[0.04] px-1.5 py-1 text-[9px] text-white/25">
                    +
                    {item.genres
                      .length -
                      2}
                  </span>
                )}
              </div>
            )}
        </div>
      </article>
    </Link>
  )
}

function PersonCard({
  href,
  avatar,
  name,
  username,
  description,
  meta,
}: {
  href: string
  avatar: string | null
  name: string
  username?: string
  description?: string | null
  meta?: string
}) {
  return (
    <Link
      href={href}
      className="group"
    >
      <article className="flex min-h-[88px] items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#090f18] p-3 transition hover:border-[#42A5F5]/25 hover:bg-[#0b121d] sm:p-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#42A5F5]/10">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-5 w-5 text-[#42A5F5]/60" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#42A5F5]">
            {name}
          </h3>

          {username && (
            <p className="mt-0.5 truncate text-xs text-white/30">
              {username}
            </p>
          )}

          {description && (
            <p className="mt-1 line-clamp-1 text-xs text-white/35">
              {description}
            </p>
          )}

          {meta && (
            <p className="mt-1 truncate text-[11px] text-[#42A5F5]/60">
              {meta}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}

function CommunityCard({
  item,
}: {
  item: CommunityItem
}) {
  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#090f18] p-4 transition hover:border-[#42A5F5]/25 hover:bg-[#0b121d]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#42A5F5]/10">
          {item.avatar ? (
            <img
              src={item.avatar}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <Users className="h-5 w-5 text-[#42A5F5]/60" />
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            {item.name}
          </h3>

          <p className="mt-1 text-xs capitalize text-white/30">
            {item.type}
          </p>
        </div>
      </div>

      {item.description && (
        <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/40">
          {item.description}
        </p>
      )}
    </article>
  )
}
