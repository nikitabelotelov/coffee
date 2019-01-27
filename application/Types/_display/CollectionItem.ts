/// <amd-module name="Types/_display/CollectionItem" />
/**
 * Элемент коллекции
 * @class Types/_display/CollectionItem
 * @mixes Types/_entity/DestroyableMixin
 * @mixes Types/_entity/OptionsMixin
 * @implements Types/_entity/IInstantiable
 * @mixes Types/_entity/InstantiableMixin
 * @mixes Types/_entity/SerializableMixin
 * @public
 * @author Мальцев А.А.
 */

import Abstract from './Abstract';
import {DestroyableMixin, OptionsToPropertyMixin, InstantiableMixin, SerializableMixin, IInstantiable} from '../entity';
import {IEnumerable} from '../collection';
import {register} from '../di';
import {mixin} from '../util';
import Collection from './Collection';

export interface IOptions {
   contents?: any;
   owner: Collection;
}

export default class CollectionItem extends mixin(
   DestroyableMixin, OptionsToPropertyMixin, InstantiableMixin, SerializableMixin
) implements IInstantiable /** @lends Types/_display/CollectionItem.prototype */{
   /**
    * @cfg {Types/_collection/IEnumerable} Коллекция, которой принадлежит элемент
    * @name Types/_display/CollectionItem#owner
    */
   protected _$owner: Abstract;

   /**
    * @cfg {*} Содержимое элемента коллекции
    * @name Types/_display/CollectionItem#contents
    */
   protected _$contents: any;

   /**
    * @cfg {*} Элемент выбран
    * @name Types/_display/CollectionItem#selected
    */
   protected _$selected: boolean;

   protected _instancePrefix: string;

   /**
    * Индекс содержимого элемента в коллекции (используется для сериализации)
    */
   protected _contentsIndex: number;

   constructor(options: IOptions) {
      super();
      OptionsToPropertyMixin.call(this, options);
      SerializableMixin.constructor.call(this);
   }

   //region IInstantiable

   readonly '[Types/_entity/IInstantiable]': boolean;

   getInstanceId: () => string;

   //endregion

   //region SerializableMixin

   protected _getSerializableState(state) {
      state = SerializableMixin.prototype._getSerializableState.call(this, state);

      if (state.$options.owner) {
         //save element index if collections implements Types/_collection/IList
         let collection = state.$options.owner.getCollection();
         let index = collection['[Types/_collection/IList]'] ? collection.getIndex(state.$options.contents) : -1;
         if (index > -1) {
            state.ci = index;
            delete state.$options.contents;
         }
      }

      //By performance reason. It will be restored at Collection::_setSerializableState
      //delete state.$options.owner;

      state.iid = this.getInstanceId();

      return state;
   }

   protected _setSerializableState(state) {
      let fromSerializableMixin = SerializableMixin.prototype._setSerializableState(state);
      return function() {
         fromSerializableMixin.call(this);
         if (state.hasOwnProperty('ci')) {
            this._contentsIndex = state.ci;
         }
         this._instanceId = state.iid;
      };
   }

   //endregion

   //region Public

   /**
    * Возвращает коллекцию, которой принадлежит элемент
    * @return {Types/_collection/IEnumerable}
    */
   getOwner(): Abstract {
      return this._$owner;
   }

   /**
    * Устанавливает коллекцию, которой принадлежит элемент
    * @param {Types/_collection/IEnumerable} owner Коллекция, которой принадлежит элемент
    */
   setOwner(owner: Abstract) {
      this._$owner = owner;
   }

   /**
    * Возвращает содержимое элемента коллекции
    * @return {*}
    */
   getContents(): any {
      if (this._contentsIndex !== undefined) {
         //Ленивое восстановление _$contents по _contentsIndex после десериализации
         this._$contents = this.getOwner().getCollection().at(this._contentsIndex);
         this._contentsIndex = undefined;
      }
      return this._$contents;
   }

   /**
    * Устанавливает содержимое элемента коллекции
    * @param {*} contents Новое содержимое
    * @param {Boolean} [silent=false] Не уведомлять владельца об изменении содержимого
    */
   setContents(contents: any, silent?: boolean) {
      if (this._$contents === contents) {
         return;
      }
      this._$contents = contents;
      if (!silent) {
         this._notifyItemChangeToOwner('contents');
      }
   }

   /**
    * Возвращает псевдоуникальный идентификатор элемента коллекции, основанный на значении опции {@link contents}.
    * @return {String|undefined}
    */
   getUid(): string {
      if (!this._$owner) {
         return;
      }
      return this._$owner.getItemUid(this);
   }

   /**
    * Возвращает признак, что элемент выбран
    * @return {*}
    */
   isSelected(): boolean {
      return this._$selected;
   }

   /**
    * Устанавливает признак, что элемент выбран
    * @param {Boolean} selected Элемент выбран
    * @param {Boolean} [silent=false] Не уведомлять владельца об изменении признака выбранности
    */
   setSelected(selected: boolean, silent?: boolean) {
      if (this._$selected === selected) {
         return;
      }
      this._$selected = selected;
      if (!silent) {
         this._notifyItemChangeToOwner('selected');
      }
   }

   //endregion

   //region Protected

   /**
    * Возвращает коллекцию проекции
    * @return {Types/_collection/IEnumerable}
    * @protected
    */
   protected _getSourceCollection(): IEnumerable<any> {
      return this.getOwner().getCollection();
   }

   /**
    * Генерирует событие у владельца об изменении свойства элемента
    * @param {String} property Измененное свойство
    * @protected
    */
   protected _notifyItemChangeToOwner(property: string) {
      if (this._$owner) {
         this._$owner.notifyItemChange(
            this,
            property
         );
      }
   }

   //endregion
}

CollectionItem.prototype._moduleName = 'Types/display:CollectionItem';
CollectionItem.prototype['[Types/_display/CollectionItem]'] = true;
// @ts-ignore
CollectionItem.prototype._$owner = null;
// @ts-ignore
CollectionItem.prototype._$contents = null;
// @ts-ignore
CollectionItem.prototype._$selected = false;
// @ts-ignore
CollectionItem.prototype._instancePrefix = 'collection-item-';
// @ts-ignore
CollectionItem.prototype._contentsIndex = undefined;

// Deprecated
CollectionItem.prototype['[WS.Data/Display/CollectionItem]'] = true;

register('Types/display:CollectionItem', CollectionItem);
