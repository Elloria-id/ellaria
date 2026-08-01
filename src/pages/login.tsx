import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const { data: session } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (session) {
    return (
      <div className="max-w-md mx-auto p-4">
        <p>Signed in as {session.user?.email}</p>
        <button onClick={() => signOut()} className="mt-3 px-3 py-2 bg-gray-200 rounded">Sign out</button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={(e) => { e.preventDefault(); signIn('credentials', { email, password, callbackUrl: '/' }) }}>
        <input className="w-full p-2 border rounded mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Login</button>
      </form>
      <p className="mt-3">No account? <Link href="/register"><a className="text-blue-600">Register</a></Link></p>
    </div>
  )
}
