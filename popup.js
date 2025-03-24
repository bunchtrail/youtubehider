// При загрузке popup читаем настройки и инициализируем UI
window.addEventListener('load', async () => {
    try {
        await LiveStorage.load();

        const enabledCheckbox = document.getElementById('extensionEnabled');
        if (!enabledCheckbox) {
            throw new Error('Не найдены элементы интерфейса popup');
        }

        // Устанавливаем начальное состояние
        enabledCheckbox.checked = LiveStorage.local.extensionEnabled !== false;
        updateUI();

        // Навешиваем обработчик на изменение
        enabledCheckbox.addEventListener('change', async () => {
            await saveConfig();
        });
    } catch (err) {
        console.error('Ошибка инициализации popup:', err);
        const statusMsg = document.getElementById('statusMessage');
        if (statusMsg) statusMsg.textContent = 'Ошибка инициализации расширения';
    }
});

// Обновление пользовательского интерфейса (только демонстрация)
function updateUI() {
    const extensionEnabled = document.getElementById('extensionEnabled').checked;
    const statusElement = document.getElementById('extensionStatus');
    const statusMessage = document.getElementById('statusMessage');

    statusElement.textContent = extensionEnabled ? 'Включено' : 'Отключено';
    statusElement.style.color = extensionEnabled ? '#4caf50' : '#cc0000';

    // Отображаем «сохранение настроек»
    statusMessage.textContent = 'Сохранение настроек...';
    statusMessage.classList.add('fade-in');
    setTimeout(() => {
        statusMessage.textContent = 'Настройки сохранены';
        // Сбрасываем сообщение через 2 секунды
        setTimeout(() => {
            statusMessage.textContent = 'Настройки сохраняются автоматически';
            statusMessage.classList.remove('fade-in');
        }, 2000);
    }, 500);
}

// Сохраняем настройки
async function saveConfig() {
    updateUI();
    const enabled = document.getElementById('extensionEnabled').checked;

    // Обновляем LiveStorage (автоматически сохранится в chrome.storage)
    LiveStorage.local.extensionEnabled = enabled;

    // Отправляем сообщение на активную вкладку YouTube (при желании)
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0] && tabs[0].url.includes('youtube.com')) {
            await chrome.tabs.sendMessage(tabs[0].id, {
                type: 'configUpdated',
                config: { extensionEnabled: enabled }
            });
        }
    } catch (err) {
        console.warn('Ошибка при отправке сообщения на вкладку:', err);
    }
} 