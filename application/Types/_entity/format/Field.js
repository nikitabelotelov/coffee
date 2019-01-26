/// <amd-module name="Types/_entity/format/Field" />
/**
 * Прототип поля записи.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/Format/Field
 * @mixes Types/Entity/DestroyableMixin
 * @implements Types/Entity/ICloneable
 * @implements Types/Entity/IEquatable
 * @mixes Types/Entity/OptionsMixin
 * @mixes Types/Entity/SerializableMixin
 * @mixes Types/Entity/CloneableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/Field', [
    'require',
    'exports',
    'tslib',
    'Types/util',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/OptionsToPropertyMixin',
    'Types/_entity/SerializableMixin',
    'Types/_entity/CloneableMixin',
    'Core/helpers/Object/isEqual'
], function (require, exports, tslib_1, util_1, DestroyableMixin_1, OptionsToPropertyMixin_1, SerializableMixin_1, CloneableMixin_1, isEqualObject) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    // @ts-ignore
    // @ts-ignore
    var Field = /** @class */
    function (_super) {
        tslib_1.__extends(Field, _super);
        function Field(options) {
            var _this = _super.call(this, options) || this;
            OptionsToPropertyMixin_1.default.call(_this, options);
            return _this;
        }    /**
         * Сравнивает 2 формата поля на идентичность: совпадает тип, название, значение по умолчанию, признак isNullable. Для полей со словарем - словарь.
         * @param {Types/Format/Field} to Формат поля, с которым сравнить
         * @return {Boolean}
         */
        /**
         * Сравнивает 2 формата поля на идентичность: совпадает тип, название, значение по умолчанию, признак isNullable. Для полей со словарем - словарь.
         * @param {Types/Format/Field} to Формат поля, с которым сравнить
         * @return {Boolean}
         */
        Field.prototype.isEqual = function (to) {
            if (to === this) {
                return true;
            }
            var selfProto = Object.getPrototypeOf(this);
            var toProto = Object.getPrototypeOf(to);
            return selfProto === toProto && this.getName() === to.getName() && isEqualObject(this.getDefaultValue(), to.getDefaultValue()) && this.isNullable() === to.isNullable();
        };    //endregion Types/Entity/IEquatable
              //region Public methods
              /**
         * Возвращает модуль, который является конструктором значения поля
         * @return {String|Function}
         */
        //endregion Types/Entity/IEquatable
        //region Public methods
        /**
         * Возвращает модуль, который является конструктором значения поля
         * @return {String|Function}
         */
        Field.prototype.getType = function () {
            return this._$type || this.getTypeName();
        };    /**
         * Возвращает название типа поля
         * @return {String}
         */
        /**
         * Возвращает название типа поля
         * @return {String}
         */
        Field.prototype.getTypeName = function () {
            return this._typeName;
        };    /**
         * Возвращает имя поля
         * @return {String}
         * @see name
         * @see setName
         */
        /**
         * Возвращает имя поля
         * @return {String}
         * @see name
         * @see setName
         */
        Field.prototype.getName = function () {
            return this._$name;
        };    /**
         * Устанавливает имя поля
         * @param {String} name Имя поля
         * @see name
         * @see getName
         */
        /**
         * Устанавливает имя поля
         * @param {String} name Имя поля
         * @see name
         * @see getName
         */
        Field.prototype.setName = function (name) {
            this._$name = name;
        };    /**
         * Возвращает значение поля по умолчанию
         * @return {*}
         * @see defaultValue
         * @see setDefaultValue
         */
        /**
         * Возвращает значение поля по умолчанию
         * @return {*}
         * @see defaultValue
         * @see setDefaultValue
         */
        Field.prototype.getDefaultValue = function () {
            return this._$defaultValue;
        };    /**
         * Устанавливает значение поля по умолчанию
         * @param {*} value Значение поля по умолчанию
         * @see defaultValue
         * @see getDefaultValue
         */
        /**
         * Устанавливает значение поля по умолчанию
         * @param {*} value Значение поля по умолчанию
         * @see defaultValue
         * @see getDefaultValue
         */
        Field.prototype.setDefaultValue = function (value) {
            this._$defaultValue = value;
        };    /**
         * Возвращает признак, что значение может быть null
         * @return {Boolean}
         * @see name
         * @see setNullable
         */
        /**
         * Возвращает признак, что значение может быть null
         * @return {Boolean}
         * @see name
         * @see setNullable
         */
        Field.prototype.isNullable = function () {
            return this._$nullable;
        };    /**
         * Устанавливает признак, что значение может быть null
         * @param {Boolean} nullable Значение может быть null
         * @see name
         * @see isNullable
         */
        /**
         * Устанавливает признак, что значение может быть null
         * @param {Boolean} nullable Значение может быть null
         * @see name
         * @see isNullable
         */
        Field.prototype.setNullable = function (nullable) {
            this._$nullable = nullable;
        };    /**
         * Копирует формат поля из другого формата
         * @param {Types/Format/Field} format Формат поля, который надо скопировать
         */
        /**
         * Копирует формат поля из другого формата
         * @param {Types/Format/Field} format Формат поля, который надо скопировать
         */
        Field.prototype.copyFrom = function (format) {
            var formatOptions = format._getOptions();
            var key;
            for (var option in formatOptions) {
                if (formatOptions.hasOwnProperty(option)) {
                    key = '_$' + option;
                    if (key in this) {
                        this[key] = formatOptions[option];
                    }
                }
            }
        };
        return Field;
    }(util_1.mixin(DestroyableMixin_1.default, OptionsToPropertyMixin_1.default, SerializableMixin_1.default, CloneableMixin_1.default));
    exports.default = Field;
    Field.prototype['[Types/_entity/format/DestroyableMixin]'] = true;
    Field.prototype._$name = '';
    Field.prototype._$type = null;
    Field.prototype._$defaultValue = null;
    Field.prototype._$nullable = true;
    Field.prototype._typeName = '';
});