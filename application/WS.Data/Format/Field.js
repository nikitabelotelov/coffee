/* global define */
define('WS.Data/Format/Field', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/Field', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.Field instead.');

   return type.format.Field;
});
