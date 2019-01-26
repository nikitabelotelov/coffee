/// <amd-module name="Types/_collection/factory/list" />
/**
 * Фабрика для получения списка из Types/Collection/IEnumerable.
 * @class Types/Collection/Factory/List
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/factory/list', [
    'require',
    'exports',
    'Types/_collection/List'
], function (require, exports, List_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * @alias Types/Collection/Factory/List
     * @param {Types/Collection/IEnumerable} items Коллекция
     * @return {Types/Collection/List}
     */
    /**
     * @alias Types/Collection/Factory/List
     * @param {Types/Collection/IEnumerable} items Коллекция
     * @return {Types/Collection/List}
     */
    function list(items) {
        if (!items || !items['[Types/_collection/IEnumerable]']) {
            throw new TypeError('Argument "items" should implement Types/collection:IEnumerable');
        }
        var itemsArray = [];
        items.each(function (item) {
            itemsArray.push(item);
        });
        return new List_1.default({ items: itemsArray });
    }
    exports.default = list;
});