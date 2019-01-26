/* global define, require */
define('WS.Data/Chain/Object', [
   'Types/chain',
   'Types/util'
], function(
   chain,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Chain/Object', 'Module is deprecated and will be removed in 19.200. Use Types/chain:Objectwise instead.');

   return chain.Objectwise;
});
