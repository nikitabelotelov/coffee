/* global define */
define('WS.Data/Adapter/Json', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/Json', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.Json instead.');

   return type.adapter.Json;
});
