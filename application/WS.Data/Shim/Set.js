/* global define */
define('WS.Data/Shim/Set', [
   'Types/shim',
   'Types/util'
], function(
   shim,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Shim/Set', 'Module is deprecated and will be removed in 19.200. Use Types/shim:Set instead.');

   return shim.Set;
});
