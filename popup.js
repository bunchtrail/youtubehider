// Обновление статуса и элементов интерфейса
function updateUI() {
    const extensionEnabled = document.getElementById('extensionEnabled').checked;
    const statusElement = document.getElementById('extensionStatus');
    
    // Обновление текста статуса
    statusElement.textContent = extensionEnabled ? 'Включено' : 'Отключено';
    statusElement.style.color = extensionEnabled ? '#4caf50' : '#cc0000';
    
    // Анимация сохранения
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = 'Сохранение настроек...';
    statusMessage.classList.add('fade-in');
    setTimeout(() => {
        statusMessage.textContent = 'Настройки сохранены';
        // Возвращаем обычный текст через 2 секунды
        setTimeout(() => {
            statusMessage.textContent = 'Настройки сохраняются автоматически';
            statusMessage.classList.remove('fade-in');
        }, 2000);
    }, 500);
}

// Загрузка настроек при открытии popup
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация LiveStorage
    LiveStorage.load().then(() => {
        // Установка настроек из LiveStorage
        const skipTimeElement = document.getElementById('skipTime');
        const enabledElement = document.getElementById('extensionEnabled');
        
        skipTimeElement.value = LiveStorage.local.skipTime || 10;
        enabledElement.checked = LiveStorage.local.extensionEnabled !== false;
        
        // Обновление интерфейса в соответствии с загруженными настройками
        updateUI();
    });
});

// Сохранение настроек при изменении
function saveConfig() {
    // Обновление интерфейса
    updateUI();
    
    // Прямое обновление LiveStorage объекта
    LiveStorage.local.skipTime = parseInt(document.getElementById('skipTime').value);
    LiveStorage.local.extensionEnabled = document.getElementById('extensionEnabled').checked;
    
    console.log('Новые настройки:', {
        skipTime: LiveStorage.local.skipTime,
        extensionEnabled: LiveStorage.local.extensionEnabled
    });
    
    // Передача настроек в background script
    const config = {
        skipTime: LiveStorage.local.skipTime,
        extensionEnabled: LiveStorage.local.extensionEnabled
    };

    // Находим активную вкладку для прямого применения настроек
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
            console.log('Отправка настроек активной вкладке', tabs[0].id);
            // Прямое сообщение активной вкладке для мгновенного применения
            try {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'configUpdated',
                    config: config
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('Ошибка отправки сообщения:', chrome.runtime.lastError.message);
                        return;
                    }
                    console.log('Ответ от content-script:', response);
                });
            } catch (err) {
                console.error('Ошибка отправки сообщения:', err);
            }
        }
    });
}

// Добавление обработчиков событий
document.getElementById('skipTime').addEventListener('change', saveConfig);
document.getElementById('extensionEnabled').addEventListener('change', saveConfig); 