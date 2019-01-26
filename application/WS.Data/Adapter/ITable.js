/* global define */
define('WS.Data/Adapter/ITable', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Adapter/ITable', 'Module is deprecated and will be removed in 19.200. Use Types/entity:adapter.ITable instead.');

   return {
      '[Types/_entity/adapter/ITable]': true,
      '[WS.Data/Adapter/ITable]': true
   };
});
