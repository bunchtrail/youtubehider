// Обработка установки расширения
chrome.runtime.onInstalled.addListener(() => {
    console.log('Расширение установлено: инициализируем настройки');
    chrome.storage.local.set({ extensionEnabled: true }, () => {
        console.log('Начальные настройки сохранены');
    });
});

// Обработка команд с клавиатуры
chrome.commands.onCommand.addListener(async (command) => {
    try {
        console.log('Получена горячая клавиша:', command);
        const config = await chrome.storage.local.get(null);

        if (command === 'toggle-stream-mode') {
            const newEnabled = !config.extensionEnabled;
            await chrome.storage.local.set({ extensionEnabled: newEnabled });
            updateAllTabsConfig({ extensionEnabled: newEnabled });
        } else if (command === 'toggle-progress-bar') {
            const newProgressBarState = !config.hideProgressBar;
            await chrome.storage.local.set({ hideProgressBar: newProgressBarState });
            updateAllTabsConfig({ hideProgressBar: newProgressBarState });
        }
    } catch (err) {
        console.error('Ошибка при обработке команды:', err);
    }
});

// Общая функция рассылки новых настроек всем нужным вкладкам
function updateAllTabsConfig(newPartialConfig) {
    console.log('Рассылка новых настроек вкладкам:', newPartialConfig);
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
            // Проверяем, что это YouTube
            if (tab.url && tab.url.includes('youtube.com')) {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'configUpdated',
                    config: newPartialConfig
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.warn('Ошибка отправки на вкладку', tab.id, chrome.runtime.lastError.message);
                    } else if (response) {
                        console.log('Ответ от вкладки', tab.id, response);
                    }
                });
            }
        });
    });
}

// Обработка сообщений от popup или content-script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || typeof request !== 'object' || !request.type) {
        sendResponse({ success: false, reason: 'no-valid-request' });
        return true;
    }

    console.log('Получено сообщение в background:', request.type, 'от', sender?.tab?.id || 'popup');

    switch (request.type) {
        case 'getConfig': {
            chrome.storage.local.get(null, (config) => {
                sendResponse(config);
            });
            return true; // Асинхронный ответ
        }
        case 'updateConfig': {
            const newConfig = request.config || {};
            console.log('Обновление конфигурации:', newConfig);
            chrome.storage.local.set(newConfig, () => {
                updateAllTabsConfig(newConfig);
                sendResponse({ success: true });
            });
            return true; // Асинхронный ответ
        }
        default:
            sendResponse({ success: false, reason: 'unknown-message-type' });
            return true;
    }
}); 