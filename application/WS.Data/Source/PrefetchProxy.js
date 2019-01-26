/* global define */
define('WS.Data/Source/PrefetchProxy', [
   'Types/source',
   'Types/util',
   'Core/core-classicExtend'
], function(
   source,
   util,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Source/PrefetchProxy', 'Module is deprecated and will be removed in 19.200. Use Types/source:PrefetchProxy instead.');

   var PrefetchProxy = function() {
      return source.PrefetchProxy.apply(this, arguments);
   };
   extend(PrefetchProxy, source.PrefetchProxy);

   // Deprecated
   PrefetchProxy.prototype['[WS.Data/Source/ICrud]'] = true;

   return PrefetchProxy;
});
