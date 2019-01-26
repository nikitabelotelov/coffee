/* global define */
define('WS.Data/Format/FormatsFactory', [
   'Types/collection',
   'Types/util'
], function(
   collection,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/FormatsFactory', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.factory instead.');

   return collection.format.factory;
});
