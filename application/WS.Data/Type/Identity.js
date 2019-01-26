/* global define */
define('WS.Data/Type/Identity', [
   'Types/entity',
   'Types/util',
   'WS.Data/Di'
], function(
   type,
   util,
   Di
) {
   'use strict';

   util.logger.error('WS.Data/Type/Identity', 'Module is deprecated and will be removed in 19.200. Use Types/entity:Identity instead.');

   Di.register('types.$identity', type.Identity, {instantiate: false});
   Di.register('types.identity', type.Identity);

   return type.Identity;
});
