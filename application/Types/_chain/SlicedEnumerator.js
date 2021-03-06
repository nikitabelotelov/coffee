/// <amd-module name="Types/_chain/SlicedEnumerator" />
/**
 * Вырезающий энумератор
 * @author Мальцев А.А.
 */
define('Types/_chain/SlicedEnumerator', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var SlicedEnumerator = /** @class */
    function () {
        /**
         * Конструктор вырезающего энумератора.
         * @param {Types/_chain/Abstract} previous Предыдущее звено.
         * @param {Number} begin Индекс, по которому начинать извлечение
         * @param {Number} end Индекс, по которому заканчивать извлечение (будут извлечены элементы с индексом меньше end)
         * @protected
         */
        function SlicedEnumerator(previous, begin, end) {
            this['[Types/_collection/IEnumerator]'] = true;
            this.previous = previous;
            this.begin = begin;
            this.end = end;
            this.reset();
        }
        SlicedEnumerator.prototype.getCurrent = function () {
            return this.enumerator.getCurrent();
        };
        SlicedEnumerator.prototype.getCurrentIndex = function () {
            return this.enumerator.getCurrentIndex();
        };
        SlicedEnumerator.prototype.moveNext = function () {
            while (this.now < this.begin - 1 && this.enumerator.moveNext()) {
                this.now++;
            }
            var next = this.now + 1;
            if (next >= this.begin && next < this.end && this.enumerator.moveNext()) {
                this.now = next;
                return true;
            }
            return false;
        };
        SlicedEnumerator.prototype.reset = function () {
            this.enumerator = this.previous.getEnumerator();
            this.now = -1;
        };
        return SlicedEnumerator;
    }();
    exports.default = SlicedEnumerator;
    Object.assign(SlicedEnumerator.prototype, {
        previous: null,
        now: 0,
        begin: 0,
        end: 0,
        enumerator: null
    });
});