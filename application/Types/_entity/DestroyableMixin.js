/// <amd-module name="Types/_entity/DestroyableMixin" />
/**
 * Миксин, добавляющий аспект состояния "экземпляр разрушен".
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @mixin Types/_entity/DestroyableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/DestroyableMixin', [
    'require',
    'exports',
    'Types/util'
], function (require, exports, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var $destroyed = util_1.protect('destroyed');
    function dontTouchDeads() {
        throw new ReferenceError('This class instance is destroyed.');
    }
    var DestroyableMixin    /** @lends Types/_entity/DestroyableMixin.prototype */ = /** @lends Types/_entity/DestroyableMixin.prototype */
    /** @class */
    function () {
        function DestroyableMixin() {
        }
        Object.defineProperty(DestroyableMixin.prototype, 'destroyed', {
            /**
             * Экземпляр был разрушен
             */
            get: function () {
                return Boolean(this[$destroyed]);
            },
            enumerable: true,
            configurable: true
        });    /**
         * Разрушает экземпляр
         */
        /**
         * Разрушает экземпляр
         */
        DestroyableMixin.prototype.destroy = function () {
            this[$destroyed] = true;
            for (var key in this) {
                switch (key) {
                case 'destroy':
                case 'destroyed':
                case 'isDestroyed':
                    break;
                default:
                    if (typeof this[key] === 'function') {
                        this[key] = dontTouchDeads;
                    }
                }
            }
        };    //FIXME: deprecated
        //FIXME: deprecated
        DestroyableMixin.prototype.isDestroyed = function () {
            return this.destroyed;
        };
        return DestroyableMixin;
    }();
    exports.default = DestroyableMixin;
    DestroyableMixin.prototype['[Types/_entity/DestroyableMixin]'] = true;
});