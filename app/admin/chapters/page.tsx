'use client'

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

type Series = {
  id: string
  title: string
}

type Chapter = {
  id: string
  number: number
  title: string
  slug: string
  coinPrice: number
  series: Series
}

type UploadedImage = {
  id: string
  pageNumber: number
  url: string | null
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [series, setSeries] = useState<Series[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const [search, setSearch] = useState('')
  const [seriesId, setSeriesId] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState('')

  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [images, setImages] = useState<UploadedImage[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    seriesId: '',
    number: '',
    title: '',
    slug: '',
    coinPrice: '0',
  })

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
      // handled silently
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
        {
          cache: 'no-store',
        }
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

  async function createChapter(
    event: FormEvent
  ) {
    event.preventDefault()

    try {
      setSaving(true)

      if (!form.seriesId) {
        throw new Error('Pilih series terlebih dahulu')
      }

      if (!form.number) {
        throw new Error(
          'Nomor chapter wajib diisi'
        )
      }

      if (!form.title.trim()) {
        throw new Error(
          'Judul chapter wajib diisi'
        )
      }

      const response = await fetch(
        '/api/admin/chapters',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            seriesId: form.seriesId,
            number: Number(form.number),
            title: form.title.trim(),
            slug: form.slug.trim(),
            coinPrice: Number(form.coinPrice || 0),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Gagal membuat chapter'
        )
      }

      const createdChapterId =
        result.data?.id

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
        setSelectedChapterId(
          createdChapterId
        )
        setShowUpload(true)
        await loadImages(
          createdChapterId
        )
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Gagal membuat chapter'
      )
    } finally {
      setSaving(false)
    }
  }

  async function loadImages(
    chapterId: string
  ) {
    try {
      setUploadError('')

      const response = await fetch(
        `/api/admin/chapters/${chapterId}/images`,
        {
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Gagal mengambil gambar'
        )
      }

      setImages(result.data || [])
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil gambar'
      )
    }
  }

  function openUpload(
    chapterId: string
  ) {
    setSelectedChapterId(chapterId)
    setSelectedFiles([])
    setImages([])
    setUploadError('')
    setShowUpload(true)
    loadImages(chapterId)
  }

  function closeUpload() {
    if (uploading) return

    setShowUpload(false)
    setSelectedChapterId('')
    setSelectedFiles([])
    setImages([])
    setUploadError('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    )

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    const invalidType = files.find(
      file =>
        !allowedTypes.includes(
          file.type
        )
    )

    if (invalidType) {
      setUploadError(
        `${invalidType.name} bukan format gambar yang didukung. Gunakan JPEG, PNG, atau WebP.`
      )

      event.target.value = ''
      setSelectedFiles([])
      return
    }

    const tooLarge = files.find(
      file => file.size > 5 * 1024 * 1024
    )

    if (tooLarge) {
      setUploadError(
        `${tooLarge.name} lebih dari 5MB. Maksimal 5MB per gambar.`
      )

      event.target.value = ''
      setSelectedFiles([])
      return
    }

    setUploadError('')
    setSelectedFiles(files)
  }

  function fileToBase64(
    file: File
  ): Promise<string> {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader()

        reader.onload = () => {
          if (
            typeof reader.result ===
            'string'
          ) {
            resolve(reader.result)
          } else {
            reject(
              new Error(
                'Gagal membaca file'
              )
            )
          }
        }

        reader.onerror = () => {
          reject(
            new Error(
              'Gagal membaca file'
            )
          )
        }

        reader.readAsDataURL(file)
      }
    )
  }

  function getImageDimensions(
    file: File
  ): Promise<{
    width: number
    height: number
  }> {
    return new Promise(
      resolve => {
        const image =
          new Image()

        const objectUrl =
          URL.createObjectURL(file)

        image.onload = () => {
          resolve({
            width: image.width,
            height: image.height,
          })

          URL.revokeObjectURL(
            objectUrl
          )
        }

        image.onerror = () => {
          resolve({
            width: 0,
            height: 0,
          })

          URL.revokeObjectURL(
            objectUrl
          )
        }

        image.src = objectUrl
      }
    )
  }

  async function uploadImages() {
    if (!selectedChapterId) {
      setUploadError(
        'Chapter belum dipilih.'
      )
      return
    }

    if (selectedFiles.length === 0) {
      setUploadError(
        'Pilih gambar terlebih dahulu.'
      )
      return
    }

    try {
      setUploading(true)
      setUploadError('')

      const existingCount =
        images.length

      for (
        let index = 0;
        index < selectedFiles.length;
        index++
      ) {
        const file =
          selectedFiles[index]

        const pageNumber =
          existingCount + index + 1

        const base64 =
          await fileToBase64(file)

        const dimensions =
          await getImageDimensions(
            file
          )

        const uploadResponse =
          await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              mimeType: file.type,
              folder: 'chapters',
            }),
          })

        const uploadResult =
          await uploadResponse.json()

        if (
          !uploadResponse.ok ||
          !uploadResult.success
        ) {
          throw new Error(
            uploadResult.message ||
              `Gagal upload ${file.name}`
          )
        }

        const imageData =
          uploadResult.data

        const saveResponse =
          await fetch(
            `/api/admin/chapters/${selectedChapterId}/images`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify({
                storageKey:
                  imageData.storageKey,
                url: imageData.url,
                pageNumber,
                width:
                  dimensions.width ||
                  null,
                height:
                  dimensions.height ||
                  null,
              }),
            }
          )

        const saveResult =
          await saveResponse.json()

        if (
          !saveResponse.ok ||
          !saveResult.success
        ) {
          throw new Error(
            saveResult.message ||
              `Gagal menyimpan ${file.name}`
          )
        }
      }

      setSelectedFiles([])

      if (fileInputRef.current) {
        fileInputRef.current.value =
          ''
      }

      await loadImages(
        selectedChapterId
      )

      alert(
        `${selectedFiles.length} gambar berhasil diupload.`
      )
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Upload gagal'
      )
    } finally {
      setUploading(false)
    }
  }

  async function deleteImage(
    imageId: string
  ) {
    if (!selectedChapterId) {
      return
    }

    const confirmed =
      window.confirm(
        'Hapus halaman ini?'
      )

    if (!confirmed) return

    try {
      setUploadError('')

      const response =
        await fetch(
          `/api/admin/chapters/${selectedChapterId}/images`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              imageId,
            }),
          }
        )

      const result =
        await response.json()

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            'Gagal menghapus gambar'
        )
      }

      await loadImages(
        selectedChapterId
      )
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus gambar'
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Admin Chapters
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Kelola chapter, harga coin,
              dan halaman chapter.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowForm(
                current => !current
              )
            }
            className="rounded-xl bg-[#42A5F5] px-5 py-3 text-sm font-semibold text-black"
          >
            {showForm
              ? 'Tutup Form'
              : '+ Tambah Chapter'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={createChapter}
            className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <h2 className="mb-4 text-lg font-semibold">
              Tambah Chapter
            </h2>

            <div className="grid gap-4 md:grid-cols-2">

              <select
                value={form.seriesId}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    seriesId:
                      event.target.value,
                  }))
                }
                className="rounded-xl border border-white/10 bg-[#0b1016] px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  Pilih Series
                </option>

                {series.map(item => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.title}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={form.number}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    number:
                      event.target.value,
                  }))
                }
                placeholder="Nomor chapter"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                value={form.title}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    title:
                      event.target.value,
                  }))
                }
                placeholder="Judul chapter"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                value={form.slug}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    slug: event.target.value
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        '-'
                      ),
                  }))
                }
                placeholder="chapter-1"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

              <input
                type="number"
                min="0"
                value={form.coinPrice}
                onChange={event =>
                  setForm(current => ({
                    ...current,
                    coinPrice:
                      event.target.value,
                  }))
                }
                placeholder="Harga coin"
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
              />

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-[#42A5F5] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              {saving
                ? 'Menyimpan...'
                : 'Simpan Chapter'}
            </button>
          </form>
        )}

        <div className="mb-6 flex flex-col gap-3 md:flex-row">

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            onKeyDown={event => {
              if (
                event.key === 'Enter'
              ) {
                loadChapters()
              }
            }}
            placeholder="Cari chapter..."
            className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none"
          />

          <select
            value={seriesId}
            onChange={event =>
              setSeriesId(
                event.target.value
              )
            }
            className="rounded-xl border border-white/10 bg-[#0b1016] px-4 py-3 text-sm outline-none"
          >
            <option value="">
              Semua Series
            </option>

            {series.map(item => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadChapters}
            className="rounded-xl bg-[#42A5F5] px-6 py-3 text-sm font-semibold text-black"
          >
            Cari
          </button>

        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          {loading ? (
            <div className="p-10 text-center text-gray-400">
              Memuat chapter...
            </div>
          ) : chapters.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Belum ada chapter.
            </div>
          ) : (
            <div className="divide-y divide-white/10">

              {chapters.map(
                chapter => (
                  <div
                    key={chapter.id}
                    className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>
                      <p className="font-semibold">
                        Chapter{' '}
                        {chapter.number} —{' '}
                        {chapter.title}
                      </p>

                      <p className="text-xs text-gray-500">
                        {chapter.series.title}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        /{chapter.slug}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">

                      <div className="rounded-lg bg-[#42A5F5]/10 px-3 py-2 text-sm text-[#42A5F5]">
                        {chapter.coinPrice}{' '}
                        Coin
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openUpload(
                            chapter.id
                          )
                        }
                        className="rounded-lg border border-[#42A5F5]/30 bg-[#42A5F5]/10 px-3 py-2 text-sm font-medium text-[#42A5F5] hover:bg-[#42A5F5]/20"
                      >
                        Upload Isi
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#080d14] p-5 shadow-2xl">

              <div className="mb-5 flex items-start justify-between gap-4">

                <div>
                  <h2 className="text-xl font-bold">
                    Upload Isi Chapter
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    Pilih beberapa halaman
                    sekaligus dari HP.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeUpload}
                  disabled={uploading}
                  className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  Tutup
                </button>

              </div>

              <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">

                <label className="mb-3 block text-sm font-medium">
                  Pilih halaman
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#42A5F5] file:px-4 file:py-2 file:font-medium file:text-black"
                />

                <p className="mt-2 text-xs text-gray-500">
                  JPEG, PNG, atau WebP.
                  Maksimal 5MB per gambar.
                </p>

                {selectedFiles.length >
                  0 && (
                  <p className="mt-3 text-sm text-[#42A5F5]">
                    {selectedFiles.length}{' '}
                    gambar dipilih.
                  </p>
                )}

              </div>

              {uploadError && (
                <div className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
                  {uploadError}
                </div>
              )}

              <button
                type="button"
                onClick={uploadImages}
                disabled={
                  uploading ||
                  selectedFiles.length ===
                    0
                }
                className="mb-6 w-full rounded-xl bg-[#42A5F5] px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? 'Mengupload... Jangan tutup halaman.'
                  : `Upload ${selectedFiles.length || ''} Gambar`}
              </button>

              <div>

                <div className="mb-3 flex items-center justify-between">

                  <h3 className="font-semibold">
                    Halaman yang sudah
                    diupload
                  </h3>

                  <span className="text-sm text-gray-500">
                    {images.length}{' '}
                    halaman
                  </span>

                </div>

                {images.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-gray-500">
                    Belum ada halaman.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">

                    {images.map(
                      image => (
                        <div
                          key={image.id}
                          className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/30"
                        >

                          {image.url ? (
                            <img
                              src={image.url}
                              alt={`Halaman ${image.pageNumber}`}
                              className="aspect-[3/4] w-full object-cover"
                            />
                          ) : (
                            <div className="flex aspect-[3/4] items-center justify-center text-xs text-gray-500">
                              Tidak ada
                              preview
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/75 px-2 py-2">

                            <span className="text-xs font-medium">
                              Halaman{' '}
                              {image.pageNumber}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                deleteImage(
                                  image.id
                                )
                              }
                              disabled={
                                uploading
                              }
                              className="rounded-md bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                            >
                              Hapus
                            </button>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  )
}
