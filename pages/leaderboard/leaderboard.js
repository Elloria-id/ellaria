/* Leaderboard JS - dummy data + simple filters */

const Leaderboard = (function () {
  const DATA = [];

  // generate dummy data
  const genres = ['Action','Romance','Fantasy','Slice of Life','Comedy','Isekai','Drama'];
  for (let i = 1; i <= 50; i++) {
    DATA.push({
      id: i,
      rankScore: Math.floor(10000 - i * Math.random() * 100),
      title: `Series Example ${i}`,
      author: `Author ${Math.ceil(i/3)}`,
      cover: `/assets/images/covers/cover${(i%6)+1}.jpg`,
      genre: genres[i % genres.length],
      views: Math.floor(1000 + Math.random() * 90000),
      likes: Math.floor(Math.random() * 5000),
      updated: `${Math.ceil(Math.random()*28)} Aug 2026`
    });
  }

  let state = {
    range: 'daily',
    query: '',
    limit: 12
  };

  function render() {
    const container = document.getElementById('leaderboard-grid');
    if (!container) return;

    // filter and sort
    let items = DATA.slice();
    if (state.query) {
      const q = state.query.toLowerCase();
      items = items.filter(it => it.title.toLowerCase().includes(q) || it.author.toLowerCase().includes(q));
    }

    // simple sorting depending on range
    items.sort((a,b) => {
      if (state.range === 'daily') return b.rankScore - a.rankScore;
      if (state.range === 'weekly') return b.views - a.views;
      return b.likes - a.likes; // monthly
    });

    items = items.slice(0, state.limit);

    container.innerHTML = items.map((it, idx) => {
      const rank = idx + 1;
      return `
        <article class="card-leaderboard">
          <div class="rank">${rank}</div>
          <img class="series-cover" src="${it.cover}" alt="${it.title}">
          <div class="leaderboard-info">
            <div class="series-title">${it.title}</div>
            <div class="series-meta">by ${it.author} • ${it.genre} • Updated ${it.updated}</div>
            <div class="metric">
              <div>Views: <strong>${numberWithCommas(it.views)}</strong></div>
              <div>Likes: <strong>${numberWithCommas(it.likes)}</strong></div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function attach() {
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.range = e.currentTarget.dataset.range;
        render();
      });
    });

    const search = document.getElementById('leaderboard-search');
    if (search) {
      search.addEventListener('input', (e) => {
        state.query = e.target.value.trim();
        render();
      });
    }

    const loadMore = document.getElementById('load-more');
    if (loadMore) {
      loadMore.addEventListener('click', () => {
        state.limit += 12;
        render();
      });
    }
  }

  return {
    init: function () {
      attach();
      render();
    }
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Leaderboard.init());
} else {
  Leaderboard.init();
}
