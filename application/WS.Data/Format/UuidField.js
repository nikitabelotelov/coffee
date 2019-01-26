/* global define */
define('WS.Data/Format/UuidField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/UuidField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.UuidField instead.');

   return type.format.UuidField;
});
