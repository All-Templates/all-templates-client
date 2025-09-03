import API_CONFIG from './api-config.js';

document.addEventListener('DOMContentLoaded', function() {
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
    const downloadBtn = document.getElementById('downloadBtn'); // Шаблон
    const finalDownloadBtn = document.getElementById('finalDownloadBtn'); // Готовый мем
    const backBtn = document.getElementById('backBtn');
    
    // Переменные состояния
    let currentColor = 'white';
    let imageObj = new Image();
    let isImageLoaded = false;
    let originalImageData = null;
    
    if (!templateId) {
        alert('Шаблон не выбран. Вы будете перенаправлены на главную страницу.');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Загрузка изображения
    function loadImage() {
        // Без isPreview=true для редактора (полное качество)
        imageObj.src = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DOWNLOAD}/${templateId}?t=${new Date().getTime()}`;
        
        imageObj.onload = function() {
            isImageLoaded = true;
            resizeCanvas();
            drawMeme();
            // Сохраняем оригинальное изображение без текста
            saveOriginalImage();
        };
        
        imageObj.onerror = function() {
            console.error('Ошибка загрузки изображения с ID:', templateId);
            imageObj.src = 'https://via.placeholder.com/600x400?text=Ошибка+загрузки+шаблона';
            isImageLoaded = false;
            
            setTimeout(() => {
                resizeCanvas();
                drawMeme();
            }, 100);
        };
    }
    
    // Сохранение оригинального изображения без текста
    function saveOriginalImage() {
        if (!isImageLoaded) return;
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
        originalImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    // Изменение размера canvas
    function resizeCanvas() {
        if (!isImageLoaded) return;
        
        const maxWidth = 800;
        const maxHeight = 600;
        
        let width = imageObj.width;
        let height = imageObj.height;
        
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
        ctx.textBaseline = 'top';
        
        // Верхний текст
        const topText = topTextInput.value || ' ';
        if (topText.trim()) {
            ctx.strokeText(topText, canvas.width / 2, 10);
            ctx.fillText(topText, canvas.width / 2, 10);
        }
        
        // Нижний текст
        const bottomText = bottomTextInput.value || ' ';
        if (bottomText.trim()) {
            ctx.textBaseline = 'bottom';
            ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 10);
            ctx.fillText(bottomText, canvas.width / 2, canvas.height - 10);
        }
    }
    
    // Скачивание оригинального шаблона (без текста)
    function downloadOriginalTemplate() {
        if (!isImageLoaded) {
            alert('Изображение не загружено!');
            return;
        }
        
        // Создаем временный canvas для оригинального изображения
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Восстанавливаем оригинальное изображение
        if (originalImageData) {
            tempCtx.putImageData(originalImageData, 0, 0);
        } else {
            tempCtx.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
        }
        
        const link = document.createElement('a');
        link.download = `meme-template-${templateId}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }
    
    // Скачивание готового мема (с текстом)
    function downloadFinishedMeme() {
        if (!isImageLoaded) {
            alert('Изображение не загружено!');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'my-meme.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
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
    
    // Кнопка скачивания шаблона (без текста)
    downloadBtn.addEventListener('click', downloadOriginalTemplate);
    
    // Кнопка скачивания готового мема (с текстом)
    finalDownloadBtn.addEventListener('click', downloadFinishedMeme);
    
    // Кнопка назад
    backBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Инициализация
    loadImage();
    
    // Добавляем обработчики для кнопок пагинации
    prevPageBtn.addEventListener('click', () => loadPage(currentPage - 1));
    nextPageBtn.addEventListener('click', () => loadPage(currentPage + 1));
});
