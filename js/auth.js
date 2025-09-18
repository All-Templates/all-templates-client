import { DOM, STATE } from './main.js';
import { loadAllTemplates } from './templates.js';
import { loadUserData } from './favorites.js';
import API_CONFIG from './api-config.js';

export const ClaimTypes = {
    NameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    Role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
};

// Декодирование JWT токена
export function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Ошибка парсинга JWT:', error);
        return null;
    }
}

// Обновление UI в зависимости от статуса авторизации
export function updateAuthUI() {
    const authToken = localStorage.getItem('authToken');
    const loginBtn = DOM.loginBtn;

    // Удаляем старые иконки
    const oldAdminIcon = document.querySelector('.admin-icon');
    const oldAdminPanelBtn = document.getElementById('adminPanelBtn');
    if (oldAdminIcon) oldAdminIcon.remove();
    if (oldAdminPanelBtn) oldAdminPanelBtn.remove();

    const oldProfileBtn = document.getElementById('profileBtn');
    if (oldProfileBtn) oldProfileBtn.remove();

    if (authToken) {
        const decodedToken = parseJwt(authToken);
        STATE.currentUser = decodedToken;

        if (decodedToken) {
            const isAdmin = decodedToken[ClaimTypes.Role] === 'Admin';

            if (isAdmin) {
                createAdminElements();
            }
            createProfileButton();
            loadUserData();
        }

        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
        loginBtn.removeEventListener('click', handleLoginClick);
        loginBtn.addEventListener('click', handleLogoutClick);
    } else {
        STATE.currentUser = null;
        STATE.userFavorites.clear();
        STATE.userUploads.clear();
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
        loginBtn.removeEventListener('click', handleLogoutClick);
        loginBtn.addEventListener('click', handleLoginClick);
    }

    DOM.uploadBtn.style.display = 'inline-flex';
}

function createAdminElements() {
    const adminIcon = document.createElement('div');
    adminIcon.className = 'admin-icon';
    adminIcon.innerHTML = '<i class="fas fa-cog" title="Режим администратора"></i>';
    adminIcon.style.marginLeft = '10px';
    adminIcon.style.cursor = 'pointer';
    adminIcon.addEventListener('click', () => {
        alert('Вы вошли как администратор. Доступны функции модерации.');
    });

    const adminPanelBtn = document.createElement('a');
    adminPanelBtn.id = 'adminPanelBtn';
    adminPanelBtn.href = '#';
    adminPanelBtn.className = 'btn btn-outline';
    adminPanelBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Модерация';
    adminPanelBtn.style.marginLeft = '10px';
    adminPanelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.showAdminPanel();
    });

    DOM.loginBtn.parentNode.insertBefore(adminIcon, DOM.loginBtn.nextSibling);
    DOM.loginBtn.parentNode.insertBefore(adminPanelBtn, DOM.loginBtn.nextSibling);
}

function createProfileButton() {
    const profileBtn = document.createElement('a');
    profileBtn.id = 'profileBtn';
    profileBtn.href = '#';
    profileBtn.className = 'profile-btn';
    profileBtn.innerHTML = '<i class="fas fa-user"></i>';
    profileBtn.title = 'Мой профиль';
    profileBtn.style.marginLeft = '10px';

    DOM.loginBtn.parentNode.insertBefore(profileBtn, DOM.loginBtn.nextSibling);
}

export function handleLoginClick(e) {
    e.preventDefault();
    DOM.loginModal.style.display = 'flex';
}

export function handleLogoutClick(e) {
    e.preventDefault();
    localStorage.removeItem('authToken');
    STATE.currentUser = null;
    STATE.userFavorites.clear();
    STATE.userUploads.clear();
    alert('Вы вышли из системы.');
    updateAuthUI();
    loadAllTemplates();
}

// Инициализация форм авторизации
export function initAuthForms() {
    // Обработчик формы регистрации
    document.querySelector('#registerModal form').addEventListener('submit', async function (e) {
        e.preventDefault();
        await handleRegister(this);
    });

    // Обработчик формы входа
    document.querySelector('#loginModal form').addEventListener('submit', async function (e) {
        e.preventDefault();
        await handleLogin(this);
    });
}

async function handleRegister(form) {
    const login = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    if (!login || !password) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    if (password.length < 4) {
        alert('Пароль должен содержать минимум 4 символа.');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Регистрация...';

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_REGISTER}?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`, {
            method: 'GET'
        });

        if (response.ok) {
            const token = await response.text();
            localStorage.setItem('authToken', token);
            DOM.registerModal.style.display = 'none';
            alert('Регистрация успешна! Вы автоматически вошли в систему.');
            updateAuthUI();
            form.reset();
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
}

async function handleLogin(form) {
    const login = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!login || !password) {
        alert('Пожалуйста, введите логин и пароль.');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_LOGIN}?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`, {
            method: 'GET'
        });

        if (response.ok) {
            const token = await response.text();
            localStorage.setItem('authToken', token);
            DOM.loginModal.style.display = 'none';
            alert('Вход выполнен успешно!');
            updateAuthUI();
            form.reset();
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
}
