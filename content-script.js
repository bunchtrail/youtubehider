// Конфигурация по умолчанию
const DEFAULT_CONFIG = {
    skipTime: 10, // секунды для перемотки
    enableSoundFeedback: true,
    enableGestures: true
};

// Состояние расширения
let config = { ...DEFAULT_CONFIG };
let video = null;

// Инициализация при загрузке страницы
function init() {
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
        if (!video) return;

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
        if (!video) return;
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
init(); 