/* global define */
define('WS.Data/Format/DateField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/DateField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.DateField instead.');

   return type.format.DateField;
});