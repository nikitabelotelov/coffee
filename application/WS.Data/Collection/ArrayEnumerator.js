/* global define */
define('WS.Data/Collection/ArrayEnumerator', [
   'Types/collection',
   'Types/util',
   'WS.Data/Utils',
   'Core/core-extend',
   'Core/helpers/Function/throttle'
], function(
   collection,
   util,
   Utils,
   coreExtend,
   throttle
) {
   'use strict';

   util.logger.error('WS.Data/Collection/ArrayEnumerator', 'Module is deprecated and will be removed in 19.200. Use Types/collection:ArrayEnumerator instead.');

   /**
    * Выводит предупреждения не чаще указанного интервала
    */
   var warning = throttle(Utils.logger.error, 300);

   // Deprecated
   var ArrayEnumerator = coreExtend.extend(collection.ArrayEnumerator, {
      '[WS.Data/Collection/ArrayEnumerator]': true,

      getNext: function() {
         warning(this._moduleName + '::getNext(): method is deprecated and will be removed in 3.18.10. Use moveNext() + getCurrent() instead.');
         return this.moveNext() ? this.getCurrent() : undefined;
      }
   });

   return ArrayEnumerator;
});