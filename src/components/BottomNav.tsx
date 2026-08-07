export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 sm:hidden">
      <div className="max-w-5xl mx-auto flex justify-around">
        <a href="/">Home</a>
        <a href="/search">Search</a>
        <a href="/bookmark">Bookmark</a>
        <a href="/history">History</a>
        <a href="/pages/leaderboard/leaderboard.html">Leaderboard</a>
      </div>
    </nav>
  )
}
