// Profile Page JavaScript

const ProfileController = {
    userProfile: {
        name: 'User Name',
        email: 'user@example.com',
        bio: 'Manga enthusiast',
        avatar: '/assets/images/avatar/default.jpg',
        joined: '1 Januari 2024',
        stats: {
            reading: 5,
            completed: 12,
            bookmarks: 45
        }
    },

    init: function() {
        this.loadProfile();
        this.displayProfile();
        this.attachEventListeners();
    },

    loadProfile: function() {
        const saved = Utils.getStorage('userProfile');
        if (saved) {
            this.userProfile = { ...this.userProfile, ...saved };
        }
    },

    displayProfile: function() {
        document.getElementById('profile-name').textContent = this.userProfile.name;
        document.getElementById('profile-bio').textContent = this.userProfile.bio;
        document.getElementById('profile-email').textContent = this.userProfile.email;
        document.getElementById('profile-image').src = this.userProfile.avatar;
        document.getElementById('profile-joined').textContent = this.userProfile.joined;
        document.getElementById('stat-reading').textContent = this.userProfile.stats.reading;
        document.getElementById('stat-completed').textContent = this.userProfile.stats.completed;
        document.getElementById('stat-bookmarks').textContent = this.userProfile.stats.bookmarks;
    },

    attachEventListeners: function() {
        // Tab switching
        document.querySelectorAll('.profile-tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.profile-tabs .tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                const tabName = e.target.dataset.tab;
                document.getElementById(tabName + '-tab').classList.add('active');
            });
        });

        // Edit profile
        document.getElementById('edit-profile-btn').addEventListener('click', () => this.openEditModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('edit-form').addEventListener('submit', (e) => this.saveProfile(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    },

    openEditModal: function() {
        document.getElementById('edit-name').value = this.userProfile.name;
        document.getElementById('edit-bio').value = this.userProfile.bio;
        document.getElementById('edit-modal').style.display = 'flex';
    },

    closeEditModal: function() {
        document.getElementById('edit-modal').style.display = 'none';
    },

    saveProfile: function(e) {
        e.preventDefault();
        this.userProfile.name = document.getElementById('edit-name').value;
        this.userProfile.bio = document.getElementById('edit-bio').value;
        Utils.setStorage('userProfile', this.userProfile);
        this.displayProfile();
        this.closeEditModal();
        Utils.showNotification('Profil berhasil diperbarui');
    },

    logout: function() {
        if (confirm('Yakin ingin keluar?')) {
            Utils.removeStorage('userProfile');
            window.location.href = '/pages/login/login.html';
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProfileController.init());
} else {
    ProfileController.init();
}