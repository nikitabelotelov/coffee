/* global define, require */
define('WS.Data/Chain/Abstract', [
   'Types/chain',
   'Types/util'
], function(
   chain,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Chain/Abstract', 'Module is deprecated and will be removed in 19.200. Use Types/chain:Abstract instead.');

   return chain.Abstract;
});
