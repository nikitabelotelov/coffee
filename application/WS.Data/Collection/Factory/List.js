/* global define */
define('WS.Data/Collection/Factory/List', [
   'Types/collection',
   'Types/util'
], function(
   collection,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/Factory/List', 'Module is deprecated and will be removed in 19.200. Use Types/collection:factory.list instead.');

   return collection.factory.list;
});
