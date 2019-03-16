/// <amd-module name="Types/_entity/adapter/RecordSetTable" />
/**
 * Адаптер для таблицы данных в формате рекордсета.
 * Работает с данными, представленными в виде экземлпяра {@link Types/_collection/RecordSet}.
 *
 * Создадим адаптер для таблицы:
 * <pre>
 *    requirejs(['Types/collection', 'Types/entity'], function(collection, entity) {
 *       var ibizasClubs = new collection.RecordSet({
 *          rawData: [
 *             {id: 1, title: 'Amnesia Ibiza'},
 *             {id: 2, title: 'DC-10'},
 *             {id: 3, title: 'Pacha Ibiza'}
 *          ]
 *       });
 *       var clubsAdapter = new entity.adapter.RecordSet(ibizasClubs);
 *       console.log(clubsAdapter.at(0).get('title'));//'Amnesia Ibiza'
 *    });
 * </pre>
 * @class Types/_entity/adapter/RecordSetTable
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_entity/adapter/ITable
 * @mixes Types/_entity/adapter/GenericFormatMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/adapter/RecordSetTable', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/DestroyableMixin',
    'Types/_entity/adapter/GenericFormatMixin',
    'Types/di',
    'Types/util'
], function (require, exports, tslib_1, DestroyableMixin_1, GenericFormatMixin_1, di_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RecordSetTable = /** @class */
    function (_super) {
        tslib_1.__extends(RecordSetTable, _super);    /**
         * Конструктор
         * @param {Types/_collection/RecordSet} data Таблица
         */
        /**
         * Конструктор
         * @param {Types/_collection/RecordSet} data Таблица
         */
        function RecordSetTable(data) {
            var _this = this;
            if (data && !data['[Types/_collection/RecordSet]']) {
                throw new TypeError('Argument "data" should be an instance of Types/collection:RecordSet');
            }
            _this = _super.call(this, data) || this;
            GenericFormatMixin_1.default.constructor.call(_this, data);
            return _this;
        }
        RecordSetTable.prototype.getFields = function () {
            var fields = [];
            if (this._isValidData()) {
                this._data.getFormat().each(function (field) {
                    fields.push(field.getName());
                });
            }
            return fields;
        };
        RecordSetTable.prototype.getCount = function () {
            return this._isValidData() ? this._data.getCount() : 0;
        };
        RecordSetTable.prototype.add = function (record, at) {
            this._buildData(record);
            this._data.add(record, at);
        };
        RecordSetTable.prototype.at = function (index) {
            return this._isValidData() ? this._data.at(index) : undefined;
        };
        RecordSetTable.prototype.remove = function (at) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            return this._data.removeAt(at);
        };
        RecordSetTable.prototype.replace = function (record, at) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            return this._data.replace(record, at);
        };
        RecordSetTable.prototype.move = function (source, target) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            var rec = this._data.at(source);
            this._data.removeAt(source);
            this._data.add(rec, target);
        };
        RecordSetTable.prototype.merge = function (acceptor, donor, idProperty) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            var acceptorRecord = this._data.at(acceptor);
            this._data.at(donor).each(function (name, value) {
                if (name !== idProperty) {
                    acceptorRecord.set(name, value);
                }
            }, this);
            this._data.removeAt(donor);
        };
        RecordSetTable.prototype.copy = function (index) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            var clone = this._data.at(index).clone();
            this.add(clone, 1 + index);
            return clone;
        };
        RecordSetTable.prototype.clear = function () {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            var count = this._data.getCount();
            for (var i = count - 1; i >= 0; i--) {
                this._data.removeAt(i);
            }
        };
        RecordSetTable.prototype.addField = function (format, at) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            this._data.addField(format, at);
        };
        RecordSetTable.prototype.removeField = function (name) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            this._data.removeField(name);
        };
        RecordSetTable.prototype.removeFieldAt = function (index) {
            if (!this._isValidData()) {
                throw new TypeError('Passed data has invalid format');
            }
            this._data.removeFieldAt(index);
        };    // endregion
              // region Protected methods
        // endregion
        // region Protected methods
        RecordSetTable.prototype._buildData = function (sample) {
            if (!this._data) {
                var config = {};
                if (sample) {
                    if (sample.getAdapter) {
                        config.adapter = sample.getAdapter();
                    }
                    if (sample.getIdProperty) {
                        config.idProperty = sample.getIdProperty();
                    }
                }
                this._data = di_1.create('Types/collection:RecordSet', config);
            }
        };
        RecordSetTable.prototype._isValidData = function () {
            return this._data && this._data['[Types/_collection/RecordSet]'];
        };
        RecordSetTable.prototype._getFieldsFormat = function () {
            return this._data.getFormat();
        };
        return RecordSetTable;
    }(util_1.mixin(DestroyableMixin_1.default, GenericFormatMixin_1.default));
    exports.default = RecordSetTable;
    Object.assign(RecordSetTable.prototype, {
        '[Types/_entity/adapter/RecordSetTable]': true,
        '[Types/_entity/adapter/ITable]': true,
        _data: null
    });
});