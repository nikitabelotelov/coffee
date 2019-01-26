/* global define */
define('WS.Data/Format/BinaryField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/BinaryField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.BinaryField instead.');

   return type.format.BinaryField;
});
