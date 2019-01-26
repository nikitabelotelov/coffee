/* global define, require */
define('WS.Data/Chain', [
   'Types/chain',
   'Types/util'
], function(
   chain,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Chain', 'Module is deprecated and will be removed in 19.200. Use Types/chain:factory instead.');

   return chain.factory;
});
