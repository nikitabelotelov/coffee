/* global define */
define('WS.Data/Collection/IEnumerable', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/IEnumerable', 'Module is deprecated and will be removed in 19.200. Use Types/collection:IEnumerable instead.');

   // Deprecated
   return {
      '[Types/_collection/IEnumerable]': true,
      '[WS.Data/Collection/IEnumerable]': true
   };
});
