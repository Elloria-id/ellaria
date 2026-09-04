'use client'

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  AlertCircle,
  FileImage,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'

type Series = {
  id: string
  title: string
}

type Chapter = {
  id: string
  number?: number
  chapterNumber?: number
  title: string
  slug?: string
  coinPrice: number
  contentType?: 'IMAGE' | 'NOVEL'
  series: Series
}

type UploadedImage = {
  id: string
  pageNumber: number
  url: string | null
  storageKey: string
  width?: number | null
  height?: number | null
}

type PendingStatus =
  | 'queued'
  | 'uploading'
  | 'uploaded'
  | 'error'

type PendingFile = {
  id: string
  file: File
  previewUrl: string
  status: PendingStatus
  error?: string
  pageNumber?: number
}

type UploadProgress = {
  completed: number
  total: number
  activeId: string | null
}

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

function getChapterNumber(chapter: Chapter) {
  return chapter.chapterNumber ?? chapter.number ?? 0
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getStatusLabel(status: PendingStatus) {
  if (status === 'uploading') return 'Sedang diupload'
  if (status === 'uploaded') return 'Tersimpan'
  if (status === 'error') return 'Gagal'
  return 'Menunggu'
}

function getStatusClass(status: PendingStatus) {
  if (status === 'uploading') {
    return 'border-sky-300/20 bg-sky-300/10 text-sky-200'
  }

  if (status === 'uploaded') {
    return 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
  }

  if (status === 'error') {
    return 'border-rose-300/20 bg-rose-300/10 text-rose-200'
  }

  return 'border-white/10 bg-white/[0.04] text-slate-400'
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [series, setSeries] = useState<Series[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loadingImages, setLoadingImages] = useState(false)
  const [reordering, setReordering] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const [search, setSearch] = useState('')
  const [seriesId, setSeriesId] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('')

  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [reorderError, setReorderError] = useState('')

  const [images, setImages] = useState<UploadedImage[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgress | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFilesRef = useRef<PendingFile[]>([])

  const [form, setForm] = useState({
    seriesId: '',
    number: '',
    title: '',
    slug: '',
    coinPrice: '0',
  })

  const selectedChapter = chapters.find(
    chapter => chapter.id === selectedChapterId
  )

  useEffect(() => {
    pendingFilesRef.current = pendingFiles
  }, [pendingFiles])

  useEffect(() => {
    return () => {
      pendingFilesRef.current.forEach(item =>
        URL.revokeObjectURL(item.previewUrl)
      )
    }
  }, [])

  async function loadSeries() {
    try {
      const response = await fetch(
        '/api/admin/series?limit=100'
      )
      const result = await response.json()

      if (result.success) {
        setSeries(result.data || [])
      }
    } catch {
      // The chapter list remains usable if the series filter cannot load.
    }
  }

  async function loadChapters() {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()

      if (seriesId) {
        params.set('seriesId', seriesId)
      }

      if (search.trim()) {
        params.set('search', search.trim())
      }

      const response = await fetch(
        `/api/admin/chapters?${params.toString()}`,
        { cache: 'no-store' }
      )
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil chapter'
        )
      }

      setChapters(result.data || [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeries()
  }, [])

  useEffect(() => {
    loadChapters()
  }, [seriesId])

  async function createChapter(event: FormEvent) {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')

      if (!form.seriesId) {
        throw new Error('Pilih series terlebih dahulu')
      }

      if (!form.number) {
        throw new Error('Nomor chapter wajib diisi')
      }

      if (!form.title.trim()) {
        throw new Error('Judul chapter wajib diisi')
      }

      const response = await fetch('/api/admin/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId: form.seriesId,
          number: Number(form.number),
          title: form.title.trim(),
          slug: form.slug.trim(),
          coinPrice: Number(form.coinPrice || 0),
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal membuat chapter'
        )
      }

      const createdChapterId = result.data?.id

      setForm({
        seriesId: '',
        number: '',
        title: '',
        slug: '',
        coinPrice: '0',
      })
      setShowForm(false)
      await loadChapters()

      if (createdChapterId) {
        setSelectedChapterId(createdChapterId)
        setShowUpload(true)
        await loadImages(createdChapterId)
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal membuat chapter'
      )
    } finally {
      setSaving(false)
    }
  }

  async function loadImages(
    chapterId: string,
    clearError = true
  ) {
    try {
      setLoadingImages(true)

      if (clearError) {
        setUploadError('')
      }

      const response = await fetch(
        `/api/admin/chapters/${chapterId}/images`,
        { cache: 'no-store' }
      )
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil gambar'
        )
      }

      setImages(result.data || [])
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil gambar'
      )
    } finally {
      setLoadingImages(false)
    }
  }

  function openUpload(chapterId: string) {
    const chapter = chapters.find(
      item => item.id === chapterId
    )

    if (chapter?.contentType === 'NOVEL') {
      return
    }

    setSelectedChapterId(chapterId)
    setUploadError('')
    setUploadSuccess('')
    setReorderError('')
    setImages([])
    setShowUpload(true)
    loadImages(chapterId)
  }

  function closeUpload() {
    if (uploading || reordering) return

    pendingFiles.forEach(item =>
      URL.revokeObjectURL(item.previewUrl)
    )

    setShowUpload(false)
    setSelectedChapterId('')
    setPendingFiles([])
    setImages([])
    setUploadError('')
    setUploadSuccess('')
    setReorderError('')
    setUploadProgress(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) return

    const invalidFiles = files.filter(
      file => !allowedTypes.includes(file.type)
    )
    const tooLargeFiles = files.filter(
      file => file.size > MAX_FILE_SIZE
    )
    const validFiles = files.filter(
      file =>
        allowedTypes.includes(file.type) &&
        file.size <= MAX_FILE_SIZE
    )

    const existingKeys = new Set(
      pendingFiles.map(
        item =>
          `${item.file.name}-${item.file.size}-${item.file.lastModified}`
      )
    )
    const uniqueFiles = validFiles.filter(file => {
      const key = `${file.name}-${file.size}-${file.lastModified}`
      if (existingKeys.has(key)) return false
      existingKeys.add(key)
      return true
    })

    if (invalidFiles.length || tooLargeFiles.length) {
      const messages = [
        invalidFiles.length
          ? `${invalidFiles.length} file memiliki format yang tidak didukung`
          : '',
        tooLargeFiles.length
          ? `${tooLargeFiles.length} file melebihi 5MB`
          : '',
      ].filter(Boolean)

      setUploadError(`${messages.join('; ')}.`)
    } else {
      setUploadError('')
    }

    if (uniqueFiles.length > 0) {
      const nextFiles = uniqueFiles.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'queued' as PendingStatus,
      }))

      setPendingFiles(current => [
        ...current,
        ...nextFiles,
      ])
      setUploadSuccess('')
    }

    event.target.value = ''
  }

  function removePendingFile(id: string) {
    if (uploading) return

    const file = pendingFiles.find(item => item.id === id)
    if (file) {
      URL.revokeObjectURL(file.previewUrl)
    }

    setPendingFiles(current =>
      current.filter(item => item.id !== id)
    )
  }

  function movePendingFile(
    id: string,
    direction: 'up' | 'down'
  ) {
    if (uploading) return

    setPendingFiles(current => {
      const index = current.findIndex(item => item.id === id)
      const targetIndex =
        direction === 'up' ? index - 1 : index + 1

      if (
        index < 0 ||
        targetIndex < 0 ||
        targetIndex >= current.length
      ) {
        return current
      }

      const next = [...current]
      const [moved] = next.splice(index, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Gagal membaca file'))
        }
      }

      reader.onerror = () =>
        reject(new Error('Gagal membaca file'))
      reader.readAsDataURL(file)
    })
  }

  function getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise(resolve => {
      const image = new Image()
      const objectUrl = URL.createObjectURL(file)

      image.onload = () => {
        resolve({
          width: image.width,
          height: image.height,
        })
        URL.revokeObjectURL(objectUrl)
      }

      image.onerror = () => {
        resolve({ width: 0, height: 0 })
        URL.revokeObjectURL(objectUrl)
      }

      image.src = objectUrl
    })
  }

  function updatePendingFile(
    id: string,
    update: Partial<PendingFile>
  ) {
    setPendingFiles(current =>
      current.map(item =>
        item.id === id ? { ...item, ...update } : item
      )
    )
  }

  async function uploadImages() {
    if (!selectedChapterId) {
      setUploadError('Chapter belum dipilih.')
      return
    }

    const queue = pendingFiles.filter(
      item =>
        item.status === 'queued' ||
        item.status === 'error'
    )

    if (queue.length === 0) {
      setUploadError('Pilih gambar terlebih dahulu.')
      return
    }

    try {
      setUploading(true)
      setUploadError('')
      setUploadSuccess('')

      let nextPageNumber =
        images.reduce(
          (highest, image) =>
            Math.max(highest, image.pageNumber),
          0
        ) + 1
      const failures: string[] = []

      setUploadProgress({
        completed: 0,
        total: queue.length,
        activeId: null,
      })

      for (let index = 0; index < queue.length; index++) {
        const item = queue[index]
        const pageNumber = nextPageNumber

        updatePendingFile(item.id, {
          status: 'uploading',
          error: undefined,
          pageNumber,
        })
        setUploadProgress({
          completed: index,
          total: queue.length,
          activeId: item.id,
        })

        try {
          const [base64, dimensions] = await Promise.all([
            fileToBase64(item.file),
            getImageDimensions(item.file),
          ])

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: item.file.name,
              mimeType: item.file.type,
              folder: 'chapters',
            }),
          })
          const uploadResult = await uploadResponse.json()

          if (!uploadResponse.ok || !uploadResult.success) {
            throw new Error(
              uploadResult.message ||
                `Gagal upload ${item.file.name}`
            )
          }

          const imageData = uploadResult.data
          const saveResponse = await fetch(
            `/api/admin/chapters/${selectedChapterId}/images`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storageKey: imageData.storageKey,
                url: imageData.url,
                pageNumber,
                width: dimensions.width || null,
                height: dimensions.height || null,
              }),
            }
          )
          const saveResult = await saveResponse.json()

          if (!saveResponse.ok || !saveResult.success) {
            throw new Error(
              saveResult.message ||
                `Gagal menyimpan ${item.file.name}`
            )
          }

          const savedImage = saveResult.data as UploadedImage
          setImages(current =>
            [...current, savedImage].sort(
              (first, second) =>
                first.pageNumber - second.pageNumber
            )
          )
          updatePendingFile(item.id, {
            status: 'uploaded',
            pageNumber,
          })
          nextPageNumber += 1
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : `Gagal upload ${item.file.name}`

          failures.push(item.file.name)
          updatePendingFile(item.id, {
            status: 'error',
            error: message,
          })
        } finally {
          setUploadProgress({
            completed: index + 1,
            total: queue.length,
            activeId:
              index === queue.length - 1
                ? null
                : queue[index + 1].id,
          })
        }
      }

      await loadImages(selectedChapterId, false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (failures.length > 0) {
        setUploadError(
          `${failures.length} halaman gagal diupload. Periksa status file lalu coba lagi.`
        )
        setUploadSuccess(
          `${queue.length - failures.length} halaman berhasil disimpan.`
        )
      } else {
        setUploadSuccess(
          `${queue.length} halaman berhasil disimpan berurutan.`
        )
      }
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Upload gagal'
      )
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  async function persistImageOrder(
    orderedImages: UploadedImage[],
  ) {
    if (!selectedChapterId || orderedImages.length === 0) return

    const response = await fetch(
      `/api/admin/chapters/${selectedChapterId}/images`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: orderedImages.map((image, index) => ({
            id: image.id,
            pageNumber: index + 1,
          })),
        }),
      }
    )
    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || 'Gagal menyimpan urutan halaman'
      )
    }
  }

  async function movePersistedImage(
    imageId: string,
    direction: 'up' | 'down'
  ) {
    if (uploading || reordering) return

    const index = images.findIndex(
      image => image.id === imageId
    )
    const targetIndex =
      direction === 'up' ? index - 1 : index + 1

    if (
      index < 0 ||
      targetIndex < 0 ||
      targetIndex >= images.length
    ) {
      return
    }

    const previous = images
    const next = [...images]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    const orderedNext = next.map((image, pageIndex) => ({
      ...image,
      pageNumber: pageIndex + 1,
    }))

    setImages(orderedNext)
    setReordering(true)
    setReorderError('')
    setUploadError('')

    try {
      await persistImageOrder(orderedNext)
      await loadImages(selectedChapterId, false)
      setUploadSuccess('Urutan halaman berhasil disimpan.')
    } catch (err) {
      setImages(previous)
      setReorderError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan urutan halaman'
      )
    } finally {
      setReordering(false)
    }
  }

  async function deleteImage(imageId: string) {
    if (!selectedChapterId || uploading || reordering) {
      return
    }

    const confirmed = window.confirm(
      'Hapus halaman ini dari chapter? Tindakan ini tidak dapat dibatalkan.'
    )
    if (!confirmed) return

    try {
      setUploadError('')
      setUploadSuccess('')

      const response = await fetch(
        `/api/admin/chapters/${selectedChapterId}/images`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageId }),
        }
      )
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menghapus gambar'
        )
      }

      setImages(current =>
        current.filter(image => image.id !== imageId)
      )
      setUploadSuccess('Halaman berhasil dihapus.')
      await loadImages(selectedChapterId, false)
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus gambar'
      )
    }
  }

  const pendingToUpload = pendingFiles.filter(
    item =>
      item.status === 'queued' ||
      item.status === 'error'
  ).length

  return (
    <main className="min-h-screen bg-[#070a0f] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-300/80">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
              Studio chapter
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Admin Chapters
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              Kelola metadata, harga coin, dan halaman
              chapter IMAGE dari satu ruang kerja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(current => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
          >
            {showForm ? <X size={17} /> : <Plus size={17} />}
            {showForm ? 'Tutup Form' : 'Tambah Chapter'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createChapter}
            className="mb-7 rounded-2xl border border-white/10 bg-[#0d131b] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)]"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                  Metadata baru
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">
                  Tambah Chapter
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
                IMAGE
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Series</span>
                <select
                  value={form.seriesId}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      seriesId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#080c12] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
                >
                  <option value="">Pilih Series</option>
                  {series.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Nomor chapter</span>
                <input
                  type="number"
                  min="1"
                  value={form.number}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      number: event.target.value,
                    }))
                  }
                  placeholder="Contoh: 12"
                  className="w-full rounded-xl border border-white/10 bg-[#080c12] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Judul chapter</span>
                <input
                  value={form.title}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Judul yang tampil ke pembaca"
                  className="w-full rounded-xl border border-white/10 bg-[#080c12] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Slug</span>
                <input
                  value={form.slug}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      slug: event.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-'),
                    }))
                  }
                  placeholder="chapter-12"
                  className="w-full rounded-xl border border-white/10 bg-[#080c12] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                <span>Harga coin</span>
                <input
                  type="number"
                  min="0"
                  value={form.coinPrice}
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      coinPrice: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="w-full rounded-xl border border-white/10 bg-[#080c12] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200">
                <AlertCircle className="mt-0.5 shrink-0" size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Chapter'}
            </button>
          </form>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0b1017] p-3 md:flex-row">
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                loadChapters()
              }
            }}
            placeholder="Cari judul chapter..."
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#070a0f] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
          />

          <select
            value={seriesId}
            onChange={event => setSeriesId(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#070a0f] px-4 py-3 text-sm outline-none transition focus:border-sky-300/60"
          >
            <option value="">Semua Series</option>
            {series.map(item => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadChapters}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
          >
            <RefreshCw size={16} />
            Cari
          </button>
        </div>

        {error && !showForm && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 shrink-0" size={16} />
              {error}
            </div>
            <button
              type="button"
              onClick={loadChapters}
              className="shrink-0 rounded-lg border border-rose-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-rose-200/10"
            >
              Coba lagi
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c121a] shadow-[0_20px_80px_rgba(0,0,0,0.2)]">
          {loading ? (
            <div className="divide-y divide-white/5">
              {[1, 2, 3].map(item => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-2/5 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-1/4 animate-pulse rounded bg-white/5" />
                  </div>
                  <div className="h-9 w-28 animate-pulse rounded-lg bg-white/5" />
                </div>
              ))}
            </div>
          ) : chapters.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <FileImage size={20} className="text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200">
                Belum ada chapter
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Buat chapter pertama untuk mulai mengisi
                konten.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {chapters.map(chapter => {
                const isNovel =
                  chapter.contentType === 'NOVEL'
                const chapterNumber = getChapterNumber(chapter)

                return (
                  <div
                    key={chapter.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-sky-300">
                          CH {String(chapterNumber).padStart(2, '0')}
                        </span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-slate-500">
                          {isNovel ? 'NOVEL' : 'IMAGE'}
                        </span>
                      </div>
                      <p className="truncate font-semibold text-white">
                        {chapter.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {chapter.series.title}
                        {chapter.slug ? ` · /${chapter.slug}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="rounded-lg border border-sky-300/15 bg-sky-300/10 px-3 py-2 text-sm text-sky-200">
                        {chapter.coinPrice} Coin
                      </div>

                      {isNovel ? (
                        <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-500">
                          Kelola teks di editor novel
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openUpload(chapter.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-300/20"
                        >
                          <UploadCloud size={16} />
                          Kelola Halaman
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020407]/85 p-3 backdrop-blur-md sm:p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="chapter-upload-title"
              className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a1017] shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
            >
              <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#0a1017]/95 p-5 backdrop-blur sm:p-6">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
                    <FileImage size={15} />
                    Chapter IMAGE
                  </div>
                  <h2
                    id="chapter-upload-title"
                    className="truncate text-xl font-semibold text-white"
                  >
                    {selectedChapter?.title ||
                      'Kelola halaman'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Susun urutan halaman sebelum dan
                    sesudah upload.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUpload}
                  disabled={uploading || reordering}
                  aria-label="Tutup pengelola halaman"
                  className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <section className="rounded-2xl border border-sky-300/15 bg-sky-300/[0.04] p-4 sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.17em] text-sky-300">
                        01 · Antrian upload
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-white">
                        Tambahkan halaman
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        JPEG, PNG, atau WebP. Maksimal 5MB
                        per file. File dikirim satu per satu
                        mengikuti urutan di bawah.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-300/30 bg-sky-300/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-300/20 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
                      <Plus size={16} />
                      Pilih gambar
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={handleFileChange}
                        disabled={uploading}
                        className="sr-only"
                      />
                    </label>
                  </div>

                  {pendingFiles.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {pendingFiles.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex gap-3 rounded-2xl border border-white/10 bg-[#080d13] p-3"
                        >
                          <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                            <img
                              src={item.previewUrl}
                              alt={`Preview ${item.file.name}`}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute left-1.5 top-1.5 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-medium text-slate-200">
                                {item.file.name}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  removePendingFile(item.id)
                                }
                                disabled={uploading}
                                aria-label={`Hapus ${item.file.name} dari antrian`}
                                className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-rose-300/10 hover:text-rose-200 disabled:opacity-50"
                              >
                                <X size={15} />
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatBytes(item.file.size)}
                              {item.pageNumber
                                ? ` · Halaman ${item.pageNumber}`
                                : ''}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${getStatusClass(item.status)}`}
                              >
                                {item.status === 'uploading' && (
                                  <Loader2
                                    size={11}
                                    className="animate-spin"
                                  />
                                )}
                                {item.status === 'uploaded' && (
                                  <Check size={11} />
                                )}
                                {getStatusLabel(item.status)}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    movePendingFile(
                                      item.id,
                                      'up'
                                    )
                                  }
                                  disabled={
                                    uploading || index === 0
                                  }
                                  aria-label={`Naikkan ${item.file.name}`}
                                  className="rounded-md border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    movePendingFile(
                                      item.id,
                                      'down'
                                    )
                                  }
                                  disabled={
                                    uploading ||
                                    index ===
                                      pendingFiles.length - 1
                                  }
                                  aria-label={`Turunkan ${item.file.name}`}
                                  className="rounded-md border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                  <ArrowDown size={13} />
                                </button>
                              </div>
                            </div>
                            {item.error && (
                              <p className="mt-2 line-clamp-2 text-[11px] text-rose-300">
                                {item.error}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
                      <UploadCloud
                        size={24}
                        className="mx-auto text-slate-600"
                      />
                      <p className="mt-3 text-sm font-medium text-slate-400">
                        Belum ada file di antrian
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Preview akan muncul saat gambar
                        dipilih.
                      </p>
                    </div>
                  )}

                  {uploadProgress && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Mengirim halaman secara berurutan
                        </span>
                        <span className="font-mono text-sky-200">
                          {uploadProgress.completed}/
                          {uploadProgress.total}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-sky-300 transition-[width] duration-300"
                          style={{
                            width: `${
                              uploadProgress.total
                                ? (uploadProgress.completed /
                                    uploadProgress.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200">
                      <AlertCircle
                        className="mt-0.5 shrink-0"
                        size={16}
                      />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccess && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-200">
                      <Check
                        className="mt-0.5 shrink-0"
                        size={16}
                      />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={uploadImages}
                    disabled={
                      uploading ||
                      reordering ||
                      pendingToUpload === 0
                    }
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {uploading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <UploadCloud size={16} />
                    )}
                    {uploading
                      ? 'Mengupload halaman...'
                      : `Upload ${pendingToUpload || ''} halaman`}
                  </button>
                </section>

                <section>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.17em] text-slate-500">
                        02 · Halaman tersimpan
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-white">
                        Urutan yang tampil ke pembaca
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {images.length} halaman
                    </span>
                  </div>

                  {reorderError && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-200">
                      <AlertCircle
                        className="mt-0.5 shrink-0"
                        size={16}
                      />
                      {reorderError}
                    </div>
                  )}

                  {loadingImages ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {[1, 2, 3, 4, 5].map(item => (
                        <div
                          key={item}
                          className="aspect-[3/4] animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]"
                        />
                      ))}
                    </div>
                  ) : images.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center">
                      <FileImage
                        size={26}
                        className="mx-auto text-slate-600"
                      />
                      <p className="mt-3 text-sm font-medium text-slate-400">
                        Belum ada halaman tersimpan
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Tambahkan file di antrian untuk
                        mengisi chapter ini.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {images.map((image, index) => (
                        <div
                          key={image.id}
                          className="group overflow-hidden rounded-2xl border border-white/10 bg-[#080d13]"
                        >
                          <div className="relative aspect-[3/4] overflow-hidden bg-black/30">
                            {image.url ? (
                              <img
                                src={image.url}
                                alt={`Halaman ${image.pageNumber}`}
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-slate-500">
                                Preview tidak tersedia
                              </div>
                            )}
                            <span className="absolute left-2 top-2 rounded-lg border border-white/10 bg-black/75 px-2 py-1 font-mono text-xs text-white">
                              {String(image.pageNumber).padStart(
                                2,
                                '0'
                              )}
                            </span>
                            {reordering && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                                <Loader2
                                  size={22}
                                  className="animate-spin text-sky-200"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-white/10 p-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  movePersistedImage(
                                    image.id,
                                    'up'
                                  )
                                }
                                disabled={
                                  uploading ||
                                  reordering ||
                                  index === 0
                                }
                                aria-label={`Pindahkan halaman ${image.pageNumber} ke atas`}
                                className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  movePersistedImage(
                                    image.id,
                                    'down'
                                  )
                                }
                                disabled={
                                  uploading ||
                                  reordering ||
                                  index === images.length - 1
                                }
                                aria-label={`Pindahkan halaman ${image.pageNumber} ke bawah`}
                                className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                              >
                                <ArrowDown size={14} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteImage(image.id)}
                              disabled={uploading || reordering}
                              aria-label={`Hapus halaman ${image.pageNumber}`}
                              className="rounded-lg border border-rose-300/15 p-1.5 text-rose-300/80 transition hover:bg-rose-300/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-25"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}