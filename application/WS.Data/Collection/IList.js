/* global define */
define('WS.Data/Collection/IList', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/IList', 'Module is deprecated and will be removed in 19.200. Use Types/collection:IList instead.');

   return /** @lends WS.Data/Collection/IList.prototype */{
      '[Types/_collection/IList]': true,
      '[WS.Data/Collection/IList]': true
   };
});
