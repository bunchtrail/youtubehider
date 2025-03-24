// Конфигурация по умолчанию
const DEFAULT_CONFIG = {
    skipTime: 10, // секунды для перемотки
    extensionEnabled: true
};

// Состояние расширения
let config = { ...DEFAULT_CONFIG };
let video = null;
let preventUpdate = false; // Флаг для предотвращения обновления во время взаимодействия

// Загрузка конфигурации с использованием LiveStorage
function loadConfig() {
    // Убедимся, что LiveStorage инициализирован и загружен
    if (typeof LiveStorage !== 'undefined') {
        LiveStorage.load().then(() => {
            // Объединяем значения по умолчанию с данными из LiveStorage
            config = { ...DEFAULT_CONFIG, ...LiveStorage.local };
            
            // Если расширение выключено, удаляем CSS-классы и отключаем функциональность
            if (config.extensionEnabled === false) {
                document.documentElement.classList.remove('youtube-hider-enabled');
            } else {
                document.documentElement.classList.add('youtube-hider-enabled');
                init();
            }
        });
    } else {
        // Запасной вариант, если LiveStorage не доступен
        chrome.storage.local.get(null, (storedConfig) => {
            config = { ...DEFAULT_CONFIG, ...storedConfig };
            
            if (config.extensionEnabled === false) {
                document.documentElement.classList.remove('youtube-hider-enabled');
            } else {
                document.documentElement.classList.add('youtube-hider-enabled');
                init();
            }
        });
    }
}

// Добавляем обработчик сообщений для прямого обновления настроек
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Получено сообщение:', request);
    
    if (request.type === 'configUpdated') {
        // Пропускаем обновление, если пользователь взаимодействует с интерфейсом
        if (preventUpdate) {
            console.log('Обновление пропущено из-за взаимодействия пользователя');
            sendResponse({ success: false, reason: 'user-interaction-in-progress' });
            return true;
        }

        console.log('Обновление конфигурации:', request.config);

        // Обновляем конфигурацию немедленно
        const changes = {};
        Object.keys(request.config).forEach(key => {
            changes[key] = { newValue: request.config[key] };
            config[key] = request.config[key]; // Обновляем локальную копию конфигурации
            
            // Также обновляем LiveStorage, если он доступен
            if (typeof LiveStorage !== 'undefined') {
                LiveStorage.local[key] = request.config[key];
            }
        });
        
        console.log('Применяем изменения конфигурации');
        // Обрабатываем изменения так же, как при обычном обновлении через storage
        handleConfigChanges(changes);
        
        // Обязательно отправляем ответ
        sendResponse({ success: true, applied: true });
        return true;
    }
    
    // Если это не configUpdated, все равно отправляем ответ, чтобы избежать ошибок связи
    sendResponse({ success: false, reason: 'unknown-message-type' });
    return true;
});

// Выделяем обработку изменений настроек в отдельную функцию для переиспользования
function handleConfigChanges(changes) {
    console.log('Обработка изменений:', changes);
    
    // Пропускаем обновление, если пользователь взаимодействует с интерфейсом
    if (preventUpdate) {
        console.log('Обработка пропущена из-за взаимодействия пользователя');
        return;
    }
    
    // Проверяем состояние расширения
    if ('extensionEnabled' in changes) {
        console.log('Изменение состояния расширения:', changes.extensionEnabled.newValue);
        
        if (changes.extensionEnabled.newValue === false) {
            // Если расширение выключили
            console.log('Выключение расширения');
            document.documentElement.classList.remove('youtube-hider-enabled');
            removeListeners();
        } else {
            // Если расширение включили
            console.log('Включение расширения');
            document.documentElement.classList.add('youtube-hider-enabled');
            init();
        }
    }
}

// Слушаем изменения конфигурации
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        // Обновляем конфигурацию
        Object.keys(changes).forEach(key => {
            config[key] = changes[key].newValue;
        });
        
        // Используем выделенную функцию обработки изменений
        handleConfigChanges(changes);
    }
});

// Предотвращаем обновление при взаимодействии пользователя
document.addEventListener('mouseenter', () => {
    preventUpdate = true;
});

document.addEventListener('mouseleave', () => {
    preventUpdate = false;
});

// Удаление слушателей событий
function removeListeners() {
    // Здесь можно отключить слушатели, если необходимо
    // Это опционально, так как при отключении CSS эффекты скрытия элементов
    // уже не будут применяться
}

// Инициализация при загрузке страницы
function init() {
    // Проверяем, включено ли расширение
    if (config.extensionEnabled === false) {
        return;
    }

    // Находим видео-элемент
    video = document.querySelector('video');
    if (!video) {
        setTimeout(init, 1000);
        return;
    }

    setupKeyboardControls();
}

// Настройка клавиатурных сочетаний
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!video || config.extensionEnabled === false) return;

        switch(e.key) {
            case 'ArrowRight':
                video.currentTime += config.skipTime;
                break;
            case 'ArrowLeft':
                video.currentTime -= config.skipTime;
                break;
        }
    });
}

// Наблюдатель за изменениями DOM
const observer = new MutationObserver((mutations) => {
    if (!document.querySelector('video')) {
        init();
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});

// Инициализация при загрузке страницы
loadConfig(); 