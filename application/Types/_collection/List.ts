/// <amd-module name="Types/_collection/List" />
/**
 * Список - коллекция c доступом по индексу.
 * Основные возможности:
 * <ul>
 *    <li>последовательный перебор элементов коллекции - поддержка интерфейса {@link Types/_collection/IEnumerable};</li>
 *    <li>доступ к элементам коллекции по индексу - поддержка интерфейса {@link Types/_collection/IList};</li>
 *    <li>поиск элементов коллекции по значению свойства - поддержка интерфейса {@link Types/_collection/IIndexedCollection}.</li>
 * </ul>
 * Создадим рекордсет, в котором в качестве сырых данных используется plain JSON (адаптер для данных в таком формате используется по умолчанию):
 * <pre>
 *    var characters = new List({
 *       items: [{
 *          id: 1,
 *          firstName: 'Tom',
 *          lastName: 'Sawyer'
 *       }, {
 *          id: 2,
 *          firstName: 'Huckleberry',
 *          lastName: 'Finn'
 *       }]
 *    });
 *    characters.at(0).firstName;//'Tom'
 *    characters.at(1).firstName;//'Huckleberry'
 * </pre>
 * @class Types/_collection/List
 * @mixes Types/_entity/DestroyableMixin
 * @implements Types/_collection/IEnumerable
 * @implements Types/_collection/IList
 * @implements Types/_collection/IIndexedCollection
 * @implements Types/_entity/ICloneable
 * @implements Types/_entity/IEquatable
 * @mixes Types/_entity/OptionsMixin
 * @mixes Types/_entity/ObservableMixin
 * @mixes Types/_entity/SerializableMixin
 * @mixes Types/_entity/CloneableMixin
 * @mixes Types/_entity/ManyToManyMixin
 * @mixes Types/_entity/ReadWriteMixin
 * @mixes Types/_entity/VersionableMixin
 * @public
 * @author Мальцев А.А.
 */

import IEnumerable from './IEnumerable';
import IList from './IList';
import IObservable from './IObservable';
import IIndexedCollection from './IIndexedCollection';
import Arraywise from './enumerator/Arraywise';
import Indexer from './Indexer';
import {
   ICloneable,
   IEquatable,
   IVersionable,
   DestroyableMixin,
   OptionsToPropertyMixin,
   ObservableMixin,
   SerializableMixin,
   CloneableMixin,
   ManyToManyMixin,
   ReadWriteMixin,
   VersionableMixin
} from '../entity';
import {register} from '../di';
import {logger, mixin, object} from '../util';

export default class List<T> extends mixin(
   DestroyableMixin,
   OptionsToPropertyMixin,
   ObservableMixin,
   SerializableMixin,
   CloneableMixin,
   ManyToManyMixin,
   ReadWriteMixin,
   VersionableMixin
) implements
   IEnumerable<T>,
   IList<T>,
   IIndexedCollection,
   ICloneable,
   IEquatable,
   IVersionable {

   /**
    * @cfg {Array.<*>} Элементы списка
    * @name Types/_collection/List#items
    */
   _$items: T[];

   /**
    * @property {Types/_collection/Indexer} Индексатор
    */
   _indexer: Indexer;

   // region IEnumerable

   readonly '[Types/_collection/IEnumerable]': boolean;

   // endregion IEnumerable

   // region IList

   readonly '[Types/_collection/IList]': boolean;

   // endregion IList

   // region IIndexedCollection

   readonly '[Types/_collection/IIndexedCollection]': boolean;

   // endregion IEquatable

   // region ICloneable

   readonly '[Types/_entity/ICloneable]': boolean;

   clone: <List>(shallow?: boolean) => List;

   // endregion ICloneable

   // region IEquatable

   readonly '[Types/_entity/IEquatable]': boolean;

   // endregion IEquatable

   // region IVersionable

   readonly '[Types/_entity/IVersionable]': boolean;

   getVersion: () => number;

   constructor(options?) {
      if (options && 'items' in options && !(options.items instanceof Array)) {
         throw new TypeError('Option "items" should be an instance of Array');
      }

      super(options);
      OptionsToPropertyMixin.call(this, options);
      SerializableMixin.constructor.call(this);
      ReadWriteMixin.constructor.call(this, options);

      this._$items = this._$items || [];
      for (let i = 0, count = this._$items.length; i < count; i++) {
         this._addChild(this._$items[i]);
      }
   }

   // endregion Protected methods

   /**
    * @deprecated
    */
   static extend(mixinsList: any, classExtender: any) {
      logger.info('Types/_collection/List', 'Method extend is deprecated, use ES6 extends or Core/core-extend');

      if (!require.defined('Core/core-extend')) {
         throw new ReferenceError('You should require module "Core/core-extend" to use old-fashioned "Types/_collection/List::extend()" method.');
      }
      const coreExtend = require('Core/core-extend');
      return coreExtend(this, mixinsList, classExtender);
   }

   destroy() {
      this._$items = null;
      this._indexer = null;

      ReadWriteMixin.destroy.call(this);
      super.destroy();
   }

   /**
    * Возвращает энумератор для перебора элементов списка.
    * Пример использования можно посмотреть в модуле {@link Types/_collection/IEnumerable}.
    * @return {Types/_collection/ArrayEnumerator}
    */
   getEnumerator(): Arraywise<T> {
      return new Arraywise(this._$items);
   }

   each(callback, context) {
      // It's faster than use getEnumerator()
      for (let i = 0, count = this.getCount(); i < count; i++) {
         callback.call(
            context || this,
            this.at(i),
            i,
            this
         );
      }
   }

   assign(items) {
      for (let i = 0, count = this._$items.length; i < count; i++) {
         this._removeChild(this._$items[i]);
      }
      this._$items.length = 0;

      items = this._splice(items || [], 0, IObservable.ACTION_RESET);

      for (let i = 0, count = items.length; i < count; i++) {
         this._addChild(items[i]);
      }
      this._childChanged(items);
   }

   append(items) {
      items = this._splice(items, this.getCount(), IObservable.ACTION_ADD);

      for (let i = 0, count = items.length; i < count; i++) {
         this._addChild(items[i]);
      }
      this._childChanged(items);
   }

   prepend(items) {
      items = this._splice(items, 0, IObservable.ACTION_ADD);

      for (let i = 0, count = items.length; i < count; i++) {
         this._addChild(items[i]);
      }
      this._childChanged(items);
   }

   clear() {
      this._$items.length = 0;
      this._reindex();
      this._getMediator().clear(this);
      this._childChanged();
      this._nextVersion();
   }

   add(item, at) {
      if (at === undefined) {
         at = this._$items.length;
         this._$items.push(item);
      } else {
         at = at || 0;
         if (at !== 0 && !this._isValidIndex(at, true)) {
            throw new Error('Index is out of bounds');
         }
         this._$items.splice(at, 0, item);
      }

      this._addChild(item);
      this._childChanged(item);
      this._nextVersion();
      this._reindex(IObservable.ACTION_ADD, at, 1);
   }

   at(index: number): any {
      return this._$items[index];
   }

   remove(item) {
      const index = this.getIndex(item);
      if (index !== -1) {
         this.removeAt(index);
         this._childChanged(item);
         return true;
      }
      return false;
   }

   removeAt(index) {
      if (!this._isValidIndex(index)) {
         throw new Error('Index is out of bounds');
      }
      this._removeChild(this._$items[index]);
      const deleted = this._$items.splice(index, 1);
      this._reindex(IObservable.ACTION_REMOVE, index, 1);
      this._childChanged(index);
      this._nextVersion();
      return deleted[0];
   }

   replace(item, at) {
      if (!this._isValidIndex(at)) {
         throw new Error('Index is out of bounds');
      }

      const oldItem = this._$items[at];

      // Replace with itself has no effect
      if (oldItem === item) {
         return;
      }

      this._removeChild(oldItem);
      this._$items[at] = item;
      this._addChild(item);
      this._reindex(IObservable.ACTION_REPLACE, at, 1);
      this._childChanged(item);
      this._nextVersion();
   }

   move(from, to) {
      if (!this._isValidIndex(from)) {
         throw new Error('Argument "from" is out of bounds');
      }
      if (!this._isValidIndex(to)) {
         throw new Error('Argument "to" is out of bounds');
      }
      if (from === to) {
         return;
      }

      const items = this._$items.splice(from, 1);
      this._$items.splice(to, 0, items[0]);

      if (from < to) {
         this._reindex(IObservable.ACTION_REPLACE, from, 1 + to - from);
      } else {
         this._reindex(IObservable.ACTION_REPLACE, to, 1 + from - to);
      }
      this._childChanged(items[0]);
      this._nextVersion();
   }

   getIndex(item) {
      return this._$items.indexOf(item);
   }

   getCount() {
      return this._$items.length;
   }

   getIndexByValue(property, value) {
      return this._getIndexer().getIndexByValue(property, value);
   }

   getIndicesByValue(property, value) {
      return this._getIndexer().getIndicesByValue(property, value);
   }

   // endregion IIndexedCollection

   // region IEquatable

   isEqual(to) {
      if (to === this) {
         return true;
      }
      if (!to || !(to instanceof List)) {
         return false;
      }

      if (this.getCount() !== to.getCount()) {
         return false;
      }
      for (let i = 0, count = this.getCount(); i < count; i++) {
         if (this.at(i) !== to.at(i)) {
            return false;
         }
      }
      return true;
   }

   // endregion IVersionable

   // SerializableMixin

   _getSerializableState(state) {
      return SerializableMixin.prototype._getSerializableState.call(this, state);
   }

   _setSerializableState(state) {
      const fromSerializableMixin = SerializableMixin.prototype._setSerializableState(state);
      return function() {
         fromSerializableMixin.call(this);
         this._clearIndexer();
      };
   }

   // SerializableMixin

   // region Protected methods

   /**
    * Возвращает индексатор коллекции
    * @return {Types/_collection/Indexer}
    * @protected
    */
   protected _getIndexer() {
      return this._indexer || (this._indexer = new Indexer(
         this._$items,
         (items) => items.length,
         (items, at) => items[at],
         (item, property) => object.getPropertyValue(item, property)
      ));
   }

   /**
    * Очищает индексатор коллекции
    * @protected
    */
   protected _clearIndexer() {
      this._indexer = null;
   }

   /**
    * Проверяет корректность индекса
    * @param {Number} index Индекс
    * @param {Boolean} [addMode=false] Режим добавления
    * @return {Boolean}
    * @protected
    */
   protected _isValidIndex(index: number, addMode?: boolean) {
      let max = this.getCount();
      if (addMode) {
         max++;
      }
      return index >= 0 && index < max;
   }

   /**
    * Переиндексирует список
    * @param {Types/_collection/IBind/ChangeAction.typedef[]} action Действие, приведшее к изменению.
    * @param {Number} [start=0] С какой позиции переиндексировать
    * @param {Number} [count=0] Число переиндексируемых элементов
    * @protected
    */
   protected _reindex(action?, start?, count?) {
      if (!this._indexer) {
         return;
      }

      const indexer = this._getIndexer();
      switch (action) {
         case IObservable.ACTION_ADD:
            indexer.shiftIndex(start, this.getCount() - start, count);
            indexer.updateIndex(start, count);
            break;
         case IObservable.ACTION_REMOVE:
            indexer.removeFromIndex(start, count);
            indexer.shiftIndex(start + count, this.getCount() - start, -count);
            break;
         case IObservable.ACTION_REPLACE:
            indexer.removeFromIndex(start, count);
            indexer.updateIndex(start, count);
            break;
         case IObservable.ACTION_RESET:
            indexer.resetIndex();
            break;
         default:
            if (count > 0) {
               indexer.removeFromIndex(start, count);
               indexer.updateIndex(start, count);
            } else {
               indexer.resetIndex();
            }
      }
   }

   /**
    * Вызывает метод splice
    * @param {Types/_collection/IEnumerable|Array} items Коллекция с элементами для замены
    * @param {Number} start Индекс в массиве, с которого начинать добавление.
    * @param {Types/_collection/IBind/ChangeAction.typedef[]} action Действие, приведшее к изменению.
    * @return {Array}
    * @protected
    */
   protected _splice(items, start, action) {
      items = this._itemsToArray(items);
      this._$items.splice(start, 0, ...items);
      this._reindex(action, start, items.length);
      this._nextVersion();
      return items;
   }

   /**
    * Приводит переденные элементы к массиву
    * @param items
    * @return {Array}
    * @protected
    */
   protected _itemsToArray(items): any[] {
      if (items instanceof Array) {
         return items;
      } else if (items && items['[Types/_collection/IEnumerable]']) {
         const result = [];
         items.each((item) => {
            result.push(item);
         });
         return result;
      } else {
         throw new TypeError('Argument "items" must be an instance of Array or implement Types/collection:IEnumerable.');
      }
   }
}

Object.assign(List.prototype, {
   '[Types/_collection/List]': true,
   '[Types/_collection/IEnumerable]': true,
   '[Types/_collection/IIndexedCollection]': true,
   '[Types/_collection/IList]': true,
   '[Types/_entity/ICloneable]': true,
   '[Types/_entity/IEquatable]': true,
   '[Types/_entity/IVersionable]': true,
   _moduleName: 'Types/collection:List',
   _$items: null,
   _indexer: null
});

// Aliases
List.prototype.forEach = List.prototype.each;

// FIXME: backward compatibility for check via Core/core-instance::instanceOfModule()
List.prototype['[WS.Data/Collection/List]'] = true;
// FIXME: backward compatibility for check via Core/core-instance::instanceOfMixin()
List.prototype['[WS.Data/Collection/IEnumerable]'] = true;
List.prototype['[WS.Data/Collection/IList]'] = true;
List.prototype['[WS.Data/Collection/IIndexedCollection]'] = true;
List.prototype['[WS.Data/Entity/ICloneable]'] = true;

register('Types/collection:List', List, {instantiate: false});
