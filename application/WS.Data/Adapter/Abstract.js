/* global define */
define('WS.Data/Adapter/Abstract', [
   'Types/entity',
   'Types/util',
   'Core/core-extend'
], function(
   type,
   util,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/Abstract', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.Abstract instead.');

   return extend.extend(type.adapter.Abstract, {
   });
});
