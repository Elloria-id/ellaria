/* ========================================
   ELLARIA エル - NAVBAR JAVASCRIPT
   Navigation and menu interactions
======================================== */

/**
 * Navbar Controller
 */
const NavbarController = {
    navbar: null,
    menuToggle: null,
    navbarMenu: null,
    profileBtn: null,
    profileDropdown: null,
    searchBtn: null,
    modalSearch: null,
    searchInput: null,
    modalSearchClose: null,

    /**
     * Initialize navbar
     */
    init: function () {
        this.navbar = Utils.getById('navbar');
        this.menuToggle = Utils.getById('menu-toggle');
        this.navbarMenu = Utils.getById('navbar-menu');
        this.profileBtn = Utils.getById('profile-btn');
        this.profileDropdown = Utils.getById('profile-dropdown');
        this.searchBtn = Utils.getById('search-btn');
        this.modalSearch = Utils.getById('modal-search');
        this.searchInput = Utils.getById('search-input');
        this.modalSearchClose = Utils.getById('modal-search-close');

        this.attachEventListeners();
        this.setupScrollListener();
    },

    /**
     * Attach event listeners
     */
    attachEventListeners: function () {
        // Menu toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleMenu());
        }

        // Profile dropdown
        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', () => this.toggleProfileDropdown());
        }

        // Search modal
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.openSearch());
        }

        if (this.modalSearchClose) {
            this.modalSearchClose.addEventListener('click', () => this.closeSearch());
        }

        if (this.modalSearch) {
            this.modalSearch.addEventListener('click', (e) => {
                if (e.target === this.modalSearch) {
                    this.closeSearch();
                }
            });
        }

        // Search input
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeSearch();
            });
        }

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.navbar-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMenu();
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.profileBtn && !this.profileBtn.contains(e.target) && 
                this.profileDropdown && !this.profileDropdown.contains(e.target)) {
                this.closeProfileDropdown();
            }
        });
    },

    /**
     * Toggle menu
     */
    toggleMenu: function () {
        Utils.toggleClass(this.menuToggle, 'active');
        Utils.toggleClass(this.navbarMenu, 'active');
    },

    /**
     * Close menu
     */
    closeMenu: function () {
        Utils.removeClass(this.menuToggle, 'active');
        Utils.removeClass(this.navbarMenu, 'active');
    },

    /**
     * Toggle profile dropdown
     */
    toggleProfileDropdown: function () {
        if (!this.profileDropdown) return;
        if (this.profileDropdown.style.display === 'none') {
            this.profileDropdown.style.display = 'block';
        } else {
            this.profileDropdown.style.display = 'none';
        }
    },

    /**
     * Close profile dropdown
     */
    closeProfileDropdown: function () {
        if (this.profileDropdown) {
            this.profileDropdown.style.display = 'none';
        }
    },

    /**
     * Open search modal
     */
    openSearch: function () {
        if (this.modalSearch) {
            this.modalSearch.style.display = 'flex';
            if (this.searchInput) {
                this.searchInput.focus();
            }
        }
    },

    /**
     * Close search modal
     */
    closeSearch: function () {
        if (this.modalSearch) {
            this.modalSearch.style.display = 'none';
            if (this.searchInput) {
                this.searchInput.value = '';
            }
        }
    },

    /**
     * Handle search input
     */
    handleSearch: function (e) {
        const query = e.target.value.trim();
        if (query.length < 2) {
            Utils.getById('search-results').innerHTML = '';
            return;
        }
        // TODO: Implement search functionality
        console.log('Search:', query);
    },

    /**
     * Setup scroll listener for navbar
     */
    setupScrollListener: function () {
        let lastScrollTop = 0;
        window.addEventListener('scroll', Utils.throttle(() => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > 50) {
                Utils.addClass(this.navbar, 'scrolled');
            } else {
                Utils.removeClass(this.navbar, 'scrolled');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        }, 50));
    }
};

/**
 * Initialize navbar when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NavbarController.init());
} else {
    NavbarController.init();
}