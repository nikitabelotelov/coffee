/// <amd-module name="Types/_chain/Counted" />
/**
 * Агрегирующее звено цепочки, подсчитывающие количество элементов, объединенных по какому-то принципу.
 * @class Types/Chain/Counted
 * @extends Types/Chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Counted', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/collection',
    'Types/shim'
], function (require, exports, tslib_1, Abstract_1, collection_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Counted = /** @class */
    function (_super) {
        tslib_1.__extends(Counted, _super);    /** @lends Types/Chain/Counted.prototype */
                                               /**
         * Конструктор агрегирующего звена цепочки, подсчитывающего количество элементов, объединенных по какому-то принципу.
         * @param {Types/Chain/Abstract} source Предыдущее звено.
         * @param {String|function(*): String} key Поле агрегации или функция агрегации для каждого элемента.
         */
        /** @lends Types/Chain/Counted.prototype */
        /**
         * Конструктор агрегирующего звена цепочки, подсчитывающего количество элементов, объединенных по какому-то принципу.
         * @param {Types/Chain/Abstract} source Предыдущее звено.
         * @param {String|function(*): String} key Поле агрегации или функция агрегации для каждого элемента.
         */
        function Counted(source, key) {
            var _this = _super.call(this, source) || this;
            _this._key = key;
            return _this;
        }
        Counted.prototype.destroy = function () {
            this._key = null;
            _super.prototype.destroy.call(this);
        };    // region Types/Collection/IEnumerable
        // region Types/Collection/IEnumerable
        Counted.prototype.getEnumerator = function () {
            var toKey = Abstract_1.default.propertyMapper(this._key);
            return new collection_1.enumerator.Mapwise(this._previous.reduce(function (memo, item, index) {
                var key = toKey(item, index);
                var count = memo.has(key) ? memo.get(key) : 0;
                memo.set(key, count + 1);
                return memo;
            }, new shim_1.Map()));
        };
        return Counted;
    }(Abstract_1.default);
    exports.default = Counted;
    Counted.prototype['[Types/_chain/Counted]'] = true;    // @ts-ignore
    // @ts-ignore
    Counted.prototype._key = null;
});