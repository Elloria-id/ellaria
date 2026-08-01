import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function submit(e: any) {
    e.preventDefault()
    try {
      const res = await axios.post('/api/auth/register', { email, password, name })
      if (res.status === 201) {
        setMsg('Registered. You can now login.')
        setTimeout(() => router.push('/login'), 1200)
      }
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Error')
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={submit}>
        <input className="w-full p-2 border rounded mb-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="w-full p-2 bg-blue-600 text-white rounded">Register</button>
      </form>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </div>
  )
}
