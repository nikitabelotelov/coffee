/* global define */
define('WS.Data/Adapter/GenericFormatMixin', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/Abstract', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.Abstract instead.');

   return type.adapter.GenericFormatMixin;
});
