/* global define */
define('Core/ContextField/List', [
   'Core/ContextField/Base',
   'Types/collection',
   'Core/Context'
], function(
   ContextFieldBase,
   collection,
   CoreContext
) {
   'use strict';

   /**
    * Поддержка типа список в контексте
    * @class Core/ContextField/List
    * @extends Core/ContextField/Base
    * @author Мальцев А.А.
    */
   var ContextFieldRecordSet = ContextFieldBase.extend(/** @lends Core/ContextField/List.prototype*/{
      '[Core/ContextField/List]': true,

      name: 'ControlsFieldTypeList',

      /**
       * Возвращает значение поля контекста по пути.
       * @param {Type/collection#List} value Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @return {*}
       */
      get: function(value, keyPath) {
         //Встроенный record отдаёт значения только по одному уровню
         var key,
            idx,
            subValue,
            subType;

         if (keyPath.length === 0) {
            return value;
         }

         key = keyPath[0];
         idx = getRsIdx(key);
         if (idx < 0 || idx >= value.getCount()) {
            return CoreContext.NonExistentValue;
         }

         subValue = value.at(idx);
         subType = CoreContext.getValueType(subValue);
         return subType.get(subValue, keyPath.slice(1));
      },

      /**
       * Возвращает признак, что значение поля контекста изменилось
       * @param {Type/collection#List} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @param {*} value Значение, сравниваемое с текущим
       * @return {Boolean}
       */
      setWillChange: function(oldValue, keyPath, value) {
         var result,
            idx, subValue, key, subType;

         if (keyPath.length === 0) {
            //При сравнении рекордсетов по данным мы рискуем попасть в ситуацию, когда рекордсет изменяют, а в связанном листвью ничего не происходит
            return oldValue !== value;
         }

         key = keyPath[0];
         idx = getRsIdx(key);
         result = keyPath.length > 1 && idx >= 0 && idx < oldValue.getCount();

         if (result) {
            //TODO: а удаление/переустановка записи как (keyPath.length === 1) ???
            subValue = oldValue.at(idx);
            subType = CoreContext.getValueType(subValue);
            result = subType.setWillChange(subValue, keyPath.slice(1), value);
         }

         return result;
      },

      /**
       * Устанавливает значение поля контекста
       * @param {Type/collection#List} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @param {*} value Новое значение
       * @return {*}
       */
      set: function(oldValue, keyPath, value) {
         var changed,
            key,
            idx,
            subValue,
            subType;

         if (keyPath.length === 0) {
            return value;
         }

         key = keyPath[0];
         idx = getRsIdx(key);
         changed = idx >= 0 && idx < oldValue.getCount();
         if (changed) {
            if (keyPath.length > 1) {
               //TODO: а удаление/переустановка записи как (keyPath.length === 1) ???
               subValue = oldValue.at(idx);
               subType = CoreContext.getValueType(subValue);
               subType.set(subValue, keyPath.slice(1), value);
            }
         }

         return oldValue;
      },

      /**
       * Удаляет значение поля контекста
       * @param {Type/collection#List} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @return {Object}
       */
      remove: function(oldValue, keyPath) {
         var changed,
            key,
            idx,
            subValue,
            subType;

         changed = keyPath.length > 0;
         if (changed) {
            key = keyPath[0];
            idx = getRsIdx(key);
            changed = keyPath.length > 1 && idx >= 0 && idx < oldValue.getCount();

            //TODO: а удаление/переустановка записи как (keyPath.length === 1) ???
            if (changed) {
               subValue = oldValue.at(idx);
               subType = CoreContext.getValueType(subValue);
               changed = subType.remove(subValue, keyPath.slice(1)).changed;
            }
         }

         return {
            value: oldValue,
            changed: changed
         };
      },

      toJSON: function(value, deep) {
         if (!deep) {
            return value;
         }
         var result = [];
         value.each(function(item) {
            result.push(item);
         });
         return result;
      },

      /**
       * Подписывается на изменение поля контекста
       * @param {Type/collection#List} value Поле контекста
       * @param {Function} value Обработчик, вызываемый при изменении значения
       * @return {Function} Метод, выполняющий отписку
       */
      subscribe: function(value, fn) {
         value.subscribe('onCollectionChange', fn);
         value.subscribe('onCollectionItemChange', fn);

         return function() {
            value.unsubscribe('onCollectionChange', fn);
            value.unsubscribe('onCollectionItemChange', fn);
         };
      }
   });

   function getRsIdx(id) {
      return String.prototype.split.call(id, ',')[0];
   }

   CoreContext.registerFieldType(new ContextFieldRecordSet(collection.List));

   return ContextFieldRecordSet;
});
