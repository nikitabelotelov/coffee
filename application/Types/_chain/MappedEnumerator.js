/// <amd-module name="Types/_chain/MappedEnumerator" />
/**
 * Преобразующующий энумератор
 * @author Мальцев А.А.
 */
define('Types/_chain/MappedEnumerator', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MappedEnumerator = /** @class */
    function () {
        /**
         * Конструктор преобразующего энумератора.
         * @param {Types/_chain/Abstract} previous Предыдущее звено.
         * @param {Function(*, Number): *} callback Функция, возвращающая новый элемент.
         * @param {Object} [callbackContext] Контекст вызова callback
         */
        function MappedEnumerator(previous, callback, callbackContext) {
            this['[Types/_collection/IEnumerator]'] = true;
            this.previous = previous;
            this.callback = callback;
            this.callbackContext = callbackContext;
            this.reset();
        }
        MappedEnumerator.prototype.getCurrent = function () {
            return this.current;
        };
        MappedEnumerator.prototype.getCurrentIndex = function () {
            return this.enumerator.getCurrentIndex();
        };
        MappedEnumerator.prototype.moveNext = function () {
            if (this.enumerator.moveNext()) {
                this.current = this.callback.call(this.callbackContext, this.enumerator.getCurrent(), this.enumerator.getCurrentIndex());
                return true;
            }
            return false;
        };
        MappedEnumerator.prototype.reset = function () {
            this.enumerator = this.previous.getEnumerator();
            this.current = undefined;
        };
        return MappedEnumerator;
    }();
    exports.default = MappedEnumerator;
    Object.assign(MappedEnumerator.prototype, {
        previous: null,
        callback: null,
        callbackContext: null,
        enumerator: null,
        current: null
    });
});