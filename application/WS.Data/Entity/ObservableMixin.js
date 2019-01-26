/* global define */
define('WS.Data/Entity/ObservableMixin', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Entity/ObservableMixin', 'Module is deprecated and will be removed in 19.200. Use Types/entity:ObservableMixin instead.');

   return type.ObservableMixin.prototype;
});
