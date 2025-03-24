// Обработка установки расширения
chrome.runtime.onInstalled.addListener(() => {
    // Установка начальных настроек
    chrome.storage.local.set({
        skipTime: 10,
        enableSoundFeedback: true,
        enableGestures: true,
        extensionEnabled: true
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
            sendResponse({ success: true });
        });
        return true;
    }
}); 