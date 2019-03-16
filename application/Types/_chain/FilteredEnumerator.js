define('Types/_chain/FilteredEnumerator', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var FilteredEnumerator = /** @class */
    function () {
        /**
         * Конструктор фильтрующего энумератора.
         * @param {Types/_chain/Abstract} previous Предыдущее звено.
         * @param {Function(*, Number): Boolean} callback Фильтр
         * @param {Object} [callbackContext] Контекст вызова callback
         */
        function FilteredEnumerator(previous, callback, callbackContext) {
            this['[Types/_collection/IEnumerator]'] = true;
            this.previous = previous;
            this.callback = callback;
            this.callbackContext = callbackContext;
            this.reset();
        }
        FilteredEnumerator.prototype.getCurrent = function () {
            return this.enumerator.getCurrent();
        };
        FilteredEnumerator.prototype.getCurrentIndex = function () {
            return this.enumerator.getCurrentIndex();
        };
        FilteredEnumerator.prototype.moveNext = function () {
            while (this.enumerator.moveNext()) {
                if (this.callback.call(this.callbackContext, this.enumerator.getCurrent(), this.enumerator.getCurrentIndex())) {
                    return true;
                }
            }
            return false;
        };
        FilteredEnumerator.prototype.reset = function () {
            this.enumerator = this.previous.getEnumerator();
        };
        return FilteredEnumerator;
    }();
    exports.default = FilteredEnumerator;
    Object.assign(FilteredEnumerator.prototype, {
        previous: null,
        callback: null,
        callbackContext: null,
        enumerator: null
    });
});