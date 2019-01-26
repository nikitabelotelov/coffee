/* global define */
define('Core/ContextField/Record', [
   'Core/ContextField/RecordMixin',
   'Core/ContextField/Base',
   'Types/entity',
   'Core/Context'
], function(
   RecordMixin,
   ContextFieldBase,
   type,
   CoreContext
) {
   'use strict';

   /**
    * Поддержка типа запись в контексте
    * @class Core/ContextField/Record
    * @mixes Core/ContextField/RecordMixin
    * @extends Core/ContextField/Base
    * @author Мальцев А.А.
    */
   var ContextFieldRecord = ContextFieldBase.extend([RecordMixin], /** @lends Core/ContextField/Record.prototype*/{
      '[Core/ContextField/Record]': true,

      name: 'ControlsFieldTypeRecord',

      /**
       * Подписывается на изменение поля контекста
       * @param {Type/entity#Record} value Поле контекста
       * @param {Function} value Обработчик, вызываемый при изменении значения
       * @return {Function} Метод, выполняющий отписку
       */
      subscribe: function(value, fn) {
         value.subscribe('onPropertyChange', fn);

         return function() {
            value.unsubscribe('onPropertyChange', fn);
         };
      }
   });

   CoreContext.registerFieldType(new ContextFieldRecord(type.Record));

   return ContextFieldRecord;
});
