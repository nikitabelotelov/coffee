/* global define */
define('WS.Data/Entity/VersionableMixin', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Entity/VersionableMixin', 'Module is deprecated and will be removed in 19.200. Use Types/entity:VersionableMixin instead.');

   return type.VersionableMixin;
});
