define('Browser/_Storage/_storage', [
    'require',
    'exports',
    'Env/Constants',
    'Env/Env'
], function (require, exports, Constants_1, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var GLOBAL = function () {
        return this || (0, eval)('this');
    }();
    var StorageType;
    (function (StorageType) {
        StorageType['local'] = 'localStorage';
        StorageType['session'] = 'sessionStorage';
    }(StorageType || (StorageType = {})));    /**
     * Логирование сообщения
     * @param {String} message
     * @param {String} [type]
     */
    /**
     * Логирование сообщения
     * @param {String} message
     * @param {String} [type]
     */
    var log = function (message, type) {
        if (type === void 0) {
            type = 'Core/_storage';
        }
        Env_1.IoC.resolve('ILogger').log(type, message);
    };    /**
     * Фейковая реализация интерфейса хранилища
     */
    /**
     * Фейковая реализация интерфейса хранилища
     */
    function getFake() {
        var storage = {};
        return {
            setItem: function (key, data) {
                storage[key] = data && data.toString() || '' + data;
                this.length++;
            },
            removeItem: function (key) {
                delete storage[key];
                this.length--;
            },
            getItem: function (key) {
                return storage[key] || null;
            },
            clear: function () {
                storage = {};
                this.length = 0;
            },
            length: 0
        };
    }    /**
     * Обёртка хранилища, чтобы не упало во время работы
     * @param {Storage} storage
     * @param {String} type
     * @return {{getItem: getItem, setItem: setItem, removeItem: removeItem, clear: clear}}
     */
    /**
     * Обёртка хранилища, чтобы не упало во время работы
     * @param {Storage} storage
     * @param {String} type
     * @return {{getItem: getItem, setItem: setItem, removeItem: removeItem, clear: clear}}
     */
    function wrapStorage(storage, type) {
        return {
            getItem: function (key) {
                try {
                    return storage.getItem(key);
                } catch (err) {
                    log(err);
                }
            },
            setItem: function (key, data) {
                try {
                    storage.setItem(key, data);
                    return true;
                } catch (err) {
                    log(err);
                    return false;
                }
            },
            removeItem: function (key) {
                try {
                    storage.removeItem(key);
                } catch (err) {
                    log(err);
                }
            },
            clear: function () {
                try {
                    storage.clear();
                } catch (err) {
                    log(err);
                }
            }
        };
    }    /**
     * Получение хранилища по типу
     * @param {"local" | "session"} type
     */
    /**
     * Получение хранилища по типу
     * @param {"local" | "session"} type
     */
    function getStorage(type) {
        var storage = GLOBAL && GLOBAL[type];
        if (!Constants_1.constants.isBrowserPlatform || !storage) {
            return getFake();
        }
        return wrapStorage(storage, type);
    }
    exports.getLocal = function () {
        return getStorage(StorageType.local);
    };
    exports.getSession = function () {
        return getStorage(StorageType.session);
    };
});