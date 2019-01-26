/// <amd-module name="Types/_entity/adapter/Cow" />
/**
 * Адаптер для работы с даными в режиме Copy-on-write.
 * \|/         (__)
 *     `\------(oo)
 *       ||    (__)
 *       ||w--||     \|/
 *   \|/
 * @class Types/Adapter/Cow
 * @mixes Types/Entity/DestroyableMixin
 * @implements Types/Adapter/IAdapter
 * @implements Types/Adapter/IDecorator
 * @mixes Types/Entity/SerializableMixin
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/Cow', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/adapter/Abstract',
    'Types/_entity/adapter/CowTable',
    'Types/_entity/adapter/CowRecord',
    'Types/_entity/SerializableMixin',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, Abstract_1, CowTable_1, CowRecord_1, SerializableMixin_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Cow = /** @class */
    function (_super) {
        tslib_1.__extends(Cow, _super);    /**
         * Конструктор
         * @param {Types/Adapter/IAdapter} original Оригинальный адаптер
         * @param {Function} [writeCallback] Ф-я обратного вызова при событии записи
         */
        /**
         * Конструктор
         * @param {Types/Adapter/IAdapter} original Оригинальный адаптер
         * @param {Function} [writeCallback] Ф-я обратного вызова при событии записи
         */
        function Cow(original, writeCallback) {
            var _this = _super.call(this) || this;
            SerializableMixin_1.default.constructor.call(_this);
            _this._original = original;
            if (writeCallback) {
                _this._writeCallback = writeCallback;
            }
            return _this;
        }    //region IAdapter
        //region IAdapter
        Cow.prototype.forTable = function (data) {
            return new CowTable_1.default(data, this._original, this._writeCallback);
        };
        Cow.prototype.forRecord = function (data) {
            return new CowRecord_1.default(data, this._original, this._writeCallback);
        };
        Cow.prototype.getKeyField = function (data) {
            return this._original.getKeyField(data);
        };
        Cow.prototype.getProperty = function (data, property) {
            return this._original.getProperty(data, property);
        };
        Cow.prototype.setProperty = function (data, property, value) {
            return this._original.setProperty(data, property, value);
        };
        Cow.prototype.serialize = function (data) {
            return this._original.serialize(data);
        };
        Cow.prototype.getOriginal = function () {
            return this._original;
        };    //endregion IDecorator
              //region SerializableMixin
        //endregion IDecorator
        //region SerializableMixin
        Cow.prototype._getSerializableState = function (state) {
            state = SerializableMixin_1.default.prototype._getSerializableState.call(this, state);
            state._original = this._original;
            return state;
        };
        Cow.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = SerializableMixin_1.default.prototype._setSerializableState(state);
            return function () {
                fromSerializableMixin.call(this);
                this._original = state._original;
            };
        };
        return Cow;
    }(util_1.mixin(Abstract_1.default, SerializableMixin_1.default));
    exports.default = Cow;
    Cow.prototype['[Types/_entity/adapter/Cow]'] = true;    // @ts-ignore
    // @ts-ignore
    Cow.prototype['[Types/_entity/adapter/IDecorator]'] = true;
    Cow.prototype._moduleName = 'Types/entity:adapter.Cow';
    Cow.prototype._original = null;
    Cow.prototype._writeCallback = null;
    di_1.register('Types/entity:adapter.Cow', Cow, { instantiate: false });
});