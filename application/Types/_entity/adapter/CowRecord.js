/// <amd-module name="Types/_entity/adapter/CowRecord" />
/**
 * Адаптер записи таблицы для работы в режиме Copy-on-write.
 * @class Types/_entity/adapter/CowRecord
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/IRecord
 * @implements Types/_entity/adapter/IDecorator
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/CowRecord', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var CowRecord = /** @class */
    function (_super) {
        tslib_1.__extends(CowRecord, _super);    /**
         * Конструктор
         * @param {*} data Сырые данные
         * @param {Types/_entity/adapter/IAdapter} original Оригинальный адаптер
         * @param {Function} [writeCallback] Ф-я обратного вызова при событии записи
         */
        /**
         * Конструктор
         * @param {*} data Сырые данные
         * @param {Types/_entity/adapter/IAdapter} original Оригинальный адаптер
         * @param {Function} [writeCallback] Ф-я обратного вызова при событии записи
         */
        function CowRecord(data, original, writeCallback) {
            var _this = _super.call(this) || this;
            _this._original = original;
            _this._originalRecord = original.forRecord(data);
            if (writeCallback) {
                _this._writeCallback = writeCallback;
            }
            return _this;
        }
        CowRecord.prototype.has = function (name) {
            return this._originalRecord.has(name);
        };
        CowRecord.prototype.get = function (name) {
            return this._originalRecord.get(name);
        };
        CowRecord.prototype.set = function (name, value) {
            this._copy();
            return this._originalRecord.set(name, value);
        };
        CowRecord.prototype.clear = function () {
            this._copy();
            return this._originalRecord.clear();
        };
        CowRecord.prototype.getData = function () {
            return this._originalRecord.getData();
        };
        CowRecord.prototype.getFields = function () {
            return this._originalRecord.getFields();
        };
        CowRecord.prototype.getFormat = function (name) {
            return this._originalRecord.getFormat(name);
        };
        CowRecord.prototype.getSharedFormat = function (name) {
            return this._originalRecord.getSharedFormat(name);
        };
        CowRecord.prototype.addField = function (format, at) {
            this._copy();
            return this._originalRecord.addField(format, at);
        };
        CowRecord.prototype.removeField = function (name) {
            this._copy();
            return this._originalRecord.removeField(name);
        };
        CowRecord.prototype.removeFieldAt = function (index) {
            this._copy();
            return this._originalRecord.removeFieldAt(index);
        };
        CowRecord.prototype.getOriginal = function () {
            return this._originalRecord;
        };    // endregion
              // region Protected methods
        // endregion
        // region Protected methods
        CowRecord.prototype._copy = function () {
            if (!this._copied) {
                if (this._originalRecord['[Types/_entity/ICloneable]']) {
                    this._originalRecord = this._originalRecord.clone();
                } else {
                    this._originalRecord = this._original.forRecord(util_1.object.clonePlain(this._originalRecord.getData()));
                }
                this._copied = true;
                if (this._writeCallback) {
                    this._writeCallback();
                    this._writeCallback = null;
                }
            }
        };
        return CowRecord;
    }(DestroyableMixin_1.default);
    exports.default = CowRecord;
    Object.assign(CowRecord.prototype, {
        '[Types/_entity/adapter/CowRecord]': true,
        '[Types/_entity/adapter/IRecord]': true,
        '[Types/_entity/adapter/IDecorator]': true,
        _original: null,
        _originalRecord: null,
        _writeCallback: null,
        _copied: false
    });
});