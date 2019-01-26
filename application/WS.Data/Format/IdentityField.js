/* global define */
define('WS.Data/Format/IdentityField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/IdentityField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.IdentityField instead.');

   return type.format.IdentityField;
});
