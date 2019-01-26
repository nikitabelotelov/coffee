/* global define */
define('WS.Data/Source/Provider/IRpc', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Source/Provider/IRpc', 'Module is deprecated and will be removed in 19.200. Use Types/source:provider.IRpc instead.');

   /**
    * Интерфейс RPC провайдера
    * @interface WS.Data/Source/Provider/IRpc
    * @public
    * @author Мальцев А.А.
    */

   return /** @lends WS.Data/Source/Provider/IRpc.prototype */{
      '[WS.Data/Source/Provider/IRpc]': true,

      /**
       * Вызывает удаленный метод
       * @param {String} method Имя метода
       * @param {Object|Array} [args] Аргументы метода
       * @return {Core/Deferred} Асинхронный результат операции
       */
      call: function(method, args) {// eslint-disable-line no-unused-vars
         throw new Error('Method must be implemented');
      }
   };
});
