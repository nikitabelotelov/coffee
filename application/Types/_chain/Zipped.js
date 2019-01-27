/// <amd-module name="Types/_chain/Zipped" />
/**
 * Объединяющее звено цепочки.
 * @class Types/_chain/Zipped
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Zipped', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/ZippedEnumerator'
], function (require, exports, tslib_1, Abstract_1, ZippedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Zipped = /** @class */
    function (_super) {
        tslib_1.__extends(Zipped, _super);    /** @lends Types/_chain/Zipped.prototype */
                                              /**
         * Конструктор объединяющего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Array.<Array>|Array.<Types/_collection/IEnumerable>} items Коллекции для объединения.
         */
        /** @lends Types/_chain/Zipped.prototype */
        /**
         * Конструктор объединяющего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Array.<Array>|Array.<Types/_collection/IEnumerable>} items Коллекции для объединения.
         */
        function Zipped(source, items) {
            var _this = _super.call(this, source) || this;
            _this._items = items;
            return _this;
        }
        Zipped.prototype.destroy = function () {
            this._items = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Zipped.prototype.getEnumerator = function () {
            return new ZippedEnumerator_1.default(this._previous, this._items);
        };
        return Zipped;
    }(Abstract_1.default);
    exports.default = Zipped;
    Zipped.prototype['[Types/_chain/Zipped]'] = true;    // @ts-ignore
    // @ts-ignore
    Zipped.prototype._items = null;
});