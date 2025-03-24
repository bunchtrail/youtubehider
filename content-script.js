// Конфигурация по умолчанию
const DEFAULT_CONFIG = {
    skipTime: 10, // секунды для перемотки
    enableSoundFeedback: true,
    enableGestures: true,
    extensionEnabled: true,
    showProgressPadding: false, // новая опция
    progressPaddingColor: '#ff0000', // цвет заполнения
    progressPaddingOpacity: 0.7 // прозрачность
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
            
            // Применяем настройки прогресс-бара независимо от состояния расширения
            if (config.showProgressPadding) {
                setupProgressPadding();
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
            
            if (config.showProgressPadding) {
                setupProgressPadding();
            }
        });
    }
}

// Добавляем обработчик сообщений для прямого обновления настроек
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'configUpdated') {
        // Пропускаем обновление, если пользователь взаимодействует с интерфейсом
        if (preventUpdate) {
            sendResponse({ success: false, reason: 'user-interaction-in-progress' });
            return true;
        }

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
        
        // Обрабатываем изменения так же, как при обычном обновлении через storage
        handleConfigChanges(changes);
        
        sendResponse({ success: true });
        return true;
    }
});

// Выделяем обработку изменений настроек в отдельную функцию для переиспользования
function handleConfigChanges(changes) {
    // Пропускаем обновление, если пользователь взаимодействует с интерфейсом
    if (preventUpdate) {
        return;
    }
    
    // Проверяем состояние расширения
    if ('extensionEnabled' in changes) {
        if (changes.extensionEnabled.newValue === false) {
            // Если расширение выключили
            document.documentElement.classList.remove('youtube-hider-enabled');
            removeListeners();
        } else {
            // Если расширение включили
            document.documentElement.classList.add('youtube-hider-enabled');
            init();
        }
    }
    
    // Обработка изменений настроек прогресс-бара
    if ('showProgressPadding' in changes) {
        if (changes.showProgressPadding.newValue) {
            setupProgressPadding();
        } else {
            removeProgressPadding();
        }
    } else if (config.showProgressPadding && 
              ('progressPaddingColor' in changes || 'progressPaddingOpacity' in changes)) {
        setupProgressPadding();
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

// Функция для настройки прогресс-бара padding
function setupProgressPadding() {
    // Добавляем атрибут для CSS
    document.documentElement.setAttribute('data-show-padding', 'true');
    
    const modifyProgressPadding = () => {
        const paddingElements = document.querySelectorAll('.ytp-progress-bar-padding');
        paddingElements.forEach(paddingElement => {
            if (paddingElement) {
                // Установка стилей для постоянного отображения
                paddingElement.style.display = 'block';
                paddingElement.style.backgroundColor = config.progressPaddingColor;
                paddingElement.style.height = '100%';
                paddingElement.style.width = '100%';
                paddingElement.style.opacity = config.progressPaddingOpacity.toString();
                paddingElement.style.position = 'absolute';
                paddingElement.style.bottom = '0px';
                paddingElement.style.zIndex = '60';
            }
        });
    };

    // Выполняем сразу при вызове функции
    modifyProgressPadding();
    
    // Также создаем стиль для случаев, когда элементы динамически добавляются
    const styleId = 'youtube-padding-style';
    if (!document.getElementById(styleId)) {
        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = `
            .ytp-progress-bar-padding {
                display: block !important;
                background-color: ${config.progressPaddingColor} !important;
                height: 100% !important;
                width: 100% !important;
                opacity: ${config.progressPaddingOpacity} !important;
                position: absolute !important;
                bottom: 0px !important;
                z-index: 60 !important;
            }
        `;
        document.head.appendChild(styleElement);
    } else {
        const styleElement = document.getElementById(styleId);
        styleElement.textContent = `
            .ytp-progress-bar-padding {
                display: block !important;
                background-color: ${config.progressPaddingColor} !important;
                height: 100% !important;
                width: 100% !important;
                opacity: ${config.progressPaddingOpacity} !important;
                position: absolute !important;
                bottom: 0px !important;
                z-index: 60 !important;
            }
        `;
    }
}

// Функция для удаления стилей прогресс-бара
function removeProgressPadding() {
    // Удаляем атрибут для CSS
    document.documentElement.removeAttribute('data-show-padding');
    
    const styleElement = document.getElementById('youtube-padding-style');
    if (styleElement) {
        styleElement.remove();
    }
    
    // Сбрасываем стили для всех элементов
    const paddingElements = document.querySelectorAll('.ytp-progress-bar-padding');
    paddingElements.forEach(paddingElement => {
        if (paddingElement) {
            paddingElement.style = '';
        }
    });
}

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
    if (config.enableGestures) {
        setupGestureControls();
    }
}

// Настройка клавиатурных сочетаний
function setupKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!video || config.extensionEnabled === false) return;

        switch(e.key) {
            case 'ArrowRight':
                video.currentTime += config.skipTime;
                if (config.enableSoundFeedback) {
                    playFeedbackSound('forward');
                }
                break;
            case 'ArrowLeft':
                video.currentTime -= config.skipTime;
                if (config.enableSoundFeedback) {
                    playFeedbackSound('backward');
                }
                break;
        }
    });
}

// Настройка жестов мыши
function setupGestureControls() {
    let lastClickTime = 0;
    let clickX = 0;

    document.addEventListener('click', (e) => {
        if (!video || config.extensionEnabled === false) return;
        
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastClickTime;
        
        // Обработка двойного клика
        if (timeDiff < 300) {
            const rect = video.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;

            if (clickPosition > 0.5) {
                video.currentTime += config.skipTime;
                playFeedbackSound('forward');
            } else {
                video.currentTime -= config.skipTime;
                playFeedbackSound('backward');
            }
        }

        lastClickTime = currentTime;
        clickX = e.clientX;
    });

    // Обработка скролла для регулировки громкости
    document.addEventListener('wheel', (e) => {
        if (!video || config.extensionEnabled === false) return;
        e.preventDefault();

        const volumeChange = e.deltaY > 0 ? -0.1 : 0.1;
        video.volume = Math.max(0, Math.min(1, video.volume + volumeChange));
    }, { passive: false });
}

// Воспроизведение звукового сигнала
function playFeedbackSound(type) {
    if (!config.enableSoundFeedback) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'forward' ? 880 : 660;
    
    gainNode.gain.value = 0.1;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Наблюдатель за изменениями DOM
const observer = new MutationObserver((mutations) => {
    if (!document.querySelector('video')) {
        init();
    }
    
    if (config.showProgressPadding && document.location.pathname.includes('/watch')) {
        const paddingElements = document.querySelectorAll('.ytp-progress-bar-padding');
        if (paddingElements.length > 0) {
            setupProgressPadding();
        }
    }
});

observer.observe(document, {
    childList: true,
    subtree: true
});

// Инициализация при загрузке страницы
loadConfig(); 