/* ========================================
   ELLARIA エル - ANIMATION JAVASCRIPT
   Scroll animations and effects
======================================== */

/**
 * Animation Controller
 */
const AnimationController = {
    /**
     * Initialize animations
     */
    init: function () {
        this.setupScrollObserver();
        this.setupIntersectionObserver();
    },

    /**
     * Setup Intersection Observer for lazy loading
     */
    setupIntersectionObserver: function () {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px 100px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeIn');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all cards
        document.querySelectorAll('.card, .section-container').forEach(el => {
            observer.observe(el);
        });
    },

    /**
     * Setup scroll observer
     */
    setupScrollObserver: function () {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.updateScrollState();
                    ticking = false;
                });
                ticking = true;
            }
        });
    },

    /**
     * Update scroll state
     */
    updateScrollState: function () {
        const scrolled = window.scrollY > 50;
        const navbar = Utils.getById('navbar');
        if (navbar) {
            if (scrolled && !navbar.classList.contains('scrolled')) {
                navbar.classList.add('scrolled');
            } else if (!scrolled && navbar.classList.contains('scrolled')) {
                navbar.classList.remove('scrolled');
            }
        }
    }
};

/**
 * Initialize animations
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AnimationController.init());
} else {
    AnimationController.init();
}