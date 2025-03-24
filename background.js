// Обработка установки расширения
chrome.runtime.onInstalled.addListener(() => {
    console.log('Расширение установлено, устанавливаем начальные настройки');
    // Установка начальных настроек
    chrome.storage.local.set({
        skipTime: 10,
        extensionEnabled: true
    }, () => {
        console.log('Начальные настройки установлены');
    });
});

// Обработка сообщений от popup и content-script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Получено сообщение в background:', request, 'от', sender?.tab?.id || 'popup');
    
    if (request.type === 'getConfig') {
        chrome.storage.local.get(null, (config) => {
            console.log('Отправка конфигурации:', config);
            sendResponse(config);
        });
        return true;
    }
    
    if (request.type === 'updateConfig') {
        console.log('Обновление конфигурации:', request.config);
        chrome.storage.local.set(request.config, () => {
            console.log('Конфигурация сохранена в хранилище');
            // Отправка сообщения всем активным вкладкам о обновлении настроек
            chrome.tabs.query({}, (tabs) => {
                console.log('Отправка сообщений на', tabs.length, 'вкладок');
                tabs.forEach(tab => {
                    console.log('Отправка на вкладку', tab.id);
                    try {
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'configUpdated',
                            config: request.config
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.log('Ошибка отправки на вкладку', tab.id, chrome.runtime.lastError.message);
                                return;
                            }
                            console.log('Ответ от вкладки', tab.id, response);
                        });
                    } catch (err) {
                        console.log('Ошибка отправки на вкладку', tab.id, err);
                    }
                });
                console.log('Все сообщения отправлены');
            });
            sendResponse({ success: true });
        });
        return true;
    }
}); 