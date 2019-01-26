/* global define */
define('WS.Data/Source/Rpc', [
   'Types/source',
   'Types/util',
   'Core/core-extend'
], function(
   source,
   util,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Source/Rpc', 'Module is deprecated and will be removed in 19.200. Use Types/source:Rpc instead.');

   var Rpc = extend.extend(source.Rpc, {
      '[WS.Data/Source/Rpc]': true
   });

   return Rpc;
});
