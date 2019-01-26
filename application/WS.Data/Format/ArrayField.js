/* global define */
define('WS.Data/Format/ArrayField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/ArrayField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.ArrayField instead.');

   return type.format.ArrayField;
});
