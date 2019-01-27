/// <amd-module name="Lib/Storage/LocalStorage" />
import EventBus = require("Core/EventBus");
import EventObject = require("Core/EventObject");
import getLocalStorageNative = require("Lib/Storage/NativeGetter");
import itemUtil = require("Lib/Storage/utils/item");
import prefixUtil = require("Lib/Storage/utils/prefix");
import {WSStorageNative} from "./Interface";
// @ts-ignore
import {ObservableMixin} from "Types/entity";

///region Const
const global = (function () { return this || (0, eval)('this'); })();
// Ключ по которому хранится список полей, которые необходимо сохранить в хранилище при смене sid
const WS_STORE_ALWAYS_KEYS = "ws-store-always-keys";
// Список всех событий хранилища
const EVENT_LIST = ["onChange", "onRemove", "onClear"];
// Канал для передачи всех событий хранилища
const channel = () => EventBus.channel("local_storage");
///endregion const
let localStorage = <WSStorageNative> getLocalStorageNative();
///region EventBus
let isAddedGlobalStorageHandler = false;
function addStorageEventListener() {
    if (isAddedGlobalStorageHandler || !global) {
        return;
    }
    isAddedGlobalStorageHandler = true;
    if (global.addEventListener) {
        return global.addEventListener("storage", storageGlobalHandler, false);
    }
}
// storage handlers
/**
 * Глобальный обработчик события onstorage
 * @param {StorageEvent} event
 */
function storageGlobalHandler(event: StorageEvent) {
    if (!event && global.event) {
        event = global.event;
    }
    if (!event) {
        return;
    }
    let {key, newValue, oldValue} = event;
    // Если в событии отсуствует ключ -> было вызвана очистка хранилища
    if (!key) {
        channel().notify("onClear");
        return;
    }
    if (!newValue) {
        return channel().notify("onRemove", key);
    }
    return channel().notify("onChange", key, itemUtil.deserialize(newValue));
}
type StorageHandler = (event: EventObject, key: string, value: any) => void;
/**
 * Обработчик события, который вызовится у каждого инстанса LocalStorage
 * @param {Core/EventObject} event
 * @param {String} key
 * @param {*} value
 * @return {*}
 */
function storageHandler(event, key, value) {
    // Если нету ключа => onClear, иначе смотрим на то чтобы ключ начинался на наш префикс
    if (!key) {
        return this._notify(event.name);
    }
    if (prefixUtil.startsWith(key, this.prefix)) {
        return this._notify(
            event.name,
            prefixUtil.remove(key, this.prefix),
            value
        );
    }
}
///endregion EventBus
///region LocalStorageNative
/**
 * Возвращение десериализованной записи хранилища по ключу
 * @param {String} key
 * @param {Boolean} noCheckSession=false
 * @return {*}
 */
function getItem(key, noCheckSession) {
    return itemUtil.deserialize(localStorage.getItem(key, !noCheckSession));
}
/**
 * Возвращает массив всех ключей, содержащих тот же префикс
 * при этом сам префикс не обрезаются
 * @param prefix префикс по которому необходимо отфильтровать ключи
 * @return {Array<String>}
 */
function getKeys(prefix: string): string[] {
    return localStorage.getKeys().filter((key: string) => {
        return prefixUtil.startsWith(key, prefix);
    })
}
///endregion LocalStorageNative

type Emitter = {
    _notify(...args: Array<any>): any;
    _publish(...args: Array<string>): void;
    destroy()
}
type EmitterConstructor = {
    new (...args): Emitter;
    prototype: Emitter
}
let Observable: EmitterConstructor = ObservableMixin.constructor;
Observable.prototype = ObservableMixin;

/**
 * Класс для работы с локальным хранилищем и его событиями
 * Позволяет хранить и получать сложные типы данных, включая WS.Data/Entity/* и WS.Data/Collections/*
 * @class Lib/Storage/LocalStorage
 * @param {String} prefix Префикс хранимых в хранилище ключей
 * @param {Boolean} [storeAlways] Необходимо ли сохранять значение при смене пользователя. Используется для хранения конфигурации, не привязаной к пользовательским данным.
 * @public
 * @author Заляев А.В.
 */
class LocalStorage extends Observable /** @lends Lib/Storage/LocalStorage.prototype*/ {
    /**
     * @cfg {string} Префикс хранилища
     * @example
     * Изменить подпись флага в зависимости от его состояния.
     * <pre>
     *  require(["Lib/Storage/LocalStorage"], function(LocalStorage){
     *      storage = new LocalStorage("news");
     *      storage.setItem("lastFilter", {...});
     *      let resetFilter = function(filterValue){
     *          // Обработчик события изменения значения в хранилище
     *          // Обработчик не будет вызван на вкладке. производящей изменения
     *          ...
     *      };
     *      storage.subscribe("onChange", resetFilter);
     *      storage.subscribe("onRemove", resetFilter);
     *  });
     * </pre>
     * @name Lib/Storage/LocalStorage#prefix
     */
    /**
     * @cfg {Boolean} Необходимо ли сохранять значение при смене пользователя.
     * Используется для хранения конфигурации, не привязаной к пользовательским данным.
     * @name Lib/Storage/LocalStorage#storeAlways
     */
    /**
     * @cfg {Boolean} =true Необходимо ли проверять опции по принадлежности к сессии пользователя
     * При смене пользователя LocalStorage очистит себя.
     * @name Lib/Storage/LocalStorage#isCheckSession
     */
    private readonly _onStorage: StorageHandler;
    constructor(
        private readonly prefix = "",
        private readonly storeAlways = false,
        private readonly isCheckSession = true
    ) {
        super();
        this._onStorage = storageHandler.bind(this);
        EVENT_LIST.forEach((event) => {
            channel().subscribe(event, this._onStorage);
        });
        this._publish.apply(this, EVENT_LIST);
        addStorageEventListener();
    }
    destroy() {
        EVENT_LIST.forEach((event) => {
            channel().unsubscribe(event, this._onStorage);
        });
        return super.destroy.call(this);
    }
    /**
     * Устанавливает значение в хранилище.
     * @param {String} key Ключ записываемого поля хранилища.
     * @param {*} item Значение.
     * @return {Boolean}
     */
    setItem(key, item): boolean {
        let fullKey = prefixUtil.add(key, this.prefix);
        let resultItem = itemUtil.serialize(item);
        let res = localStorage.setItem(fullKey, resultItem, !this.isCheckSession);
        if (!res || !this.storeAlways) { return res }
        let keepKeys = getItem(WS_STORE_ALWAYS_KEYS, !this.isCheckSession) || [];
        if (keepKeys.indexOf(fullKey) === -1) {
            keepKeys.push(fullKey);
            localStorage.setItem(WS_STORE_ALWAYS_KEYS, itemUtil.serialize(keepKeys), !this.isCheckSession);
        }
        return res;
    }
    /**
     * Возвращает значение хранилища.
     * @param {String} key Ключ возвращаемого поля хранилища.
     */
    getItem(key) {
        return getItem(prefixUtil.add(key, this.prefix), !this.isCheckSession);
    }
    /**
     * Удаляет значение из хранилища.
     * @param {String} key Ключ удаляемого поля хранилища.
     * @void
     */
    removeItem(key) {
        return localStorage.removeItem(prefixUtil.add(key, this.prefix));
    }
    /**
     * Очищает хранилище от значений имеющих тот же префикс, что и текущий экземпляр класса.
     * @void
     */
    clear() {
        getKeys(this.prefix).forEach((key: string) => {
            localStorage.removeItem(key);
        });
    }
    /**
     * Возвращает массив всех ключей, содержащих тот же префикс
     * @return {Array<String>}
     */
    getKeys(): Array<string> {
        return getKeys(this.prefix).map((key: string) => {
            return prefixUtil.remove(key, this.prefix);
        });
    }
    /**
     * Возвращает объект, содержащий все значения хранилища, соответствующие текущему префиксу
     * @return {Object}
     */
    toObject(): {
        [propName: string]: any
    } {
        let result = {};
        getKeys(this.prefix).forEach((key: string) => {
            result[key] = getItem(key, !this.isCheckSession);
        });
        return result;
    }
    /**
     * Очищает всё хранилище вне зависимости от используемых префиксов.
     * @static
     * @void
     */
    static clearAll() {
        localStorage.clear();
    }
}

export = LocalStorage;

/**
 * @event onChange
 * Происходит при изменении/добавлении данных в хранилище.
 * @name Lib/Storage/LocalStorage#onChange
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {String} key Ключ добавленного/изменённого в хранилище поля.
 * @param {*} value Значение поля в хранилище.
 */
/**
 * @event onRemove
 * Происходит при удалении данных из хранилища.
 * @name Lib/Storage/LocalStorage#onRemove
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {String} key Ключ удалённого из хранилища поля.
 */
/**
 * @event onClear
 * Происходит при очистке хранилища.
 * @name Lib/Storage/LocalStorage#onClear
 * @param {Core/EventObject} eventObject Дескриптор события.
 */