/// <amd-module name="Types/_entity/relation/Hierarchy" />
/**
 * Класс, предоставляющий возможность построить иерархические отношения.
 *
 * Организуем работу с иерархическим каталогом товаров:
 * <pre>
 *    //Создадим экземпляр иерархических отношений и рекордсет
 *    var hierarchy = new Hierarchy({
 *          idProperty: 'id',
 *          parentProperty: 'parent',
 *          nodeProperty: 'parent@',
 *          declaredChildrenProperty: 'parent$'
 *       }),
 *       catalogue = new RecordSet({
 *          rawData: [
 *             {id: 1, parent: null, 'parent@': true, 'parent$': true, title: 'Computers'},
 *             {id: 2, parent: 1, 'parent@': true, 'parent$': false, title: 'Mac'},
 *             {id: 3, parent: 1, 'parent@': true, 'parent$': true, title: 'PC'},
 *             {id: 4, parent: null, 'parent@': true, 'parent$': true, title: 'Smartphones'},
 *             {id: 5, parent: 3, 'parent@': false, title: 'Home Station One'},
 *             {id: 6, parent: 3, 'parent@': false, title: 'Home Station Two'},
 *             {id: 7, parent: 4, 'parent@': false, title: 'Apple iPhone 7'},
 *             {id: 8, parent: 4, 'parent@': false, title: 'Samsung Galaxy Note 7'}
 *          ]
 *       });
 *
 *    //Проверим, является ли узлом запись 'Computers'
 *    hierarchy.isNode(catalogue.at(0));//true
 *
 *    //Проверим, является ли узлом запись 'Apple iPhone 7'
 *    hierarchy.isNode(catalogue.at(6));//false
 *
 *    //Получим все записи узла 'PC' (по значению ПК узла)
 *    hierarchy.getChildren(3, catalogue);//'Home Station One', 'Home Station Two'
 *
 *    //Получим все записи узла 'Smartphones' (по узлу)
 *    hierarchy.getChildren(catalogue.at(3), catalogue);//'Apple iPhone 7', 'Samsung Galaxy Note 7'
 *
 *    //Получим родительский узел для товара 'Home Station One' (по значению ПК товара)
 *    hierarchy.getParent(5, catalogue);//'PC'
 *
 *    //Получим родительский узел для узла 'Mac' (по узлу)
 *    hierarchy.getParent(catalogue.at(1), catalogue);//'Computers'
 *
 *    //Проверим, есть ли декларируемые потомки в узле 'Computers'
 *    hierarchy.hasDeclaredChildren(catalogue.at(0));//true
 *
 *    //Проверим, есть ли декларируемые потомки в узле 'Mac'
 *    hierarchy.hasDeclaredChildren(catalogue.at(1));//false
 * </pre>
 *
 * @class Types/Relation/Hierarchy
 * @mixes Types/Entity/DestroyableMixin
 * @mixes Types/Entity/OptionsMixin
 * @public
 * @author Мальцев А.А.
 */

import DestroyableMixin from '../DestroyableMixin';
import OptionsToPropertyMixin from '../OptionsToPropertyMixin';
import {mixin} from '../../util';

export default class Hierarchy extends mixin(DestroyableMixin, OptionsToPropertyMixin) /** @lends Types/Mediator/Hierarchy.prototype */{
   /**
    * @cfg {String} Название свойства, содержащего идентификатор узла.
    * @name Types/Relation/Hierarchy#idProperty
    * @see getIdProperty
    * @see setIdProperty
    */
   _$idProperty: string;

   /**
    * @cfg {String} Название свойства, содержащего идентификатор родительского узла.
    * @name Types/Relation/Hierarchy#parentProperty
    * @see getIdProperty
    * @see setIdProperty
    */
   _$parentProperty: string;

   /**
    * @cfg {String} Название свойства, содержащего признак узла.
    * @name Types/Relation/Hierarchy#nodeProperty
    * @see getIdProperty
    * @see setIdProperty
    */
   _$nodeProperty: string;

   /**
    * @cfg {String} Название свойства, содержащего декларируемый признак наличия детей.
    * @name Types/Relation/Hierarchy#declaredChildrenProperty
    * @see getIdProperty
    * @see setIdProperty
    */
   _$declaredChildrenProperty: string;

   constructor(options?: Object) {
      super(options);
      OptionsToPropertyMixin.call(this, options);
   }

   //region Public methods

   /**
    * Возвращает название свойства, содержащего идентификатор узла.
    * @return {String}
    * @see idProperty
    * @see setIdProperty
    */
   getIdProperty(): string {
      return this._$idProperty;
   }

   /**
    * Устанавливает название свойства, содержащего идентификатор узла.
    * @param {String} idProperty
    * @see idProperty
    * @see getIdProperty
    */
   setIdProperty(idProperty: string) {
      this._$idProperty = idProperty;
   }


   /**
    * Возвращает название свойства, содержащего идентификатор родительского узла.
    * @return {String}
    * @see parentProperty
    * @see setParentProperty
    */
   getParentProperty(): string {
      return this._$parentProperty;
   }

   /**
    * Устанавливает название свойства, содержащего идентификатор родительского узла.
    * @param {String} parentProperty
    * @see parentProperty
    * @see getParentProperty
    */
   setParentProperty(parentProperty: string) {
      this._$parentProperty = parentProperty;
   }

   /**
    * Возвращает название свойства, содержащего признак узла.
    * @return {String}
    * @see nodeProperty
    * @see setNodeProperty
    */
   getNodeProperty(): string {
      return this._$nodeProperty;
   }

   /**
    * Устанавливает название свойства, содержащего признак узла.
    * @param {String} nodeProperty
    * @see nodeProperty
    * @see getNodeProperty
    */
   setNodeProperty(nodeProperty: string) {
      this._$nodeProperty = nodeProperty;
   }

   /**
    * Возвращает название свойства, содержащего декларируемый признак наличия детей.
    * @return {String}
    * @see declaredChildrenProperty
    * @see setDeclaredChildrenProperty
    */
   getDeclaredChildrenProperty(): string {
      return this._$declaredChildrenProperty;
   }

   /**
    * Устанавливает название свойства, содержащего декларируемый признак наличия детей.
    * @param {String} declaredChildrenProperty
    * @see declaredChildrenProperty
    * @see getDeclaredChildrenProperty
    */
   setDeclaredChildrenProperty(declaredChildrenProperty: string) {
      this._$declaredChildrenProperty = declaredChildrenProperty;
   }

   /**
    * Проверяет, является ли запись узлом.
    * Возвращаемые значения:
    * <ul>
    *   <li><em>true</em>: запись является узлом</li>
    *   <li><em>false</em>: запись скрытым листом</li>
    *   <li><em>null</em>: запись является листом</li>
    * </ul>
    * @param {Types/Entity/Record} record
    * @return {Boolean|null}
    * @see nodeProperty
    */
   isNode(record): boolean {
      return record.get(this._$nodeProperty);
   }

   /**
    * Возвращает список детей для указанного родителя.
    * @param {Types/Entity/Record|Sting|Number} parent Родительский узел или его идентификатор
    * @param {Types/Collection/RecordSet} rs Рекордсет
    * @return {Array.<Types/Entity/Record>}
    * @see nodeProperty
    */
   getChildren(parent, rs) {
      if (!this._$parentProperty) {
         return parent === null || parent === undefined ? (() => {
            let result = [];
            rs.each((item) => {
               result.push(item);
            });
            return result;
         })() : [];
      }

      let parentId = this._asField(parent, this._$idProperty);
      let indices = rs.getIndicesByValue(this._$parentProperty, parentId);
      let children = [];

      //If nothing found by that property value, return all if null(root) requested
      if (indices.length === 0 && parentId === null) {
         indices = rs.getIndicesByValue(this._$parentProperty);
      }

      for (let i = 0; i < indices.length; i++) {
         children.push(rs.at(indices[i]));
      }

      return children;
   }

   /**
    *
    * Возвращает признак наличия декларируемых детей.
    * @param {Types/Entity/Record} record
    * @return {Boolean}
    * @see declaredChildrenProperty
    */
   hasDeclaredChildren(record) {
      return record.get(this._$declaredChildrenProperty);
   }

   /**
    * Возвращает признак наличия родителя для указанного дочернего узла.
    * @param {Types/Entity/Record|Sting|Number} child Дочерний узел или его идентификатор
    * @param {Types/Collection/RecordSet} rs Рекордсет
    * @return {Boolean}
    * @see nodeProperty
    */
   hasParent(child, rs) {
      child = this._asRecord(child, rs);
      let parentId = child.get(this._$parentProperty);
      let idProperty = this._$idProperty || rs.getIdProperty();
      let index = rs.getIndexByValue(idProperty, parentId);

      return index > -1;
   }

   /**
    * Возвращает родителя для указанного дочернего узла.
    * Если записи с указанным идентификатором нет - кидает исключение.
    * Если узел является корневым, возвращает null.
    * @param {Types/Entity/Record|Sting|Number} child Дочерний узел или его идентификатор
    * @param {Types/Collection/RecordSet} rs Рекордсет
    * @return {Types/Entity/Record|Null}
    * @see nodeProperty
    */
   getParent(child, rs) {
      child = this._asRecord(child, rs);
      let parentId = child.get(this._$parentProperty);

      return parentId === undefined || parentId === null ? null : this._asRecord(parentId, rs);
   }

   //endregion Public methods

   //region Protected methods

   /**
    * Возвращает инстанс записи
    * @param {Types/Entity/Record|Sting|Number} value Запись или ее ПК
    * @param {Types/Collection/RecordSet} rs Рекордсет
    * @return {Types/Entity/Record}
    * @protected
    */
   _asRecord(value, rs) {
      if (value && value['[Types/_entity/Record]']) {
         return value;
      }

      let idProperty = this._$idProperty || rs.getIdProperty();
      let index = rs.getIndexByValue(idProperty, value);

      if (index === -1) {
         throw new ReferenceError(`${this._moduleName}: record with id "${value}" does not found in the recordset`);
      }

      return rs.at(index);
   }

   /**
    * Возвращает значение поля записи
    * @param {Types/Entity/Record|Sting|Number} value Запись или значение ее поля
    * @param {String} field Имя поля
    * @return {*}
    * @protected
    */
   _asField(value, field) {
      if (!(value && value['[Types/_entity/Record]'])) {
         return value;
      }

      return value.get(field);
   }

   //endregion Protected methods
}

Hierarchy.prototype['[Types/_entity/relation/Hierarchy]'] = true;
Hierarchy.prototype._$idProperty = '';
Hierarchy.prototype._$parentProperty = '';
Hierarchy.prototype._$nodeProperty = '';
Hierarchy.prototype._$declaredChildrenProperty = '';