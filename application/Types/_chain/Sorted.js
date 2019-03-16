/// <amd-module name="Types/_chain/Sorted" />
/**
 * Сортирующее звено цепочки.
 * @class Types/_chain/Sorted
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Sorted', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/SortedEnumerator'
], function (require, exports, tslib_1, Abstract_1, SortedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Sorted = /** @class */
    function (_super) {
        tslib_1.__extends(Sorted, _super);    /** @lends Types/_chain/Sorted.prototype */
                                              /**
         * Конструктор сортирующего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {function(*, *): Number} [compareFunction] Функция сравнения
         */
        /** @lends Types/_chain/Sorted.prototype */
        /**
         * Конструктор сортирующего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {function(*, *): Number} [compareFunction] Функция сравнения
         */
        function Sorted(source, compareFunction) {
            var _this = _super.call(this, source) || this;
            _this._compareFunction = compareFunction;
            return _this;
        }
        Sorted.prototype.destroy = function () {
            this._compareFunction = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Sorted.prototype.getEnumerator = function () {
            return new SortedEnumerator_1.default(this._previous, this._compareFunction);
        };
        return Sorted;
    }(Abstract_1.default);
    exports.default = Sorted;
    Object.assign(Sorted.prototype, {
        '[Types/_chain/Sorted]': true,
        _compareFunction: null
    });
});