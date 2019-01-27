/* global define */
define('WS.Data/ContextField/Record', [
   'WS.Data/ContextField/RecordMixin',
   'WS.Data/ContextField/Base',
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
    * @class WS.Data/ContextField/Record
    * @mixes WS.Data/ContextField/RecordMixin
    * @extends WS.Data/ContextField/Base
    * @author Мальцев А.А.
    */
   var ContextFieldRecord = ContextFieldBase.extend([RecordMixin], /** @lends WS.Data/ContextField/Record.prototype*/{
      '[WS.Data/ContextField/Record]': true,

      name: 'ControlsFieldTypeRecord',

      /**
       * Подписывается на изменение поля контекста
       * @param {WS.Data/Entity/Record} value Поле контекста
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