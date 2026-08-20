export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016]">

          <div className="h-32 bg-gradient-to-r from-[#42A5F5] to-[#0b1016]" />

          <div className="px-6 pb-8">

            <div className="-mt-12 mb-6 flex items-end justify-between">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#0b1016] bg-[#111820] text-3xl font-bold text-[#42A5F5]">
                E
              </div>

              <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10">
                Edit Profile
              </button>
            </div>

            <h1 className="text-2xl font-bold">
              Ellaria User
            </h1>

            <p className="mt-1 text-sm text-white/50">
              @user
            </p>

            <p className="mt-5 text-sm leading-6 text-white/70">
              Selamat datang di profil Ellaria.
              Di sini kamu nantinya bisa melihat informasi akun,
              bookmark, riwayat membaca, coin, level, badge, dan lainnya.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Coin
                </p>
                <p className="mt-1 text-xl font-bold">
                  0
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Level
                </p>
                <p className="mt-1 text-xl font-bold">
                  1
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Following
                </p>
                <p className="mt-1 text-xl font-bold">
                  0
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/40">
                  Followers
                </p>
                <p className="mt-1 text-xl font-bold">
                  0
                </p>
              </div>

            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">

              <a
                href="/bookmark"
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <h2 className="font-semibold">
                  Bookmark
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Lihat komik yang kamu simpan.
                </p>
              </a>

              <a
                href="/history"
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <h2 className="font-semibold">
                  Riwayat Membaca
                </h2>
                <p className="mt-1 text-sm text-white/50">
                  Lanjutkan komik yang terakhir kamu baca.
                </p>
              </a>

            </div>

          </div>
        </div>

      </div>
    </main>
  )
}
