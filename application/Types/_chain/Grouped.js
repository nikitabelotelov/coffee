/// <amd-module name="Types/_chain/Grouped" />
/**
 * Группирующее звено цепочки.
 * @class Types/_chain/Grouped
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Grouped', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/collection',
    'Types/shim'
], function (require, exports, tslib_1, Abstract_1, collection_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Grouped = /** @class */
    function (_super) {
        tslib_1.__extends(Grouped, _super);    /** @lends Types/_chain/Grouped.prototype */
                                               /**
         * Конструктор группирующего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {String|function(*): String} key Поле группировки или функция группировки для каждого элемента.
         * @param {String|function(*): *} [value] Поле значения или функция, возвращающая значение для каждого элемента.
         */
        /** @lends Types/_chain/Grouped.prototype */
        /**
         * Конструктор группирующего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {String|function(*): String} key Поле группировки или функция группировки для каждого элемента.
         * @param {String|function(*): *} [value] Поле значения или функция, возвращающая значение для каждого элемента.
         */
        function Grouped(source, key, value) {
            var _this = _super.call(this, source) || this;
            _this._key = key;
            _this._value = value;
            return _this;
        }
        Grouped.prototype.destroy = function () {
            this._key = null;
            this._value = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Grouped.prototype.getEnumerator = function () {
            var toKey = Abstract_1.default.propertyMapper(this._key);
            var toValue = Abstract_1.default.propertyMapper(this._value);
            return new collection_1.enumerator.Mapwise(this._previous.reduce(function (memo, item, index) {
                var key = toKey(item, index);
                var value = toValue(item, index);
                var group;
                if (memo.has(key)) {
                    group = memo.get(key);
                } else {
                    group = [];
                    memo.set(key, group);
                }
                group.push(value);
                return memo;
            }, new shim_1.Map()));
        };
        return Grouped;
    }(Abstract_1.default);
    exports.default = Grouped;
    Object.assign(Grouped.prototype, {
        '[Types/_chain/Grouped]': true,
        _key: null,
        _value: null
    });
});