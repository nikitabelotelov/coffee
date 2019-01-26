/* global define */
define('WS.Data/Format/IntegerField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/IntegerField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.IntegerField instead.');

   return type.format.IntegerField;
});
