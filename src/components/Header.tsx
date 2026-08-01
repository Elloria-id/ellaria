export default function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/60 dark:bg-black/60">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-3">
        <a href="/" className="text-xl font-bold">Ellaria</a>
        <div className="flex items-center gap-3">
          <input
            className="hidden sm:block w-72 px-3 py-2 rounded bg-gray-100"
            placeholder="Cari judul, genre, author..."
          />
          <a className="px-3 py-2 bg-blue-600 text-white rounded" href="/login">Login</a>
        </div>
      </div>
    </header>
  )
}
