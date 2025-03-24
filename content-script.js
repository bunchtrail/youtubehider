// Конфигурация по умолчанию
const DEFAULT_CONFIG = {
    extensionEnabled: true
};

// Текущее состояние
let config = { ...DEFAULT_CONFIG };
let video = null;

// Инициализация скрипта
initContentScript();

// Основная функция инициализации
function initContentScript() {
    // Загружаем конфигурацию через LiveStorage, если доступно
    if (typeof LiveStorage !== 'undefined') {
        LiveStorage.load().then(() => {
            config = { ...DEFAULT_CONFIG, ...LiveStorage.local };
            applyExtensionState();
        });
    } else {
        // Запасной вариант: берем настройки напрямую
        chrome.storage.local.get(null, (storedConfig) => {
            config = { ...DEFAULT_CONFIG, ...storedConfig };
            applyExtensionState();
        });
    }

    // Слушаем события обновления настроек
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'configUpdated') {
            console.log('configUpdated:', request.config);
            handleConfigUpdates(request.config);
            sendResponse({ success: true });
            return true;
        }

        // Возвращаем ответ по умолчанию
        sendResponse({ success: false, reason: 'unknown-message-type' });
        return true;
    });

    // Следим за изменениями в chrome.storage
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            const updatedKeys = Object.keys(changes);
            updatedKeys.forEach((key) => {
                config[key] = changes[key].newValue;
            });
            handleConfigChanges(changes);
        }
    });

    // Наблюдатель за изменениями DOM, чтобы повторно искать <video> при смене страницы
    const observer = new MutationObserver(() => {
        if (!document.querySelector('video')) {
            initVideoElement();
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

// Применяем текущее состояние расширения (включено/выключено)
function applyExtensionState() {
    if (config.extensionEnabled) {
        document.documentElement.classList.add('youtube-hider-enabled');
        initVideoElement();
    } else {
        document.documentElement.classList.remove('youtube-hider-enabled');
        removeListeners();
    }
}

// Обрабатываем новые настройки, присланные через message
function handleConfigUpdates(newConfig) {
    Object.keys(newConfig).forEach((key) => {
        config[key] = newConfig[key];
        if (typeof LiveStorage !== 'undefined') {
            LiveStorage.local[key] = newConfig[key];
        }
    });
    handleConfigChanges(newConfig);
}

// Универсальная функция, которая реагирует на любые изменения настроек
function handleConfigChanges(changes) {
    if ('extensionEnabled' in changes) {
        if (changes.extensionEnabled) {
            document.documentElement.classList.add('youtube-hider-enabled');
            initVideoElement();
        } else {
            document.documentElement.classList.remove('youtube-hider-enabled');
            removeListeners();
        }
    }
}

// Находим/инициализируем <video>
function initVideoElement() {
    video = document.querySelector('video');
    if (!video) {
        // Пробуем ещё раз через небольшой таймаут
        setTimeout(initVideoElement, 1000);
        return;
    }
    setupKeyboardControls();
}

// Настраиваем горячие клавиши для перемотки
function setupKeyboardControls() {
    document.addEventListener('keydown', onKeyDown);
}

// Обработчик нажатия клавиш
function onKeyDown(e) {
    if (!video || !config.extensionEnabled) return;
    // Пример: перемотка, если указано config.skipTime
    if (config.skipTime) {
        if (e.key === 'ArrowRight') {
            video.currentTime += config.skipTime;
        } else if (e.key === 'ArrowLeft') {
            video.currentTime -= config.skipTime;
        }
    }
}

// Удаляем слушатели при отключении расширения
function removeListeners() {
    document.removeEventListener('keydown', onKeyDown);
} 