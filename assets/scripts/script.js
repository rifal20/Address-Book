// Enhanced Contact Database with Statistics
class ContactDatabase {
    constructor() {
        this.storageKey = 'contacthub_contacts';
        this.themeKey = 'contacthub_theme';
        this.contacts = this.loadContacts();
    }

    loadContacts() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading contacts:', error);
            return [];
        }
    }

    saveContacts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.contacts));
            return true;
        } catch (error) {
            console.error('Error saving contacts:', error);
            return false;
        }
    }

    addContact(contact) {
        const newContact = {
            id: Date.now() + Math.random(),
            ...contact,
            createdAt: new Date().toISOString()
        };
        this.contacts.push(newContact);
        this.saveContacts();
        return newContact;
    }

    getAllContacts() {
        return this.contacts;
    }

    getContactById(id) {
        return this.contacts.find(c => c.id === id);
    }

    updateContact(id, updatedData) {
        const index = this.contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            this.contacts[index] = {
                ...this.contacts[index],
                ...updatedData,
                updatedAt: new Date().toISOString()
            };
            this.saveContacts();
            return this.contacts[index];
        }
        return null;
    }

    deleteContact(id) {
        const index = this.contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            this.contacts.splice(index, 1);
            this.saveContacts();
            return true;
        }
        return false;
    }

    getCount() {
        return this.contacts.length;
    }

    getRecentCount() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return this.contacts.filter(c => new Date(c.createdAt) > oneWeekAgo).length;
    }

    getStorageSize() {
        const data = localStorage.getItem(this.storageKey);
        return data ? (data.length / 1024).toFixed(2) : 0;
    }

    searchContacts(query) {
        const lowerQuery = query.toLowerCase();
        return this.contacts.filter(c =>
            c.nama.toLowerCase().includes(lowerQuery) ||
            c.email.toLowerCase().includes(lowerQuery) ||
            c.noTelp.includes(lowerQuery) ||
            c.lokasi.toLowerCase().includes(lowerQuery)
        );
    }

    // Theme Management
    getTheme() {
        return localStorage.getItem(this.themeKey) || 'dark';
    }

    setTheme(theme) {
        localStorage.setItem(this.themeKey, theme);
    }
}

// Initialize
const db = new ContactDatabase();
let currentView = 'grid';
let editingId = null;
let currentSection = 'contacts';

// DOM Elements
const contactForm = document.getElementById('contactForm');
const contactsGrid = document.getElementById('contactsGrid');
const emptyState = document.getElementById('emptyState');
const contactCount = document.getElementById('contactCount');
const submitText = document.getElementById('submitText');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeNavigation();
    initializeViewSwitcher();
    initializeSearch();
    renderContacts();
    updateStatistics();
    showSection('contacts');
});

// Theme Toggle
function initializeTheme() {
    const savedTheme = db.getTheme();
    document.body.className = savedTheme + '-mode';
    
    themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.className = newTheme + '-mode';
    db.setTheme(newTheme);
    
    // Add animation effect
    themeToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 150);
    
    showNotification(`Switched to ${newTheme} mode!`, 'success');
}

// Form Submit
contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        nama: document.getElementById('nama').value.trim(),
        noTelp: document.getElementById('noTelp').value.trim(),
        email: document.getElementById('email').value.trim(),
        lokasi: document.getElementById('lokasi').value.trim()
    };

    if (!validateContact(formData)) return;

    if (editingId) {
        db.updateContact(editingId, formData);
        showNotification('Contact updated successfully!', 'success');
        editingId = null;
        submitText.textContent = 'Save Contact';
    } else {
        db.addContact(formData);
        showNotification('Contact added successfully!', 'success');
    }

    contactForm.reset();
    renderContacts();
    updateStatistics();
    showSection('contacts');
});

// Validation
function validateContact(contact) {
    if (contact.nama.length < 3) {
        showNotification('Name must be at least 3 characters!', 'error');
        return false;
    }

    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(contact.noTelp)) {
        showNotification('Invalid phone number! (10-15 digits)', 'error');
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
        showNotification('Invalid email format!', 'error');
        return false;
    }

    if (contact.lokasi.length < 3) {
        showNotification('Location must be at least 3 characters!', 'error');
        return false;
    }

    return true;
}

// Render Contacts
function renderContacts(contactsToRender = null) {
    const contacts = contactsToRender || db.getAllContacts();

    if (contacts.length === 0) {
        contactsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    contactsGrid.className = currentView === 'grid' ? 'contacts-grid' : 'contacts-grid list-view';

    contactsGrid.innerHTML = contacts.map(contact => `
        <div class="contact-card">
            <div class="contact-header">
                <div class="contact-avatar">${contact.nama.charAt(0).toUpperCase()}</div>
                <div class="contact-name">
                    <h3>${escapeHtml(contact.nama)}</h3>
                    <div class="contact-status">
                        <span class="status-dot"></span>
                        Active
                    </div>
                </div>
            </div>
            <div class="contact-info">
                <div class="info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92V19.92C22 20.4728 21.5523 20.9205 21 20.9205C10.3945 20.4714 2 12.0769 2 1.47143C2 0.918861 2.44772 0.47143 3 0.47143H6C6.55228 0.47143 7 0.918861 7 1.47143C7 3.47143 7.5 5.47143 8.5 7.47143" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>${escapeHtml(contact.noTelp)}</span>
                </div>
                <div class="info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
                        <path d="M3 7L12 13L21 7" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>${escapeHtml(contact.email)}</span>
                </div>
                <div class="info-row">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13401 2 5 5.13401 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13401 15.866 2 12 2Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="9" r="2.5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <span>${escapeHtml(contact.lokasi)}</span>
                </div>
            </div>
            <div class="contact-actions">
                <button class="action-btn btn-edit" onclick="editContact(${contact.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" stroke-width="2"/>
                        <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Edit
                </button>
                <button class="action-btn btn-delete" onclick="deleteContact(${contact.id})">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 6V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V6M19 6V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V6H19Z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Edit Contact
function editContact(id) {
    const contact = db.getContactById(id);
    if (!contact) {
        showNotification('Contact not found!', 'error');
        return;
    }

    document.getElementById('nama').value = contact.nama;
    document.getElementById('noTelp').value = contact.noTelp;
    document.getElementById('email').value = contact.email;
    document.getElementById('lokasi').value = contact.lokasi;

    editingId = id;
    submitText.textContent = 'Update Contact';
    showSection('add');
    
    document.getElementById('nama').focus();
}

// Delete Contact
function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    if (db.deleteContact(id)) {
        showNotification('Contact deleted successfully!', 'success');
        renderContacts();
        updateStatistics();
    } else {
        showNotification('Failed to delete contact!', 'error');
    }
}

// Cancel Edit
function cancelEdit() {
    contactForm.reset();
    editingId = null;
    submitText.textContent = 'Save Contact';
    showSection('contacts');
}

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function showSection(section) {
    currentSection = section;
    
    document.getElementById('contactsSection').classList.add('hidden');
    document.getElementById('addSection').classList.add('hidden');
    document.getElementById('statsSection').classList.add('hidden');
    
    if (section === 'contacts') {
        document.getElementById('contactsSection').classList.remove('hidden');
    } else if (section === 'add') {
        document.getElementById('addSection').classList.remove('hidden');
    } else if (section === 'stats') {
        document.getElementById('statsSection').classList.remove('hidden');
        updateStatistics();
    }
}

function showAddSection() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => nav.classList.remove('active'));
    navItems[1].classList.add('active');
    showSection('add');
}

// View Switcher
function initializeViewSwitcher() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = btn.dataset.view;
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderContacts();
        });
    });
}

// Search
function initializeSearch() {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (query === '') {
            renderContacts();
        } else {
            const results = db.searchContacts(query);
            renderContacts(results);
        }
    });
}

// Update Statistics
function updateStatistics() {
    contactCount.textContent = db.getCount();
    document.getElementById('statTotal').textContent = db.getCount();
    document.getElementById('statRecent').textContent = db.getRecentCount();
    
    const storageUsed = db.getStorageSize();
    document.getElementById('storageUsed').textContent = `${storageUsed} KB`;
    
    const percentage = (storageUsed / 5120) * 100;
    document.getElementById('storageBar').style.width = `${Math.min(percentage, 100)}%`;
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #ef4444, #f87171)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        font-weight: 600;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 400px;
    `;

    const icon = type === 'success' ? 
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.3 2 18.23 3.64 20 6.19" stroke="currentColor" stroke-width="2"/><path d="M22 4L12 14L9 11" stroke="currentColor" stroke-width="2"/></svg>' :
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    notification.innerHTML = icon + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add CSS Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);