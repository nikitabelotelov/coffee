/* global define */
define('WS.Data/Type/descriptor', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Type/descriptor', 'Module is deprecated and will be removed in 19.200. Use Types/entity:descriptor instead.');

   return type.descriptor;
});
