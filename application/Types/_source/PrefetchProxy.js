/// <amd-module name="Types/_source/PrefetchProxy" />
/**
 * Источник данных, содержащий предварительно загруженные данные и возвращающий их на первый вызов любого метода
 * чтения данных. Все последующие вызовы проксируются на целевой источник данных.
 *
 * Создадим источник с заранее загруженным результатом списочного метода:
 * <pre>
 *    require(['Types/source'], function (source) {
 *       var fastFoods = new source.PrefetchProxy({
 *          target: new source.Memory({
 *             data: [
 *                {id: 1, name: 'Kurger Bing'},
 *                {id: 2, name: 'DcMonald\'s'},
 *                {id: 3, name: 'CFK'},
 *                {id: 4, name: 'Kuicq'}
 *             ],
 *          }),
 *          data: {
 *             query: new source.DataSet({
 *                rawData: [
 *                   {id: 1, name: 'Mret a Panger'},
 *                   {id: 2, name: 'Cofta Cosfee'},
 *                   {id: 3, name: 'AET'},
 *                ]
 *             })
 *          }
 *       });
 *
 *       //First query will return prefetched data
 *       fastFoods.query().addCallbacks(function(spots) {
 *          spots.getAll().forEach(function(spot) {
 *             console.log(spot.get('name'));//'Mret a Panger', 'Cofta Cosfee', 'AET'
 *          });
 *       }, function(error) {
 *          console.error(error);
 *       });
 *
 *       //Second query will return real data
 *       fastFoods.query().addCallbacks(function(spots) {
 *          spots.getAll().forEach(function(spot) {
 *             console.log(spot.get('name'));//'Kurger Bing', 'DcMonald's', 'CFK', 'Kuicq'
 *          });
 *       }, function(error) {
 *          console.error(error);
 *       });
 *    });
 * </pre>
 * @class Types/_source/PrefetchProxy
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_source/ICrud
 * @implements Types/_source/ICrudPlus
 * @mixes Types/_entity/OptionsMixin
 * @mixes Types/_entity/SerializableMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/PrefetchProxy', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/util',
    'Core/Deferred'
], function (require, exports, tslib_1, entity_1, util_1, Deferred) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var PrefetchProxy = /** @class */
    function (_super) {
        tslib_1.__extends(PrefetchProxy, _super);
        function PrefetchProxy(options) {
            var _this = _super.call(this, options) || this;    /**
             * @cfg {Types/_source/ICrud} Целевой источник данных.
             * @name Types/_source/PrefetchProxy#target
             */
            /**
             * @cfg {Types/_source/ICrud} Целевой источник данных.
             * @name Types/_source/PrefetchProxy#target
             */
            _this._$target = null;    /**
             * @cfg {Object} Предварительно загруженные данные для методов чтения, определенных в интерфейсах
             * {@link Types/_source/ICrud} и {@link Types/_source/ICrudPlus}.
             * @name Types/_source/PrefetchProxy#data
             */
            /**
             * @cfg {Object} Предварительно загруженные данные для методов чтения, определенных в интерфейсах
             * {@link Types/_source/ICrud} и {@link Types/_source/ICrudPlus}.
             * @name Types/_source/PrefetchProxy#data
             */
            _this._$data = {
                /**
                 * @cfg {Types/_entity/Record} Предварительно загруженные данные для метода {@link Types/_source/ICrud#read}.
                 * @name Types/_source/PrefetchProxy#data.read
                 */
                read: null,
                /**
                 * @cfg {Types/_source/DataSet} Предварительно загруженные данные для метода {@link Types/_source/ICrud#query}.
                 * @name Types/_source/PrefetchProxy#data.query
                 */
                query: null,
                /**
                 * @cfg {Types/_entity/Record} Предварительно загруженные данные для метода {@link Types/_source/ICrud#copy}.
                 * @name Types/_source/PrefetchProxy#data.copy
                 */
                copy: null
            };    /**
             * Методы, уже отдавший заранее приготовленные данные
             */
            /**
             * Методы, уже отдавший заранее приготовленные данные
             */
            _this._done = {};    // region ICrud
            // region ICrud
            _this['[Types/_source/ICrud]'] = true;    // endregion
                                                      // region ICrudPlus
            // endregion
            // region ICrudPlus
            _this['[Types/_source/ICrudPlus]'] = true;
            entity_1.OptionsToPropertyMixin.call(_this, options);
            entity_1.SerializableMixin.constructor.call(_this);
            if (!_this._$target) {
                throw new ReferenceError('Option "target" is required.');
            }
            return _this;
        }
        PrefetchProxy.prototype.create = function (meta) {
            return this._$target.create(meta);
        };
        PrefetchProxy.prototype.read = function (key, meta) {
            if (this._$data.read && !this._done.read) {
                this._done.read = true;
                return Deferred.success(this._$data.read);
            }
            return this._$target.read(key, meta);
        };
        PrefetchProxy.prototype.update = function (data, meta) {
            return this._$target.update(data, meta);
        };
        PrefetchProxy.prototype.destroy = function (keys, meta) {
            return this._$target.destroy(keys, meta);
        };
        PrefetchProxy.prototype.query = function (query) {
            if (this._$data.query && !this._done.query) {
                this._done.query = true;
                return Deferred.success(this._$data.query);
            }
            return this._$target.query(query);
        };
        PrefetchProxy.prototype.merge = function (from, to) {
            return this._$target.merge(from, to);
        };
        PrefetchProxy.prototype.copy = function (key, meta) {
            if (this._$data.copy && !this._done.copy) {
                this._done.copy = true;
                return Deferred.success(this._$data.copy);
            }
            return this._$target.copy(key, meta);
        };
        PrefetchProxy.prototype.move = function (items, target, meta) {
            return this._$target.move(items, target, meta);
        };    // endregion
              // region Base
        // endregion
        // region Base
        PrefetchProxy.prototype.getOptions = function () {
            return this._$target.getOptions();
        };
        PrefetchProxy.prototype.setOptions = function (options) {
            return this._$target.setOptions(options);
        };    // endregion
              // region SerializableMixin
        // endregion
        // region SerializableMixin
        PrefetchProxy.prototype._getSerializableState = function (state) {
            var resultState = entity_1.SerializableMixin.prototype._getSerializableState.call(this, state);
            resultState._done = this._done;
            return resultState;
        };
        PrefetchProxy.prototype._setSerializableState = function (state) {
            var fromSerializableMixin = entity_1.SerializableMixin.prototype._setSerializableState(state);
            return function () {
                fromSerializableMixin.call(this);
                this._done = state._done;
            };
        };
        return PrefetchProxy;
    }(util_1.mixin(entity_1.DestroyableMixin, entity_1.OptionsToPropertyMixin, entity_1.SerializableMixin));
    exports.default = PrefetchProxy;
    PrefetchProxy.prototype._moduleName = 'Types/source:PrefetchProxy';
    PrefetchProxy.prototype['[Types/_source/PrefetchProxy]'] = true;
});