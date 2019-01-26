/* global define */
define('WS.Data/Format/BooleanField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/BooleanField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.BooleanField instead.');

   return type.format.BooleanField;
});
