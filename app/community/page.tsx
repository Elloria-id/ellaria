import Link from 'next/link'
import {
  MessageSquare,
  MessagesSquare,
  Users,
  BookOpen,
  Send,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react'

export const metadata = {
  title: 'Community - Ellaria',
  description: 'Tempat pengguna berdiskusi dan berinteraksi di Ellaria.',
}

export default function CommunityPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:py-8">
      {/* 1. HEADER SECTION */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Community
        </h1>
        <p className="mt-1.5 text-xs text-white/50 sm:text-sm">
          Ruang berdiskusi, berbagi rekomendasi, dan berinteraksi sesama pembaca serta kreator di Ellaria.
        </p>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* 2. GLOBAL CHAT CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016] p-5 sm:p-6 lg:col-span-2">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#42A5F5]/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#42A5F5]/15 text-[#42A5F5]">
                  <MessagesSquare className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#42A5F5]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#42A5F5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#42A5F5] animate-pulse" />
                    Ruang Publik
                  </span>
                  <h2 className="text-xl font-bold text-white">
                    Global Chat
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Bergabunglah dalam percakapan publik real-time bersama komunitas Ellaria. Diskusi seputar series favorit, rekomendasi terbaru, atau sekadar menyapa sesama pembaca.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <Users className="h-4 w-4 text-[#42A5F5]" />
                <span>Terbuka untuk semua pengguna</span>
              </div>

              <Link
                href="/community/chat"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#42A5F5] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#42A5F5]/90 active:scale-[0.98]"
              >
                <MessageSquare className="h-4 w-4" />
                Open Global Chat
              </Link>
            </div>
          </div>
        </div>

        {/* 4. REQUEST CARD */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016] p-5 sm:p-6">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#42A5F5]/15 text-[#42A5F5]">
                <Send className="h-5 w-5" />
              </div>

              <h2 className="mt-4 text-lg font-bold text-white">
                Series Request
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Punya judul series yang ingin dibaca atau diterjemahkan di Ellaria? Kirimkan permintaan kamu di sini.
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <Link
                href="/request"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-[#42A5F5]/50 hover:bg-white/10"
              >
                <span>Ajukan Request</span>
                <ArrowRight className="h-4 w-4 text-[#42A5F5]" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. SERIES COMMUNITY */}
        <div className="rounded-2xl border border-white/10 bg-[#0b1016] p-5 sm:p-6 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#42A5F5]/10 text-[#42A5F5]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Series Community
              </h2>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center sm:py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/30">
              <Users className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-white">
              Belum Ada Komunitas Series
            </h3>

            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-white/45">
              Komunitas khusus tiap series akan segera tersedia secara otomatis saat fitur komunitas per judul dirilis.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/search?type=series"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <Search className="h-4 w-4 text-[#42A5F5]" />
                Jelajahi Series
              </Link>

              <div className="inline-flex items-center gap-2 rounded-xl bg-[#42A5F5]/10 px-4 py-2 text-sm font-medium text-[#42A5F5]">
                <Sparkles className="h-4 w-4" />
                Segera Hadir
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
