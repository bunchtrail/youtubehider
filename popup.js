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

// Функция для отправки сообщения на активную вкладку
async function sendMessageToActiveTab(message) {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            console.log('Активная вкладка не найдена');
            return;
        }

        const activeTab = tabs[0];
        // Проверяем, что это вкладка YouTube
        if (!activeTab.url || !activeTab.url.includes('youtube.com')) {
            console.log('Активная вкладка не является YouTube');
            return;
        }

        await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
        console.log('Ошибка при отправке сообщения:', error.message);
    }
}

// Сохранение настроек при изменении
async function saveConfig() {
    // Обновление интерфейса
    updateUI();
    
    // Прямое обновление LiveStorage объекта
    LiveStorage.local.extensionEnabled = document.getElementById('extensionEnabled').checked;
    
    const config = {
        extensionEnabled: LiveStorage.local.extensionEnabled
    };

    console.log('Новые настройки:', config);
    
    // Отправляем сообщение в content script
    await sendMessageToActiveTab({
        type: 'configUpdated',
        config: config
    });
}

// Инициализация при загрузке popup
window.addEventListener('load', async () => {
    try {
        // Ждем загрузки LiveStorage
        await LiveStorage.load();
        
        // Получаем элементы после полной загрузки DOM
        const enabledElement = document.getElementById('extensionEnabled');
        
        if (!enabledElement) {
            throw new Error('Не удалось найти необходимые элементы интерфейса');
        }

        // Устанавливаем начальные значения
        enabledElement.checked = LiveStorage.local.extensionEnabled !== false;
        
        // Обновляем UI и добавляем обработчики событий
        updateUI();
        enabledElement.addEventListener('change', saveConfig);
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        document.getElementById('statusMessage').textContent = 'Ошибка инициализации расширения';
    }
}); 