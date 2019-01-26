/* global define */
define('WS.Data/Format/FlagsField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/FlagsField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.FlagsField instead.');

   return type.format.FlagsField;
});
