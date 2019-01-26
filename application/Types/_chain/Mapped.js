/// <amd-module name="Types/_chain/Mapped" />
/**
 * Преобразующее звено цепочки.
 * @class Types/Chain/Mapped
 * @extends Types/Chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Mapped', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/MappedEnumerator'
], function (require, exports, tslib_1, Abstract_1, MappedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Mapped = /** @class */
    function (_super) {
        tslib_1.__extends(Mapped, _super);    /** @lends Types/Chain/Mapped.prototype */
                                              /**
         * Конструктор преобразующего звена цепочки.
         * @param {Types/Chain/Abstract} source Предыдущее звено.
         * @param {Function(*, Number): *} callback Функция, возвращающая новый элемент.
         * @param {Object} [callbackContext] Контекст вызова callback
         */
        /** @lends Types/Chain/Mapped.prototype */
        /**
         * Конструктор преобразующего звена цепочки.
         * @param {Types/Chain/Abstract} source Предыдущее звено.
         * @param {Function(*, Number): *} callback Функция, возвращающая новый элемент.
         * @param {Object} [callbackContext] Контекст вызова callback
         */
        function Mapped(source, callback, callbackContext) {
            var _this = _super.call(this, source) || this;
            _this._callback = callback;
            _this._callbackContext = callbackContext;
            return _this;
        }
        Mapped.prototype.destroy = function () {
            this._callback = null;
            this._callbackContext = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Mapped.prototype.getEnumerator = function () {
            return new MappedEnumerator_1.default(this._previous, this._callback, this._callbackContext);
        };
        return Mapped;
    }(Abstract_1.default);
    exports.default = Mapped;
    Mapped.prototype['[Types/_chain/Mapped]'] = true;    // @ts-ignore
    // @ts-ignore
    Mapped.prototype._callback = null;    // @ts-ignore
    // @ts-ignore
    Mapped.prototype._callbackContext = null;
});