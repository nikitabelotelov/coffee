/// <amd-module name="Types/_display/CollectionEnumerator" />
/**
 * Энумератор для проекции коллекции
 * @class Types/Display/CollectionEnumerator
 * @mixes Types/Entity/DestroyableMixin
 * @mixes Types/Entity/OptionsMixin
 * @implements Types/Collection/IEnumerator
 * @mixes Types/Collection/IndexedEnumeratorMixin
 * @public
 * @author Мальцев А.А.
 */

import CollectionItem from './CollectionItem';
import {DestroyableMixin, OptionsToPropertyMixin} from '../entity';
import {IEnumerator, IndexedEnumeratorMixin} from '../collection';
import {mixin} from '../util';

interface IOptions {
}

export default class CollectionEnumerator extends mixin(
   DestroyableMixin, OptionsToPropertyMixin, IndexedEnumeratorMixin
) implements IEnumerator<CollectionItem> /** @lends Types/Display/CollectionEnumerator.prototype */{
   /**
    * @cfg {Array.<Types/Display/CollectionItem>|Function} Элементы проекции
    * @name Types/Display/CollectionEnumerator#items
    */
   protected _$items: CollectionItem[] | Function = [];

   /**
    * @cfg {Array.<Boolean>} Результат применения фильтра
    * @name Types/Display/CollectionEnumerator#filterMap
    */
   protected _$filterMap: boolean[] = [];

   /**
    * @cfg {Array.<Number>} Результат применения сортировки
    * @name Types/Display/CollectionEnumerator#sortMap
    */
   protected _$sortMap: number[] = [];

   /**
    * Кэш элементов проекции
    */
   protected _itemsCache: CollectionItem[];

   /**
    * Текущая позиция
    */
   protected _position: number;

   /**
    * Текущий элемент
    */
   protected _current: CollectionItem;

   /**
    * Порядковый индекс -> индекс элемента проекции
    */
   protected _internalToSource: number[];

   /**
    * Индекс элемента проекции -> Порядковый индекс
    */
   protected _sourceToInternal: number[] = [];

   get items(): CollectionItem[] {
      if (!this._itemsCache) {
         this._itemsCache = this._$items instanceof Function ? this._$items() : this._$items;
      }
      return this._itemsCache;
   }

   constructor(options: IOptions) {
      super();
      OptionsToPropertyMixin.call(this, options);
      IndexedEnumeratorMixin.constructor.call(this);

      if (!(this._$items instanceof Array) && !(this._$items instanceof Function)) {
         throw new TypeError(this._moduleName + '::constructor(): items should be instance of an Array or Function');
      }
      if (!(this._$filterMap instanceof Array)) {
         throw new TypeError(this._moduleName + '::constructor(): filter map should be instance of an Array');
      }
      if (!(this._$sortMap instanceof Array)) {
         throw new TypeError(this._moduleName + '::constructor(): sort map should be instance of an Array');
      }
   }

   //region IEnumerator

   readonly '[Types/_collection/IEnumerator]': boolean = true;

   getCurrent(): CollectionItem {
      return this._current;
   }

   getCurrentIndex(): number {
      return this._position;
   }

   reset() {
      this._itemsCache = null;
      this._position = -1;
      this._setCurrentByPosition();
   }

   //endregion

   //region IndexedEnumeratorMixin

   reIndex(action?: string, start?: number, count?: number) {
      IndexedEnumeratorMixin.reIndex.call(this, action, start, count);
      this._itemsCache = null;
      this._internalToSource = null;
      this._sourceToInternal = [];
      this._position = -1;
      if (this._current) {
         this._setPositionByCurrent();
      }
   }

   _createIndex(property: string) {
      let savedPosition = this._position;
      let savedCurrent = this._current;
      IndexedEnumeratorMixin._createIndex.call(this, property);
      this._position = savedPosition;
      this._current = savedCurrent;
   }

   //endregion

   //region Public methods

   /**
    * Возвращает элемент по индексу
    * @param {Number} index Индекс
    * @return {Types/Display/CollectionItem}
    * @state mutable
    */
   at(index: number): CollectionItem {
      return index === undefined
         ? undefined
         : this.items[this.getSourceByInternal(index)];
   }

   /**
    * Возвращает кол-во элементов
    * @return {Number}
    */
   getCount(): number {
      this._initInternalMap();
      return this._internalToSource.length;
   }

   /**
    * Устанавливает текущий элемент
    * @param {Types/Display/CollectionItem} item Текущий элемент
    */
   setCurrent(item: CollectionItem) {
      this._itemsCache = null;
      this._position = this.getInternalBySource(this.items.indexOf(item));
      this._setCurrentByPosition();
   }

   /**
    * Возвращает текущую позицию проекции
    * @return {Number}
    */
   getPosition(): number {
      return this._position;
   }

   /**
    * Устанавливает текущую позицию
    * @param {Number} position Позиция проекции
    * @return {Boolean}
    */
   setPosition(position: number) {
      this._itemsCache = null;
      this._checkPosition(position);
      this._position = position;
      this._setCurrentByPosition();
   }

   /**
    * Возвращает признак корректности позиции
    * @param {Number} position Позиция
    * @return {Boolean}
    */
   isValidPosition(position: number): boolean {
      return position >= -1 && position < this.getCount();
   }

   /**
    * Возвращает предыдущий элемент
    * @return {*}
    */
   movePrevious(): boolean {
      if (this._position < 1) {
         return false;
      }
      this._position--;
      this._setCurrentByPosition();
      return true;
   }

   moveNext(): boolean {
      if (this._position >= this.getCount() - 1) {
         return false;
      }
      this._position++;
      this._setCurrentByPosition();
      return true;
   }

   /**
    * Вычисляет позицию в проекции относительно позиции в коллекции
    * @param {Number} source Позиция в коллекции
    * @return {Number}
    */
   getInternalBySource(source: number): number {
      if (source === undefined || source === null || source === -1) {
         return source;
      }
      this._initInternalMap();

      if (this._sourceToInternal[source] === undefined) {
         this._sourceToInternal[source] = this._internalToSource.indexOf(source);
      }
      return this._sourceToInternal[source];
   }

   /**
    * Вычисляет позицию в исходной коллекции относительно позиции в проекции
    * @param {Number} internal Позиция в проекции
    * @return {Number}
    * @protected
    */
   getSourceByInternal(internal: number): number {
      if (internal === undefined || internal === null || internal === -1) {
         return internal;
      }
      this._initInternalMap();
      return this._internalToSource[internal];
   }

   //endregion

   //region Protected methods

   /**
    * Инициализирует массив соответствия позиций проекции и исходной коллекции
    * @protected
    */
   protected _initInternalMap() {
      if (this._internalToSource === null) {
         this._internalToSource = CollectionEnumerator.getAssociativeMap(this._$sortMap, this._$filterMap);
      }
   }

   /**
    * Проверяет корректность позиции
    * @param {Number} position Позиция
    * @protected
    */
   protected _checkPosition(position: number) {
      if (!this.isValidPosition(position)) {
         throw new Error(this._moduleName + ': position is out of bounds');
      }
   }

   /**
    * Устанавливает текущий элемент исходя из позиции
    * @protected
    */
   protected _setCurrentByPosition() {
      this._current = this._position > -1
         ? this.items[this.getSourceByInternal(this._position)]
         : undefined;
   }

   /**
    * Устанавливает позицию исходя из текущего элемента
    * @protected
    */
   protected _setPositionByCurrent() {
      this._position = -1;
      let index = this._current ? this.items.indexOf(this._current) : -1;
      if (
         index > -1 &&
         this._$filterMap[index]
      ) {
         this._position = this.getInternalBySource(index);
      } else {
         this._current = undefined;
      }
   }

   //endregion

   //region Statics

   /**
    * Возвращает массив соответствия порядкового индекса и индекса элемента проекции
    * @param {Array.<Number>} sortMap Индекс после сортировки -> индекс элемента проекции
    * @param {Array.<Boolean>} filterMap Индекс элемента проекции -> прошел фильтр
    * @return {Array.<Number>} Порядковый индекс -> индекс элемента проекции
    * @public
    * @static
    */
   static getAssociativeMap(sortMap: number[], filterMap: boolean[]): number[] {
      let result = [];
      let index;

      for (let i = 0; i < sortMap.length; i++) {
         index = sortMap[i];
         if (filterMap[index]) {
            result.push(index);
         }
      }

      return result;
   }

   //endregion
}

CollectionEnumerator.prototype['[Types/_display/CollectionEnumerator]'] = true;
// @ts-ignore
CollectionEnumerator.prototype._$items = null;
// @ts-ignore
CollectionEnumerator.prototype._$filterMap = null;
// @ts-ignore
CollectionEnumerator.prototype._$sortMap = null;
// @ts-ignore
CollectionEnumerator.prototype._itemsCache = null;
// @ts-ignore
CollectionEnumerator.prototype._position = -1;
// @ts-ignore
CollectionEnumerator.prototype._current = undefined;
// @ts-ignore
CollectionEnumerator.prototype._internalToSource = null;
// @ts-ignore
CollectionEnumerator.prototype._sourceToInternal = null;