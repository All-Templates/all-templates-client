import { DOM, STATE } from './main.js';
import { showLoading, showError } from './ui.js';
import { loadAllTemplates } from './templates.js';
import API_CONFIG from './api-config.js';

// Показать админ-панель
export async function showAdminPanel() {
    try {
        showLoading(true);

        const authToken = localStorage.getItem('authToken');
        const headers = {
            'Authorization': `Bearer ${authToken}`
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UNCHECKED}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки шаблонов для модерации');
        }

        const templateIds = await response.json();

        if (templateIds.length === 0) {
            showNoTemplatesMessage();
            return;
        }

        const templatesData = await loadTemplatesData(templateIds, headers);
        renderAdminPanel(templatesData.filter(template => template !== null));

    } catch (error) {
        console.error('Ошибка загрузки админ-панели:', error);
        alert('Ошибка: ' + error.message);
        loadAllTemplates();
    } finally {
        showLoading(false);
    }
}

async function loadTemplatesData(templateIds, headers) {
    return await Promise.all(
        templateIds.map(async (id) => {
            try {
                const templateResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TEMPLATE_DETAILS}/${id}`);
                if (!templateResponse.ok) return null;

                const templateData = await templateResponse.json();
                const userInfo = await loadUserInfo(templateData.senderId, headers);
                const fileSize = await loadFileInfo(id, headers);

                return {
                    id: id,
                    keyWords: templateData.keyWords || [],
                    sender: userInfo,
                    fileSize: fileSize
                };
            } catch (error) {
                console.error('Ошибка загрузки данных шаблона:', error);
                return null;
            }
        })
    );
}

async function loadUserInfo(senderId, headers) {
    if (!senderId) return 'Анонимно';

    try {
        const userResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_INFO}/${senderId}`, {
            headers: headers
        });
        if (userResponse.ok) {
            const userData = await userResponse.json();
            return userData.login;
        }
        return 'Анонимно';
    } catch (error) {
        console.error('Ошибка загрузки информации о пользователе:', error);
        return 'Анонимно';
    }
}

async function loadFileInfo(templateId, headers) {
    try {
        const fileResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD}/${templateId}?fileinfo=true`, {
            headers: headers
        });
        if (fileResponse.ok) {
            const fileData = await fileResponse.json();
            return formatFileSize(fileData.size);
        }
        return 'Неизвестно';
    } catch (error) {
        console.error('Ошибка загрузки информации о файле:', error);
        return 'Неизвестно';
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

function showNoTemplatesMessage() {
    DOM.templatesGrid.innerHTML = `
        <div class="no-results-message">
            <i class="fas fa-check-circle"></i>
            <h3>Нет шаблонов для модерации</h3>
            <p>Все шаблоны проверены. Нет новых заявок на модерацию.</p>
        </div>
    `;
    DOM.paginationContainer.style.display = 'none';
}

// Отрисовка админ-панели
function renderAdminPanel(templates) {
    DOM.templatesGrid.innerHTML = `
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

    DOM.paginationContainer.style.display = 'none';
}

// Одобрить шаблон
export async function approveTemplate(templateId) {
    if (!confirm('Одобрить этот шаблон?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.APPROVE}/${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('Шаблон одобрен!');
            showAdminPanel();
        } else {
            throw new Error('Ошибка одобрения шаблона');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}

// Отклонить шаблон
export async function rejectTemplate(templateId) {
    if (!confirm('Отклонить этот шаблон?')) return;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REJECT}/${templateId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            alert('Шаблон отклонен!');
            showAdminPanel();
        } else {
            throw new Error('Ошибка отклонения шаблона');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка: ' + error.message);
    }
}






