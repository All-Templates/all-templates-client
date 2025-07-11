// Конфигурация API
const API_CONFIG = {
    BASE_URL: 'https://finely-mature-naiad.cloudpub.ru',
    ENDPOINTS: {
        TEMPLATES: '/api/templates',
        DOWNLOAD: '/api/templates/download',
        CREATE: '/api/templates/create',
        TEMPLATE_DETAILS: '/api/templates'
    }
};

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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadTemplates();
    initModalWindows();
    initTemplateCards();
    initUploadForm();
});

// Загрузка шаблонов мемов
async function loadTemplates() {
    try {
        showLoading(true);
        templatesGrid.innerHTML = '';

        // Загружаем список ID шаблонов
        const idsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATES}`);
        const templateIds = await idsResponse.json();

        // Создаем карточки для каждого шаблона
        templatesGrid.innerHTML = templateIds.map(id => `
            <div class="template-card" data-id="${id}">
                <img src="${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD}/${id}"
                     alt="Шаблон мема"
                     class="template-thumbnail"
                     loading="lazy"
                     onmouseover="showKeywords(this.parentElement)"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/300x180?text=Ошибка+загрузки'">
                <div class="keywords-tooltip" id="keywords-${id}"></div>
            </div>
        `).join('');
        // Добавляем обработчики клика
        initTemplateClickHandlers();

    } catch (error) {
        console.error('Ошибка загрузки шаблонов:', error);
        showError('Не удалось загрузить шаблоны');
    } finally {
        showLoading(false);
    }
}

// Инициализация обработчиков клика
function initTemplateClickHandlers() {
    document.querySelectorAll('.template-card').forEach(card => {
        card.addEventListener('click', function () {
            const templateId = this.dataset.id;
            // Переходим к редактору с ID шаблона
            window.location.href = `https://all-templates.github.io/all-templates-client/edit/?templateId=${templateId}`;
        });
    });
}

// Функция для показа ключевых слов
async function showKeywords(cardElement) {
    const templateId = cardElement.dataset.id;
    const tooltip = cardElement.querySelector('.keywords-tooltip');

    // Если ключевые слова уже загружены, просто показываем их
    if (tooltip.textContent) return;

    try {
        // Загружаем ключевые слова для шаблона
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE_DETAILS}/${templateId}`);
        const templateData = await response.json();

        // Отображаем ключевые слова
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

        // Валидация полей
        const keywords = templateKeywords.value.trim();
        if (!keywords) {
            alert('Введите ключевые слова через запятую');
            return;
        }

        if (!templateFile.files || templateFile.files.length === 0) {
            alert('Выберите файл изображения');
            return;
        }

        // Подготовка данных
        const formData = new FormData();
        formData.append('keyWords', keywords);
        formData.append('pic', templateFile.files[0]);

        // Показать состояние загрузки
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE}`, {
                method: 'POST',
                body: formData
            });

            // Обработка ответа
            if (response.ok) {
                // Успешный ответ (200-299)
                try {
                    // Пробуем прочитать JSON, но не блокируемся на ошибке
                    const data = await response.text();
                    try {
                        const json = JSON.parse(data);
                        console.log('Успешный ответ JSON:', json);
                        alert('Шаблон отправлен на модераци! ID: ' + (json.id || ''));
                    } catch {
                        console.log('Сервер вернул текст:', data);
                        alert('Шаблон успешно загружен!');
                    }
                } catch (error) {
                    console.log('Пустой ответ сервера');
                    alert('Шаблон успешно загружен!');
                }

                // Обновляем интерфейс
                uploadModal.style.display = 'none';
                uploadForm.reset();
                loadTemplates();
            } else {
                // Ошибка сервера (4xx, 5xx)
                let errorText = '';
                try {
                    errorText = await response.text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        if (errorJson.errors) {
                            // Обработка ошибок валидации
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
}

// Инициализация модальных окон
function initModalWindows() {
    // Открытие модальных окон
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        uploadModal.style.display = 'flex';
    });

    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.style.display = 'flex';
    });

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

    // Закрытие модальных окон
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            uploadModal.style.display = 'none';
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });

    // Закрытие при клике вне модального окна
    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) uploadModal.style.display = 'none';
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });
}

// Инициализация карточек шаблонов
function initTemplateCards() {
    templatesGrid.addEventListener('click', (e) => {
        if (e.target.closest('.template-card')) {
            const card = e.target.closest('.template-card');
            const img = card.querySelector('img');
            const imageUrl = img.src;
            console.log('Выбран шаблон:', imageUrl);
            // Здесь можно добавить открытие редактора
        }
    });
}
