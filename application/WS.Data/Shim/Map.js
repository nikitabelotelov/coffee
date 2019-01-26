/* global define */
define('WS.Data/Shim/Map', [
   'Types/shim',
   'Types/util'
], function(
   shim,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Shim/Map', 'Module is deprecated and will be removed in 19.200. Use Types/shim:Map instead.');

   return shim.Map;
});
