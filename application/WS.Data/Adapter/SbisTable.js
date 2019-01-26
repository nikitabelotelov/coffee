/* global define */
define('WS.Data/Adapter/SbisTable', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/SbisTable', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.SbisTable instead.');

   return type.adapter.SbisTable;
});
