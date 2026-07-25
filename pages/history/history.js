// History Page JavaScript

const HistoryController = {
    history: [],

    init: function() {
        this.loadHistory();
        this.attachEventListeners();
        this.displayHistory();
    },

    attachEventListeners: function() {
        document.getElementById('history-search').addEventListener('input', (e) => this.filterHistory(e.target.value));
        document.getElementById('clear-history').addEventListener('click', () => this.clearAllHistory());
    },

    loadHistory: function() {
        this.history = Utils.getStorage('readingHistory') || [
            { id: 1, title: 'Solo Leveling', cover: '/assets/images/covers/solo-leveling.jpg', lastChapter: 150, lastRead: '2 hours ago' },
            { id: 2, title: 'Tower of God', cover: '/assets/images/covers/tower-of-god.jpg', lastChapter: 200, lastRead: '1 day ago' }
        ];
    },

    displayHistory: function() {
        const list = document.getElementById('history-list');
        const empty = document.getElementById('empty-state');

        if (this.history.length === 0) {
            list.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        list.style.display = 'flex';
        empty.style.display = 'none';
        list.innerHTML = this.history.map(h => `
            <div class="history-item">
                <img src="${h.cover}" alt="${h.title}" class="history-cover">
                <div class="history-info">
                    <h4>${h.title}</h4>
                    <div class="history-meta">
                        <span>Chapter ${h.lastChapter}</span>
                        <span>Dibaca ${h.lastRead}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" onclick="window.location.href='/pages/reader/reader.html?id=${h.id}'">Lanjutkan</button>
                    <button class="history-action-btn" onclick="HistoryController.removeHistory(${h.id})">Hapus</button>
                </div>
            </div>
        `).join('');
    },

    filterHistory: function(query) {
        const filtered = this.history.filter(h => h.title.toLowerCase().includes(query.toLowerCase()));
        const list = document.getElementById('history-list');
        list.innerHTML = filtered.map(h => `
            <div class="history-item">
                <img src="${h.cover}" alt="${h.title}" class="history-cover">
                <div class="history-info">
                    <h4>${h.title}</h4>
                    <div class="history-meta">
                        <span>Chapter ${h.lastChapter}</span>
                        <span>Dibaca ${h.lastRead}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" onclick="window.location.href='/pages/reader/reader.html?id=${h.id}'">Lanjutkan</button>
                </div>
            </div>
        `).join('');
    },

    removeHistory: function(id) {
        this.history = this.history.filter(h => h.id !== id);
        Utils.setStorage('readingHistory', this.history);
        this.displayHistory();
    },

    clearAllHistory: function() {
        if (confirm('Hapus semua riwayat bacaan?')) {
            this.history = [];
            Utils.setStorage('readingHistory', []);
            this.displayHistory();
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HistoryController.init());
} else {
    HistoryController.init();
}