/* ========================================
   ELLARIA エル - HOMEPAGE JAVASCRIPT
   Homepage data loading and interactions
======================================== */

/**
 * Homepage Controller
 */
const HomepageController = {
    /**
     * Sample series data
     */
    seriesData: [
        {
            id: 1,
            title: 'Solo Leveling',
            cover: '/assets/images/covers/solo-leveling.jpg',
            genre: 'Action, Fantasy',
            rating: 9.8,
            views: 150000,
            bookmarks: 45000,
            status: 'Completed'
        },
        {
            id: 2,
            title: 'Tower of God',
            cover: '/assets/images/covers/tower-of-god.jpg',
            genre: 'Action, Adventure',
            rating: 9.5,
            views: 120000,
            bookmarks: 38000,
            status: 'Ongoing'
        },
        {
            id: 3,
            title: 'The Beginning After the End',
            cover: '/assets/images/covers/tbate.jpg',
            genre: 'Action, Fantasy',
            rating: 9.7,
            views: 130000,
            bookmarks: 42000,
            status: 'Ongoing'
        },
        {
            id: 4,
            title: 'Omniscient Reader',
            cover: '/assets/images/covers/omniscient-reader.jpg',
            genre: 'Fantasy, Supernatural',
            rating: 9.6,
            views: 110000,
            bookmarks: 35000,
            status: 'Ongoing'
        }
    ],

    /**
     * Initialize homepage
     */
    init: function () {
        this.loadUpdates();
        this.loadTrending();
    },

    /**
     * Load latest updates
     */
    loadUpdates: function () {
        const grid = Utils.getById('updates-grid');
        if (!grid) return;

        setTimeout(() => {
            grid.innerHTML = this.seriesData.map(series => this.createSeriesCard(series)).join('');
            this.attachCardListeners();
        }, 500);
    },

    /**
     * Load trending series
     */
    loadTrending: function () {
        const grid = Utils.getById('trending-grid');
        if (!grid) return;

        setTimeout(() => {
            grid.innerHTML = this.seriesData.map(series => this.createSeriesCard(series)).join('');
            this.attachCardListeners();
        }, 800);
    },

    /**
     * Create series card HTML
     */
    createSeriesCard: function (series) {
        return `
            <div class="series-card" data-id="${series.id}">
                <img src="${series.cover}" alt="${series.title}" class="card-image">
                <div class="card-content">
                    <h3 class="card-title">${series.title}</h3>
                    <div class="card-meta">
                        <span>★ ${series.rating}</span>
                        <span>${series.status}</span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Attach click listeners to cards
     */
    attachCardListeners: function () {
        document.querySelectorAll('.series-card').forEach(card => {
            card.addEventListener('click', function () {
                const seriesId = this.dataset.id;
                window.location.href = `/pages/detail/detail.html?id=${seriesId}`;
            });
        });
    }
};

/**
 * Initialize homepage
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HomepageController.init());
} else {
    HomepageController.init();
}