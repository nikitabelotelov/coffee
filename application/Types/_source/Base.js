/// <amd-module name="Types/_source/Base" />
/**
 * Базовый источник данных.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_source/Base
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_source/IData
 * @mixes Types/_entity/OptionsMixin
 * @mixes Types/_entity/SerializableMixin
 * @mixes Types/_source/OptionsMixin
 * @mixes Types/_source/LazyMixin
 * @mixes Types/_source/DataMixin
 * @ignoreOptions options.writable
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/Base', [
    'require',
    'exports',
    'tslib',
    'Types/_source/OptionsMixin',
    'Types/_source/LazyMixin',
    'Types/_source/DataMixin',
    'Types/entity',
    'Types/util',
    'Core/core-extend'
], function (require, exports, tslib_1, OptionsMixin_1, LazyMixin_1, DataMixin_1, entity_1, util_1, coreExtend) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Base = /** @class */
    function (_super) {
        tslib_1.__extends(Base, _super);
        function Base(options) {
            var _this = this;
            options = Object.assign({}, options || {});
            _this = _super.call(this, options) || this;
            OptionsMixin_1.default.constructor.call(_this, options);
            entity_1.OptionsToPropertyMixin.call(_this, options);
            entity_1.SerializableMixin.constructor.call(_this);
            DataMixin_1.default.constructor.call(_this, options);
            return _this;
        }    // endregion
             /**
         * @deprecated
         */
        // endregion
        /**
         * @deprecated
         */
        Base.extend = function (mixinsList, classExtender) {
            util_1.logger.info('Types/source:Base', 'Method extend is deprecated, use ES6 extends or Core/core-extend');
            return coreExtend(this, mixinsList, classExtender);
        };
        ;
        return Base;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.OptionsToPropertyMixin, entity_1.SerializableMixin, OptionsMixin_1.default, LazyMixin_1.default, DataMixin_1.default));
    exports.default = Base;
    Base.prototype._moduleName = 'Types/source:Base';
    Base.prototype['[Types/_source/Base]'] = true;    // @ts-ignore
    // @ts-ignore
    Base.prototype['[Types/_source/IData]'] = true;
});