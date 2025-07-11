import API_CONFIG from './api-config.js';

document.addEventListener('DOMContentLoaded', function() {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('templateId');
    
    // Элементы DOM
    const canvas = document.getElementById('memeCanvas');
    const ctx = canvas.getContext('2d');
    const topTextInput = document.getElementById('topText');
    const bottomTextInput = document.getElementById('bottomText');
    const topTextPreview = document.getElementById('topTextPreview');
    const bottomTextPreview = document.getElementById('bottomTextPreview');
    const fontSizeInput = document.getElementById('fontSize');
    const colorOptions = document.querySelectorAll('.color-option');
    const customColorInput = document.getElementById('customColor');
    const downloadBtn = document.getElementById('downloadBtn');
    const finalDownloadBtn = document.getElementById('finalDownloadBtn');
    const backBtn = document.getElementById('backBtn');
    
    // Переменные состояния
    let currentColor = 'white';
    let imageObj = new Image();
    let isImageLoaded = false;
    
    // Загрузка изображения по templateId или использование заглушки
    function loadImage() {
        if (templateId) {
            // Если есть templateId, загружаем изображение с сервера
            imageObj.src = `https://finely-mature-naiad.cloudpub.ru/api/templates/download/${templateId}`;
        } else {
            // Если нет templateId, используем заглушку
            imageObj.src = 'https://via.placeholder.com/600x400?text=Выберите+шаблон+на+главной+странице';
        }
        
        imageObj.onload = function() {
            isImageLoaded = true;
            resizeCanvas();
            drawMeme();
        };
        
        imageObj.onerror = function() {
            // Если ошибка загрузки, используем заглушку
            imageObj.src = 'https://via.placeholder.com/600x400?text=Ошибка+загрузки+шаблона';
            isImageLoaded = false;
        };
    }
    
    // Изменение размера canvas под изображение
    function resizeCanvas() {
        if (!isImageLoaded) return;
        
        // Максимальные размеры для canvas
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = imageObj.width;
        let height = imageObj.height;
        
        // Масштабирование если изображение слишком большое
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
    }
    
    // Отрисовка мема
    function drawMeme() {
        if (!isImageLoaded) return;
        
        // Очищаем canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем изображение
        ctx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
        
        // Настройки текста
        const fontSize = parseInt(fontSizeInput.value);
        ctx.font = `bold ${fontSize}px Impact, Arial, sans-serif`;
        ctx.fillStyle = currentColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 10;
        ctx.textAlign = 'center';
        
        // Верхний текст
        const topText = topTextInput.value || ' ';
        ctx.strokeText(topText, canvas.width / 2, fontSize + 10);
        ctx.fillText(topText, canvas.width / 2, fontSize + 10);
        
        // Нижний текст
        const bottomText = bottomTextInput.value || ' ';
        ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 10);
        ctx.fillText(bottomText, canvas.width / 2, canvas.height - 10);
    }
    
    // Обработчики событий
    topTextInput.addEventListener('input', function() {
        topTextPreview.textContent = this.value || 'Верхний текст';
        drawMeme();
    });
    
    bottomTextInput.addEventListener('input', function() {
        bottomTextPreview.textContent = this.value || 'Нижний текст';
        drawMeme();
    });
    
    fontSizeInput.addEventListener('input', drawMeme);
    
    // Выбор цвета
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            currentColor = this.dataset.color;
            drawMeme();
        });
    });
    
    customColorInput.addEventListener('input', function() {
        colorOptions.forEach(opt => opt.classList.remove('selected'));
        currentColor = this.value;
        drawMeme();
    });
    
    // Кнопка скачивания
    downloadBtn.addEventListener('click', function() {
        if (!isImageLoaded) {
            alert('Изображение не загружено!');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'meme-template.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    finalDownloadBtn.addEventListener('click', function() {
        if (!isImageLoaded) {
            alert('Изображение не загружено!');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'my-meme.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
    
    // Кнопка назад
    backBtn.addEventListener('click', function() {
        window.location.href = 'https://all-templates.github.io/all-templates-client/';
    });
    
    // Инициализация
    loadImage();
});
