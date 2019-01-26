/* global define */
define('WS.Data/Adapter/Cow', [
   'Types/entity',
   'Types/util',
   'WS.Data/Di'
], function(
   type,
   util,
   Di
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/Abstract', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.Abstract instead.');

   Di.register('adapter.cow', type.adapter.Cow);

   return type.adapter.Cow;
});
