define('Browser/_Event/Server/native/_IndexedDB/Connector', [
    'require',
    'exports',
    'Core/Deferred',
    'Browser/_Event/Server/native/_IndexedDB/Writer',
    'Browser/_Event/Server/native/_IndexedDB/Reader'
], function (require, exports, Deferred, Writer_1, Reader_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Удаляем старую БД
     */
    /**
     * Удаляем старую БД
     */
    if (typeof indexedDB !== 'undefined' && indexedDB !== null && indexedDB instanceof IDBFactory) {
        try {
            indexedDB.deleteDatabase('sbis.seb');
        } catch (e) {
        }
    }    /**
     * Соединение с indexedDB
     * @class Browser/_Event/Server/native/_IndexedDB/Connector
     */
    /**
     * Соединение с indexedDB
     * @class Browser/_Event/Server/native/_IndexedDB/Connector
     */
    var Connector = /** @class */
    function () {
        function Connector(db, storeName, adapter) {
            this.db = db;
            this.storeName = storeName;
            this.adapter = adapter;
        }    /**
         * @param {string} storeName имя хранилища для чтения данных
         * @return {Core/Deferred<Connector | Error>}
         */
        /**
         * @param {string} storeName имя хранилища для чтения данных
         * @return {Core/Deferred<Connector | Error>}
         */
        Connector.connect = function (dbName, storeName, adapter) {
            var def = new Deferred();
            if (typeof indexedDB !== 'object' || indexedDB === null) {
                return Deferred.fail('В окружении нет indexedDB');
            }
            var request;
            try {
                request = indexedDB.open(dbName, adapter.getVersion());
            } catch (e) {
                def.errback(e);
                return def;
            }
            request.onupgradeneeded = function (event) {
                var db = this.result;
                db.onerror = function (event) {
                };
                new Writer_1.Writer(db, storeName, adapter).createStore();
            };
            request.onsuccess = function (event) {
                var db = this.result;
                def.callback(new Connector(db, storeName, adapter));
            };
            request.onerror = function (event) {
                def.errback('You haven\'t rights to use IndexDB.');    /**
                 * https://github.com/localForage/localForage/issues/195#issuecomment-185135074
                 */
                /**
                 * https://github.com/localForage/localForage/issues/195#issuecomment-185135074
                 */
                return true;
            };
            return def;
        };    /**
         * @return {Browser/_Event/Server/native/_IndexedDB/Writer}
         */
        /**
         * @return {Browser/_Event/Server/native/_IndexedDB/Writer}
         */
        Connector.prototype.createWriter = function () {
            return new Writer_1.Writer(this.db, this.storeName, this.adapter);
        };    /**
         * @return {Browser/_Event/Server/native/_IndexedDB/Reader}
         */
        /**
         * @return {Browser/_Event/Server/native/_IndexedDB/Reader}
         */
        Connector.prototype.createReader = function () {
            return new Reader_1.Reader(this.db, this.storeName, this.adapter);
        };
        Connector.DB_DEBUG = 'sbis.seb.debug';
        Connector.DB_DELIVER = 'sbis.seb.deliver';
        Connector.DEBUG_STORE_NAME = 'logs';
        Connector.EVENTS_STORE_NAME = 'events';
        return Connector;
    }();
    exports.Connector = Connector;
});