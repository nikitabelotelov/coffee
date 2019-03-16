define('Env/_Config/_ConfigMock', [
    'require',
    'exports',
    'Core/Deferred',
    'Env/Constants',
    'Browser/Storage',
    'Types/collection'
], function (require, exports, Deferred, Constants_1, Storage_1, collection_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var ARRAY_DELIMITER = '\x0B\t\b';    /**
     * Временный класс обертка нового Engin/Config для приведение к UserConfig
     * TODO удалить, когда удим core/UserConfig и core/ClientsGlobalConfig
     * @param loader
     * @constructor
     */
    /**
     * Временный класс обертка нового Engin/Config для приведение к UserConfig
     * TODO удалить, когда удим core/UserConfig и core/ClientsGlobalConfig
     * @param loader
     * @constructor
     */
    function Mock(loader) {
        /**
         * @type {ParametersWebAPI/Loader}
         */
        this.__loader = loader;
    }    /**
     * Возвращает значение данного параметра
     * @param {String} key - Название параметра.
     * @param {Boolean} ignoreCache - флаг игнорирования текущего кеша в браузере.
     * @return {Core/Deferred}
     */
    /**
     * Возвращает значение данного параметра
     * @param {String} key - Название параметра.
     * @param {Boolean} ignoreCache - флаг игнорирования текущего кеша в браузере.
     * @return {Core/Deferred}
     */
    Mock.prototype.getParam = function (key, ignoreCache) {
        return this.__loader.load([key], ignoreCache).addCallback(function (cfg) {
            return cfg.get(key);
        }).createDependent();
    };    /**
     * Возвращает все параметры с их значениями
     * В виде набора записей. В каждой записи два поля: Название и Значение.
     * @param {Array} [keys] - Массив названий параметров.
     * @param {Boolean} ignoreCache - флаг игнорирования текущего кеша в браузере.
     * @return {Core/Deferred}
     */
    /**
     * Возвращает все параметры с их значениями
     * В виде набора записей. В каждой записи два поля: Название и Значение.
     * @param {Array} [keys] - Массив названий параметров.
     * @param {Boolean} ignoreCache - флаг игнорирования текущего кеша в браузере.
     * @return {Core/Deferred}
     */
    Mock.prototype.getParams = function (keys, ignoreCache) {
        var _keys = keys || [];
        return this.__loader.load(keys, ignoreCache).addCallback(function (cfg) {
            var rawData = [];
            for (var i = 0; i < _keys.length; i++) {
                rawData.push({
                    'Название': _keys[i],
                    'Значение': cfg.get(_keys[i])
                });
            }
            return new collection_1.RecordSet({
                rawData: rawData,
                idProperty: 'Название'
            });
        }).createDependent();
    };    /**
     * Вставляет параметр со значением
     * @param {String} key - Название параметра.
     * @param {String} value - Значение параметра.
     * @param {String} ctx - Контекст параметра.
     * @return {Core/Deferred}
     */
    /**
     * Вставляет параметр со значением
     * @param {String} key - Название параметра.
     * @param {String} value - Значение параметра.
     * @param {String} ctx - Контекст параметра.
     * @return {Core/Deferred}
     */
    Mock.prototype.setParam = function (key, value) {
        if (value === undefined || value === null) {
            return this.removeParam(key);
        }
        return this.__loader.set(key, value).addCallback(function (res) {
            return res && res.getScalar();    // как в Deprecated/AbstractConfig
        }).createDependent();
    };    /**
     * Удаляет параметр
     * @param {String} key - Название параметра.
     * @return {Core/Deferred}
     */
    /**
     * Удаляет параметр
     * @param {String} key - Название параметра.
     * @return {Core/Deferred}
     */
    Mock.prototype.removeParam = function (key) {
        return this.__loader.remove(key).addCallback(function (res) {
            return res && res.getScalar();    // как в Deprecated/AbstractConfig
        }).createDependent();
    };    /**
     * Возвращает список значений параметра
     * Список значений возвращается в виде массива строк
     * @param {String} key - Название параметра.
     * @return {Core/Deferred}
     */
    /**
     * Возвращает список значений параметра
     * Список значений возвращается в виде массива строк
     * @param {String} key - Название параметра.
     * @return {Core/Deferred}
     */
    Mock.prototype.getParamValues = function (key) {
        return this.getParam(key).addCallback(function (res) {
            if (!res || typeof res !== 'string') {
                return [];
            }
            return res.split(ARRAY_DELIMITER);
        });
    };    /**
     * Вставляет новое значение параметра
     * @param {String} key Название параметра.
     * @param {String} value Значение параметра.
     * @param {Number} [maxCount] Максимальное количество значений параметра. По умолчанию 10.
     * @return {Core/Deferred<Boolean>}
     */
    /**
     * Вставляет новое значение параметра
     * @param {String} key Название параметра.
     * @param {String} value Значение параметра.
     * @param {Number} [maxCount] Максимальное количество значений параметра. По умолчанию 10.
     * @return {Core/Deferred<Boolean>}
     */
    Mock.prototype.setParamValue = function (key, value, maxCount) {
        if (typeof maxCount === 'undefined') {
            maxCount = 10;
        }
        var self = this;
        return this.getParamValues(key).addCallback(function (results) {
            if (results.length >= maxCount) {
                results.pop();
            }
            results.unshift(value);
            return self.setParam(key, results.join(ARRAY_DELIMITER));
        }).createDependent();
    };    /**
     * Заглушка для использования на сервисе представлений
     */
    /**
     * Заглушка для использования на сервисе представлений
     */
    function EmptyMock() {
    }
    EmptyMock.prototype.getParam = function (key) {
        return Deferred.success('');
    };
    EmptyMock.prototype.getParams = function (keys) {
        return Deferred.success(new collection_1.RecordSet());
    };
    EmptyMock.prototype.setParam = function (key, value) {
        return Deferred.success(true);
    };
    EmptyMock.prototype.removeParam = function (key) {
        return Deferred.success(true);
    };
    EmptyMock.prototype.getParamValues = function (key) {
        return Deferred.success([]);
    };
    EmptyMock.prototype.setParamValue = function (key, value, maxCount) {
        return Deferred.success(true);
    };    /**
     * Заглушка для использования в браузере,
     *   если отключены пользовательские параметры
     */
    /**
     * Заглушка для использования в браузере,
     *   если отключены пользовательские параметры
     */
    function MemoryMock() {
    }
    MemoryMock.prototype.getParam = function (key) {
        return Deferred.success(Storage_1.SessionStorage.get(key));
    };
    MemoryMock.prototype.getParams = function (keys) {
        var rawData = [];
        for (var i = 0; i < keys.length; i++) {
            rawData.push({
                'Название': keys[i],
                'Значение': Storage_1.SessionStorage.get(keys[i])
            });
        }
        var rs = new collection_1.RecordSet({
            rawData: rawData,
            idProperty: 'Название'
        });
        return Deferred.success(rs);
    };
    MemoryMock.prototype.setParam = function (key, value) {
        return Deferred.success(Storage_1.SessionStorage.set(key, value));
    };
    MemoryMock.prototype.removeParam = function (key) {
        return Deferred.success(Storage_1.SessionStorage.remove(key));
    };
    MemoryMock.prototype.getParamValues = function (key) {
        return this.getParam(key).addCallback(function (res) {
            if (!res || typeof res !== 'string') {
                return [];
            }
            return res.split(ARRAY_DELIMITER);
        });
    };
    MemoryMock.prototype.setParamValue = function (key, value, maxCount) {
        if (typeof maxCount === 'undefined') {
            maxCount = 10;
        }
        var self = this;
        return this.getParamValues(key).addCallback(function (results) {
            if (results.length >= maxCount) {
                results.pop();
            }
            results.unshift(value);
            return self.setParam(key, results.join(ARRAY_DELIMITER));
        }).createDependent();
    };
    if (Constants_1.default.isBrowserPlatform) {
        // @ts-ignore
        EmptyMock = MemoryMock;    // eslint-disable-line no-func-assign
    }
    // eslint-disable-line no-func-assign
    exports.default = {
        Mock: Mock,
        EmptyMock: EmptyMock
    };
});