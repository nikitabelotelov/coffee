/* global define */
define('WS.Data/Format/RealField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/RealField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.RealField instead.');

   return type.format.RealField;
});
