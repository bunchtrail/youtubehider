/**
 * LiveStorage - обертка над chrome.storage для автоматической синхронизации 
 * данных между представлениями расширения
 */
const LiveStorage = {
    local: {}, // Локальная копия данных

    /**
     * Загружает данные из хранилища в локальную копию
     * @returns {Promise} - Promise, который разрешается, когда данные загружены
     */
    load: function() {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (data) => {
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
        // Настраиваем прослушивание изменений из других компонентов
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') {
                // Обновляем локальную копию данных
                Object.keys(changes).forEach(key => {
                    this.local[key] = changes[key].newValue;
                });
            }
        });

        // Создаем прокси-объект для автоматической синхронизации
        this.local = new Proxy(this.local, {
            set: (target, prop, value) => {
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
});

// Экспортируем объект в глобальное пространство имен
window.LiveStorage = LiveStorage; 