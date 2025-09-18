import { DOM } from './main.js';
class TagsManager {
    constructor() {
        this.tags = [];
        this.tagsInput = DOM.templateKeywords;
        this.tagsDisplay = document.getElementById('tagsDisplay');
        this.init();
    }

    init() {
        this.tagsInput.addEventListener('blur', () => this.processCurrentInput());
        this.tagsInput.addEventListener('paste', (e) => this.handlePaste(e));
    }

    addTag(tagText) {
        const trimmedTag = tagText.trim();

        if (!trimmedTag) return false;

        // Проверка на дубликаты
        if (this.tags.includes(trimmedTag)) {
            this.showDuplicateWarning(trimmedTag);
            return false;
        }

        // Проверка длины тега
        if (trimmedTag.length > 20) {
            this.showLengthWarning();
            return false;
        }

        this.tags.push(trimmedTag);
        this.renderTags();
        this.updateHiddenInput();
        return true;
    }

    removeTag(tagIndex) {
        this.tags.splice(tagIndex, 1);
        this.renderTags();
        this.updateHiddenInput();
    }

    processCurrentInput() {
        const currentValue = this.tagsInput.value;
        if (currentValue) {
            const tagsToAdd = currentValue.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);

            let added = false;
            tagsToAdd.forEach(tag => {
                if (this.addTag(tag)) {
                    added = true;
                }
            });

            if (added) {
                this.tagsInput.value = '';
            }
        }
    }

    handlePaste(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const tags = pastedText.split(/[,;\n]+/)
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        let addedAny = false;
        tags.forEach(tag => {
            if (this.addTag(tag)) {
                addedAny = true;
            }
        });

        if (addedAny) {
            this.tagsInput.value = '';
        }
    }

    renderTags() {
        this.tagsDisplay.innerHTML = '';

        this.tags.forEach((tag, index) => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-chip';
            tagElement.innerHTML = `
                <span class="tag-text" title="${tag}">${tag}</span>
                <button type="button" class="remove-tag" onclick="tagsManager.removeTag(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            this.tagsDisplay.appendChild(tagElement);
        });

        // Показываем/скрываем плейсхолдер
        if (this.tags.length > 0) {
            this.tagsInput.placeholder = '';
        } else {
            this.tagsInput.placeholder = 'Введите теги через запятую...';
        }
    }

    updateHiddenInput() {
        // Обновляем значение скрытого инпута для формы
        const hiddenInput = document.getElementById('templateKeywordsHidden');
        if (hiddenInput) {
            hiddenInput.value = this.tags.join(',');
        }
    }

    getTags() {
        return [...this.tags];
    }

    clearTags() {
        this.tags = [];
        this.renderTags();
        this.updateHiddenInput();
        this.tagsInput.value = '';
    }

    showDuplicateWarning(tag) {
        const tagElement = this.tagsDisplay.querySelector(`.tag-text[title="${tag}"]`);
        if (tagElement) {
            const chip = tagElement.closest('.tag-chip');
            chip.style.animation = 'shake 0.5s ease';
            setTimeout(() => {
                chip.style.animation = '';
            }, 500);
        }
    }

    showLengthWarning() {
        this.tagsInput.style.borderColor = '#ef4444';
        setTimeout(() => {
            this.tagsInput.style.borderColor = '';
        }, 1000);
    }

    validate() {
        if (this.tags.length < 2) {
            this.showValidationError('Добавьте минимум 2 тега');
            return false;
        }
        return true;
    }

    showValidationError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'tags-error';
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.marginTop = '5px';
        errorDiv.textContent = message;

        const existingError = this.tagsInput.parentNode.querySelector('.tags-error');
        if (existingError) {
            existingError.remove();
        }

        this.tagsInput.parentNode.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 3000);
    }
}

// Глобальная функция для обработки ввода
function handleTagsInput(event) {
    if (event.key === ',' || event.key === 'Enter') {
        event.preventDefault();
        tagsManager.processCurrentInput();
    } else if (event.key === 'Backspace' && tagsManager.tagsInput.value === '' && tagsManager.tags.length > 0) {
        // Удаление последнего тега по Backspace
        tagsManager.removeTag(tagsManager.tags.length - 1);
    }
}

// Инициализация менеджера тегов
let tagsManager;

function initTagsManager() {
    tagsManager = new TagsManager();
    window.tagsManager = tagsManager;
}

export { initTagsManager, tagsManager, handleTagsInput };
