// Загрузка настроек при открытии popup
document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ type: 'getConfig' }, (config) => {
        document.getElementById('skipTime').value = config.skipTime;
        document.getElementById('enableSoundFeedback').checked = config.enableSoundFeedback;
        document.getElementById('enableGestures').checked = config.enableGestures;
        document.getElementById('extensionEnabled').checked = config.extensionEnabled !== false; // По умолчанию включено
    });
});

// Сохранение настроек при изменении
function saveConfig() {
    const config = {
        skipTime: parseInt(document.getElementById('skipTime').value),
        enableSoundFeedback: document.getElementById('enableSoundFeedback').checked,
        enableGestures: document.getElementById('enableGestures').checked,
        extensionEnabled: document.getElementById('extensionEnabled').checked
    };

    chrome.runtime.sendMessage({
        type: 'updateConfig',
        config: config
    });
}

// Добавление обработчиков событий
document.getElementById('skipTime').addEventListener('change', saveConfig);
document.getElementById('enableSoundFeedback').addEventListener('change', saveConfig);
document.getElementById('enableGestures').addEventListener('change', saveConfig);
document.getElementById('extensionEnabled').addEventListener('change', saveConfig); 