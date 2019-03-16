/// <amd-module name="Types/_source/OptionsMixin" />
/**
 * Миксин, позволяющий задавать опциональные настройки источника данных.
 * @mixin Types/_source/OptionsMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/OptionsMixin', [
    'require',
    'exports',
    'tslib'
], function (require, exports, tslib_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var OptionsMixin = /** @lends Types/_source/OptionsMixin.prototype */
    {
        '[Types/_source/OptionsMixin]': true,
        /**
         * @cfg {Object} Дополнительные настройки источника данных.
         * @name Types/_source/OptionsMixin#options
         */
        _$options: {
            /**
             * @cfg {Boolean} Режим отладки.
             * @name Types/_source/OptionsMixin#options.debug
             */
            debug: false
        },
        constructor: function (options) {
            if (options && options.options instanceof Object) {
                this._$options = tslib_1.__assign({}, this._$options || {}, options.options);
                delete options.options;
            }
        },
        /**
         * Возвращает дополнительные настройки источника данных.
         * @return {Object}
         * @see options
         */
        getOptions: function () {
            return tslib_1.__assign({}, this._$options);
        },
        setOptions: function (options) {
            this._$options = tslib_1.__assign({}, this._$options, options || {});
        },
        /**
         * Объединяет набор опций суперкласса с наследником
         * @param {Types/_source/OptionsMixin} Super Суперкласс
         * @param {Object} options Опции наследника
         * @return {Object}
         * @static
         */
        addOptions: function (Super, options) {
            return tslib_1.__assign({}, Super.prototype._$options, options);
        }
    };
    exports.default = OptionsMixin;
});