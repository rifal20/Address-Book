// Global Variables
let contacts = [];
let editId = null;
let currentView = 'grid';

// Load data dari localStorage
function loadData() {
    const stored = localStorage.getItem('addressbook_contacts');
    if (stored) {
        contacts = JSON.parse(stored);
    }
}

// Save data ke localStorage
function saveData() {
    localStorage.setItem('addressbook_contacts', JSON.stringify(contacts));
}

// Load theme
function loadTheme() {
    const theme = localStorage.getItem('addressbook_theme') || 'light';
    document.body.className = theme;
}

// Save theme
function saveTheme(theme) {
    localStorage.setItem('addressbook_theme', theme);
}

// DOM Elements
const form = document.getElementById('contactForm');
const namaInput = document.getElementById('nama');
const noTelpInput = document.getElementById('noTelp');
const emailInput = document.getElementById('email');
const lokasiInput = document.getElementById('lokasi');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('formTitle');
const contactsContainer = document.getElementById('contactsContainer');
const emptyState = document.getElementById('emptyState');
const totalCount = document.getElementById('totalCount');
const searchInput = document.getElementById('searchInput');
const gridView = document.getElementById('gridView');
const listView = document.getElementById('listView');
const themeToggle = document.getElementById('themeToggle');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    loadTheme();
    render();
    updateCount();
});

// Form Submit
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const data = {
        nama: namaInput.value.trim(),
        noTelp: noTelpInput.value.trim(),
        email: emailInput.value.trim(),
        lokasi: lokasiInput.value.trim()
    };
    
    // Validasi
    if (data.nama.length < 3) {
        alert('Nama minimal 3 karakter');
        return;
    }
    
    if (!/^[0-9]{10,15}$/.test(data.noTelp)) {
        alert('Nomor telepon harus 10-15 digit angka');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        alert('Format email tidak valid');
        return;
    }
    
    if (data.lokasi.length < 3) {
        alert('Lokasi minimal 3 karakter');
        return;
    }
    
    if (editId !== null) {
        // Update kontak
        const index = contacts.findIndex(c => c.id === editId);
        contacts[index] = { ...contacts[index], ...data };
        alert('Kontak berhasil diperbarui!');
        resetForm();
    } else {
        // Tambah kontak baru
        data.id = Date.now();
        contacts.push(data);
        alert('Kontak berhasil ditambahkan!');
    }
    
    form.reset();
    saveData();
    render();
    updateCount();
});

// Cancel Edit
cancelBtn.addEventListener('click', function() {
    resetForm();
    form.reset();
});

// Reset Form
function resetForm() {
    editId = null;
    formTitle.textContent = 'Tambah Kontak Baru';
    btnText.textContent = '💾 Simpan';
    cancelBtn.style.display = 'none';
}

// Render Contacts
function render(data = null) {
    const list = data || contacts;
    
    if (list.length === 0) {
        contactsContainer.innerHTML = '';
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    if (currentView === 'grid') {
        contactsContainer.className = 'contacts-grid';
    } else {
        contactsContainer.className = 'contacts-list';
    }
    
    contactsContainer.innerHTML = list.map(contact => `
        <div class="contact-card">
            <div class="contact-header">
                <div class="contact-avatar">${contact.nama.charAt(0).toUpperCase()}</div>
                <div class="contact-name">
                    <h3>${escapeHTML(contact.nama)}</h3>
                    <span>Kontak</span>
                </div>
            </div>
            <div class="contact-info">
                <div class="info-item">
                    <span>📞</span>
                    <span>${escapeHTML(contact.noTelp)}</span>
                </div>
                <div class="info-item">
                    <span>✉️</span>
                    <span>${escapeHTML(contact.email)}</span>
                </div>
                <div class="info-item">
                    <span>📍</span>
                    <span>${escapeHTML(contact.lokasi)}</span>
                </div>
            </div>
            <div class="contact-actions">
                <button class="btn-edit" onclick="editContact(${contact.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteContact(${contact.id})">🗑️ Hapus</button>
            </div>
        </div>
    `).join('');
}

// Edit Contact
function editContact(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    namaInput.value = contact.nama;
    noTelpInput.value = contact.noTelp;
    emailInput.value = contact.email;
    lokasiInput.value = contact.lokasi;
    
    editId = id;
    formTitle.textContent = 'Edit Kontak';
    btnText.textContent = '✅ Update';
    cancelBtn.style.display = 'inline-block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Delete Contact
function deleteContact(id) {
    if (!confirm('Yakin ingin menghapus kontak ini?')) return;
    
    contacts = contacts.filter(c => c.id !== id);
    saveData();
    render();
    updateCount();
    alert('Kontak berhasil dihapus!');
}

// Search
searchInput.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
        render();
        return;
    }
    
    const results = contacts.filter(c => 
        c.nama.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.noTelp.includes(query) ||
        c.lokasi.toLowerCase().includes(query)
    );
    
    render(results);
});

// View Toggle
gridView.addEventListener('click', function() {
    currentView = 'grid';
    gridView.classList.add('active');
    listView.classList.remove('active');
    render();
});

listView.addEventListener('click', function() {
    currentView = 'list';
    listView.classList.add('active');
    gridView.classList.remove('active');
    render();
});

// Theme Toggle
themeToggle.addEventListener('click', function() {
    if (document.body.classList.contains('dark')) {
        document.body.className = 'light';
        saveTheme('light');
    } else {
        document.body.className = 'dark';
        saveTheme('dark');
    }
});

// Update Counter
function updateCount() {
    totalCount.textContent = contacts.length;
}

// Escape HTML
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}