/* global define, require */
define('WS.Data/Functor/Compute', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Functor/Compute', 'Module is deprecated and will be removed in 19.200. Use Types/entity:functor.Compute instead.');

   return type.functor.Compute;
});
