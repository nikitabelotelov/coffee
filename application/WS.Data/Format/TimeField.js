/* global define */
define('WS.Data/Format/TimeField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/TimeField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.TimeField instead.');

   return type.format.TimeField;
});
