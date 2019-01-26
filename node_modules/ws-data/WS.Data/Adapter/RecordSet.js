/* global define */
define('WS.Data/Adapter/RecordSet', [
   'Types/entity',
   'Types/util',
   'WS.Data/Di'
], function(
   type,
   util,
   Di
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/RecordSet', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.RecordSet instead.');

   Di.register('adapter.recordset', type.adapter.RecordSet);

   return type.adapter.RecordSet;
});
