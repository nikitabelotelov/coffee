define('WS.Data/Adapter/SbisFieldType', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/SbisFieldType', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.SbisFieldType instead.');

   return type.adapter.SbisFieldType;
});
