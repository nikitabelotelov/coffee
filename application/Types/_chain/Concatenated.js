/// <amd-module name="Types/_chain/Concatenated" />
/**
 * Объединяющее звено цепочки.
 * @class Types/_chain/Concatenated
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Concatenated', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/ConcatenatedEnumerator'
], function (require, exports, tslib_1, Abstract_1, ConcatenatedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Concatenated = /** @class */
    function (_super) {
        tslib_1.__extends(Concatenated, _super);    /** @lends Types/_chain/Concatenated.prototype */
                                                    /**
         * Конструктор объединяющего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Array.<Array>|Array.<Types/_collection/IEnumerable>} items Коллекции для объединения.
         */
        /** @lends Types/_chain/Concatenated.prototype */
        /**
         * Конструктор объединяющего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Array.<Array>|Array.<Types/_collection/IEnumerable>} items Коллекции для объединения.
         */
        function Concatenated(source, items) {
            var _this = _super.call(this, source) || this;
            _this._items = items;
            return _this;
        }
        Concatenated.prototype.destroy = function () {
            this._items = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Concatenated.prototype.getEnumerator = function () {
            return new ConcatenatedEnumerator_1.default(this._previous, this._items);
        };
        return Concatenated;
    }(Abstract_1.default);
    exports.default = Concatenated;
    Concatenated.prototype['[Types/_chain/Concatenated]'] = true;    // @ts-ignore
    // @ts-ignore
    Concatenated.prototype._items = null;
    Object.defineProperty(Concatenated.prototype, 'shouldSaveIndices', { value: false });
});