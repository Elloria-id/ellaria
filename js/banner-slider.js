/* ========================================
   ELLARIA エル - BANNER SLIDER JAVASCRIPT
   Hero banner auto-slider functionality
======================================== */

/**
 * Banner Slider Controller
 */
const BannerSlider = {
    currentSlide: 0,
    totalSlides: 0,
    slides: [],
    autoPlayInterval: null,
    autoPlayDelay: 5000, // 5 seconds

    /**
     * Sample banner data
     */
    bannerData: [
        {
            title: 'Solo Leveling',
            genre: 'Action • Fantasy • Supernatural',
            subtitle: 'Seorang pemburu lemah yang tiba-tiba mendapatkan kekuatan luar biasa',
            status: 'Completed',
            rating: '9.8',
            background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.8), rgba(66, 165, 245, 0.3))',
            image: '/assets/images/banners/banner-1.jpg',
            cover: '/assets/images/banners/cover-1.jpg'
        },
        {
            title: 'Tower of God',
            genre: 'Action • Adventure • Fantasy',
            subtitle: 'Perjalanan menembus menara legendaris menuju puncak',
            status: 'Ongoing',
            rating: '9.5',
            background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.8), rgba(66, 165, 245, 0.3))',
            image: '/assets/images/banners/banner-2.jpg',
            cover: '/assets/images/banners/cover-2.jpg'
        },
        {
            title: 'The Beginning After the End',
            genre: 'Action • Adventure • Fantasy',
            subtitle: 'Pendekar legendaris lahir kembali di dunia baru',
            status: 'Ongoing',
            rating: '9.7',
            background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.8), rgba(66, 165, 245, 0.3))',
            image: '/assets/images/banners/banner-3.jpg',
            cover: '/assets/images/banners/cover-3.jpg'
        }
    ],

    /**
     * Initialize banner slider
     */
    init: function () {
        const container = Utils.getById('banner-container');
        if (!container) return;

        this.totalSlides = this.bannerData.length;
        this.renderBanners();
        this.createDots();
        this.attachEventListeners();
        this.startAutoPlay();
    },

    /**
     * Render banner HTML
     */
    renderBanners: function () {
        const container = Utils.getById('banner-container');
        if (!container) return;

        container.innerHTML = '';
        this.bannerData.forEach((banner, index) => {
            const slide = document.createElement('div');
            slide.className = 'banner-slide' + (index === 0 ? ' active' : '');
            slide.style.backgroundImage = `${banner.background}, url('${banner.image}')`;
            slide.innerHTML = `
                <div class="banner-content">
                    <h2 class="banner-title">${banner.title}</h2>
                    <p class="banner-genre">${banner.genre}</p>
                    <p class="banner-subtitle">${banner.subtitle}</p>
                    <div class="banner-meta">
                        <span class="badge-status">${banner.status}</span>
                        <div class="banner-rating">
                            <span class="stars">★★★★★</span>
                            <span>(${banner.rating}/10)</span>
                        </div>
                    </div>
                    <button class="banner-btn">Baca Sekarang</button>
                </div>
                <img src="${banner.cover}" alt="${banner.title}" class="banner-cover">
            `;
            container.appendChild(slide);
        });
        this.slides = document.querySelectorAll('.banner-slide');
    },

    /**
     * Create dots for pagination
     */
    createDots: function () {
        const dotsContainer = Utils.getById('banner-dots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';
        for (let i = 0; i < this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'banner-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => this.goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    },

    /**
     * Attach event listeners
     */
    attachEventListeners: function () {
        const prevBtn = Utils.getById('banner-prev');
        const nextBtn = Utils.getById('banner-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSlide());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSlide());
        }

        // Reset autoplay on user interaction
        document.querySelectorAll('.banner-btn-prev, .banner-btn-next, .banner-dot').forEach(el => {
            el.addEventListener('click', () => this.restartAutoPlay());
        });
    },

    /**
     * Go to specific slide
     */
    goToSlide: function (index) {
        if (index < 0 || index >= this.totalSlides) return;

        // Remove active class from all slides and dots
        this.slides.forEach(slide => Utils.removeClass(slide, 'active'));
        document.querySelectorAll('.banner-dot').forEach(dot => Utils.removeClass(dot, 'active'));

        // Add active class to current slide and dot
        this.currentSlide = index;
        Utils.addClass(this.slides[this.currentSlide], 'active');
        const dots = document.querySelectorAll('.banner-dot');
        if (dots[this.currentSlide]) {
            Utils.addClass(dots[this.currentSlide], 'active');
        }
    },

    /**
     * Next slide
     */
    nextSlide: function () {
        this.goToSlide((this.currentSlide + 1) % this.totalSlides);
    },

    /**
     * Previous slide
     */
    previousSlide: function () {
        this.goToSlide((this.currentSlide - 1 + this.totalSlides) % this.totalSlides);
    },

    /**
     * Start auto play
     */
    startAutoPlay: function () {
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    },

    /**
     * Restart auto play
     */
    restartAutoPlay: function () {
        clearInterval(this.autoPlayInterval);
        this.startAutoPlay();
    },

    /**
     * Stop auto play
     */
    stopAutoPlay: function () {
        clearInterval(this.autoPlayInterval);
    }
};

/**
 * Initialize banner slider when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BannerSlider.init());
} else {
    BannerSlider.init();
}