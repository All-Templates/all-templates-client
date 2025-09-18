import { DOM, STATE } from './main.js';
import { showLoading, showError } from './ui.js';
import { loadPage } from './templates.js';
import API_CONFIG from './api-config.js';

// Загрузка данных пользователя
export async function loadUserData() {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return;

        const headers = {
            'Authorization': `Bearer ${authToken}`
        };

        // Загружаем избранное
        const favsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_FAVS}`, {
            method: 'GET',
            headers: headers
        });

        if (favsResponse.ok) {
            const favorites = await favsResponse.json();
            STATE.userFavorites = new Set(favorites);
        }

        // Загружаем загрузки пользователя
        const uploadsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_UPLOADS}`, {
            method: 'GET',
            headers: headers
        });

        if (uploadsResponse.ok) {
            const uploads = await uploadsResponse.json();
            STATE.userUploads = new Set(uploads);
        }

    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }
}

// Показать избранное
export async function showFavorites() {
    try {
        showLoading(true);
        STATE.currentView = 'favorites';

        if (STATE.userFavorites.size === 0) {
            showNoFavoritesMessage();
            return;
        }

        STATE.allTemplateIds = Array.from(STATE.userFavorites);
        STATE.totalPages = Math.ceil(STATE.allTemplateIds.length / STATE.ITEMS_PER_PAGE);
        loadPage(1);

    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        showError('Ошибка загрузки избранного');
    } finally {
        showLoading(false);
    }
}

// Показать мои загрузки
export async function showMyUploads() {
    try {
        showLoading(true);
        STATE.currentView = 'my-uploads';

        if (STATE.userUploads.size === 0) {
            showNoUploadsMessage();
            return;
        }

        STATE.allTemplateIds = Array.from(STATE.userUploads);
        STATE.totalPages = Math.ceil(STATE.allTemplateIds.length / STATE.ITEMS_PER_PAGE);
        loadPage(1);

    } catch (error) {
        console.error('Ошибка загрузки загрузок:', error);
        showError('Ошибка загрузки загрузок');
    } finally {
        showLoading(false);
    }
}

function showNoFavoritesMessage() {
    DOM.templatesGrid.innerHTML = `
        <div class="no-results-message">
            <i class="fas fa-heart"></i>
            <h3>Нет избранных шаблонов</h3>
            <p>Добавляйте шаблоны в избранное, нажимая на сердечко.</p>
        </div>
    `;
    DOM.paginationContainer.style.display = 'none';
}

function showNoUploadsMessage() {
    DOM.templatesGrid.innerHTML = `
        <div class="no-results-message">
            <i class="fas fa-upload"></i>
            <h3>Нет загруженных шаблонов</h3>
            <p>Загрузите свой первый шаблон, чтобы он появился здесь.</p>
        </div>
    `;
    DOM.paginationContainer.style.display = 'none';
}

// Добавить в избранное
export async function addToFavorites(templateId) {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('Для добавления в избранное необходимо войти в систему');
            return;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_FAVS_ADD}?template=${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            STATE.userFavorites.add(templateId);
            updateFavoriteIcons();
        } else {
            throw new Error('Ошибка добавления в избранное');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Удалить из избранного
export async function removeFromFavorites(templateId) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_FAVS_REMOVE}?template=${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            STATE.userFavorites.delete(templateId);
            updateFavoriteIcons();

            if (STATE.currentView === 'favorites') {
                showFavorites();
            }
        } else {
            throw new Error('Ошибка удаления из избранного');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Обновить иконки избранного
export function updateFavoriteIcons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const templateId = btn.closest('.template-card').dataset.id;
        if (STATE.userFavorites.has(parseInt(templateId))) {
            btn.innerHTML = '<i class="fas fa-heart"></i>';
            btn.classList.add('favorited');
        } else {
            btn.innerHTML = '<i class="far fa-heart"></i>';
            btn.classList.remove('favorited');
        }
    });
}
