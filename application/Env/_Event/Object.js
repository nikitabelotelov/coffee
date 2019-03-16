define('Env/_Event/Object', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Env/_Event/Object" />
                                                                      /**
     *
     * @class Env/_Event/Object
     * @author Мальцев А.А.
     * @public
     */
    /// <amd-module name="Env/_Event/Object" />
    /**
     *
     * @class Env/_Event/Object
     * @author Мальцев А.А.
     * @public
     */
    var EventObject = /** @class */
    function () {
        function EventObject(eventName, target) {
            this._isBubbling = true;
            this._eventName = null;
            this._target = null;
            this.name = this._eventName = eventName;
            this._target = target;
        }    /**
         * Отменить дальнейшую обработку
         */
        /**
         * Отменить дальнейшую обработку
         */
        EventObject.prototype.cancelBubble = function () {
            this._isBubbling = false;
        };    /**
         * Будет ли продолжена дальнейшая обработка
         * @returns {Boolean}
         */
        /**
         * Будет ли продолжена дальнейшая обработка
         * @returns {Boolean}
         */
        EventObject.prototype.isBubbling = function () {
            return this._isBubbling;
        };    /**
         * Возвращает результат
         * @returns {*}
         */
        /**
         * Возвращает результат
         * @returns {*}
         */
        EventObject.prototype.getResult = function () {
            return this._result;
        };    /**
         * Устанавливает результат
         * @param {*} r
         */
        /**
         * Устанавливает результат
         * @param {*} r
         */
        EventObject.prototype.setResult = function (r) {
            this._result = r;
        };    /**
         * Возвращает объект, инициировавший событие
         * @returns {*}
         */
        /**
         * Возвращает объект, инициировавший событие
         * @returns {*}
         */
        EventObject.prototype.getTarget = function () {
            return this._target;
        };
        return EventObject;
    }();
    exports.default = EventObject;
    ;
});