// Reader Page JavaScript

const ReaderController = {
    currentChapter: 1,
    totalChapters: 5,
    readerType: 'manga', // 'manga' or 'novel'

    init: function() {
        this.attachEventListeners();
        this.loadChapter();
    },

    attachEventListeners: function() {
        document.getElementById('back-btn').addEventListener('click', () => window.history.back());
        document.getElementById('prev-chapter-btn').addEventListener('click', () => this.previousChapter());
        document.getElementById('next-chapter-btn').addEventListener('click', () => this.nextChapter());
        document.getElementById('bookmark-btn').addEventListener('click', () => this.toggleBookmark());
        document.getElementById('settings-btn').addEventListener('click', () => this.toggleSettings());
        document.getElementById('close-settings').addEventListener('click', () => this.toggleSettings());
    },

    loadChapter: function() {
        const chapterText = document.getElementById('current-chapter');
        chapterText.textContent = `Chapter ${this.currentChapter}`;

        if (this.readerType === 'manga') {
            document.getElementById('manga-reader').style.display = 'block';
            document.getElementById('novel-reader').style.display = 'none';
        } else {
            document.getElementById('manga-reader').style.display = 'none';
            document.getElementById('novel-reader').style.display = 'block';
        }
    },

    nextChapter: function() {
        if (this.currentChapter < this.totalChapters) {
            this.currentChapter++;
            this.loadChapter();
        } else {
            alert('This is the last chapter');
        }
    },

    previousChapter: function() {
        if (this.currentChapter > 1) {
            this.currentChapter--;
            this.loadChapter();
        } else {
            alert('This is the first chapter');
        }
    },

    toggleBookmark: function() {
        const btn = document.getElementById('bookmark-btn');
        btn.classList.toggle('active');
        // Save to localStorage
        const bookmarks = Utils.getStorage('bookmarks') || [];
        if (!bookmarks.includes(this.currentChapter)) {
            bookmarks.push(this.currentChapter);
        } else {
            bookmarks = bookmarks.filter(c => c !== this.currentChapter);
        }
        Utils.setStorage('bookmarks', bookmarks);
    },

    toggleSettings: function() {
        const settings = document.getElementById('reader-settings');
        settings.style.display = settings.style.display === 'none' ? 'flex' : 'none';
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ReaderController.init());
} else {
    ReaderController.init();
}