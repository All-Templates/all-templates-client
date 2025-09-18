import { DOM, STATE } from './main.js';
import { showLoading, showError } from './ui.js';
import { updateFavoriteIcons } from './favorites.js';
import API_CONFIG from './api-config.js';

// Загрузка всех шаблонов
export async function loadAllTemplates() {
    try {
        showLoading(true);
        STATE.currentView = 'all';

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATES}`);
        STATE.allTemplateIds = await response.json();

        STATE.totalPages = Math.ceil(STATE.allTemplateIds.length / STATE.ITEMS_PER_PAGE);
        loadPage(1);

    } catch (error) {
        console.error('Ошибка загрузки шаблонов:', error);
        showError('Не удалось загрузить шаблоны');
    } finally {
        showLoading(false);
    }
}

// Загрузка конкретной страницы
export function loadPage(page) {
    if (page < 1 || page > STATE.totalPages) return;

    STATE.currentPage = page;
    const startIndex = (page - 1) * STATE.ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + STATE.ITEMS_PER_PAGE, STATE.allTemplateIds.length);
    const pageTemplateIds = STATE.allTemplateIds.slice(startIndex, endIndex);

    renderTemplates(pageTemplateIds);
    updatePagination();
}

// Отрисовка шаблонов
function renderTemplates(templateIds) {
    DOM.templatesGrid.innerHTML = templateIds.map(id => `
        <div class="template-card" data-id="${id}">
            <div class="template-image-container">
                <img src="${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD}/${id}?isPreview=true"
                     alt="Шаблон мема"
                     class="template-thumbnail"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/300x180?text=Ошибка+загрузки'">
                ${STATE.currentUser ? `
                <div class="favorite-overlay">
                    <button class="favorite-btn ${STATE.userFavorites.has(id) ? 'favorited' : ''}"
                            onclick="event.stopPropagation(); ${STATE.userFavorites.has(id) ? 'removeFromFavorites' : 'addToFavorites'}(${id})">
                        <i class="${STATE.userFavorites.has(id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            <div class="keywords-tooltip" id="keywords-${id}"></div>
            ${STATE.userUploads.has(id) ? '<div class="user-upload-badge">Мой шаблон</div>' : ''}
        </div>
    `).join('');

    initTemplateClickHandlers();
    initTemplateHover();
    updateFavoriteIcons();
}

// Инициализация hover для показа ключевых слов
function initTemplateHover() {
    document.querySelectorAll('.template-thumbnail').forEach(img => {
        img.addEventListener('mouseover', function () {
            const card = this.closest('.template-card');
            showKeywords(card);
        });
    });
}

// Обновление пагинации
function updatePagination() {
    DOM.pageInfo.textContent = `Страница ${STATE.currentPage} из ${STATE.totalPages}`;

    DOM.prevPageBtn.disabled = STATE.currentPage === 1;
    DOM.nextPageBtn.disabled = STATE.currentPage === STATE.totalPages;

    const pageButtons = DOM.paginationContainer.querySelectorAll('.pagination-btn:not(#prevPage):not(#nextPage)');
    pageButtons.forEach(btn => btn.remove());

    const startPage = Math.max(1, STATE.currentPage - 2);
    const endPage = Math.min(STATE.totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === STATE.currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => loadPage(i));

        DOM.paginationContainer.insertBefore(pageBtn, DOM.nextPageBtn);
    }
}

// Инициализация обработчиков клика по карточкам
export function initTemplateClickHandlers() {
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (e.target.closest('.favorite-btn')) return;

            e.stopPropagation();
            const templateId = this.dataset.id;
            if (templateId) {
                window.location.href = `editor.html?templateId=${templateId}`;
            }
        });
    });
}

// Показать ключевые слова
export async function showKeywords(cardElement) {
    const templateId = cardElement.dataset.id;
    const tooltip = cardElement.querySelector('.keywords-tooltip');

    if (tooltip.textContent) return;

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE_DETAILS}/${templateId}`);
        const templateData = await response.json();

        if (templateData.keyWords && Array.isArray(templateData.keyWords)) {
            tooltip.textContent = templateData.keyWords.join(', ');
        } else {
            tooltip.textContent = 'Нет ключевых слов';
        }
    } catch (error) {
        console.error('Ошибка загрузки ключевых слов:', error);
        tooltip.textContent = 'Не удалось загрузить ключевые слова';
    }
}
