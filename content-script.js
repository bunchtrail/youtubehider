// Конфигурация по умолчанию
const DEFAULT_CONFIG = {
    skipTime: 10, // секунды для перемотки
    enableSoundFeedback: true,
    enableGestures: true,
    extensionEnabled: true
};

// Состояние расширения
let config = { ...DEFAULT_CONFIG };
let video = null;

// Загрузка конфигурации из storage
function loadConfig() {
    chrome.storage.local.get(null, (storedConfig) => {
        config = { ...DEFAULT_CONFIG, ...storedConfig };
        
        // Если расширение выключено, удаляем CSS-классы и отключаем функциональность
        if (config.extensionEnabled === false) {
            document.documentElement.classList.remove('youtube-hider-enabled');
        } else {
            document.documentElement.classList.add('youtube-hider-enabled');
            init();
        }
    });
}

// Слушаем изменения конфигурации
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        // Обновляем конфигурацию
        Object.keys(changes).forEach(key => {
            config[key] = changes[key].newValue;
        });
        
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
    }
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
const observer = new MutationObserver(() => {
    if (!document.querySelector('video')) {
        init();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Инициализация при загрузке страницы
loadConfig(); 