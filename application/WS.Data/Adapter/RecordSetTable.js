/* global define */
define('WS.Data/Adapter/RecordSetTable', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/RecordSetTable', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.RecordSetTable instead.');

   return type.adapter.RecordSetTable;
});
