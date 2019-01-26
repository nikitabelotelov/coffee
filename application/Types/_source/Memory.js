/// <amd-module name="Types/_source/Memory" />
/**
 * Источник данных в памяти ОС.
 * Позволяет получать данные из объектов в оперативной памяти.
 *
 * Создадим источник со списком объектов солнечной системы:
 * <pre>
 *    require(['Types/Source/Memory', 'Types/Query/Query'], function (MemorySource, Query) {
 *       var solarSystem = new MemorySource({
 *          data: [
 *             {id: 1, name: 'Sun', kind: 'Star'},
 *             {id: 2, name: 'Mercury', kind: 'Planet'},
 *             {id: 3, name: 'Venus', kind: 'Planet'},
 *             {id: 4, name: 'Earth', kind: 'Planet'},
 *             {id: 5, name: 'Mars', kind: 'Planet'},
 *             {id: 6, name: 'Jupiter', kind: 'Planet'},
 *             {id: 7, name: 'Saturn', kind: 'Planet'},
 *             {id: 8, name: 'Uranus', kind: 'Planet'},
 *             {id: 9, name: 'Neptune', kind: 'Planet'},
 *             {id: 10, name: 'Pluto', kind: 'Dwarf planet'}
 *          ],
 *          idProperty: 'id'
 *       });
 *
 *       //Создадим новый объект:
 *       solarSystem.create(
 *          {id: 11, name: 'Moon', 'kind': 'Satellite'}
 *       ).addCallback(function(satellite) {
 *          console.log('Object created:', satellite.get('name'));//'Object created: Moon'
 *       });
 *
 *       //Прочитаем данные о Солнце:
 *       solarSystem.read(1).addCallback(function(star) {
 *          console.log('Object readed:', star.get('name'));//'Object readed: Sun'
 *       });
 *
 *       //Вернем Плутону статус планеты:
 *       solarSystem.read(10).addCallback(function(pluto) {
 *          pluto.set('kind', 'Planet');
 *          solarSystem.update(pluto).addCallback(function() {
 *             console.log('Pluto is the planet again!');
 *          });
 *       });
 *
 *       //Удалим Марс:
 *       solarSystem.destroy(5).addCallback(function() {
 *          console.log('Bye Mars!');
 *       });
 *
 *       //Получим список планет:
 *       var query = new Query();
 *       query.where({
 *          kind: 'Planet'
 *       });
 *       solarSystem.query(query).addCallback(function(dataSet) {
 *          var planets = dataSet.getAll();
 *          planets.getCount();//8
 *          planets.each(function(planet) {
 *             console.log(planet.get('name'));
 *          });
 *          //Mercury, Venus, Earth, Jupiter, Saturn, Uranus, Neptune, Pluto
 *       });
 *    });
 * </pre>
 * @class Types/Source/Memory
 * @extends Types/Source/Local
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/Memory', [
    'require',
    'exports',
    'tslib',
    'Types/_source/Local',
    'Types/di',
    'Types/util',
    'Types/shim'
], function (require, exports, tslib_1, Local_1, di_1, util_1, shim_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Protected 'cachedAdapter' property symbol
     */
    /**
     * Protected 'cachedAdapter' property symbol
     */
    var $cachedAdapter = util_1.protect('cachedAdapter');    /**
     * All injected data by contracts
     */
    /**
     * All injected data by contracts
     */
    var contracts = {};
    var Memory = /** @class */
    function (_super) {
        tslib_1.__extends(Memory, _super);    /** @lends Types/Source/Memory.prototype */
        /** @lends Types/Source/Memory.prototype */
        function Memory(options) {
            var _this = _super.call(this, options) || this;    //FIXME: YAGNI
            //FIXME: YAGNI
            if (options && options.endpoint && options.endpoint.contract && !contracts.hasOwnProperty(options.endpoint.contract)) {
                contracts[options.endpoint.contract] = _this._$data;
            }
            return _this;
        }    //region Base
        //region Base
        Memory.prototype._prepareQueryResult = function (data, query) {
            //selection has no items - return an empty table
            if (data && data.items === undefined) {
                data.items = this._getEmptyData(query);
            }
            return _super.prototype._prepareQueryResult.call(this, data);
        };    //endregion Base
              //region Local
        //endregion Base
        //region Local
        Memory.prototype._getTableAdapter = function () {
            return this[$cachedAdapter] || (this[$cachedAdapter] = this.getAdapter().forTable(this._$data));
        };
        Memory.prototype._applyFrom = function (from) {
            return from ? contracts[from] : this._data;
        };
        Memory.prototype._applyJoin = function (data, join) {
            if (join.length) {
                throw new Error('Joins are not supported');
            }
            return data;
        };
        Memory.prototype._applyWhere = function (data, where) {
            //FIXME: get rid of this SBIS-specified
            if (where && typeof where === 'object') {
                where = Object.assign({}, where);
                delete where['Разворот'];
                delete where['ВидДерева'];
                delete where['usePages'];
            }
            return _super.prototype._applyWhere.call(this, data, where);
        };    //endregion Local
              //region Protected members
              /**
         * Возвращает данные пустой выборки с учетом того, что в ней может содержаться описание полей (зависит от используемого адаптера)
         * @param {Types/Query/Query} [query] Запрос
         * @return {*}
         * @protected
         */
        //endregion Local
        //region Protected members
        /**
         * Возвращает данные пустой выборки с учетом того, что в ней может содержаться описание полей (зависит от используемого адаптера)
         * @param {Types/Query/Query} [query] Запрос
         * @return {*}
         * @protected
         */
        Memory.prototype._getEmptyData = function (query) {
            this._emptyData = this._emptyData || new shim_1.Map();
            var table = query ? query.getFrom() : undefined;
            if (!this._emptyData.has(table)) {
                var items = util_1.object.clonePlain(this._applyFrom(table), true);
                var adapter_1 = this.getAdapter().forTable(items);
                adapter_1.clear();
                this._emptyData.set(table, adapter_1.getData());
            }
            return this._emptyData.get(table);
        };
        return Memory;
    }(Local_1.default    /** @lends Types/Source/Memory.prototype */);
    /** @lends Types/Source/Memory.prototype */
    exports.default = Memory;
    Memory.prototype._moduleName = 'Types/source:Memory';
    Memory.prototype['[Types/_source/Memory]'] = true;    // @ts-ignore
    // @ts-ignore
    Memory.prototype._$data = null;    // @ts-ignore
    // @ts-ignore
    Memory.prototype._dataSetItemsProperty = 'items';    // @ts-ignore
    // @ts-ignore
    Memory.prototype._dataSetMetaProperty = 'meta';    // @ts-ignore
    // @ts-ignore
    Memory.prototype._emptyData = null;
    di_1.register('Types/source:Memory', Memory, { instantiate: false });
});