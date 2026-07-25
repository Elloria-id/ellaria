// Explore Page JavaScript

const ExploreController = {
    allSeries: [
        { id: 1, title: 'Solo Leveling', genre: 'action', status: 'completed', rating: 9.8, cover: '/assets/images/covers/solo-leveling.jpg' },
        { id: 2, title: 'Tower of God', genre: 'fantasy', status: 'ongoing', rating: 9.5, cover: '/assets/images/covers/tower-of-god.jpg' },
        { id: 3, title: 'The Beginning After the End', genre: 'fantasy', status: 'ongoing', rating: 9.7, cover: '/assets/images/covers/tbate.jpg' },
        { id: 4, title: 'Omniscient Reader', genre: 'fantasy', status: 'ongoing', rating: 9.6, cover: '/assets/images/covers/omniscient-reader.jpg' },
    ],

    init: function() {
        this.attachEventListeners();
        this.renderSeries(this.allSeries);
    },

    attachEventListeners: function() {
        document.getElementById('explore-search').addEventListener('input', () => this.filterSeries());
        document.getElementById('genre-filter').addEventListener('change', () => this.filterSeries());
        document.getElementById('status-filter').addEventListener('change', () => this.filterSeries());
        document.getElementById('sort-filter').addEventListener('change', () => this.filterSeries());
    },

    filterSeries: function() {
        const search = document.getElementById('explore-search').value.toLowerCase();
        const genre = document.getElementById('genre-filter').value;
        const status = document.getElementById('status-filter').value;
        const sort = document.getElementById('sort-filter').value;

        let filtered = this.allSeries.filter(series => {
            const matchSearch = series.title.toLowerCase().includes(search);
            const matchGenre = !genre || series.genre === genre;
            const matchStatus = !status || series.status === status;
            return matchSearch && matchGenre && matchStatus;
        });

        // Sort
        if (sort === 'rating') {
            filtered.sort((a, b) => b.rating - a.rating);
        }

        this.renderSeries(filtered);
    },

    renderSeries: function(series) {
        const grid = document.getElementById('explore-grid');
        const noResults = document.getElementById('no-results');

        if (series.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        noResults.style.display = 'none';

        grid.innerHTML = series.map(s => `
            <div class="series-card" onclick="window.location.href='/pages/detail/detail.html?id=${s.id}'" style="cursor:pointer;">
                <img src="${s.cover}" alt="${s.title}" class="card-image">
                <div class="card-content">
                    <h3 class="card-title">${s.title}</h3>
                    <div class="card-meta">
                        <span>★ ${s.rating}</span>
                        <span>${s.status}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ExploreController.init());
} else {
    ExploreController.init();
}