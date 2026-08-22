'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
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

export default function SearchContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const initialQuery = searchParams.get('q') || ''

  const initialType =
    (searchParams.get('type') as SearchType) || 'all'

  const initialGenre = searchParams.get('genre') || ''

  const initialStatus =
    searchParams.get('status') || ''

  const initialContentType =
    searchParams.get('contentType') || ''

  const initialSort =
    searchParams.get('sort') || 'latest'

  const [query, setQuery] =
    useState(initialQuery)

  const [type, setType] =
    useState<SearchType>(initialType)

  const [genre, setGenre] =
    useState(initialGenre)

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

  const [page, setPage] =
    useState(1)

  const [totalPages, setTotalPages] =
    useState(0)

  const [total, setTotal] =
    useState(0)

  const [loading, setLoading] =
    useState(false)

  const [genresLoading, setGenresLoading] =
    useState(true)

  const [showFilters, setShowFilters] =
    useState(false)

  /*
   * =========================================================
   * UPDATE URL
   * =========================================================
   */

  const updateUrl = useCallback(
    (nextPage = 1) => {
      const params = new URLSearchParams()

      if (query.trim()) {
        params.set('q', query.trim())
      }

      if (type !== 'all') {
        params.set('type', type)
      }

      if (genre) {
        params.set('genre', genre)
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

  /*
   * =========================================================
   * FETCH ALL GENRES
   *
   * Genre diambil secara khusus dari API.
   * Tidak bergantung pada keyword search.
   * =========================================================
   */

  const fetchGenres =
    useCallback(async () => {
      try {
        setGenresLoading(true)

        const res = await fetch(
          '/api/search?type=genre&limit=100',
          {
            cache: 'no-store',
          }
        )

        if (!res.ok) {
          throw new Error(
            'Failed to fetch genres'
          )
        }

        const data =
          (await res.json()) as SearchResponse

        if (!data.success) {
          throw new Error(
            data.message ||
              'Failed to fetch genres'
          )
        }

        const genreList =
          data.data.genres || []

        setGenres(genreList)
      } catch (error) {
        console.error(
          'FETCH_GENRES_ERROR:',
          error
        )

        setGenres([])
      } finally {
        setGenresLoading(false)
      }
    }, [])

  /*
   * =========================================================
   * SEARCH
   * =========================================================
   */

  const performSearch =
    useCallback(
      async (
        requestedPage = 1
      ) => {
        setLoading(true)

        try {
          const params =
            new URLSearchParams({
              type,
              page: String(
                requestedPage
              ),
              limit: '20',
            })

          if (query.trim()) {
            params.set(
              'q',
              query.trim()
            )
          }

          if (genre) {
            params.set(
              'genre',
              genre
            )
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
            params.set(
              'sort',
              sort
            )
          }

          const res = await fetch(
            `/api/search?${params.toString()}`,
            {
              cache: 'no-store',
            }
          )

          const data =
            (await res.json()) as SearchResponse

          if (
            !res.ok ||
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
            data.data.translators ||
              []
          )

          setCreators(
            data.data.creators || []
          )

          setCommunities(
            data.data.communities ||
              []
          )

          setPage(
            data.data.pagination
              ?.page ||
              requestedPage
          )

          setTotalPages(
            data.data.pagination
              ?.pages || 0
          )

          setTotal(
            data.data.pagination
              ?.total || 0
          )

          updateUrl(
            data.data.pagination
              ?.page ||
              requestedPage
          )
        } catch (error) {
          console.error(
            'SEARCH_ERROR:',
            error
          )

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

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    fetchGenres()
  }, [fetchGenres])

  useEffect(() => {
    performSearch(
      Number(
        searchParams.get(
          'page'
        ) || '1'
      )
    )
  }, [
    type,
    genre,
    status,
    contentType,
    sort,
  ])

  /*
   * =========================================================
   * HANDLERS
   * =========================================================
   */

  const handleSearch = (
    event: React.FormEvent
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
      setGenre('')
      setStatus('')
      setContentType('')
      setSort('latest')
    }
  }

  const clearFilters = () => {
    setGenre('')
    setStatus('')
    setContentType('')
    setSort('latest')
    setPage(1)
  }

  const handleGenreChange = (
    value: string
  ) => {
    setGenre(value)
    setPage(1)
  }

  /*
   * =========================================================
   * DERIVED STATE
   * =========================================================
   */

  const hasFilters =
    Boolean(genre) ||
    Boolean(status) ||
    Boolean(contentType) ||
    sort !== 'latest'

  const visibleSeries =
    useMemo(
      () => series,
      [series]
    )

  const hasResults =
    visibleSeries.length > 0 ||
    users.length > 0 ||
    translators.length > 0 ||
    creators.length > 0 ||
    communities.length > 0

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Pencarian
        </h1>

        <p className="mt-1 text-sm text-white/45">
          Cari series, translator,
          creator, user, atau
          community di Ellaria.
        </p>
      </div>

      {/* SEARCH */}

      <form
        onSubmit={handleSearch}
        className="mb-5"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/35" />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Cari series, translator, creator, user, community..."
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0b1016] pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#42A5F5]/50"
            />
          </div>

          <button
            type="submit"
            className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-[#42A5F5] px-5 text-sm font-semibold text-black transition hover:bg-[#42A5F5]/90"
          >
            <Search className="h-4 w-4" />

            <span className="hidden sm:inline">
              Cari
            </span>
          </button>
        </div>
      </form>

      {/* SEARCH TYPE */}

      <div className="mb-5 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon

            const active =
              type === tab.value

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() =>
                  handleTabChange(
                    tab.value
                  )
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-[#42A5F5]/15 text-[#42A5F5]'
                    : 'bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />

                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="mb-6 rounded-2xl border border-white/10 bg-[#0b1016]/80 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {type === 'series' ||
          type === 'all' ? (
            <>
              {/* TYPE */}

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

              {/* STATUS */}

              <FilterSelect
                value={status}
                onChange={
                  setStatus
                }
                options={
                  statusOptions
                }
              />

              {/* GENRE */}

              <div className="relative">
                <select
                  value={genre}
                  onChange={(
                    event
                  ) =>
                    handleGenreChange(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    genresLoading
                  }
                  className="h-10 max-w-[240px] rounded-xl border border-white/10 bg-[#111820] px-3 pr-8 text-sm text-white outline-none transition focus:border-[#42A5F5]/50 disabled:cursor-wait disabled:opacity-60"
                >
                  <option value="">
                    {genresLoading
                      ? 'Memuat genre...'
                      : genres.length ===
                          0
                        ? 'Genre belum tersedia'
                        : 'Semua Genre'}
                  </option>

                  {genres.map(
                    (item) => (
                      <option
                        key={
                          item.id
                        }
                        value={
                          item.slug
                        }
                      >
                        {item.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* SORT */}

              <FilterSelect
                value={sort}
                onChange={setSort}
                options={
                  sortOptions
                }
              />
            </>
          ) : null}

          {/* MORE FILTER */}

          <button
            type="button"
            onClick={() =>
              setShowFilters(
                !showFilters
              )
            }
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <SlidersHorizontal className="h-4 w-4" />

            Filter

            <ChevronDown
              className={`h-3.5 w-3.5 transition ${
                showFilters
                  ? 'rotate-180'
                  : ''
              }`}
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
          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="text-xs leading-5 text-white/40">
              {genresLoading
                ? 'Memuat daftar genre...'
                : `${genres.length} genre aktif tersedia.`}

              {!genresLoading &&
                genres.length >
                  0 && (
                  <>
                    {' '}
                    Pilih genre dari
                    daftar untuk
                    mempersempit
                    hasil series.
                  </>
                )}
            </div>
          </div>
        )}
      </div>

      {/* RESULT COUNT */}

      {!loading && (
        <div className="mb-4 text-sm text-white/40">
          {query.trim() ? (
            <>
              Hasil untuk{' '}

              <span className="font-medium text-white/70">
                "{query.trim()}"
              </span>

              {total > 0
                ? ` · ${total} hasil`
                : ''}
            </>
          ) : (
            <>
              {type === 'series'
                ? 'Series'
                : type === 'all'
                  ? 'Pencarian'
                  : tabs.find(
                      (
                        item
                      ) =>
                        item.value ===
                        type
                    )?.label ||
                    'Hasil'}
            </>
          )}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#42A5F5] border-t-transparent" />
        </div>
      )}

      {/* NO RESULTS */}

      {!loading &&
        !hasResults && (
          <div className="rounded-2xl border border-white/10 bg-[#0b1016] px-6 py-16 text-center">
            <Search className="mx-auto mb-4 h-10 w-10 text-white/20" />

            <h2 className="text-lg font-semibold text-white">
              Tidak ada hasil
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Coba kata kunci
              atau filter yang
              berbeda.
            </p>
          </div>
        )}

      {/* RESULTS */}

      {!loading && (
        <div className="space-y-10">
          {/* SERIES */}

          {visibleSeries.length >
            0 && (
            <ResultSection
              title="Series"
              count={
                visibleSeries.length
              }
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                {visibleSeries.map(
                  (item) => (
                    <SeriesCard
                      key={item.id}
                      item={item}
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
                  (item) => (
                    <PersonCard
                      key={item.id}
                      href={`/profile/${item.user.username}`}
                      avatar={
                        item.user
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
                        item
                          .languages
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
                  (item) => (
                    <PersonCard
                      key={item.id}
                      href={`/profile/${item.user.username}`}
                      avatar={
                        item.user
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

          {users.length > 0 && (
            <ResultSection
              title="User"
              count={users.length}
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {users.map(
                  (item) => (
                    <PersonCard
                      key={item.id}
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
                  (item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-[#0b1016] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
                          {item.avatar ? (
                            <img
                              src={
                                item.avatar
                              }
                              alt={
                                item.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-white">
                            {
                              item.name
                            }
                          </h3>

                          <p className="text-xs capitalize text-white/40">
                            {
                              item.type
                            }
                          </p>
                        </div>
                      </div>

                      {item.description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/45">
                          {
                            item.description
                          }
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </ResultSection>
          )}
        </div>
      )}

      {/* PAGINATION */}

      {!loading &&
        totalPages > 1 &&
        type !== 'all' && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                performSearch(
                  page - 1
                )
              }
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Sebelumnya
            </button>

            <span className="rounded-xl bg-[#42A5F5]/10 px-4 py-2 text-sm text-[#42A5F5]">
              {page} /{' '}
              {totalPages}
            </span>

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
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Berikutnya
            </button>
          </div>
        )}
    </div>
  )
}

/*
 * =========================================================
 * FILTER SELECT
 * =========================================================
 */

function FilterSelect({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string
  onChange: (
    value: string
  ) => void
  options: {
    value: string
    label: string
  }[]
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="h-10 rounded-xl border border-white/10 bg-[#111820] px-3 text-sm text-white outline-none transition focus:border-[#42A5F5]/50 disabled:cursor-not-allowed disabled:opacity-50"
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
  )
}

/*
 * =========================================================
 * RESULT SECTION
 * =========================================================
 */

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
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>

        <span className="text-xs text-white/35">
          {count} hasil
        </span>
      </div>

      {children}
    </section>
  )
}

/*
 * =========================================================
 * SERIES CARD
 * =========================================================
 */

function SeriesCard({
  item,
}: {
  item: SeriesItem
}) {
  return (
    <Link
      href={`/series/${item.slug}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016] transition hover:-translate-y-0.5 hover:border-[#42A5F5]/40"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
        <img
          src={
            item.cover ||
            '/images/placeholder-cover.jpg'
          }
          alt={item.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />

        <div className="absolute left-2 top-2">
          <span className="rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
            {formatSeriesType(
              item.type
            )}
          </span>
        </div>

        {item.is18Plus && (
          <div className="absolute right-2 top-2">
            <span className="rounded-md bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
              18+
            </span>
          </div>
        )}

        {item.isPremium && (
          <div className="absolute bottom-2 left-2">
            <span className="rounded-md bg-yellow-400 px-2 py-1 text-[10px] font-bold text-black">
              Premium
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-semibold text-white">
          {item.title}
        </h3>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/40">
            {formatStatus(
              item.status
            )}
          </span>

          <span className="flex items-center gap-1 text-[11px] text-yellow-300">
            <Star className="h-3 w-3 fill-current" />

            {item.rating.toFixed(
              1
            )}
          </span>
        </div>

        {item.genres.length >
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
                    className="truncate rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] text-white/40"
                  >
                    {
                      itemGenre.name
                    }
                  </span>
                )
              )}
          </div>
        )}
      </div>
    </Link>
  )
}

/*
 * =========================================================
 * PERSON CARD
 * =========================================================
 */

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
      className="rounded-2xl border border-white/10 bg-[#0b1016] p-4 transition hover:border-[#42A5F5]/40 hover:bg-[#0d131a]"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-lg font-semibold">
              {name
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">
            {name}
          </h3>

          {username && (
            <p className="truncate text-xs text-white/35">
              {username}
            </p>
          )}

          {meta && (
            <p className="mt-0.5 truncate text-xs text-[#42A5F5]/70">
              {meta}
            </p>
          )}
        </div>
      </div>

      {description && (
        <p className="mt-3 line-clamp-2 text-sm leading-5 text-white/40">
          {description}
        </p>
      )}
    </Link>
  )
}

/*
 * =========================================================
 * FORMATTERS
 * =========================================================
 */

function formatSeriesType(
  type: string
) {
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

function formatStatus(
  status: string
) {
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
