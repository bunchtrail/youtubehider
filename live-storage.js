/**
 * LiveStorage - обёртка над chrome.storage для автоматической синхронизации 
 * данных между частями расширения (popup, content-script и т.д.).
 */
const LiveStorage = {
    local: {}, // Локальная копия данных

    /**
     * Загружает данные из хранилища в локальную копию
     * @returns {Promise} - Promise, который разрешается, когда данные загружены
     */
    load: function() {
        console.log('LiveStorage: загрузка данных из хранилища');
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (data) => {
                console.log('LiveStorage: данные получены из хранилища', data);
                // Копируем все поля из хранилища в локальное хранилище
                Object.assign(this.local, data);
                resolve(data);
            });
        });
    },

    /**
     * Настраивает прокси-обработчики для автоматической синхронизации
     */
    init: function() {
        console.log('LiveStorage: инициализация');
        // Подписка на изменения в chrome.storage
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                console.log('LiveStorage: обнаружены изменения в хранилище', changes);
                for (const [key, { newValue }] of Object.entries(changes)) {
                    this.local[key] = newValue;
                }
            }
        });

        // Прокси для автоматической записи в chrome.storage
        this.local = new Proxy(this.local, {
            set: (target, prop, value) => {
                console.log(`LiveStorage: установка свойства ${prop} = ${value}`);
                target[prop] = value;
                
                // Записываем изменения в хранилище
                const update = {};
                update[prop] = value;
                chrome.storage.local.set(update);
                
                return true;
            }
        });
    }
};

// Инициализируем LiveStorage при загрузке
LiveStorage.load().then(() => {
    LiveStorage.init();
    console.log('LiveStorage: инициализация завершена');
});

// Экспортируем объект в глобальное пространство имен
window.LiveStorage = LiveStorage; 