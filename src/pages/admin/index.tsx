import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'

export default function AdminIndex() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <p className="mt-3">Anda harus login sebagai admin untuk melihat halaman ini.</p>
        <button className="mt-3 px-3 py-2 bg-blue-600 text-white rounded" onClick={() => signIn()}>Login</button>
      </div>
    )
  }

  // @ts-ignore
  if ((session.user as any).role !== 'ADMIN') {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold">Admin</h1>
        <p className="mt-3">Akses ditolak. Akun Anda bukan admin.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/series"><a className="p-4 bg-white rounded shadow">Manage Series</a></Link>
        <Link href="/admin/chapters"><a className="p-4 bg-white rounded shadow">Manage Chapters</a></Link>
        <Link href="/admin/users"><a className="p-4 bg-white rounded shadow">Manage Users</a></Link>
      </div>
    </div>
  )
}
