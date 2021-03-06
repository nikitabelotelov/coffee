/// <amd-module name="Types/_chain/SortWrapper" />
/**
 * Обертка для элемента коллекции, позволяющая сохранить информацию о его индексе в коллекции.
 * @param {*} item Элемент коллекции.
 * @param {*} index Индекс элемента коллекции.
 * @protected
 */
define('Types/_chain/SortWrapper', [
    'require',
    'exports',
    'Types/util'
], function (require, exports, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var SortWrapper = /** @class */
    function () {
        function SortWrapper(item, index) {
            if (item instanceof Object) {
                item[SortWrapper.indexKey] = index;
                return item;
            }
            this.item = item;
            this.index = index;
        }
        SortWrapper.valueOf = function (item) {
            return item instanceof SortWrapper ? item.valueOf() : item;
        };
        SortWrapper.indexOf = function (item) {
            return item instanceof SortWrapper ? item.indexOf() : item[SortWrapper.indexKey];
        };
        SortWrapper.clear = function (item) {
            if (!(item instanceof SortWrapper)) {
                delete item[SortWrapper.indexKey];
            }
        };
        SortWrapper.prototype.valueOf = function () {
            return this.item;
        };
        SortWrapper.prototype.indexOf = function () {
            return this.index;
        };
        return SortWrapper;
    }();
    exports.default = SortWrapper;
    SortWrapper.indexKey = util_1.protect('[]');
});