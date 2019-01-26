define('Types/_chain/FlattenedEnumerator', [
    'require',
    'exports',
    'Types/_chain/FlattenedMover'
], function (require, exports, FlattenedMover_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var FlattenedEnumerator = /** @class */
    function () {
        /**
         * Конструктор разворачивающего энумератора.
         * @param {Types/Chain/Abstract} previous Предыдущее звено.
         * @protected
         */
        function FlattenedEnumerator(previous) {
            this['[Types/_collection/IEnumerator]'] = true;
            this.previous = previous;
            this.reset();
        }
        FlattenedEnumerator.prototype.getCurrent = function () {
            return this.mover ? this.mover.getCurrent() : undefined;
        };
        FlattenedEnumerator.prototype.getCurrentIndex = function () {
            return this.index;
        };
        FlattenedEnumerator.prototype.moveNext = function () {
            this.mover = this.mover || (this.mover = new FlattenedMover_1.default(this.previous.getEnumerator()));
            var hasNext = this.mover.moveNext();
            if (hasNext) {
                this.index++;
            }
            return hasNext;
        };
        FlattenedEnumerator.prototype.reset = function () {
            this.mover = null;
            this.index = -1;
        };
        return FlattenedEnumerator;
    }();
    exports.default = FlattenedEnumerator;    // @ts-ignore
    // @ts-ignore
    FlattenedEnumerator.prototype.previous = null;    // @ts-ignore
    // @ts-ignore
    FlattenedEnumerator.prototype.mover = null;    // @ts-ignore
    // @ts-ignore
    FlattenedEnumerator.prototype.index = null;
});