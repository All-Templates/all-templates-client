// Управление избранным
document.addEventListener('DOMContentLoaded', function() {
    // Обработка кликов по сердечкам
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            this.innerHTML = this.classList.contains('active') 
                ? '<i class="fas fa-heart"></i>' 
                : '<i class="far fa-heart"></i>';
            
            // Здесь можно добавить AJAX-запрос для сохранения в избранное
        });
    });
});
