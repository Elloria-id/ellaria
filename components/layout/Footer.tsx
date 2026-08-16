import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-6 text-center text-sm text-gray-400">
      <div className="container mx-auto">
        <div className="flex items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} Ellaria</span>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  )
}
