/* global define */
define('WS.Data/Format/EnumField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/EnumField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.EnumField instead.');

   return type.format.EnumField;
});
