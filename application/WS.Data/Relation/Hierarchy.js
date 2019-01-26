/* global define */
define('WS.Data/Relation/Hierarchy', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Relation/Hierarchy', 'Module is deprecated and will be removed in 19.200. Use Types/entity:relation.Hierarchy instead.');

   return type.relation.Hierarchy;
});
