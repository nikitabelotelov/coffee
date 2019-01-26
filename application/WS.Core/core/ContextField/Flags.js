/* global define */
define('Core/ContextField/Flags', [
   'Core/ContextField/RecordMixin',
   'Core/ContextField/Base',
   'Types/collection',
   'Core/Context'
], function(
   RecordMixin,
   ContextFieldBase,
   collection,
   CoreContext
) {
   'use strict';

   /**
    * Поддержка типа флаги в контексте
    * @class Core/ContextField/Flags
    * @mixes Core/ContextField/RecordMixin
    * @extends Core/ContextField/Base
    * @author Мальцев А.А.
    */
   var ContextFieldFlags = ContextFieldBase.extend([RecordMixin], /** @lends Core/ContextField/Flags.prototype*/{
      '[Core/ContextField/Flags]': true,

      name: 'ControlsFieldTypeFlags',

      /**
       * Удаляет значение поля контекста
       * @param {Type/collection#Enum} oldValue Поле контекста
       * @param {Array.<String>} keyPath Путь до значения
       * @return {Object}
       */
      remove: function(value, keyPath) {
         var changed = keyPath.length !== 0;
         if (changed) {
            value.set(keyPath[0], false);
         }

         return {
            value: value,
            changed: changed
         };
      },

      toJSON: function(value, deep) {
         if (deep) {
            var result = {};
            value.each(function(name) {
               result[name] = value.get(name);
            });
            return result;
         }

         return value.toString();
      }
   });

   CoreContext.registerFieldType(new ContextFieldFlags(collection.Flags));

   return ContextFieldFlags;
});

