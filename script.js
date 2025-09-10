import API_CONFIG from './api-config.js';

// DOM элементы
const uploadBtn = document.getElementById('uploadBtn');
const loginBtn = document.getElementById('loginBtn');
const uploadModal = document.getElementById('uploadModal');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const closeButtons = document.querySelectorAll('.close-modal');
const templatesGrid = document.getElementById('templatesGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const templateKeywords = document.getElementById('templateKeywords');
const templateFile = document.getElementById('templateFile');
const paginationContainer = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

// Настройки пагинации
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let totalPages = 1;
let allTemplateIds = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadAllTemplates();
    initModalWindows();
    initUploadForm();
    initAuthForms(); // Инициализируем формы авторизации
    updateAuthUI(); // Проверяем статус аутентификации при загрузке
});

// Функция для обновления UI в зависимости от статуса авторизации
function updateAuthUI() {
    const authToken = localStorage.getItem('authToken');
    const loginBtn = document.getElementById('loginBtn');

    if (authToken) {
        // Пользователь авторизован
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
        loginBtn.removeEventListener('click', handleLoginClick);
        loginBtn.addEventListener('click', handleLogoutClick);
        uploadBtn.style.display = 'inline-flex';
    } else {
        // Пользователь не авторизован
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
        loginBtn.removeEventListener('click', handleLogoutClick);
        loginBtn.addEventListener('click', handleLoginClick);
        uploadBtn.style.display = 'none';
    }
}

function handleLoginClick(e) {
    e.preventDefault();
    loginModal.style.display = 'flex';
}

function handleLogoutClick(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    alert('Вы вышли из системы.');
    updateAuthUI();
}

// Инициализация форм авторизации
function initAuthForms() {
    // Обработчик формы регистрации
    document.querySelector('#registerModal form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const login = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        // Валидация
        if (!login || !password) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        if (password.length < 4) {
            alert('Пароль должен содержать минимум 4 символа.');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/User/register?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`, {
                method: 'GET'
            });

            if (response.ok) {
                const token = await response.text();
                localStorage.setItem('authToken', token);
                registerModal.style.display = 'none';
                alert('Регистрация успешна! Вы автоматически вошли в систему.');
                updateAuthUI();
                this.reset();
            } else if (response.status === 409) {
                throw new Error('Пользователь с таким логином уже существует.');
            } else {
                const errorText = await response.text();
                throw new Error(errorText || `Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            alert('Ошибка регистрации: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    });

    // Обработчик формы входа
    document.querySelector('#loginModal form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const login = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!login || !password) {
            alert('Пожалуйста, введите логин и пароль.');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/User/login?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`, {
                method: 'GET'
            });

            if (response.ok) {
                const token = await response.text();
                localStorage.setItem('authToken', token);
                loginModal.style.display = 'none';
                alert('Вход выполнен успешно!');
                updateAuthUI();
                this.reset();
            } else if (response.status === 404) {
                throw new Error('Неверный логин или пароль.');
            } else {
                const errorText = await response.text();
                throw new Error(errorText || `Ошибка сервера: ${response.status}`);
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка входа: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    });
}

// Загрузка всех шаблонов для пагинации
async function loadAllTemplates() {
    try {
        showLoading(true);
        
        // Загружаем список всех ID шаблонов
        const idsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATES}`);
        allTemplateIds = await idsResponse.json();
        
        // Вычисляем общее количество страниц
        totalPages = Math.ceil(allTemplateIds.length / ITEMS_PER_PAGE);
        
        // Загружаем первую страницу
        loadPage(1);
        
    } catch (error) {
        console.error('Ошибка загрузки шаблонов:', error);
        showError('Не удалось загрузить шаблоны');
    } finally {
        showLoading(false);
    }
}

// Загрузка конкретной страницы
function loadPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allTemplateIds.length);
    const pageTemplateIds = allTemplateIds.slice(startIndex, endIndex);
    
    renderTemplates(pageTemplateIds);
    updatePagination();
}

// Отрисовка шаблонов на странице
function renderTemplates(templateIds) {
    templatesGrid.innerHTML = templateIds.map(id => `
        <div class="template-card" data-id="${id}">
            <img src="${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD}/${id}?isPreview=true"
                 alt="Шаблон мема"
                 class="template-thumbnail"
                 loading="lazy"
                 onmouseover="showKeywords(this.parentElement)"
                 onerror="this.onerror=null;this.src='https://via.placeholder.com/300x180?text=Ошибка+загрузки'">
            <div class="keywords-tooltip" id="keywords-${id}"></div>
        </div>
    `).join('');
    
    initTemplateClickHandlers();
}

// Обновление пагинации
function updatePagination() {
    pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Очищаем кнопки страниц
    const pageButtons = paginationContainer.querySelectorAll('.pagination-btn:not(#prevPage):not(#nextPage)');
    pageButtons.forEach(btn => btn.remove());
    
    // Добавляем кнопки страниц
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => loadPage(i));
        
        paginationContainer.insertBefore(pageBtn, nextPageBtn);
    }
}

// Инициализация обработчиков клика по карточкам
function initTemplateClickHandlers() {
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const templateId = this.dataset.id;
            if (templateId) {
                window.location.href = `editor.html?templateId=${templateId}`;
            }
        });
    });
}

// Функция для показа ключевых слов
async function showKeywords(cardElement) {
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

// Инициализация формы загрузки
function initUploadForm() {
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const keywords = templateKeywords.value.trim();
        if (!keywords) {
            alert('Введите ключевые слова через запятую');
            return;
        }

        if (!templateFile.files || templateFile.files.length === 0) {
            alert('Выберите файл изображения');
            return;
        }

        const formData = new FormData();
        formData.append('keyWords', keywords);
        formData.append('pic', templateFile.files[0]);

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';

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
                try {
                    const data = await response.text();
                    try {
                        const json = JSON.parse(data);
                        alert('Шаблон отправлен на модерацию! ID: ' + (json.id || ''));
                    } catch {
                        alert('Шаблон успешно загружен! ID: ' + data);
                    }
                } catch {
                    alert('Шаблон успешно загружен!');
                }

                uploadModal.style.display = 'none';
                uploadForm.reset();
                loadAllTemplates(); // Перезагружаем все шаблоны
            } else {
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
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            alert('Ошибка: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить на модерацию';
        }
    });
}

// Управление состоянием загрузки
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    if (show) {
        templatesGrid.innerHTML = '';
        paginationContainer.style.display = 'none';
    } else {
        paginationContainer.style.display = 'flex';
    }
}

// Отображение ошибки
function showError(message) {
    templatesGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
    paginationContainer.style.display = 'none';
}

// Инициализация модальных окон
function initModalWindows() {
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        uploadModal.style.display = 'flex';
    });

    loginBtn.addEventListener('click', handleLoginClick);

    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'none';
        registerModal.style.display = 'flex';
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            uploadModal.style.display = 'none';
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) uploadModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });
}

// Глобальные функции для обработки событий
window.showKeywords = showKeywords;
