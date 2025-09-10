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
const searchInput = document.querySelector('.search-bar input');
const searchButton = document.querySelector('.search-bar button');
const adminPanelBtn = document.getElementById('adminPanelBtn');

// Настройки пагинации
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let totalPages = 1;
let allTemplateIds = [];
let currentSearchQuery = '';
let currentUser = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadAllTemplates();
    initModalWindows();
    initUploadForm();
    initAuthForms();
    initSearch();
    updateAuthUI();
});

// Инициализация поиска
function initSearch() {
    // Поиск по кнопке
    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch();
    });

    // Поиск по Enter
    searchInput.addEventListener('keypress', (e) => {
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
    
    searchInput.parentNode.appendChild(clearSearchBtn);

    // Показываем/скрываем кнопку очистки
    searchInput.addEventListener('input', function() {
        clearSearchBtn.style.display = this.value ? 'block' : 'none';
    });
}

// Выполнение поиска
async function performSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        clearSearch();
        return;
    }

    currentSearchQuery = query;
    await searchTemplates(query);
}

// Очистка поиска
function clearSearch() {
    searchInput.value = '';
    currentSearchQuery = '';
    const clearBtn = document.querySelector('.clear-search-btn');
    if (clearBtn) clearBtn.style.display = 'none';
    loadAllTemplates();
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

        const response = await fetch(`${API_CONFIG.BASE_URL}/Templates/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Ошибка поиска: ${response.status}`);
        }

        const searchResults = await response.json();
        allTemplateIds = searchResults;
        totalPages = Math.ceil(allTemplateIds.length / ITEMS_PER_PAGE);
        
        if (allTemplateIds.length === 0) {
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
    templatesGrid.innerHTML = `
        <div class="no-results-message">
            <i class="fas fa-search"></i>
            <h3>Ничего не найдено</h3>
            <p>По запросу "${query}" не найдено ни одного шаблона.</p>
            <button class="btn btn-outline" onclick="clearSearch()">
                <i class="fas fa-times"></i> Очистить поиск
            </button>
        </div>
    `;
    paginationContainer.style.display = 'none';
}

// Декодирование JWT токена для получения информации о пользователе
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Ошибка парсинга JWT:', error);
        return null;
    }
}

// Функция для обновления UI в зависимости от статуса авторизации
function updateAuthUI() {
    const authToken = localStorage.getItem('authToken');
    const loginBtn = document.getElementById('loginBtn');

    // Удаляем старые иконки админа, если они есть
    const oldAdminIcon = document.querySelector('.admin-icon');
    const oldAdminPanelBtn = document.getElementById('adminPanelBtn');
    if (oldAdminIcon) oldAdminIcon.remove();
    if (oldAdminPanelBtn) oldAdminPanelBtn.remove();

    if (authToken) {
        // Парсим токен для получения информации о пользователе
        const decodedToken = parseJwt(authToken);
        currentUser = decodedToken;

        if (decodedToken) {
            // Проверяем, является ли пользователь админом
            const isAdmin = decodedToken[ClaimTypes.Role] === 'Admin';
            
            if (isAdmin) {
                // Создаем иконку гаечного ключа для админа
                const adminIcon = document.createElement('div');
                adminIcon.className = 'admin-icon';
                adminIcon.innerHTML = '<i class="fas fa-cog" title="Режим администратора"></i>';
                adminIcon.style.marginLeft = '10px';
                adminIcon.style.cursor = 'pointer';
                adminIcon.addEventListener('click', () => {
                    alert('Вы вошли как администратор. Доступны функции модерации.');
                });
                
                // Добавляем иконку рядом с кнопкой входа
                loginBtn.parentNode.insertBefore(adminIcon, loginBtn.nextSibling);

                // Создаем кнопку админ-панели
                const adminPanelBtn = document.createElement('a');
                adminPanelBtn.id = 'adminPanelBtn';
                adminPanelBtn.href = '#';
                adminPanelBtn.className = 'btn btn-outline';
                adminPanelBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Модерация';
                adminPanelBtn.style.marginLeft = '10px';
                adminPanelBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAdminPanel();
                });

                // Добавляем кнопку в навигацию
                loginBtn.parentNode.insertBefore(adminPanelBtn, loginBtn.nextSibling);
            }
        }

        // Пользователь авторизован
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
        loginBtn.removeEventListener('click', handleLoginClick);
        loginBtn.addEventListener('click', handleLogoutClick);
        uploadBtn.style.display = 'inline-flex';
    } else {
        // Пользователь не авторизован
        currentUser = null;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
        loginBtn.removeEventListener('click', handleLogoutClick);
        loginBtn.addEventListener('click', handleLoginClick);
        uploadBtn.style.display = 'none';
    }
}

// Константы для ClaimTypes
const ClaimTypes = {
    NameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    Role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
};

// Показать админ-панель
async function showAdminPanel() {
    try {
        showLoading(true);
        
        const authToken = localStorage.getItem('authToken');
        const headers = {
            'Authorization': `Bearer ${authToken}`
        };

        // Загружаем шаблоны, ожидающие модерации
        const response = await fetch(`${API_CONFIG.BASE_URL}/Templates/unchecked`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки шаблонов для модерации');
        }

        const templateIds = await response.json();
        
        if (templateIds.length === 0) {
            templatesGrid.innerHTML = `
                <div class="no-results-message">
                    <i class="fas fa-check-circle"></i>
                    <h3>Нет шаблонов для модерации</h3>
                    <p>Все шаблоны проверены. Нет новых заявок на модерацию.</p>
                </div>
            `;
            paginationContainer.style.display = 'none';
            return;
        }

        // Загружаем детальную информацию о каждом шаблоне
        const templatesData = await Promise.all(
            templateIds.map(async (id) => {
                const templateResponse = await fetch(`${API_CONFIG.BASE_URL}/Templates/${id}`);
                if (!templateResponse.ok) return null;
                
                const templateData = await templateResponse.json();
                
                // Загружаем информацию о пользователе
                let userInfo = 'Анонимно';
                if (templateData.senderId) {
                    try {
                        const userResponse = await fetch(`${API_CONFIG.BASE_URL}/User/info/${templateData.senderId}`, {
                            headers: headers
                        });
                        if (userResponse.ok) {
                            const userData = await userResponse.json();
                            userInfo = userData.login;
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки информации о пользователе:', error);
                    }
                }

                // Получаем информацию о файле
                let fileSize = 'Неизвестно';
                try {
                    const fileResponse = await fetch(`${API_CONFIG.BASE_URL}/Templates/fileinfo/${id}`, {
                        headers: headers
                    });
                    if (fileResponse.ok) {
                        const fileData = await fileResponse.json();
                        fileSize = formatFileSize(fileData.size);
                    }
                } catch (error) {
                    console.error('Ошибка загрузки информации о файле:', error);
                }

                return {
                    id: id,
                    keyWords: templateData.keyWords || [],
                    sender: userInfo,
                    fileSize: fileSize
                };
            })
        );

        // Отображаем админ-панель
        renderAdminPanel(templatesData.filter(template => template !== null));

    } catch (error) {
        console.error('Ошибка загрузки админ-панели:', error);
        alert('Ошибка: ' + error.message);
        loadAllTemplates(); // Возвращаемся к обычному виду
    } finally {
        showLoading(false);
    }
}

// Форматирование размера файла
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Отрисовка админ-панели
function renderAdminPanel(templates) {
    templatesGrid.innerHTML = `
        <div class="admin-panel-header">
            <h3><i class="fas fa-shield-alt"></i> Панель модерации</h3>
            <p>Шаблоны, ожидающие проверки: ${templates.length}</p>
        </div>
        <div class="admin-templates-list">
            ${templates.map(template => `
                <div class="admin-template-card" data-id="${template.id}">
                    <div class="template-preview">
                        <img src="${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD}/${template.id}?isPreview=true"
                             alt="Шаблон мема"
                             onerror="this.onerror=null;this.src='https://via.placeholder.com/200x150?text=Ошибка+загрузки'">
                    </div>
                    <div class="template-info">
                        <div class="info-row">
                            <label>ID:</label>
                            <span>${template.id}</span>
                        </div>
                        <div class="info-row">
                            <label>Теги:</label>
                            <span class="keywords">${template.keyWords.join(', ') || 'Нет тегов'}</span>
                        </div>
                        <div class="info-row">
                            <label>Пользователь:</label>
                            <span>${template.sender}</span>
                        </div>
                        <div class="info-row">
                            <label>Размер файла:</label>
                            <span>${template.fileSize}</span>
                        </div>
                    </div>
                    <div class="admin-actions">
                        <button class="btn btn-success approve-btn" onclick="approveTemplate(${template.id})">
                            <i class="fas fa-check"></i> Одобрить
                        </button>
                        <button class="btn btn-danger reject-btn" onclick="rejectTemplate(${template.id})">
                            <i class="fas fa-times"></i> Отклонить
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="admin-panel-footer">
            <button class="btn btn-outline" onclick="loadAllTemplates()">
                <i class="fas fa-arrow-left"></i> Вернуться к галерее
            </button>
        </div>
    `;

    paginationContainer.style.display = 'none';
}

// Одобрить шаблон
async function approveTemplate(templateId) {
    if (!confirm('Одобрить этот шаблон?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_CONFIG.BASE_URL}/Templates/approve/${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('Шаблон одобрен!');
            showAdminPanel(); // Обновляем панель
        } else {
            throw new Error('Ошибка одобрения шаблона');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Отклонить шаблон
async function rejectTemplate(templateId) {
    if (!confirm('Отклонить этот шаблон?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_CONFIG.BASE_URL}/Templates/reject/${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('Шаблон отклонен!');
            showAdminPanel(); // Обновляем панель
        } else {
            throw new Error('Ошибка отклонения шаблона');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

function handleLoginClick(e) {
    e.preventDefault();
    loginModal.style.display = 'flex';
}

function handleLogoutClick(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    currentUser = null;
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
window.clearSearch = clearSearch;
window.showAdminPanel = showAdminPanel;
window.approveTemplate = approveTemplate;
window.rejectTemplate = rejectTemplate;
