import { DOM, STATE } from './main.js';
import { showLoading, showError } from './ui.js';
import { loadPage } from './templates.js';
import API_CONFIG from './api-config.js';

// Инициализация поиска
export function initSearch() {
    // Поиск по кнопке
    DOM.searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });

    // Поиск по Enter
    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Кнопка очистки поиска
    const clearSearchBtn = document.createElement('button');
    clearSearchBtn.innerHTML = '<i class="fas fa-times"></i>';
    clearSearchBtn.className = 'clear-search-btn';
    clearSearchBtn.style.display = 'none';
    clearSearchBtn.addEventListener('click', clearSearch);

    DOM.searchInput.parentNode.appendChild(clearSearchBtn);

    // Показываем/скрываем кнопку очистки
    DOM.searchInput.addEventListener('input', function () {
        clearSearchBtn.style.display = this.value ? 'block' : 'none';
    });
}

// Выполнение поиска
export async function performSearch() {
    const query = DOM.searchInput.value.trim();

    if (!query) {
        clearSearch();
        return;
    }

    STATE.currentSearchQuery = query;
    await searchTemplates(query);
}

// Очистка поиска
export function clearSearch() {
    DOM.searchInput.value = '';
    STATE.currentSearchQuery = '';
    const clearBtn = document.querySelector('.clear-search-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    window.loadAllTemplates();
}

// Поиск шаблонов по ключевым словам
async function searchTemplates(query) {
    try {
        showLoading(true);

        const authToken = localStorage.getItem('authToken');
        const headers = {};

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Ошибка поиска: ${response.status}`);
        }

        const searchResults = await response.json();
        STATE.allTemplateIds = searchResults;
        STATE.totalPages = Math.ceil(STATE.allTemplateIds.length / STATE.ITEMS_PER_PAGE);

        if (STATE.allTemplateIds.length === 0) {
            showNoResultsMessage(query);
        } else {
            loadPage(1);
        }

    } catch (error) {
        console.error('Ошибка поиска:', error);
        showError('Ошибка при выполнении поиска');
    } finally {
        showLoading(false);
    }
}

// Сообщение об отсутствии результатов
function showNoResultsMessage(query) {
    DOM.templatesGrid.innerHTML = `
        <div class="no-results-message">
            <i class="fas fa-search"></i>
            <h3>Ничего не найдено</h3>
            <p>По запросу "${query}" не найдено ни одного шаблона.</p>
            <button class="btn btn-outline" onclick="clearSearch()">
                <i class="fas fa-times"></i> Очистить поиск
            </button>
        </div>
    `;
    DOM.paginationContainer.style.display = 'none';
}
