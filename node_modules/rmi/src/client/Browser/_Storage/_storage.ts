/// <amd-module name='Browser/_Storage/_storage' />
import { constants }  from 'Env/Constants';
import { IoC } from 'Env/Env';

const GLOBAL = (function () { return this || (0, eval)('this'); })();
enum StorageType {
    "local" = "localStorage",
    "session" = "sessionStorage"
}

/**
 * Логирование сообщения
 * @param {String} message
 * @param {String} [type]
 */
let log = (message, type = 'Core/_storage') => {
    IoC.resolve('ILogger').log(type, message);
};

/**
 * Фейковая реализация интерфейса хранилища
 */
function getFake() {
    var storage = {};
    return {
        setItem (key, data) {
            storage[key] = data && data.toString() || ("" + data);
            this.length++;
        },
        removeItem (key) {
            delete storage[key];
            this.length--;
        },
        getItem (key) {
            return storage[key] || null;
        },
        clear () {
            storage = {};
            this.length = 0;
        },
        length: 0
    }
}

/**
 * Обёртка хранилища, чтобы не упало во время работы
 * @param {Storage} storage
 * @param {String} type
 * @return {{getItem: getItem, setItem: setItem, removeItem: removeItem, clear: clear}}
 */
function wrapStorage (storage, type) {
    return {
        getItem (key) {
            try {
                return storage.getItem(key);
            } catch (err) {
                log(err);
            }
        },
        setItem (key, data) {
            try {
                storage.setItem(key, data);
                return true;
            } catch (err) {
                log(err);
                return false;
            }
        },
        removeItem (key) {
            try {
                storage.removeItem(key);
            } catch (err) {
                log(err);
            }
        },
        clear () {
            try {
                storage.clear();
            } catch (err) {
                log(err);
            }
        }
    };
}

/**
 * Получение хранилища по типу
 * @param {"local" | "session"} type
 */
function getStorage (type: StorageType) {
    var storage = GLOBAL && GLOBAL[type];
    if (!constants.isBrowserPlatform || !storage) {
        return getFake();
    }
    return wrapStorage(storage, type);
}

export let getLocal = () => getStorage(StorageType.local);
export let getSession = () => getStorage(StorageType.session);
