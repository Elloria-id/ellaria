// Auth Page JavaScript

const AuthController = {
    init: function() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm) {
            this.setupLoginForm();
        }
        if (registerForm) {
            this.setupRegisterForm();
        }

        this.setupPasswordToggle();
        this.setupSocialLogin();
    },

    setupLoginForm: function() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', (e) => this.handleLogin(e));
    },

    setupRegisterForm: function() {
        const form = document.getElementById('register-form');
        form.addEventListener('submit', (e) => this.handleRegister(e));
    },

    setupPasswordToggle: function() {
        const toggles = document.querySelectorAll('.toggle-password');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const input = e.target.closest('.password-input-wrapper').querySelector('input');
                input.type = input.type === 'password' ? 'text' : 'password';
            });
        });
    },

    setupSocialLogin: function() {
        document.getElementById('google-login')?.addEventListener('click', () => {
            alert('Google login akan diintegrasikan dengan Firebase');
        });
        document.getElementById('discord-login')?.addEventListener('click', () => {
            alert('Discord login akan diintegrasikan dengan Firebase');
        });
    },

    handleLogin: function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Validation
        if (!this.validateEmail(email)) {
            this.showError('email-error', 'Email tidak valid');
            return;
        }

        if (password.length < 6) {
            this.showError('password-error', 'Password minimal 6 karakter');
            return;
        }

        // Save user
        Utils.setStorage('userProfile', { email });
        window.location.href = '/';
    },

    handleRegister: function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

        // Validation
        if (username.length < 3) {
            this.showError('username-error', 'Username minimal 3 karakter');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('email-error', 'Email tidak valid');
            return;
        }

        if (password.length < 6) {
            this.showError('password-error', 'Password minimal 6 karakter');
            return;
        }

        if (password !== confirm) {
            this.showError('confirm-error', 'Password tidak sama');
            return;
        }

        // Save user
        Utils.setStorage('userProfile', { username, email });
        window.location.href = '/';
    },

    validateEmail: function(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    showError: function(elementId, message) {
        const el = document.getElementById(elementId);
        el.textContent = message;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 5000);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthController.init());
} else {
    AuthController.init();
}
