/// <amd-module name="Types/_entity/adapter/CowTable" />
/**
 * Адаптер таблицы для работы в режиме Copy-on-write.
 * @class Types/_entity/adapter/CowTable
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/ITable
 * @implements Types/_entity/adapter/IDecorator
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/CowTable', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var CowTable = /** @class */
    function (_super) {
        tslib_1.__extends(CowTable, _super);    /**
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
        function CowTable(data, original, writeCallback) {
            var _this = _super.call(this) || this;
            _this._original = original;
            _this._originalTable = original.forTable(data);
            if (writeCallback) {
                _this._writeCallback = writeCallback;
            }
            return _this;
        }
        CowTable.prototype.getFields = function () {
            return this._originalTable.getFields();
        };
        CowTable.prototype.getCount = function () {
            return this._originalTable.getCount();
        };
        CowTable.prototype.getData = function () {
            return this._originalTable.getData();
        };
        CowTable.prototype.add = function (record, at) {
            this._copy();
            return this._originalTable.add(record, at);
        };
        CowTable.prototype.at = function (index) {
            return this._originalTable.at(index);
        };
        CowTable.prototype.remove = function (at) {
            this._copy();
            return this._originalTable.remove(at);
        };
        CowTable.prototype.replace = function (record, at) {
            this._copy();
            return this._originalTable.replace(record, at);
        };
        CowTable.prototype.move = function (source, target) {
            this._copy();
            return this._originalTable.move(source, target);
        };
        CowTable.prototype.merge = function (acceptor, donor, idProperty) {
            this._copy();
            return this._originalTable.merge(acceptor, donor, idProperty);
        };
        CowTable.prototype.copy = function (index) {
            this._copy();
            return this._originalTable.copy(index);
        };
        CowTable.prototype.clear = function () {
            this._copy();
            return this._originalTable.clear();
        };
        CowTable.prototype.getFormat = function (name) {
            return this._originalTable.getFormat(name);
        };
        CowTable.prototype.getSharedFormat = function (name) {
            return this._originalTable.getSharedFormat(name);
        };
        CowTable.prototype.addField = function (format, at) {
            this._copy();
            return this._originalTable.addField(format, at);
        };
        CowTable.prototype.removeField = function (name) {
            this._copy();
            return this._originalTable.removeField(name);
        };
        CowTable.prototype.removeFieldAt = function (index) {
            this._copy();
            return this._originalTable.removeFieldAt(index);
        };
        CowTable.prototype.getOriginal = function () {
            return this._originalTable;
        };    //endregion Types/_entity/adapter/IDecorator
              //region Protected methods
        //endregion Types/_entity/adapter/IDecorator
        //region Protected methods
        CowTable.prototype._copy = function () {
            if (!this._copied) {
                if (this._originalTable['[Types/_entity/ICloneable]']) {
                    // @ts-ignore
                    this._originalTable = this._originalTable.clone();
                } else {
                    this._originalTable = this._original.forTable(util_1.object.clonePlain(this._originalTable.getData()));
                }
                this._copied = true;
                if (this._writeCallback) {
                    this._writeCallback();
                    this._writeCallback = null;
                }
            }
        };
        return CowTable;
    }(DestroyableMixin_1.default);
    exports.default = CowTable;
    CowTable.prototype['[Types/_entity/adapter/CowTable]'] = true;    // @ts-ignore
    // @ts-ignore
    CowTable.prototype['[Types/_entity/adapter/ITable]'] = true;    // @ts-ignore
    // @ts-ignore
    CowTable.prototype['[Types/_entity/adapter/IDecorator]'] = true;
    CowTable.prototype._original = null;
    CowTable.prototype._originalTable = null;
    CowTable.prototype._writeCallback = null;
    CowTable.prototype._copied = false;
});