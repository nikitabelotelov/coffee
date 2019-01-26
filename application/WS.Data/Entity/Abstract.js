/* global define */
define('WS.Data/Entity/Abstract', [
   'Types/entity',
   'Types/util',
   'Core/core-extend'
], function(
   type,
   util,
   coreExtend
) {
   'use strict';

   util.logger.error('WS.Data/Entity/Abstract', 'Module is deprecated and will be removed in 19.200. Use Types/entity:DestroyableMixin instead.');

   // Deprecated
   var Abstract = coreExtend.extend(type.DestroyableMixin, {
      '[WS.Data/Entity/Abstract]': true
   });

   return Abstract;
});
