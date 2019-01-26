/* global define */
define('WS.Data/Source/Provider/SbisBusinessLogic', [
   'Types/source',
   'Types/util',
   'WS.Data/Di',
   'Core/core-extend'
], function(
   source,
   util,
   Di,
   coreExtend
) {
   'use strict';

   util.logger.error('WS.Data/Source/Provider/SbisBusinessLogic', 'Module is deprecated and will be removed in 19.200. Use Types/source:provider.SbisBusinessLogic instead.');

   var SbisBusinessLogic = coreExtend.extend(source.provider.SbisBusinessLogic, {
      '[WS.Data/Source/Provider/SbisBusinessLogic]': true
   });

   Di.register('source.provider.sbis-business-logic', SbisBusinessLogic);

   return SbisBusinessLogic;
});
