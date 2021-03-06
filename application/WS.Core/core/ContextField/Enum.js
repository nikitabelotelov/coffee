/* global define */
define('Core/ContextField/Enum', [
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
    * Поддержка типа перечисляемое в контексте
    * @class Core/ContextField/Enum
    * @extends Core/ContextField/Base
    * @author Мальцев А.А.
    */
   var ContextFieldEnum = ContextFieldBase.extend(/** @lends Core/ContextField/Enum.prototype*/{
      '[Core/ContextField/Enum]': true,

      name: 'ControlsFieldTypeEnum',

      /**
       * Возвращает значение поля контекста по пути.
       * @param {Type/collection#Enum} value Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @return {*}
       */
      get: function(value, keyPath) {
         if (keyPath.length === 0) {
            return value;
         }

         return CoreContext.NonExistentValue;
      },

      /**
       * Возвращает признак, что значение поля контекста изменилось
       * @param {Type/collection#Enum} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @param {*} value Значение, сравниваемое с текущим
       * @return {Boolean}
       */
      setWillChange: function(oldValue, keyPath, value) {
         if (keyPath.length === 0) {
            return oldValue !== value;
         }

         return false;
      },

      /**
       * Устанавливает значение поля контекста
       * @param {Type/collection#Enum} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @param {*} value Новое значение
       * @return {*}
       */
      set: function(oldValue, keyPath, value) {
         if (keyPath.length === 0) {
            return value;
         }

         return oldValue;
      },

      /**
       * Удаляет значение поля контекста
       * @param {Type/collection#Enum} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @return {Object}
       */
      remove: function(value) {
         return {
            value: value,
            changed: false
         };
      },

      toJSON: function(value, deep) {
         if (deep) {
            var result = [];
            value.each(function(name) {
               result.push(name);
            });
            return result;
         }

         return value.get();
      },

      /**
       * Подписывается на изменение поля контекста
       * @param {Type/collection#Enum} value Поле контекста
       * @param {Function} value Обработчик, вызываемый при изменении значения
       * @return {Function} Метод, выполняющий отписку
       */
      subscribe: function(value, fn) {
         value.subscribe('onChange', fn);

         return function() {
            value.unsubscribe('onChange', fn);
         };
      }
   });

   CoreContext.registerFieldType(new ContextFieldEnum(collection.Enum));

   return ContextFieldEnum;
});
