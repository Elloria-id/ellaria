'use client'

import { useEffect, useState } from 'react'

type Payment = {
  id: string
  status: string
  amount: number
  createdAt: string
  user?: {
    id: string
    username: string
    email: string
  }
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadPayments() {
    try {
      setLoading(true)

      const response = await fetch(
        '/api/admin/payments',
        {
          cache: 'no-store',
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Gagal mengambil pembayaran'
        )
      }

      setPayments(result.data || [])
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
    loadPayments()
  }, [])

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Admin Payments
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Pantau transaksi pembayaran Ellaria.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          {loading ? (
            <div className="p-10 text-center text-gray-400">
              Memuat pembayaran...
            </div>
          ) : payments.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              Belum ada transaksi.
            </div>
          ) : (
            <div className="divide-y divide-white/10">

              {payments.map(payment => (
                <div
                  key={payment.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >

                  <div>
                    <p className="font-semibold">
                      {payment.user?.username ||
                        'Unknown User'}
                    </p>

                    <p className="text-xs text-gray-500">
                      {payment.user?.email || '-'}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      {new Date(
                        payment.createdAt
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">

                    <span className="text-sm">
                      Rp{' '}
                      {Number(
                        payment.amount || 0
                      ).toLocaleString('id-ID')}
                    </span>

                    <span className="rounded-lg bg-white/5 px-3 py-2 text-xs">
                      {payment.status}
                    </span>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>
    </main>
  )
}
