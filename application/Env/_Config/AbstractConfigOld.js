define('Env/_Config/AbstractConfigOld', [
    'require',
    'exports',
    'Core/Abstract',
    'Core/Deferred',
    'Browser/Storage',
    'Env/_Constants/constants',
    'optional!Types/source'
], function (require, exports, Abstract, Deferred, Storage_1, constants_1, source_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Абстрактный класс работы с конфигурации
     * @class Core/AbstractConfig
     * @extends Core/Abstract
     * @control
     * @public
     * @author Бегунов А.В.
     */
    /**
     * Абстрактный класс работы с конфигурации
     * @class Core/AbstractConfig
     * @extends Core/Abstract
     * @control
     * @public
     * @author Бегунов А.В.
     */
    exports.default = Abstract.extend(/** @lends Core/AbstractConfig.prototype */
    {
        /**
         * @event onChange Событие, возникающее при изменении параметра
         * @param {Env/Object} eventObject описание в классе Core/Abstract.
         * @param {String} name Название параметра.
         * @param {String} value Значение параметра.
         */
        $protected: { _blo: null },
        $constructor: function () {
            this._publish('onChange');
        },
        /**
         * Есть ли поддержка конфига на странице
         * @return {Boolean}
         * @protected
         * @abstract
         */
        _isConfigSupport: function () {
            throw new Error('AbstractConfig:_isConfigSupport must be implemented in child classes');
        },
        /**
         * Возвращает имя объекта, ответственного за хранение параметров
         * Должен быть переопределен в дочерних классах.
         * @return {String}
         * @abstract
         * @protected
         */
        _getObjectName: function () {
            throw new Error('AbstractConfig:_getObjectName must be implemented in child classes');
        },
        /**
         * Получить объект БЛ
         * @return {Core/Deferred<Types/source.SbisService>}
         * @protected
         */
        _getBLObject: function () {
            if (!source_1.SbisService) {
                throw new Error('Для работы Core/AbstractConfig нужен модуль Types/source.SbisService');
            }
            var rv = new Deferred(), self = this;
            if (this._blo === null) {
                return rv.callback().addCallback(function () {
                    self._blo = new source_1.SbisService({ endpoint: self._getObjectName() });
                    return self._blo;
                });
            } else {
                rv.callback(this._blo);
            }
            return rv;
        },
        /**
         * Вызывает метод БЛ с переданными параметрами, если есть поддержка конфига на странице
         * @param {String} method - Имя метода БЛ.
         * @param {*} param - Параметры вызова
         * @return {Core/Deferred<*>}
         * @protected
         */
        _callMethod: function (method, param) {
            if (!this._isConfigSupport()) {
                return Deferred.success();
            }
            return this._getBLObject().addCallback(function (blo) {
                return blo.call(method, param);
            });
        },
        /**
         * Подготавливает объект для вызова БЛ метода
         * @param {String} key - Название параметра.
         * @param {String} ctx - Контекст параметра.
         * @return {Object}
         * @protected
         */
        _prepareParam: function (key, ctx) {
            var params = { 'Путь': key };
            if (ctx) {
                params['Контекст'] = ctx;
            }
            return params;
        },
        /**
         * Обработка полученного параметра
         * @param {String} operation - операция над контекстом
         * @param {String} name - ключ или объект.
         * @param {String} [value] - значение.
         * @protected
         */
        _processingParam: function (operation, name, value) {
            if (!constants_1.default.isBrowserPlatform || !name) {
                return;
            }
            switch (operation) {
            case 'update':
                Storage_1.SessionStorage.set(name, value);
                break;
            case 'delete':
                Storage_1.SessionStorage.remove(name);
                break;
            case 'read':
                return Storage_1.SessionStorage.get(name);
            }
            this._notify('onChange', name, value);
        },
        /**
         * @param {String} method - Имя метода БЛ для получения параметра.
         * @param {String} key - Название параметра.
         * @param {String} ctx - Контекст параметра.
         * @return {Core/Deferred}
         * @protected
        */
        _getParam: function (method, key, ctx) {
            var self = this;
            return this._callMethod(method, this._prepareParam(key, ctx)).addCallback(function (res) {
                if (!res) {
                    // если нету поддержки конфига на странице
                    return self._processingParam('read', key);
                }
                var value = res.getScalar();
                self._processingParam('update', key, value);
                return value;
            });
        },
        /**
         * Возвращает значение данного параметра
         * @param {String} key - Название параметра.
         * @param {String} ctx - Контекст параметра.
         * @return {Core/Deferred}
         */
        getParam: function (key, ctx) {
            return this._getParam('ПолучитьЗначение', key, ctx);
        },
        /**
         * Возвращает все параметры с их значениями
         * В виде набора записей. В каждой записи два поля: Название и Значение.
         * @param {Array} [keys] - Массив названий параметров.
         * @return {Core/Deferred}
         */
        getParams: function (keys) {
            var self = this;
            var params = keys ? { 'Names': keys } : {};
            return this._callMethod('ПолучитьПараметры', params).addCallback(function (res) {
                if (!res) {
                    // если нету поддержки конфига на странице
                    return {};
                }
                var r, name;
                r = res.getAll();
                if (r) {
                    r.each(function (e) {
                        name = e.get('Название');
                        name && self._processingParam('update', name, e.get('Значение'));
                    });
                }
                return r;
            });
        },
        /**
         * Вставляет параметр со значением
         * @param {String} key - Название параметра.
         * @param {String} value - Значение параметра.
         * @param {String} ctx - Контекст параметра.
         * @return {Core/Deferred<Boolean>}
         */
        setParam: function (key, value, ctx) {
            if (value === undefined) {
                value = null;
            }
            this._processingParam('update', key, value);
            if (!this._isConfigSupport()) {
                return new Deferred().callback(true);
            }
            var params = this._prepareParam(key, ctx);
            params['ЗначениеПараметра'] = value;
            return this._callMethod('ВставитьЗначение', params).addCallback(function (res) {
                return res && res.getScalar();
            });
        },
        /***
         * Удаляет параметр
         * @param {String} key - Название параметра.
         * @param {String} ctx - Контекст параметра.
         * @return {Core/Deferred}
         */
        removeParam: function (key, ctx) {
            this._processingParam('delete', key, null);
            if (!this._isConfigSupport()) {
                return new Deferred().callback(true);
            }
            var params = this._prepareParam(key, ctx);
            return this._callMethod('УдалитьПараметр', params).addCallback(function (res) {
                return res && res.getScalar();
            });
        }
    });
});