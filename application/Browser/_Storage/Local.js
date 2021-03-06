define('Browser/_Storage/Local', [
    'require',
    'exports',
    'tslib',
    'Env/Event',
    'Browser/_Storage/NativeGetter',
    'Browser/_Storage/utils/item',
    'Browser/_Storage/utils/prefix',
    'Types/entity'
], function (require, exports, tslib_1, Event_1, getLocalStorageNative, itemUtil, prefixUtil, entity_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    ///region Const
    ///region Const
    var global = function () {
        return this || (0, eval)('this');
    }();    // Ключ по которому хранится список полей, которые необходимо сохранить в хранилище при смене sid
    // Ключ по которому хранится список полей, которые необходимо сохранить в хранилище при смене sid
    var WS_STORE_ALWAYS_KEYS = 'ws-store-always-keys';    // Список всех событий хранилища
    // Список всех событий хранилища
    var EVENT_LIST = [
        'onChange',
        'onRemove',
        'onClear'
    ];    // Канал для передачи всех событий хранилища
    // Канал для передачи всех событий хранилища
    var channel = function () {
        return Event_1.Bus.channel('local_storage');
    };    ///endregion const
    ///endregion const
    var local = getLocalStorageNative();    ///region EventBus
    ///region EventBus
    var isAddedGlobalStorageHandler = false;
    function addStorageEventListener() {
        if (isAddedGlobalStorageHandler || !global) {
            return;
        }
        isAddedGlobalStorageHandler = true;
        if (global.addEventListener) {
            return global.addEventListener('storage', storageGlobalHandler, false);
        }
    }    // storage handlers
         /**
     * Глобальный обработчик события onstorage
     * @param {StorageEvent} event
     */
    // storage handlers
    /**
     * Глобальный обработчик события onstorage
     * @param {StorageEvent} event
     */
    function storageGlobalHandler(event) {
        if (!event && global.event) {
            event = global.event;
        }
        if (!event) {
            return;
        }
        var key = event.key, newValue = event.newValue, oldValue = event.oldValue;    // Если в событии отсуствует ключ -> было вызвана очистка хранилища
        // Если в событии отсуствует ключ -> было вызвана очистка хранилища
        if (!key) {
            channel().notify('onClear');
            return;
        }
        if (!newValue) {
            return channel().notify('onRemove', key);
        }
        return channel().notify('onChange', key, itemUtil.deserialize(newValue));
    }    /**
     * Обработчик события, который вызовится у каждого инстанса LocalStorage
     * @param {Core/EventObject} event
     * @param {String} key
     * @param {*} value
     * @return {*}
     */
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
            return this._notify(event.name, prefixUtil.remove(key, this.prefix), value);
        }
    }    ///endregion EventBus
         ///region LocalStorageNative
         /**
     * Возвращение десериализованной записи хранилища по ключу
     * @param {String} key
     * @param {Boolean} noCheckSession=false
     * @return {*}
     */
    ///endregion EventBus
    ///region LocalStorageNative
    /**
     * Возвращение десериализованной записи хранилища по ключу
     * @param {String} key
     * @param {Boolean} noCheckSession=false
     * @return {*}
     */
    function getItem(key, noCheckSession) {
        return itemUtil.deserialize(local.getItem(key, !noCheckSession));
    }    /**
     * Возвращает массив всех ключей, содержащих тот же префикс
     * при этом сам префикс не обрезаются
     * @param prefix префикс по которому необходимо отфильтровать ключи
     * @return {Array<String>}
     */
    /**
     * Возвращает массив всех ключей, содержащих тот же префикс
     * при этом сам префикс не обрезаются
     * @param prefix префикс по которому необходимо отфильтровать ключи
     * @return {Array<String>}
     */
    function getKeys(prefix) {
        return local.getKeys().filter(function (key) {
            return prefixUtil.startsWith(key, prefix);
        });
    }    /**
     * Класс для работы с локальным хранилищем и его событиями
     * Позволяет хранить и получать сложные типы данных, включая Types/entity.* и Types/collections.*
     * @class Browser/_Storage/LocalStorage
     * @param {String} prefix Префикс хранимых в хранилище ключей
     * @param {Boolean} [storeAlways] Необходимо ли сохранять значение при смене пользователя. Используется для хранения конфигурации, не привязаной к пользовательским данным.
     * @public
     * @author Заляев А.В.
     */
    /**
     * Класс для работы с локальным хранилищем и его событиями
     * Позволяет хранить и получать сложные типы данных, включая Types/entity.* и Types/collections.*
     * @class Browser/_Storage/LocalStorage
     * @param {String} prefix Префикс хранимых в хранилище ключей
     * @param {Boolean} [storeAlways] Необходимо ли сохранять значение при смене пользователя. Используется для хранения конфигурации, не привязаной к пользовательским данным.
     * @public
     * @author Заляев А.В.
     */
    var LocalStorage = /** @class */
    function (_super) {
        tslib_1.__extends(LocalStorage, _super);    /** @lends Browser/_Storage/LocalStorage.prototype*/
        /** @lends Browser/_Storage/LocalStorage.prototype*/
        function LocalStorage(prefix, storeAlways, isCheckSession) {
            if (prefix === void 0) {
                prefix = '';
            }
            if (storeAlways === void 0) {
                storeAlways = false;
            }
            if (isCheckSession === void 0) {
                isCheckSession = true;
            }
            var _this = _super.call(this) || this;
            _this.prefix = prefix;
            _this.storeAlways = storeAlways;
            _this.isCheckSession = isCheckSession;
            _this._onStorage = storageHandler.bind(_this);
            EVENT_LIST.forEach(function (event) {
                channel().subscribe(event, _this._onStorage);
            });    // @ts-ignore
            // @ts-ignore
            _this._publish.apply(_this, EVENT_LIST);
            addStorageEventListener();
            return _this;
        }
        LocalStorage.prototype.destroy = function () {
            var _this = this;
            EVENT_LIST.forEach(function (event) {
                channel().unsubscribe(event, _this._onStorage);
            });
            return _super.prototype.destroy.call(this);
        };    /**
         * Устанавливает значение в хранилище.
         * @param {String} key Ключ записываемого поля хранилища.
         * @param {*} item Значение.
         * @return {Boolean}
         */
        /**
         * Устанавливает значение в хранилище.
         * @param {String} key Ключ записываемого поля хранилища.
         * @param {*} item Значение.
         * @return {Boolean}
         */
        LocalStorage.prototype.setItem = function (key, item) {
            var fullKey = prefixUtil.add(key, this.prefix);
            var resultItem = itemUtil.serialize(item);
            var res = local.setItem(fullKey, resultItem, !this.isCheckSession);
            if (!res || !this.storeAlways) {
                return res;
            }
            var keepKeys = getItem(WS_STORE_ALWAYS_KEYS, !this.isCheckSession) || [];
            if (keepKeys.indexOf(fullKey) === -1) {
                keepKeys.push(fullKey);
                local.setItem(WS_STORE_ALWAYS_KEYS, itemUtil.serialize(keepKeys), !this.isCheckSession);
            }
            return res;
        };    /**
         * Возвращает значение хранилища.
         * @param {String} key Ключ возвращаемого поля хранилища.
         */
        /**
         * Возвращает значение хранилища.
         * @param {String} key Ключ возвращаемого поля хранилища.
         */
        LocalStorage.prototype.getItem = function (key) {
            return getItem(prefixUtil.add(key, this.prefix), !this.isCheckSession);
        };    /**
         * Удаляет значение из хранилища.
         * @param {String} key Ключ удаляемого поля хранилища.
         * @void
         */
        /**
         * Удаляет значение из хранилища.
         * @param {String} key Ключ удаляемого поля хранилища.
         * @void
         */
        LocalStorage.prototype.removeItem = function (key) {
            return local.removeItem(prefixUtil.add(key, this.prefix));
        };    /**
         * Очищает хранилище от значений имеющих тот же префикс, что и текущий экземпляр класса.
         * @void
         */
        /**
         * Очищает хранилище от значений имеющих тот же префикс, что и текущий экземпляр класса.
         * @void
         */
        LocalStorage.prototype.clear = function () {
            getKeys(this.prefix).forEach(function (key) {
                local.removeItem(key);
            });
        };    /**
         * Возвращает массив всех ключей, содержащих тот же префикс
         * @return {Array<String>}
         */
        /**
         * Возвращает массив всех ключей, содержащих тот же префикс
         * @return {Array<String>}
         */
        LocalStorage.prototype.getKeys = function () {
            var _this = this;
            return getKeys(this.prefix).map(function (key) {
                return prefixUtil.remove(key, _this.prefix);
            });
        };    /**
         * Возвращает объект, содержащий все значения хранилища, соответствующие текущему префиксу
         * @return {Object}
         */
        /**
         * Возвращает объект, содержащий все значения хранилища, соответствующие текущему префиксу
         * @return {Object}
         */
        LocalStorage.prototype.toObject = function () {
            var _this = this;
            var result = {};
            getKeys(this.prefix).forEach(function (key) {
                result[key] = getItem(key, !_this.isCheckSession);
            });
            return result;
        };    /**
         * Очищает всё хранилище вне зависимости от используемых префиксов.
         * @static
         * @void
         */
        /**
         * Очищает всё хранилище вне зависимости от используемых префиксов.
         * @static
         * @void
         */
        LocalStorage.clearAll = function () {
            local.clear();
        };
        return LocalStorage;
    }(entity_1.ObservableMixin    /** @lends Browser/_Storage/LocalStorage.prototype*/);
    /** @lends Browser/_Storage/LocalStorage.prototype*/
    exports.default = LocalStorage;
});    /**
 * @event onChange
 * Происходит при изменении/добавлении данных в хранилище.
 * @name Browser/_Storage/LocalStorage#onChange
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {String} key Ключ добавленного/изменённого в хранилище поля.
 * @param {*} value Значение поля в хранилище.
 */
       /**
 * @event onRemove
 * Происходит при удалении данных из хранилища.
 * @name Browser/_Storage/LocalStorage#onRemove
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {String} key Ключ удалённого из хранилища поля.
 */
       /**
 * @event onClear
 * Происходит при очистке хранилища.
 * @name Browser/_Storage/LocalStorage#onClear
 * @param {Core/EventObject} eventObject Дескриптор события.
 */