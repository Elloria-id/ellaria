export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Community
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Temukan komunitas dan berbagi bersama pengguna Ellaria.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
              Global
            </div>

            <h2 className="text-xl font-semibold">
              Global Chat
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Ngobrol dan berinteraksi dengan pengguna Ellaria lainnya.
            </p>

            <button className="mt-5 w-full rounded-xl bg-[#42A5F5] px-4 py-3 font-semibold text-black transition hover:opacity-90">
              Masuk Chat
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
              Series
            </div>

            <h2 className="text-xl font-semibold">
              Series Community
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Bergabung dengan komunitas berdasarkan series favoritmu.
            </p>

            <button className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:bg-white/10">
              Lihat Komunitas
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
              Request
            </div>

            <h2 className="text-xl font-semibold">
              Request
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Ajukan manga, manhwa, manhua, atau novel yang ingin kamu baca.
            </p>

            <button className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold transition hover:bg-white/10">
              Buat Request
            </button>
          </div>

        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1016] p-6">
          <h2 className="text-lg font-semibold">
            Community Ellaria
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Sistem komunitas, chat, komentar, dan fitur sosial Ellaria
            akan dikembangkan setelah seluruh halaman utama selesai
            diperbaiki.
          </p>
        </div>

      </div>
    </main>
  )
}
