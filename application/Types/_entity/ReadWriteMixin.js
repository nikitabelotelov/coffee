/// <amd-module name="Types/_entity/ReadWriteMixin" />
/**
 * Миксин, позволяющий ограничивать запись и чтение.
 * Подмешивается после Types/_entity/ObservableMixin и после Types/_entity/ManyToManyMixin, перекрывая часть их методов
 * @mixin Types/_entity/ReadWriteMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/ReadWriteMixin', [
    'require',
    'exports',
    'Types/_entity/OptionsToPropertyMixin',
    'Types/_entity/ObservableMixin',
    'Types/_entity/ManyToManyMixin',
    'Types/util'
], function (require, exports, OptionsToPropertyMixin_1, ObservableMixin_1, ManyToManyMixin_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var hasOwnProperty = Object.prototype.hasOwnProperty;    /**
     * Свойство, хранящее признак возможности записи
     */
    /**
     * Свойство, хранящее признак возможности записи
     */
    var $writable = util_1.protect('writable');
    var ReadWriteMixin = /** @lends Types/_entity/ReadWriteMixin.prototype */
    {
        '[Types/_entity/ReadWriteMixin]': true,
        //region Types/_entity/ReadWriteMixin
        get writable() {
            return this[$writable];
        },
        constructor: function (options) {
            if (this._options && hasOwnProperty.call(this._options, 'writable')) {
                this[$writable] = this._options.writable;
            }
            if (options && hasOwnProperty.call(options, 'writable')) {
                this[$writable] = options.writable;
            }
            if (this[$writable]) {
                ObservableMixin_1.default.apply(this, arguments);
            }
        },
        destroy: function () {
            if (this[$writable]) {
                ObservableMixin_1.default.prototype.destroy.call(this);
                ManyToManyMixin_1.default.destroy.call(this);
            }
        },
        //endregion Types/_entity/ReadWriteMixin
        //region Types/_entity/ObservableMixin
        subscribe: function (event, handler, ctx) {
            if (this[$writable]) {
                return ObservableMixin_1.default.prototype.subscribe.call(this, event, handler, ctx);
            }
        },
        unsubscribe: function (event, handler, ctx) {
            if (this[$writable]) {
                return ObservableMixin_1.default.prototype.unsubscribe.call(this, event, handler, ctx);
            }
        },
        _publish: function () {
            if (this[$writable]) {
                // @ts-ignore
                return ObservableMixin_1.default.prototype._publish.apply(this, arguments);
            }
        },
        _notify: function () {
            if (this[$writable]) {
                // @ts-ignore
                return ObservableMixin_1.default.prototype._notify.apply(this, arguments);
            }
        },
        //endregion Types/_entity/ObservableMixin
        //region Types/_entity/OptionsToPropertyMixin
        _getOptions: function () {
            // @ts-ignore
            var options = OptionsToPropertyMixin_1.default.prototype._getOptions.call(this);    //Delete "writable" property received from _options
            //Delete "writable" property received from _options
            delete options.writable;
            return options;
        }    //endregion Types/_entity/OptionsToPropertyMixin
    };    // @ts-ignore
    //endregion Types/_entity/OptionsToPropertyMixin
    // @ts-ignore
    var IS_BROWSER = typeof window !== 'undefined';    // @ts-ignore
    // @ts-ignore
    var IS_TESTING = !!(typeof global !== 'undefined' && global.assert && global.assert.strictEqual);    /**
     * @property {Boolean} Объект можно модифицировать. Запрет модификации выключит механизмы генерации событий (ObservableMixin).
     */
    /**
     * @property {Boolean} Объект можно модифицировать. Запрет модификации выключит механизмы генерации событий (ObservableMixin).
     */
    Object.defineProperty(ReadWriteMixin, $writable, {
        writable: true,
        value: IS_BROWSER || IS_TESTING
    });
    exports.default = ReadWriteMixin;
});