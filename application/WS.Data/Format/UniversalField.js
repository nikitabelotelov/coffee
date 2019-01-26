/* global define */
define('WS.Data/Format/UniversalField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/UniversalField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.UniversalField instead.');

   return type.format.UniversalField;
});
