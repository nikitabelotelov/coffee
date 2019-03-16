/// <amd-module name="Types/_chain/Filtered" />
/**
 * Фильтрующее звено цепочки.
 * @class Types/_chain/Filtered
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Filtered', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/FilteredEnumerator'
], function (require, exports, tslib_1, Abstract_1, FilteredEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Filtered = /** @class */
    function (_super) {
        tslib_1.__extends(Filtered, _super);    /** @lends Types/_chain/Filtered.prototype */
                                                /**
         * Конструктор фильтрующего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Function(*, Number): Boolean} callback Фильтр
         * @param {Object} [callbackContext] Контекст вызова callback
         */
        /** @lends Types/_chain/Filtered.prototype */
        /**
         * Конструктор фильтрующего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Function(*, Number): Boolean} callback Фильтр
         * @param {Object} [callbackContext] Контекст вызова callback
         */
        function Filtered(source, callback, callbackContext) {
            var _this = _super.call(this, source) || this;
            _this._callback = callback;
            _this._callbackContext = callbackContext;
            return _this;
        }
        Filtered.prototype.destroy = function () {
            this._callback = null;
            this._callbackContext = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Filtered.prototype.getEnumerator = function () {
            return new FilteredEnumerator_1.default(this._previous, this._callback, this._callbackContext);
        };
        return Filtered;
    }(Abstract_1.default);
    exports.default = Filtered;
    Filtered.prototype['[Types/_chain/Filtered]'] = true;
});