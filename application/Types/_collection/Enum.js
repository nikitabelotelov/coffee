/// <amd-module name="Types/_collection/Enum" />
/**
 * Тип данных "перечисляемое".
 * @class Types/Type/Enum
 * @extends Types/Type/Dictionary
 * @implements Types/Type/IEnum
 * @implements Types/Entity/ICloneable
 * @implements Types/Entity/IProducible
 * @mixes Types/Entity/ManyToManyMixin
 * @mixes Types/Entity/SerializableMixin
 * @mixes Types/Entity/CloneableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/Enum', [
    'require',
    'exports',
    'tslib',
    'Types/_collection/Dictionary',
    'Types/entity',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, Dictionary_1, entity_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Enum = /** @class */
    function (_super) {
        tslib_1.__extends(Enum, _super);
        function Enum(options) {
            var _this = _super.call(this, options) || this;
            entity_1.SerializableMixin.constructor.call(_this);
            _this._publish('onChange');
            _this._checkIndex();
            return _this;
        }
        Enum.prototype.destroy = function () {
            entity_1.ManyToManyMixin.destroy.call(this);
            _super.prototype.destroy.call(this);
        };    //endregion
              //region IEnum
        //endregion
        //region IEnum
        Enum.prototype.get = function () {
            return this._$index;
        };
        Enum.prototype.set = function (index) {
            var value = this._$dictionary[index];
            var defined = value !== undefined;
            var changed = this._$index !== index;
            if (index === null || defined) {
                this._$index = index;
                this._checkIndex();
            } else {
                throw new ReferenceError(this._moduleName + '::set(): the index "' + index + '" is out of range');
            }
            if (changed) {
                this._notifyChange(this._$index, this.getAsValue());
            }
        };
        Enum.prototype.getAsValue = function (localize) {
            return this._getValue(this._$index, localize);
        };
        Enum.prototype.setByValue = function (value, localize) {
            var index = this._getIndex(value, localize);
            var changed = index !== this._$index;
            if (value === null) {
                this._$index = value;
            } else if (index === undefined) {
                throw new ReferenceError(this._moduleName + '::setByValue(): the value "' + value + '" doesn\'t found in dictionary');
            } else {
                this._$index = index;
            }
            if (changed) {
                this._notifyChange(index, value);
            }
        };    //endregion
              //region IEquatable
        //endregion
        //region IEquatable
        Enum.prototype.isEqual = function (to) {
            if (!(to instanceof Enum)) {
                return false;
            }
            if (!Dictionary_1.default.prototype.isEqual.call(this, to)) {
                return false;
            }
            return this.get() === to.get();
        };    //endregion
              //region IProducible
        //endregion
        //region IProducible
        Enum.produceInstance = function (data, options) {
            return new this({
                dictionary: this.prototype._getDictionaryByFormat(options && options.format),
                localeDictionary: this.prototype._getLocaleDictionaryByFormat(options && options.format),
                index: data
            });
        };    //endregion
              //region Public methods
        //endregion
        //region Public methods
        Enum.prototype.valueOf = function () {
            return this.get();
        };
        Enum.prototype.toString = function () {
            var value = this.getAsValue();
            return value === undefined || value === null ? '' : String(value);
        };    //endregion
              //region Protected methods
              /**
         * Приводит индекс у типу Number
         * @protected
         */
        //endregion
        //region Protected methods
        /**
         * Приводит индекс у типу Number
         * @protected
         */
        Enum.prototype._checkIndex = function () {
            if (this._$index === null) {
                return;
            }
            this._$index = parseInt(String(this._$index), 10);
        };    /**
         * Уведомляет об изменении
         * @param {Number} index Индекс нового значения
         * @param {String} value Новое значение
         * @protected
         */
        /**
         * Уведомляет об изменении
         * @param {Number} index Индекс нового значения
         * @param {String} value Новое значение
         * @protected
         */
        Enum.prototype._notifyChange = function (index, value) {
            var data = {};
            data[index] = value;
            this._childChanged(data);
            this._notify('onChange', index, value);
        };
        return Enum;
    }(Dictionary_1.default);
    exports.default = Enum;
    util_1.applyMixins(Enum, entity_1.ManyToManyMixin, entity_1.SerializableMixin, entity_1.CloneableMixin);
    Enum.prototype['[Types/_collection/Enum]'] = true;    // @ts-ignore
    // @ts-ignore
    Enum.prototype['[Types/_collection/IEnum]'] = true;    // @ts-ignore
    // @ts-ignore
    Enum.prototype['[Types/_entity/ICloneable]'] = true;    // @ts-ignore
    // @ts-ignore
    Enum.prototype['[Types/_entity/IProducible]'] = true;    // @ts-ignore
    // @ts-ignore
    Enum.prototype._moduleName = 'Types/collection:Enum';    // @ts-ignore
    // @ts-ignore
    Enum.prototype._$index = null;    // @ts-ignore
    // @ts-ignore
    Enum.prototype._type = 'enum';    //FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    //FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    Enum.prototype['[WS.Data/Type/Enum]'] = true;    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    Enum.prototype['[WS.Data/Entity/ICloneable]'] = true;
    di_1.register('Types/collection:Enum', Enum, { instantiate: false });
});