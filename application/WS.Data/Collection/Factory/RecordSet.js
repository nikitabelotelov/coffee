/* global define */
define('WS.Data/Collection/Factory/RecordSet', [
   'Types/collection',
   'Types/util'
], function(
   collection,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/Factory/RecordSet', 'Module is deprecated and will be removed in 19.200. Use Types/collection:factory.recordSet instead.');

   return collection.factory.recordSet;
});
