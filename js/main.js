/* ========================================
   ELLARIA エル - MAIN JAVASCRIPT
   Global utilities and helper functions
======================================== */

/**
 * Utility Functions
 */
const Utils = {
    // Smooth scroll to element
    smoothScroll: (element) => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    // Add class to element
    addClass: (el, className) => {
        if (el) el.classList.add(className);
    },

    // Remove class from element
    removeClass: (el, className) => {
        if (el) el.classList.remove(className);
    },

    // Toggle class on element
    toggleClass: (el, className) => {
        if (el) el.classList.toggle(className);
    },

    // Check if element has class
    hasClass: (el, className) => {
        return el?.classList.contains(className) || false;
    },

    // Get element by ID
    getById: (id) => document.getElementById(id),

    // Get elements by class
    getByClass: (className) => document.querySelectorAll(`.${className}`),

    // Get elements by selector
    querySelector: (selector) => document.querySelector(selector),

    // Get all elements by selector
    querySelectorAll: (selector) => document.querySelectorAll(selector),

    // Format date
    formatDate: (date, format = 'DD-MM-YYYY') => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year);
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Store data in localStorage
    setStorage: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    // Get data from localStorage
    getStorage: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },

    // Remove data from localStorage
    removeStorage: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage error:', e);
        }
    },

    // Show notification
    showNotification: (message, type = 'info', duration = 3000) => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // Dapat di-extend untuk UI notification
    },

    // Hide loading screen
    hideLoadingScreen: () => {
        const loadingScreen = Utils.getById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    }
};

/**
 * Initialize on DOM Ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ellaria エル - Initialized');
    Utils.hideLoadingScreen();
});

/**
 * Handle page unload
 */
window.addEventListener('beforeunload', () => {
    // Save any important data before leaving
});

/**
 * Export for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}