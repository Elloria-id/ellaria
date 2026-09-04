import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { authOptions } from '@/lib/auth/auth'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export default async function VIPPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const [plans, vip] = await Promise.all([
    prisma.vIPPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        days: 'asc',
      },
    }),
    prisma.userVIP.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        plan: true,
      },
    }),
  ])

  const now = new Date()
  const isActive = !!vip && vip.expiresAt > now

  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 pb-24 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#42A5F5]/30 bg-[#42A5F5]/10 text-2xl text-[#42A5F5]">
            VIP
          </div>

          <h1 className="text-3xl font-bold">
            Ellaria VIP
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Dapatkan pengalaman membaca yang lebih nyaman dengan benefit khusus VIP.
          </p>
        </div>

        {/* Current Status */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-[#0b1016] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-white/50">
                Status VIP kamu
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                {isActive ? 'VIP Aktif' : 'Belum Aktif'}
              </h2>

              {isActive && vip && (
                <p className="mt-2 text-sm text-white/50">
                  Berlaku sampai{' '}
                  {new Date(vip.expiresAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isActive
                  ? 'bg-[#42A5F5]/15 text-[#42A5F5]'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {isActive ? 'AKTIF' : 'NONAKTIF'}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">
            Benefit VIP
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              'Pengalaman membaca lebih nyaman',
              'Akses benefit khusus member VIP',
              'Prioritas untuk fitur premium Ellaria',
              'Benefit tambahan akan terus dikembangkan',
            ].map((benefit) => (
              <div
                key={benefit}
                className="rounded-xl border border-white/10 bg-[#0b1016] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[#42A5F5]">✓</span>
                  <span className="text-sm text-white/75">
                    {benefit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Pilih Paket VIP
            </h2>

            <p className="mt-1 text-sm text-white/50">
              Pilih durasi VIP yang sesuai dengan kebutuhanmu.
            </p>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-8 text-center">
              <p className="text-white/60">
                Belum ada paket VIP yang tersedia.
              </p>

              <p className="mt-2 text-xs text-white/40">
                Paket VIP akan tersedia setelah pengaturan paket selesai.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016] p-6"
                >
                  {plan.days >= 30 && (
                    <div className="absolute right-4 top-4 rounded-full bg-[#42A5F5]/10 px-3 py-1 text-xs font-semibold text-[#42A5F5]">
                      Populer
                    </div>
                  )}

                  <p className="text-sm text-white/50">
                    Paket
                  </p>

                  <h3 className="mt-1 text-2xl font-bold">
                    {plan.name}
                  </h3>

                  <div className="mt-5">
                    <span className="text-3xl font-bold text-[#42A5F5]">
                      Rp{plan.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-white/50">
                    {plan.days} hari
                  </p>

                  {plan.description && (
                    <p className="mt-4 text-sm leading-6 text-white/60">
                      {plan.description}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full cursor-not-allowed rounded-xl bg-[#42A5F5]/30 px-4 py-3 font-semibold text-white/50"
                  >
                    Pembelian segera tersedia
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Note */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1016] p-5">
          <p className="text-sm leading-6 text-white/50">
            Sistem paket VIP sudah terhubung dengan database Ellaria.
            Pembelian otomatis akan diaktifkan setelah sistem pembayaran
            VIP selesai dihubungkan.
          </p>

          <Link
            href="/shop"
            className="mt-4 inline-block text-sm font-semibold text-[#42A5F5]"
          >
            Kembali ke Shop →
          </Link>
        </div>

      </div>
    </main>
  )
}
