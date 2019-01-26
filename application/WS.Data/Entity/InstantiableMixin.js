/* global define */
define('WS.Data/Entity/InstantiableMixin', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Entity/InstantiableMixin', 'Module is deprecated and will be removed in 19.200. Use Types/entity:InstantiableMixin instead.');

   return type.InstantiableMixin;
});
