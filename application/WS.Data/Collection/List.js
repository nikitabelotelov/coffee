/* global define */
define('WS.Data/Collection/List', [
   'Types/collection',
   'Types/util',
   'WS.Data/Di',
   'WS.Data/Utils',
   'Core/core-extend'
], function(
   collection,
   util,
   Di,
   Utils,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Collection/List', 'Module is deprecated and will be removed in 19.200. Use Types/collection:List instead.');

   var List = extend.extend(collection.List, /** @lends WS.Data/Collection/List.prototype */{

      // region Deprecated methods

      /**
       * Возвращает коллекцию в виде массива
       * @return {Array}
       * @deprecated Метод будет удален в 3.18.10, используйте {@link WS.Data/Chain/Abstract#toArray}.
       */
      toArray: function() {
         Utils.logger.stack(this._moduleName + '::toArray(): method is deprecated and will be removed in 3.18.10. Use WS.Data/Chain/DestroyableMixin::toArray() instead. See https://wi.sbis.ru/docs/WS/Data/Chain/DestroyableMixin/methods/toArray/ for details.', 0, 'error');
         return this._$items.slice();
      }

      // endregion Deprecated methods
   });

   Di.register('collection.list', List);

   return List;
});
