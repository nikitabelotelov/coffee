/* global define */
define('WS.Data/Adapter/RecordSetRecord', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/RecordSetRecord', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.RecordSetRecord instead.');

   return type.adapter.RecordSetRecord;
});
