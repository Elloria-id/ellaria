import { useEffect, useState } from 'react'

type Series = {
  id: string
  title: string
  slug: string
}

export default function AdminSeries() {
  const [series, setSeries] = useState<Series[]>([])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const res = await fetch('/api/admin/series')
    if (res.ok) {
      const data = await res.json()
      setSeries(data)
    }
  }

  async function createSeries(e: any) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, slug }) })
    setLoading(false)
    if (res.ok) {
      setTitle('')
      setSlug('')
      load()
    } else {
      alert('Error')
    }
  }

  async function deleteSeries(id: string) {
    if (!confirm('Hapus series ini?')) return
    const res = await fetch('/api/admin/series', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) load()
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Manage Series</h1>
      <form className="mt-4 flex gap-2" onSubmit={createSeries}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="p-2 border rounded" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug" className="p-2 border rounded" />
        <button className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? '...' : 'Create'}</button>
      </form>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {series.map((s) => (
          <div key={s.id} className="p-3 bg-white rounded shadow">
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-gray-500">/{s.slug}</p>
            <div className="mt-2">
              <button className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => deleteSeries(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
