export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Leaderboard
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Lihat pengguna terbaik di Ellaria.
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto">
          <button className="rounded-xl bg-[#42A5F5] px-5 py-2.5 text-sm font-semibold text-black">
            Pembaca
          </button>

          <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm">
            Translator
          </button>

          <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm">
            Donatur
          </button>

          <button className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm">
            Komunitas
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">

          <div className="mb-6 text-center">
            <p className="text-sm text-white/40">
              Leaderboard belum tersedia
            </p>

            <p className="mt-2 text-xs text-white/30">
              Data peringkat akan muncul setelah sistem leaderboard
              Ellaria diaktifkan.
            </p>
          </div>

          <div className="space-y-3">

            <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
              <span className="w-8 text-center text-lg font-bold text-[#42A5F5]">
                1
              </span>

              <div className="h-10 w-10 rounded-full bg-white/10" />

              <div className="flex-1">
                <p className="font-semibold">
                  -
                </p>

                <p className="text-xs text-white/40">
                  Belum ada data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
              <span className="w-8 text-center text-lg font-bold">
                2
              </span>

              <div className="h-10 w-10 rounded-full bg-white/10" />

              <div className="flex-1">
                <p className="font-semibold">
                  -
                </p>

                <p className="text-xs text-white/40">
                  Belum ada data
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
              <span className="w-8 text-center text-lg font-bold">
                3
              </span>

              <div className="h-10 w-10 rounded-full bg-white/10" />

              <div className="flex-1">
                <p className="font-semibold">
                  -
                </p>

                <p className="text-xs text-white/40">
                  Belum ada data
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}
