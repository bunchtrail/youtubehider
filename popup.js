// Загрузка настроек при открытии popup
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация LiveStorage
    LiveStorage.load().then(() => {
        // Установка настроек из LiveStorage
        document.getElementById('skipTime').value = LiveStorage.local.skipTime || 10;
        document.getElementById('enableSoundFeedback').checked = LiveStorage.local.enableSoundFeedback !== false;
        document.getElementById('enableGestures').checked = LiveStorage.local.enableGestures !== false;
        document.getElementById('extensionEnabled').checked = LiveStorage.local.extensionEnabled !== false;
        
        // Загрузка настроек прогресс-бара
        document.getElementById('showProgressPadding').checked = LiveStorage.local.showProgressPadding === true;
        
        const colorInput = document.getElementById('progressPaddingColor');
        colorInput.value = LiveStorage.local.progressPaddingColor || '#ff0000';
        document.getElementById('colorHexValue').textContent = colorInput.value;
        
        const opacityInput = document.getElementById('progressPaddingOpacity');
        opacityInput.value = LiveStorage.local.progressPaddingOpacity || 0.7;
        document.getElementById('opacityValue').textContent = opacityInput.value;
    });
    
    // Обновление текстовых значений при изменении цвета и прозрачности
    document.getElementById('progressPaddingColor').addEventListener('input', (e) => {
        document.getElementById('colorHexValue').textContent = e.target.value;
    });
    
    document.getElementById('progressPaddingOpacity').addEventListener('input', (e) => {
        document.getElementById('opacityValue').textContent = e.target.value;
    });
});

// Сохранение настроек при изменении
function saveConfig() {
    // Прямое обновление LiveStorage объекта
    LiveStorage.local.skipTime = parseInt(document.getElementById('skipTime').value);
    LiveStorage.local.enableSoundFeedback = document.getElementById('enableSoundFeedback').checked;
    LiveStorage.local.enableGestures = document.getElementById('enableGestures').checked;
    LiveStorage.local.extensionEnabled = document.getElementById('extensionEnabled').checked;
    LiveStorage.local.showProgressPadding = document.getElementById('showProgressPadding').checked;
    LiveStorage.local.progressPaddingColor = document.getElementById('progressPaddingColor').value;
    LiveStorage.local.progressPaddingOpacity = parseFloat(document.getElementById('progressPaddingOpacity').value);
    
    // LiveStorage автоматически синхронизирует данные между компонентами
    // Но для совместимости с нашим методом прямой коммуникации также отправляем сообщения
    
    const config = {
        skipTime: LiveStorage.local.skipTime,
        enableSoundFeedback: LiveStorage.local.enableSoundFeedback,
        enableGestures: LiveStorage.local.enableGestures,
        extensionEnabled: LiveStorage.local.extensionEnabled,
        showProgressPadding: LiveStorage.local.showProgressPadding,
        progressPaddingColor: LiveStorage.local.progressPaddingColor,
        progressPaddingOpacity: LiveStorage.local.progressPaddingOpacity
    };

    // Находим активную вкладку для прямого применения настроек
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
            // Прямое сообщение активной вкладке для мгновенного применения
            chrome.tabs.sendMessage(tabs[0].id, {
                type: 'configUpdated',
                config: config
            }).catch(() => {
                // Если content-script не доступен, игнорируем ошибку
            });
        }
    });
}

// Добавление обработчиков событий
document.getElementById('skipTime').addEventListener('change', saveConfig);
document.getElementById('enableSoundFeedback').addEventListener('change', saveConfig);
document.getElementById('enableGestures').addEventListener('change', saveConfig);
document.getElementById('extensionEnabled').addEventListener('change', saveConfig);
document.getElementById('showProgressPadding').addEventListener('change', saveConfig);
document.getElementById('progressPaddingColor').addEventListener('change', saveConfig);
document.getElementById('progressPaddingOpacity').addEventListener('change', saveConfig); 