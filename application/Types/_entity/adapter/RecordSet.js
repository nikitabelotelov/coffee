/// <amd-module name="Types/_entity/adapter/RecordSet" />
/**
 * Адаптер для рекордсета.
 * Работает с данными, представленными в виде рекорда/рекордсета.
 * Примеры можно посмотреть в модулях {@link Types/Adapter/RecordSetRecord} и {@link Types/Adapter/RecordSetTable}.
 * @class Types/Adapter/RecordSet
 * @extends Types/Adapter/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/RecordSet', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/adapter/Abstract',
    'Types/_entity/adapter/RecordSetTable',
    'Types/_entity/adapter/RecordSetRecord',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, Abstract_1, RecordSetTable_1, RecordSetRecord_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RecordSet = /** @class */
    function (_super) {
        tslib_1.__extends(RecordSet, _super);    /** @lends Types/Adapter/RecordSet.prototype */
        /** @lends Types/Adapter/RecordSet.prototype */
        function RecordSet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    /**
         * Возвращает интерфейс доступа к рекордсету в виде таблицы
         * @param {Types/Collection/RecordSet} data Рекордсет
         * @return {Types/Adapter/ITable}
         */
        /**
         * Возвращает интерфейс доступа к рекордсету в виде таблицы
         * @param {Types/Collection/RecordSet} data Рекордсет
         * @return {Types/Adapter/ITable}
         */
        RecordSet.prototype.forTable = function (data) {
            return new RecordSetTable_1.default(data);
        };    /**
         * Возвращает интерфейс доступа к record-у в виде записи
         * @param {Types/Entity/Record} data Запись
         * @param {Types/Collection/RecordSet} [tableData] Таблица
         * @return {Types/Adapter/IRecord}
         */
        /**
         * Возвращает интерфейс доступа к record-у в виде записи
         * @param {Types/Entity/Record} data Запись
         * @param {Types/Collection/RecordSet} [tableData] Таблица
         * @return {Types/Adapter/IRecord}
         */
        RecordSet.prototype.forRecord = function (data, tableData) {
            return new RecordSetRecord_1.default(data, tableData);
        };
        RecordSet.prototype.getProperty = function (data, property) {
            return util_1.object.getPropertyValue(data, property);
        };
        RecordSet.prototype.setProperty = function (data, property, value) {
            return util_1.object.setPropertyValue(data, property, value);
        };
        RecordSet.prototype.getKeyField = function (data) {
            if (data && typeof data.getIdProperty === 'function') {
                return data.getIdProperty();
            }
            return undefined;
        };
        return RecordSet;
    }(Abstract_1.default    /** @lends Types/Adapter/RecordSet.prototype */);
    /** @lends Types/Adapter/RecordSet.prototype */
    exports.default = RecordSet;
    RecordSet.prototype['[Types/_entity/adapter/RecordSet]'] = true;
    RecordSet.prototype._moduleName = 'Types/entity:adapter.RecordSet';
    di_1.register('Types/entity:adapter.RecordSet', RecordSet, { instantiate: false });
});