// Обработка установки расширения
chrome.runtime.onInstalled.addListener(() => {
    // Установка начальных настроек
    chrome.storage.local.set({
        skipTime: 10,
        enableSoundFeedback: true,
        enableGestures: true,
        extensionEnabled: true,
        showProgressPadding: false,
        progressPaddingColor: '#ff0000',
        progressPaddingOpacity: 0.7
    });
});

// Обработка сообщений от popup и content-script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getConfig') {
        chrome.storage.local.get(null, (config) => {
            sendResponse(config);
        });
        return true;
    }
    
    if (request.type === 'updateConfig') {
        chrome.storage.local.set(request.config, () => {
            // Отправка сообщения всем активным вкладкам о обновлении настроек
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'configUpdated',
                        config: request.config
                    }).catch(() => {
                        // Игнорируем ошибки для вкладок, где content script не активен
                    });
                });
            });
            sendResponse({ success: true });
        });
        return true;
    }
}); 