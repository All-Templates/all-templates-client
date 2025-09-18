import { DOM, STATE } from './main.js';
import { handleLoginClick } from './auth.js';
import { loadAllTemplates } from './templates.js';
import { showFavorites, showMyUploads } from './favorites.js';
import API_CONFIG from './api-config.js';

// Управление состоянием загрузки
export function showLoading(show) {
    DOM.loadingSpinner.style.display = show ? 'block' : 'none';
    if (show) {
        DOM.templatesGrid.innerHTML = '';
        DOM.paginationContainer.style.display = 'none';
    } else {
        DOM.paginationContainer.style.display = 'flex';
    }
}

// Отображение ошибки
export function showError(message) {
    DOM.templatesGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
    DOM.paginationContainer.style.display = 'none';
}

// Инициализация модальных окон
export function initModalWindows() {
    DOM.uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.uploadModal.style.display = 'flex';
    });

    DOM.loginBtn.addEventListener('click', handleLoginClick);

    DOM.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.loginModal.style.display = 'none';
        DOM.registerModal.style.display = 'flex';
    });

    DOM.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.registerModal.style.display = 'none';
        DOM.loginModal.style.display = 'flex';
    });

    DOM.closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            DOM.uploadModal.style.display = 'none';
            DOM.loginModal.style.display = 'none';
            DOM.registerModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === DOM.uploadModal) DOM.uploadModal.style.display = 'none';
        if (e.target === DOM.loginModal) DOM.loginModal.style.display = 'none';
        if (e.target === DOM.registerModal) DOM.registerModal.style.display = 'none';
    });
}

// Инициализация формы загрузки
export function initUploadForm() {
    DOM.uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleUpload();
    });
}

async function handleUpload() {
    const keywords = DOM.templateKeywords.value.trim();
    if (!keywords) {
        alert('Введите ключевые слова через запятую');
        return;
    }

    if (!DOM.templateFile.files || DOM.templateFile.files.length === 0) {
        alert('Выберите файл изображения');
        return;
    }

    const formData = new FormData();
    formData.append('keyWords', keywords);
    formData.append('pic', DOM.templateFile.files[0]);

    DOM.submitBtn.disabled = true;
    DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';

    try {
        const authToken = localStorage.getItem('authToken');
        const headers = {};

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE}`, {
            method: 'POST',
            body: formData,
            headers: headers
        });

        if (response.ok) {
            await handleUploadSuccess(response, authToken);
        } else {
            await handleUploadError(response);
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Ошибка: ' + error.message);
    } finally {
        DOM.submitBtn.disabled = false;
        DOM.submitBtn.textContent = 'Отправить на модерацию';
    }
}

async function handleUploadSuccess(response, authToken) {
    try {
        const data = await response.text();
        try {
            const json = JSON.parse(data);
            alert('Шаблон отправлен на модерацию! ID: ' + (json.id || ''));
            if (authToken) {
                STATE.userUploads.add(parseInt(json.id || data));
            }
        } catch {
            alert('Шаблон успешно загружен! ID: ' + data);
            if (authToken) {
                STATE.userUploads.add(parseInt(data));
            }
        }
    } catch {
        alert('Шаблон успешно загружен!');
    }

    DOM.uploadModal.style.display = 'none';
    DOM.uploadForm.reset();
    loadAllTemplates();
}

async function handleUploadError(response) {
    let errorText = '';
    try {
        errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.errors) {
                const errors = Object.values(errorJson.errors).flat();
                throw new Error(errors.join('\n'));
            }
            throw new Error(errorJson.title || errorJson.message || 'Неизвестная ошибка');
        } catch {
            throw new Error(errorText || `Ошибка сервера: ${response.status}`);
        }
    } catch {
        throw new Error(`Ошибка сервера: ${response.status}`);
    }
}

// Инициализация меню профиля
export function initProfileMenu() {
    DOM.profileBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.profileMenu.style.display = DOM.profileMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (DOM.profileMenu && !DOM.profileMenu.contains(e.target) && !DOM.profileBtn?.contains(e.target)) {
            DOM.profileMenu.style.display = 'none';
        }
    });

    document.getElementById('viewFavorites')?.addEventListener('click', (e) => {
        e.preventDefault();
        showFavorites();
        DOM.profileMenu.style.display = 'none';
    });

    document.getElementById('viewMyUploads')?.addEventListener('click', (e) => {
        e.preventDefault();
        showMyUploads();
        DOM.profileMenu.style.display = 'none';
    });

    document.getElementById('viewAllTemplates')?.addEventListener('click', (e) => {
        e.preventDefault();
        loadAllTemplates();
        DOM.profileMenu.style.display = 'none';
    });
}