/* global define */
define('WS.Data/Adapter/IAdapter', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/Abstract', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.Abstract instead.');

   return {
      '[Types/_entity/adapter/IAdapter]': true,
      '[WS.Data/Adapter/IAdapter]': true
   };
});
