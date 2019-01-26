/* global define */
define('WS.Data/Adapter/IRecord', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/IRecord', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.IRecord instead.');

   return {
      '[Types/_entity/adapter/IRecord]': true,
      '[WS.Data/Adapter/IRecord]': true
   };
});
