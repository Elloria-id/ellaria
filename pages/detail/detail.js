// Detail Page JavaScript

const DetailController = {
    seriesId: null,
    series: null,

    init: function() {
        const params = new URLSearchParams(window.location.search);
        this.seriesId = params.get('id');
        this.loadSeriesData();
    },

    loadSeriesData: function() {
        // Sample data - replace with API call
        const seriesData = {
            1: {
                id: 1,
                title: 'Solo Leveling',
                cover: '/assets/images/covers/solo-leveling.jpg',
                author: 'Chugong',
                artist: 'Dubu (Redice Studio)',
                translator: 'Tim Penerjemah Ellaria',
                genre: 'Action, Fantasy, Supernatural',
                country: 'Korean',
                status: 'Completed',
                rating: 9.8,
                views: 150000,
                bookmarks: 45000,
                description: 'Sung Jinwoo adalah pemburu E-Rank yang lemah ketika tiba-tiba dia terpilih sebagai "pemain" dan mendapat kesempatan untuk naik level. Setiap pembunuhan membawanya lebih dekat ke kekuatan tertinggi.'
            }
        };
        
        this.series = seriesData[this.seriesId];
        if (this.series) {
            this.renderDetail();
        }
    },

    renderDetail: function() {
        const header = document.getElementById('detail-header');
        const info = document.getElementById('series-info');

        header.innerHTML = `
            <div class="detail-header-content">
                <img src="${this.series.cover}" alt="${this.series.title}" class="detail-cover">
                <div class="detail-info">
                    <h1 class="detail-title">${this.series.title}</h1>
                    <div class="detail-meta">
                        <div class="meta-item"><span class="meta-label">Status</span><span class="meta-value">${this.series.status}</span></div>
                        <div class="meta-item"><span class="meta-label">Rating</span><span class="meta-value">★ ${this.series.rating}</span></div>
                        <div class="meta-item"><span class="meta-label">Views</span><span class="meta-value">${this.series.views.toLocaleString()}</span></div>
                        <div class="meta-item"><span class="meta-label">Bookmarks</span><span class="meta-value">${this.series.bookmarks.toLocaleString()}</span></div>
                    </div>
                    <div class="detail-actions">
                        <button class="detail-btn" onclick="window.location.href='/pages/reader/reader.html?id=${this.series.id}'">Baca Sekarang</button>
                        <button class="detail-btn detail-btn-secondary">+ Bookmark</button>
                        <button class="detail-btn detail-btn-secondary">â❤️ Favorit</button>
                    </div>
                    <p class="description">${this.series.description}</p>
                </div>
            </div>
        `;

        info.innerHTML = `
            <div></div>
            <div>
                <h3 style="margin-bottom: var(--sp-lg);">Informasi Series</h3>
                <dl style="display: grid; gap: var(--sp-lg);">
                    <div><dt style="color: var(--text-secondary); font-size: var(--text-sm);">Penulis</dt><dd>${this.series.author}</dd></div>
                    <div><dt style="color: var(--text-secondary); font-size: var(--text-sm);">Artis</dt><dd>${this.series.artist}</dd></div>
                    <div><dt style="color: var(--text-secondary); font-size: var(--text-sm);">Penerjemah</dt><dd>${this.series.translator}</dd></div>
                    <div><dt style="color: var(--text-secondary); font-size: var(--text-sm);">Genre</dt><dd>${this.series.genre}</dd></div>
                    <div><dt style="color: var(--text-secondary); font-size: var(--text-sm);">Negara</dt><dd>${this.series.country}</dd></div>
                </dl>
            </div>
        `;
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DetailController.init());
} else {
    DetailController.init();
}