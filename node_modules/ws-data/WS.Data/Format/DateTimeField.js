/* global define */
define('WS.Data/Format/DateTimeField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/DateTimeField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.DateTimeField instead.');

   return type.format.DateTimeField;
});
