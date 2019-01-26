/// <amd-module name="Types/_collection/factory/recordSet" />
/**
 * Фабрика для получения рекордсета из Types/Collection/IEnumerable.
 * @class Types/Collection/Factory/RecordSet
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/factory/recordSet', [
    'require',
    'exports',
    'Types/di'
], function (require, exports, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @alias Types/Collection/Factory/RecordSet
     * @param {Types/Collection/IEnumerable.<Types/Entity/Record>} items Коллекция записей
     * @param {Object} [options] Опции конструктора рекордсета
     * @return {Types/Collection/RecordSet}
     */
    /**
     * @alias Types/Collection/Factory/RecordSet
     * @param {Types/Collection/IEnumerable.<Types/Entity/Record>} items Коллекция записей
     * @param {Object} [options] Опции конструктора рекордсета
     * @return {Types/Collection/RecordSet}
     */
    function recordSet(items, options) {
        if (!items || !items['[Types/_collection/IEnumerable]']) {
            throw new TypeError('Argument "items" should implement Types/collection:IEnumerable');
        }
        var Factory = di_1.resolve(di_1.isRegistered('collection.$recordset') ? 'collection.$recordset' : 'Types/collection:RecordSet');
        options = options || {};
        delete options.rawData;
        var result = new Factory(options);
        items.each(function (item) {
            result.add(item);
        });
        return result;
    }
    exports.default = recordSet;
});