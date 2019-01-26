/* global define, require */
define('WS.Data/Adapter/Sbis', [
   'Types/entity',
   'Types/util',
   'WS.Data/Di'
], function(
   type,
   util,
   Di
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/Sbis', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.Sbis instead.');

   Di.register('adapter.sbis', type.adapter.Sbis);

   return type.adapter.Sbis;
});
