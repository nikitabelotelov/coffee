/// <amd-module name="Types/_collection/Flags" />
/**
 * Тип данных "флаги".
 * @class Types/Type/Flags
 * @extends Types/Type/Dictionary
 * @implements Types/Type/IFlags
 * @implements Types/Entity/ICloneable
 * @implements Types/Entity/IProducible
 * @mixes Types/Entity/ManyToManyMixin
 * @mixes Types/Entity/SerializableMixin
 * @mixes Types/Entity/CloneableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_collection/Flags', [
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
    function prepareValue(value) {
        return value === null || value === undefined ? null : !!value;
    }
    var Flags = /** @class */
    function (_super) {
        tslib_1.__extends(Flags, _super);
        function Flags(options) {
            var _this = _super.call(this, options) || this;
            entity_1.SerializableMixin.constructor.call(_this);
            _this._publish('onChange');
            _this._$values = _this._$values || [];
            return _this;
        }
        Flags.prototype.destroy = function () {
            entity_1.ManyToManyMixin.destroy.call(this);
            _super.prototype.destroy.call(this);
        };    //endregion
              //region IFlags
        //endregion
        //region IFlags
        Flags.prototype.get = function (name, localize) {
            var ordinalIndex = this._getOrdinalIndex(name, localize);
            if (ordinalIndex !== undefined) {
                return prepareValue(this._$values[ordinalIndex]);
            }
            return undefined;
        };
        Flags.prototype.set = function (name, value, localize) {
            var ordinalIndex = this._getOrdinalIndex(name, localize);
            if (ordinalIndex === undefined) {
                throw new ReferenceError(this._moduleName + '::set(): the value "' + name + '" doesn\'t found in dictionary');
            }
            value = prepareValue(value);
            if (this._$values[ordinalIndex] === value) {
                return;
            }
            this._$values[ordinalIndex] = value;
            var index = this._getIndex(name, localize);
            this._notifyChange(name, index, value);
        };
        Flags.prototype.getByIndex = function (index) {
            var name = this._getValue(index);
            var ordinalIndex = this._getOrdinalIndex(name);
            return this._$values[ordinalIndex];
        };
        Flags.prototype.setByIndex = function (index, value) {
            var name = this._getValue(index);
            if (name === undefined) {
                throw new ReferenceError(this._moduleName + '::setByIndex(): the index ' + index + ' doesn\'t found in dictionary');
            }
            var ordinalIndex = this._getOrdinalIndex(name);
            value = prepareValue(value);
            if (this._$values[ordinalIndex] === value) {
                return;
            }
            this._$values[ordinalIndex] = value;
            this._notifyChange(name, index, value);
        };
        Flags.prototype.setFalseAll = function () {
            this._setAll(false);
        };
        Flags.prototype.setTrueAll = function () {
            this._setAll(true);
        };
        Flags.prototype.setNullAll = function () {
            this._setAll(null);
        };    //endregion
              //region IEquatable
        //endregion
        //region IEquatable
        Flags.prototype.isEqual = function (to) {
            if (!(to instanceof Flags)) {
                return false;
            }
            if (!Dictionary_1.default.prototype.isEqual.call(this, to)) {
                return false;
            }
            var enumerator = this.getEnumerator();
            var key;
            while (enumerator.moveNext()) {
                key = enumerator.getCurrent();
                if (this.get(key) !== to.get(key)) {
                    return false;
                }
            }
            return true;
        };    //endregion
              //region IProducible
        //endregion
        //region IProducible
        Flags.produceInstance = function (data, options) {
            return new this({
                dictionary: this.prototype._getDictionaryByFormat(options && options.format),
                localeDictionary: this.prototype._getLocaleDictionaryByFormat(options && options.format),
                values: data
            });
        };    //endregion
              //region Public methods
        //endregion
        //region Public methods
        Flags.prototype.toString = function () {
            return '[' + this._$values.map(function (value) {
                return value === null ? 'null' : value;
            }).join(',') + ']';
        };    //endregion
              //region Protected methods
              /**
         * Возвращает порядковый номер значения в словаре
         * @param {String} name Значение в словаре
         * @param {Boolean} [localize=false] Это локализованное значение
         * @return {Number|undefined}
         * @protected
         */
        //endregion
        //region Protected methods
        /**
         * Возвращает порядковый номер значения в словаре
         * @param {String} name Значение в словаре
         * @param {Boolean} [localize=false] Это локализованное значение
         * @return {Number|undefined}
         * @protected
         */
        Flags.prototype._getOrdinalIndex = function (name, localize) {
            var enumerator = this.getEnumerator(localize);
            var index = 0;
            while (enumerator.moveNext()) {
                if (enumerator.getCurrent() === name) {
                    return index;
                }
                index++;
            }
            return undefined;
        };
        Flags.prototype._setAll = function (value) {
            var dictionary = this._$dictionary;
            var values = this._$values;
            var enumerator = this.getEnumerator();
            var ordinalIndex = 0;
            while (enumerator.moveNext()) {
                if (values[ordinalIndex] !== value) {
                    values[ordinalIndex] = value;
                    var dictionaryIndex = enumerator.getCurrentIndex();
                    this._notifyChange(dictionary[dictionaryIndex], dictionaryIndex, value);
                }
                ordinalIndex++;
            }
        };    /**
         * Уведомляет об изменении
         * @param {String} name Имя флага
         * @param {Number} index Изменившийся индекс
         * @param {String} value Значение в индексе
         * @protected
         */
        /**
         * Уведомляет об изменении
         * @param {String} name Имя флага
         * @param {Number} index Изменившийся индекс
         * @param {String} value Значение в индексе
         * @protected
         */
        Flags.prototype._notifyChange = function (name, index, value) {
            var data = {};
            data[String(name)] = value;
            this._childChanged(data);
            this._notify('onChange', name, index, value);
        };
        return Flags;
    }(Dictionary_1.default);
    exports.default = Flags;
    util_1.applyMixins(Flags, entity_1.ManyToManyMixin, entity_1.SerializableMixin, entity_1.CloneableMixin);
    Flags.prototype['[Types/_collection/Flags]'] = true;    // @ts-ignore
    // @ts-ignore
    Flags.prototype['[Types/_collection/IFlags]'] = true;    // @ts-ignore
    // @ts-ignore
    Flags.prototype['[Types/_entity/ICloneable]'] = true;    // @ts-ignore
    // @ts-ignore
    Flags.prototype['[Types/_entity/IProducible]'] = true;    // @ts-ignore
    // @ts-ignore
    Flags.prototype._moduleName = 'Types/collection:Flags';    // @ts-ignore
    // @ts-ignore
    Flags.prototype._$values = undefined;    // @ts-ignore
    // @ts-ignore
    Flags.prototype._type = 'flags';    //FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    //FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
    Flags.prototype['[WS.Data/Type/Flags]'] = true;    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    //FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
    Flags.prototype['[WS.Data/Entity/ICloneable]'] = true;
    di_1.register('Types/collection:Flags', Flags, { instantiate: false });
});