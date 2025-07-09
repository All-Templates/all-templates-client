document.addEventListener('DOMContentLoaded', function() {
    // Выбор цвета текста
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            document.querySelector('.color-option.selected').classList.remove('selected');
            this.classList.add('selected');
            updateMemeText();
        });
    });
    
    // Сохранение мема локально
    document.getElementById('saveLocal').addEventListener('click', function() {
        alert('Мем сохранен на ваше устройство!');
        // Здесь будет код для сохранения изображения
    });
    
    // Сохранение в профиль
    document.getElementById('saveProfile').addEventListener('click', function() {
        alert('Мем сохранен в ваш профиль!');
        // Здесь будет код для сохранения в аккаунт
    });
    
    // Обновление текста при изменении
    document.getElementById('topText').addEventListener('input', updateMemeText);
    document.getElementById('bottomText').addEventListener('input', updateMemeText);
    document.getElementById('fontSelector').addEventListener('change', updateMemeText);
    document.getElementById('fontSize').addEventListener('input', updateMemeText);
    
    // Функция обновления текста мема
    function updateMemeText() {
        // Здесь будет код для обновления текста на изображении
        console.log('Обновление текста мема...');
    }
    
    // Загрузка похожих шаблонов
    document.querySelectorAll('.template-thumbnail').forEach(thumb => {
        thumb.addEventListener('click', function() {
            // Здесь будет код для загрузки выбранного шаблона
            console.log('Загрузка шаблона:', this.src);
        });
    });
});
