/* ========================================
   ELLARIA エル - ANNOUNCEMENT JAVASCRIPT
   Announcement bar carousel functionality
======================================== */

/**
 * Announcement Controller
 */
const AnnouncementController = {
    currentIndex: 0,
    announcements: [
        'Selamat datang di Ellaria エル - Platform membaca terpercaya Anda',
        'Update terbaru: Solo Leveling Chapter 180 telah tersedia',
        'Dapatkan akses VIP dan nikmati semua manga premium tanpa batas',
        'Bergabunglah dengan komunitas Ellaria dan temukan pembaca lainnya'
    ],

    /**
     * Initialize announcement
     */
    init: function () {
        this.attachEventListeners();
        this.rotateAnnouncement();
    },

    /**
     * Attach event listeners
     */
    attachEventListeners: function () {
        const prevBtn = Utils.getById('announcement-prev');
        const nextBtn = Utils.getById('announcement-next');
        const closeBtn = Utils.getById('announcement-close');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    },

    /**
     * Rotate announcement
     */
    rotateAnnouncement: function () {
        this.updateText();
        setInterval(() => {
            this.currentIndex = (this.currentIndex + 1) % this.announcements.length;
            this.updateText();
        }, 5000);
    },

    /**
     * Update announcement text
     */
    updateText: function () {
        const textEl = Utils.getById('announcement-text');
        if (textEl) {
            textEl.textContent = this.announcements[this.currentIndex];
        }
    },

    /**
     * Next announcement
     */
    next: function () {
        this.currentIndex = (this.currentIndex + 1) % this.announcements.length;
        this.updateText();
    },

    /**
     * Previous announcement
     */
    previous: function () {
        this.currentIndex = (this.currentIndex - 1 + this.announcements.length) % this.announcements.length;
        this.updateText();
    },

    /**
     * Close announcement bar
     */
    close: function () {
        const bar = Utils.getById('announcement-bar');
        if (bar) {
            bar.style.display = 'none';
        }
    }
};

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnnouncementController.init());
} else {
    AnnouncementController.init();
}