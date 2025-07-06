 // Управление модальными окнами
        const uploadBtn = document.getElementById('uploadBtn');
        const loginBtn = document.getElementById('loginBtn');
        const uploadModal = document.getElementById('uploadModal');
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const closeButtons = document.querySelectorAll('.close-modal');
        
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
            if (e.target === uploadModal) {
                uploadModal.style.display = 'none';
            }
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
            }
        });
        
        // Обработка формы загрузки
        const uploadForm = document.getElementById('uploadForm');
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Здесь будет код для загрузки шаблона
            alert('Шаблон успешно загружен! После модерации он появится на сайте.');
            uploadModal.style.display = 'none';
            uploadForm.reset();
        });
        
        // Обработка форм авторизации (заглушка)
        document.querySelectorAll('.auth-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Форма отправлена! В реальном приложении здесь будет авторизация.');
                loginModal.style.display = 'none';
                registerModal.style.display = 'none';
                form.reset();
            });
        });
        
        // Обработка кликов по сердечкам
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.toggle('active');
                this.innerHTML = this.classList.contains('active') 
                    ? '<i class="fas fa-heart"></i>' 
                    : '<i class="far fa-heart"></i>';
            });
        });
