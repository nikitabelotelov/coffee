/* global define */
define('WS.Data/Entity/SerializableMixin', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Entity/SerializableMixin', 'Module is deprecated and will be removed in 19.200. Use Types/entity:SerializableMixin instead.');

   return type.SerializableMixin.prototype;
});
