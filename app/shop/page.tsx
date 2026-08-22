export default function ShopPage() {
  return (
    <main className="min-h-screen bg-[#05070a] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Ellaria Shop
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Gunakan Coin untuk membeli chapter, VIP, dan item Ellaria.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
              Coin
            </div>

            <h2 className="text-xl font-semibold">
              Ellaria Coin
            </h2>

            <p className="mt-2 text-sm text-white/50">
              Beli Coin untuk membuka chapter premium dan fitur lainnya.
            </p>

            <button className="mt-6 w-full rounded-xl bg-[#42A5F5] px-4 py-3 font-semibold text-black transition hover:opacity-90">
              Beli Coin
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
              VIP
            </div>

            <h2 className="text-xl font-semibold">
              VIP
            </h2>

            <p className="mt-2 text-sm text-white/50">
              Dapatkan akses dan keuntungan khusus untuk member VIP.
            </p>

            <button className="mt-6 w-full rounded-xl border border-[#42A5F5]/40 px-4 py-3 font-semibold text-[#42A5F5] transition hover:bg-[#42A5F5]/10">
              Lihat VIP
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-6">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#42A5F5]/10 text-[#42A5F5]">
              Item
            </div>

            <h2 className="text-xl font-semibold">
              Item
            </h2>

            <p className="mt-2 text-sm text-white/50">
              Avatar frame, title, badge, dan item lainnya.
            </p>

            <button className="mt-6 w-full rounded-xl border border-white/10 px-4 py-3 font-semibold transition hover:bg-white/5">
              Lihat Item
            </button>
          </div>

        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0b1016] p-6">
          <h2 className="text-lg font-semibold">
            Fitur Shop
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/50">
            Sistem pembelian Coin, VIP, voucher, dan item akan
            dihubungkan dengan database dan sistem pembayaran setelah
            halaman dasar Ellaria selesai diperbaiki.
          </p>
        </div>

      </div>
    </main>
  )
}
