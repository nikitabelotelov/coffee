/* global define */
define('WS.Data/Query/Query', [
   'Types/source',
   'Types/util',
   'Core/core-extend'
], function(
   source,
   util,
   coreExtend
) {
   'use strict';

   util.logger.error('WS.Data/Query/Query', 'Module is deprecated and will be removed in 19.200. Use Types/source:Query instead.');

   var Query = coreExtend.extend(source.Query, {
      '[WS.Data/Query/Query]': true
   });

   return Query;
});
