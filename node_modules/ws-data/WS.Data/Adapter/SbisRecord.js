/* global define */
define('WS.Data/Adapter/SbisRecord', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/SbisRecord', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.SbisRecord instead.');

   return type.adapter.SbisRecord;
});
