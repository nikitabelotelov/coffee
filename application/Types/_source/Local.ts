/// <amd-module name="Types/_source/Local" />
/**
 * Источник данных, работающий локально.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_source/Local
 * @extends Types/_source/Base
 * @implements Types/_source/ICrud
 * @implements Types/_source/ICrudPlus
 * @mixes Types/_source/DataCrudMixin
 * @public
 * @author Мальцев А.А.
 */

import ICrud from './ICrud';
import ICrudPlus from './ICrudPlus';
import Base, {IOptions as IBaseOptions} from './Base';
import DataMixin from './DataMixin';
import DataCrudMixin from './DataCrudMixin';
import Query, {IMeta, Join, Order} from './Query';
import DataSet from './DataSet';
import {adapter, Model, Record} from '../entity';
import {RecordSet} from '../collection';
import {mixin, object} from '../util';
// @ts-ignore
import Deferred = require('Core/Deferred');
// @ts-ignore
import randomId = require('Core/helpers/Number/randomId');

const MOVE_POSITION = {
   on: 'on',
   before: 'before',
   after: 'after'
};

function compareValues(given: any, expect: any, operator: string): boolean {
   // If array expected, use "given in expect" logic
   if (expect instanceof Array) {
      for (let i = 0; i < expect.length; i++) {
         if (compareValues(given, expect[i], operator)) {
            return true;
         }
      }
      return false;
   }

   // If array given, use "given has only expect" logic
   if (given instanceof Array) {
      for (let i = 0; i < given.length; i++) {
         if (!compareValues(given[i], expect, operator)) {
            return false;
         }
      }
      return true;
   }

   // Otherwise - just compare
   // tslint:disable-next-line:triple-equals
   return given == expect;
}

type FilterFunction = (item: adapter.IRecord, query: Object) => boolean;

interface IGenericObject<T> {
   __proto?: object;
}

export interface IOptions extends IBaseOptions {
   filter?: FilterFunction;
}

export default abstract class Local extends mixin(
   Base, DataCrudMixin
) implements ICrud, ICrudPlus /** @lends Types/_source/Local.prototype */{
   /**
    * @cfg {Function(Types/_entity/adapter/IRecord, Object):Boolean} Фильтр записей, используемый при вызове метода
    * {@link query}.
    * @name Types/_source/Local#filter
    * @remark
    * Первым аргументом передается адаптер сырых данных для каждой записи, вторым - фильтр, переданный в вызов метода
    * query().
    * Функция должна вернуть Boolean: true - запись прошла фильтр и попадет в итоговую выборку, false - не  прошла.
    * @example
    * Спрячем Землю из результатов выборки:
    * <pre>
    *    require(['Types/source'], function (source) {
    *       var solarSystem = new source.Memory({
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
    *          filter: function(item) {
    *             return item.get('name') !== 'Earth';
    *          },
    *          idProperty: 'id'
    *       });
    *
    *       solarSystem.query().addCallback(function(result) {
    *          result.getAll().each(function(record) {
    *             console.log(record.get('name'));
    *             //'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
    *          });
    *       });
    *    });
    * </pre>
    * Выберем все объекты, имена которых начинаются на 'S':
    * <pre>
    *    require(['Types/source'], function (source) {
    *       var solarSystem = new source.Memory({
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
    *          filter: function(item, where) {
    *             return Object.keys(where).some(function(field) {
    *                var value = item.get(field),
    *                   needed = where[field];
    *                return String(value).indexOf(needed) === 0;
    *             });
    *          },
    *          idProperty: 'id'
    *       });
    *
    *       var query = new source.Query();
    *       query.where({name: 'S'});
    *       solarSystem.query(query).addCallback(function(result) {
    *          result.getAll().each(function(record) {
    *             console.log(record.get('name'));//'Sun', 'Saturn'
    *          });
    *       });
    *    });
    * </pre>
    */
   protected _$filter: FilterFunction;

   /**
    * Индекс для быстрого поиска записи по ключу
    */
   protected _index: IGenericObject<Number>;

   /**
    * Data which source work with
    */
   get data(): any {
      return this._getTableAdapter().getData();
   }

   protected constructor(options?: IOptions) {
      super(options);

      this._reIndex();
   }

   // region ICrud

   readonly '[Types/_source/ICrud]': boolean = true;

   create(meta?: Object): ExtendPromise<Record> {
      meta = object.clonePlain(meta, true);
      return this._loadAdditionalDependencies().addCallback(() => {
         return this._prepareCreateResult(meta);
      });
   }

   read(key: any, meta?: Object): ExtendPromise<Record> {
      const data = this._getRecordByKey(key);
      if (data) {
         return this._loadAdditionalDependencies().addCallback(() => this._prepareReadResult(data));
      } else {
         return Deferred.fail(`Record with key "${key}" does not exist`);
      }
   }

   update(data: Record | RecordSet<Record>, meta?: Object): ExtendPromise<null> {
      const updateRecord = (record) => {
         const idProperty = this.getIdProperty();
         let key = idProperty ? record.get(idProperty) : undefined;
         if (key === undefined) {
            key = randomId('k');
            record.set(idProperty, key);
         }

         const adapter = this._getTableAdapter();
         const index = this._getIndexByKey(key);

         if (index === -1) {
            adapter.add(record.getRawData());
            if (this._index) {
               this._index[key] = adapter.getCount() - 1;
            }
         } else {
            adapter.replace(record.getRawData(), index);
         }

         return key;
      };

      let keys = [];

      if (DataMixin.isListInstance(data)) {
         (data as RecordSet<Record>).each((record) => {
            keys.push(updateRecord(record));
         });
      } else {
         keys = updateRecord(data);
      }

      return this._loadAdditionalDependencies().addCallback(
         () => this._prepareUpdateResult(data, keys)
      );
   }

   destroy(keys: any | any[], meta?: Object): ExtendPromise<null> {
      const destroyByKey = (key) => {
         const index = this._getIndexByKey(key);
         if (index !== -1) {
            this._getTableAdapter().remove(index);
            this._reIndex();
            return true;
         } else {
            return false;
         }
      };

      if (!(keys instanceof Array)) {
         keys = [keys];
      }

      for (let i = 0, len = keys.length; i < len; i++) {
         if (!destroyByKey(keys[i])) {
            return Deferred.fail(`Record with key "${keys[i]}" does not exist`);
         }
      }

      return Deferred.success(true);
   }

   query(query: Query): ExtendPromise<DataSet> {
      let items = this._applyFrom(query ? query.getFrom() : undefined);
      const adapter = this.getAdapter();
      let total;

      if (query) {
         items = this._applyJoin(items, query.getJoin());
         items = this._applyWhere(items, query.getWhere(), query.getMeta());
         items = this._applyOrderBy(items, query.getOrderBy());
         total = adapter.forTable(items).getCount();
         items = this._applyPaging(items, query.getOffset(), query.getLimit());
      } else if (this._$filter) {
         items = this._applyWhere(items);
      } else {
         total = adapter.forTable(items).getCount();
      }

      return this._loadAdditionalDependencies().addCallback(() => this._prepareQueryResult({
         items,
         meta: {
            total
         }
      }, query));
   }

   // endregion

   // region ICrudPlus

   readonly '[Types/_source/ICrudPlus]': boolean = true;

   merge(from: string | number, to: string | number): ExtendPromise<any> {
      const indexOne = this._getIndexByKey(from);
      const indexTwo = this._getIndexByKey(to);
      if (indexOne === -1 || indexTwo === -1) {
         return Deferred.fail(`Record with key "${from}" or "${to}" does not exist`);
      } else {
         this._getTableAdapter().merge(
            indexOne,
            indexTwo,
            this.getIdProperty()
         );
         this._reIndex();
         return Deferred.success(true);
      }
   }

   copy(key: string | number, meta?: Object): ExtendPromise<Record> {
      const index = this._getIndexByKey(key);
      if (index === -1) {
         return Deferred.fail(`Record with key "${key}" does not exist`);
      } else {
         const copy = this._getTableAdapter().copy(index);
         this._reIndex();
         return this._loadAdditionalDependencies().addCallback(
            () => this._prepareReadResult(copy)
         );
      }
   }

   move(items: Array<string | number>, target: string | number, meta?: any): ExtendPromise<any> {
      meta = meta || {};
      const sourceItems = [];
      if (!(items instanceof Array)) {
         items = [items];
      }
      const tableAdapter = this._getTableAdapter();
      const adapter = this.getAdapter();

      items.sort( (a, b) => {
         const indexa = this._getIndexByKey(a);
         const indexb = this._getIndexByKey(b);
         return  meta.position === MOVE_POSITION.after ? indexb - indexa : indexa - indexb;
      }).forEach((id) => {
         const index = this._getIndexByKey(id);
         sourceItems.push(adapter.forRecord(tableAdapter.at(index)));
      });

      let targetPosition = -1;
      let targetItem = null;
      if (target !== null) {
         targetPosition = this._getIndexByKey(target);
         targetItem = adapter.forRecord(tableAdapter.at(targetPosition));
         if (targetPosition === -1) {
            return Deferred.fail('Can\'t find target position');
         }
      }

      if (meta.position === MOVE_POSITION.on) {
         return this._hierarchyMove(sourceItems, targetItem, meta);
      }

      return this._reorderMove(sourceItems, targetItem, meta);
   }

   // endregion

   // region DataMixin

   protected _wrapToDataSet(data: any): DataSet {
      return super._wrapToDataSet(
         object.clonePlain(data, true)
      );
   }

   // endregion

   // region DataCrudMixin

   protected _prepareCreateResult(data: any): Model {
      return DataCrudMixin._prepareCreateResult.call(
         this,
         object.clonePlain(data, true)
      );
   }

   protected _prepareReadResult(data: any): Model {
      return DataCrudMixin._prepareReadResult.call(
         this,
         object.clonePlain(data, true)
      );
   }

   // endregion

   // region Protected methods

   /**
    * Возвращает адаптер для работы с таблицей
    * @return {Types/_entity/adapter/ITable}
    * @protected
    */
   protected abstract _getTableAdapter(): adapter.ITable;

   /**
    * Возвращает данные модели с указанным ключом
    * @param {String} key Значение ключа
    * @return {Array|undefined}
    * @protected
    */
   protected _getRecordByKey(key: string): adapter.IRecord {
      return this._getTableAdapter().at(
         this._getIndexByKey(key)
      );
   }

   /**
    * Возвращает индекс модели с указанным ключом
    * @param {String} key Значение ключа
    * @return {Number} -1 - не найден, >=0 - индекс
    * @protected
    */
   protected _getIndexByKey(key: string | number): number {
      const index = this._index[key];
      return index === undefined ? -1 : index;
   }

   /**
    * Перестраивает индекс
    * @protected
    */
   protected _reIndex(): void {
      this._index = {};
      const adapter = this.getAdapter();
      this._each(this.data, (item, index) => {
         const key = adapter.forRecord(item).get(this._$idProperty);
         this._index[key] = index;
      });
   }

   /**
    * Применяет источник выборки
    * @param {String} [from] Источник выборки
    * @return {*}
    * @protected
    */
   protected abstract _applyFrom(from?: string): any;

   /**
    * Применяет объединение
    * @param {*} data Данные
    * @param {Types/_source/Query#Join[]} join Выборки для объединения
    * @return {*}
    * @protected
    */
   protected abstract _applyJoin(data: any, join: Join[]): any;

   /**
    * Applies filter
    * @param data Data to handle
    * @param where Query filter
    * @param meta Query metadata
    * @return {*}
    * @protected
    */
   protected _applyWhere(data: any, where?: Object | Function, meta?: IMeta): any {
      //TODO: support for IMeta.expand values
      where = where || {};
      if (!this._$filter && typeof where === 'object' && !Object.keys(where).length) {
         return data;
      }

      const checkFields = (fields, item) => {
         let result = true;
         for (const name in fields) {
            if (!fields.hasOwnProperty(name)) {
               continue;
            }
            result = compareValues(
               item.get(name),
               fields[name],
               '='
            );
            if (!result) {
               break;
            }
         }
         return result;
      };

      const adapter = this.getAdapter();
      const tableAdapter = adapter.forTable();
      const isPredicate = typeof where === 'function';

      this._each(data, (item, index) => {
         item = adapter.forRecord(item);

         let isMatch = true;
         if (this._$filter) {
            isMatch = this._$filter(item, where);
         } else {
            isMatch = isPredicate ? (where as Function)(item, index) : checkFields(where, item);
         }

         if (isMatch) {
            tableAdapter.add(item.getData());
         }
      });

      return tableAdapter.getData();
   }

   /**
    * Применяет сортировку
    * @param {*} data Данные
    * @param {Array.<Types/_source/Query#Order>} order Параметры сортировки
    * @return {*}
    * @protected
    */
   protected _applyOrderBy(data: any, order: Order[]): any {
      order = order || [];
      if (!order.length) {
         return data;
      }

      //Создаем карту сортировки
      const orderMap = [];
      for (let i = 0; i < order.length; i++) {
         orderMap.push({
            field: order[i].getSelector(),
            order: order[i].getOrder()
         });
      }

      //Создаем служебный массив, который будем сортировать
      const adapter = this.getAdapter();
      const dataMap = [];
      this._each(data, (item, index) => {
         let value;
         const values = [];
         for (let i = 0; i < orderMap.length; i++) {
            value = adapter.forRecord(item).get(orderMap[i].field);

            // undefined значения не передаются в compareFunction Array.prototype.sort, и в результате сортируются
            // непредсказуемо. Поэтому заменим их на null.
            values.push(value === undefined ? null : value);
         }
         dataMap.push({
            index,
            values
         });
      });

      const compare = (a, b) => {
         if (a === null && b !== null) {
            //Считаем null меньше любого не-null
            return -1;
         }
         if (a !== null && b === null) {
            //Считаем любое не-null больше null
            return 1;
         }
         // tslint:disable-next-line:triple-equals
         if (a == b) {
            return 0;
         }
         return a > b ? 1 : -1;
      };

      // Сортируем служебный массив
      dataMap.sort((a, b) => {
         let result = 0;
         for (let index = 0; index < orderMap.length; index++) {
            result = (orderMap[index].order ? -1 : 1) * compare(
               a.values[index],
               b.values[index]
            );
            if (result !== 0) {
               break;
            }
         }
         return result;
      });

      // Создаем новую таблицу по служебному массиву
      const sourceAdapter = adapter.forTable(data);
      const resultAdapter = adapter.forTable();
      for (let i = 0, count = dataMap.length; i < count; i++) {
         resultAdapter.add(sourceAdapter.at(dataMap[i].index));
      }

      return resultAdapter.getData();
   }

   /**
    * Применяет срез
    * @param {*} data Данные
    * @param {Number} [offset=0] Смещение начала выборки
    * @param {Number} [limit] Количество записей выборки
    * @return {*}
    * @protected
    */
   protected _applyPaging(data: any, offset?: number, limit?: number): any {
      offset = offset || 0;
      if (offset === 0 && limit === undefined) {
         return data;
      }

      const dataAdapter = this.getAdapter().forTable(data);
      if (limit === undefined) {
         limit = dataAdapter.getCount();
      } else {
         limit = limit || 0;
      }

      const newDataAdapter = this.getAdapter().forTable();
      let newIndex = 0;
      const beginIndex = offset;
      const endIndex = Math.min(
         dataAdapter.getCount(),
         beginIndex + limit
      );
      for (let index = beginIndex; index < endIndex; index++, newIndex++) {
         newDataAdapter.add(dataAdapter.at(index));
      }

      return newDataAdapter.getData();
   }

   protected _reorderMove(items: adapter.IRecord[], target: adapter.IRecord, meta: any): ExtendPromise<null> {
      let parentValue;
      if (meta.parentProperty) {
         parentValue = target.get(meta.parentProperty);
      }
      if (!meta.position && meta.hasOwnProperty('before')) {
         meta.position = meta.before ? MOVE_POSITION.before : MOVE_POSITION.after;
      }

      const tableAdapter = this._getTableAdapter();
      const targetsId = target.get(this._$idProperty);
      items.forEach((item) => {
         if (meta.parentProperty) {
            item.set(meta.parentProperty, parentValue);
         }
         const index = this._getIndexByKey(item.get(this._$idProperty));
         let targetIndex = this._getIndexByKey(targetsId);
         if (meta.position === MOVE_POSITION.before && targetIndex > index) {
            targetIndex--;
         } else if (meta.position === MOVE_POSITION.after && targetIndex < index) {
            targetIndex++;
         }
         tableAdapter.move(index, targetIndex);
         this._reIndex();
      });

      return new Deferred().callback();
   }

   protected _hierarchyMove(items: adapter.IRecord[], target: adapter.IRecord, meta: any): ExtendPromise<null> {
      if (!meta.parentProperty) {
         return Deferred.fail('Parent property is not defined');
      }
      const parentValue = target ? target.get(this._$idProperty) : null;
      items.forEach((item) => {
         item.set(meta.parentProperty, parentValue);
      });

      return new Deferred().callback();
   }

   // endregion
}

Object.assign(Local.prototype, {
   '[Types/_source/Local]': true,
   _moduleName: 'Types/source:Local',
   _$filter: null,
   _index: null
});
