/* global define */
define('WS.Data/Format/Format', [
   'Types/collection',
   'Types/util'
], function(
   collection,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/Format', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.Format instead.');

   return collection.format.Format;
});
