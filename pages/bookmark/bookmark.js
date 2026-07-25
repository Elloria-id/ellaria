// Bookmark Page JavaScript

const BookmarkController = {
    currentCategory: 'reading',
    bookmarks: {
        reading: [
            { id: 1, title: 'Solo Leveling', cover: '/assets/images/covers/solo-leveling.jpg', progress: 65, lastChapter: 150 }
        ],
        completed: [],
        planned: [],
        dropped: [],
        favorites: []
    },

    init: function() {
        this.attachEventListeners();
        this.loadBookmarks();
        this.displayBookmarks();
    },

    attachEventListeners: function() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.displayBookmarks();
            });
        });
    },

    loadBookmarks: function() {
        // Load from localStorage or API
        const saved = Utils.getStorage('bookmarks');
        if (saved) {
            this.bookmarks = saved;
        }
    },

    displayBookmarks: function() {
        const grid = document.getElementById('bookmarks-grid');
        const empty = document.getElementById('empty-state');
        const bookmarks = this.bookmarks[this.currentCategory] || [];

        if (bookmarks.length === 0) {
            grid.style.display = 'none';
            empty.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        empty.style.display = 'none';
        grid.innerHTML = bookmarks.map(b => `
            <div class="bookmark-card">
                <img src="${b.cover}" alt="${b.title}" class="bookmark-cover">
                <div class="bookmark-info">
                    <h4 class="bookmark-title">${b.title}</h4>
                    <div class="bookmark-progress">${b.progress}% - Chapter ${b.lastChapter}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${b.progress}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BookmarkController.init());
} else {
    BookmarkController.init();
}