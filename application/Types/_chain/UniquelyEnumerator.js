/// <amd-module name="Types/_chain/UniquelyEnumerator" />
/**
 * Энумератор уникальных элементов
 * @author Мальцев А.А.
 */
define('Types/_chain/UniquelyEnumerator', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var UniquelyEnumerator = /** @class */
    function () {
        /**
         * Конструктор энумератора уникальных элементов.
         * @param {Types/_chain/Abstract} previous Предыдущее звено.
         * @param {function(*, String|Number): String|Number} [idExtractor] Возвращает уникальный идентификатор элемента.
         */
        function UniquelyEnumerator(previous, idExtractor) {
            this['[Types/_collection/IEnumerator]'] = true;
            this.previous = previous;
            this.idExtractor = idExtractor;
            this.reset();
        }
        UniquelyEnumerator.prototype.getCurrent = function () {
            return this.enumerator.getCurrent();
        };
        UniquelyEnumerator.prototype.getCurrentIndex = function () {
            return this.enumerator.getCurrentIndex();
        };
        UniquelyEnumerator.prototype.moveNext = function () {
            var hasNext = this.enumerator.moveNext();
            var current;
            if (hasNext) {
                current = this.enumerator.getCurrent();
                if (this.idExtractor) {
                    current = this.idExtractor(current, this.enumerator.getCurrentIndex());
                }
                if (current instanceof Object) {
                    if (this.objectsHash.indexOf(current) > -1) {
                        return this.moveNext();
                    }
                    this.objectsHash.push(current);
                } else {
                    if (current in this.keysHash) {
                        return this.moveNext();
                    }
                    this.keysHash[current] = true;
                }
            }
            return hasNext;
        };
        UniquelyEnumerator.prototype.reset = function () {
            this.enumerator = this.previous.getEnumerator();
            this.keysHash = {};
            this.objectsHash = [];
        };
        return UniquelyEnumerator;
    }();
    exports.default = UniquelyEnumerator;
    Object.assign(UniquelyEnumerator.prototype, {
        previous: null,
        enumerator: null,
        idExtractor: null,
        keysHash: null,
        objectsHash: null
    });
});