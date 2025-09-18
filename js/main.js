import API_CONFIG from './api-config.js';
import { initAuthForms, updateAuthUI, handleLoginClick, handleLogoutClick } from './auth.js';
import { loadAllTemplates, initTemplateClickHandlers, showKeywords } from './templates.js';
import { initModalWindows, initUploadForm, initProfileMenu } from './ui.js';
import { initSearch, performSearch, clearSearch } from './search.js';
import { showAdminPanel, approveTemplate, rejectTemplate } from './admin.js';
import { addToFavorites, removeFromFavorites, showFavorites, showMyUploads } from './favorites.js';
import { initProfilePage } from './profile.js';

// DOM элементы
export const DOM = {
    uploadBtn: document.getElementById('uploadBtn'),
    loginBtn: document.getElementById('loginBtn'),
    uploadModal: document.getElementById('uploadModal'),
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    closeButtons: document.querySelectorAll('.close-modal'),
    templatesGrid: document.getElementById('templatesGrid'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    uploadForm: document.getElementById('uploadForm'),
    submitBtn: document.getElementById('submitBtn'),
    templateKeywords: document.getElementById('templateKeywords'),
    templateFile: document.getElementById('templateFile'),
    paginationContainer: document.getElementById('pagination'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    searchInput: document.querySelector('.search-bar input'),
    searchButton: document.querySelector('.search-bar button'),
    profileMenu: document.getElementById('profileMenu'),
    profileBtn: document.getElementById('profileBtn')
};

// Глобальные переменные
export const STATE = {
    ITEMS_PER_PAGE: 12,
    currentPage: 1,
    totalPages: 1,
    allTemplateIds: [],
    currentSearchQuery: '',
    currentUser: null,
    userFavorites: new Set(),
    userUploads: new Set(),
    currentView: 'all'
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadAllTemplates();
    initModalWindows();
    initUploadForm();
    initAuthForms();
    initSearch();
    initProfileMenu();
    updateAuthUI();
});

// Глобальные функции
window.showKeywords = showKeywords;
window.clearSearch = clearSearch;
window.showAdminPanel = showAdminPanel;
window.approveTemplate = approveTemplate;
window.rejectTemplate = rejectTemplate;
window.addToFavorites = addToFavorites;
window.removeFromFavorites = removeFromFavorites;
window.showFavorites = showFavorites;
window.showMyUploads = showMyUploads;
window.loadAllTemplates = loadAllTemplates;
window.performSearch = performSearch;
window.openProfile = function() {
    window.location.href = 'profile.html';
};

// Экспорт для глобального доступа
window.STATE = STATE;
window.DOM = DOM;
window.API_CONFIG = API_CONFIG;
