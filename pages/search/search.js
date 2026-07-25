// Search Page JavaScript

const SearchController = {
    recentSearches: [],
    trendingSearches: ['Solo Leveling', 'Tower of God', 'Omniscient Reader', 'The Beginning After the End'],

    init: function() {
        this.loadRecentSearches();
        this.attachEventListeners();
        this.showInitialView();
    },

    attachEventListeners: function() {
        const input = document.getElementById('search-input');
        input.addEventListener('input', (e) => this.handleSearch(e.target.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.performSearch(e.target.value);
        });
    },

    handleSearch: function(query) {
        if (query.length === 0) {
            this.showInitialView();
            return;
        }

        // Perform search
        const results = this.filterResults(query);
        this.displayResults(results);
    },

    filterResults: function(query) {
        // Sample data
        const allSeries = [
            { title: 'Solo Leveling', id: 1 },
            { title: 'Tower of God', id: 2 },
            { title: 'Omniscient Reader', id: 3 },
        ];
        return allSeries.filter(s => s.title.toLowerCase().includes(query.toLowerCase()));
    },

    displayResults: function(results) {
        document.getElementById('recent-searches').style.display = 'none';
        document.getElementById('trending-searches').style.display = 'none';

        if (results.length === 0) {
            document.getElementById('search-results').style.display = 'none';
            document.getElementById('no-results').style.display = 'block';
            return;
        }

        document.getElementById('no-results').style.display = 'none';
        document.getElementById('search-results').style.display = 'block';
        const grid = document.getElementById('results-grid');
        grid.innerHTML = results.map(s => `
            <div class="series-card" onclick="window.location.href='/pages/detail/detail.html?id=${s.id}'">
                <img src="/assets/images/covers/placeholder.jpg" alt="${s.title}" class="card-image">
                <div class="card-content">
                    <h3 class="card-title">${s.title}</h3>
                </div>
            </div>
        `).join('');
    },

    showInitialView: function() {
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('recent-searches').style.display = 'block';
        document.getElementById('trending-searches').style.display = 'block';
        this.showTrendingTags();
    },

    showTrendingTags: function() {
        const container = document.getElementById('trending-tags');
        container.innerHTML = this.trendingSearches.map(tag => `
            <div class="tag" onclick="document.getElementById('search-input').value='${tag}'; this.handleSearch('${tag}')">${tag}</div>
        `).join('');
    },

    loadRecentSearches: function() {
        this.recentSearches = Utils.getStorage('recentSearches') || [];
    },

    performSearch: function(query) {
        if (query.length > 0) {
            this.recentSearches.unshift(query);
            this.recentSearches = this.recentSearches.slice(0, 10);
            Utils.setStorage('recentSearches', this.recentSearches);
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchController.init());
} else {
    SearchController.init();
}