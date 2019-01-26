/* global define */
define('WS.Data/Format/RpcFileField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/RpcFileField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.RpcFileField instead.');

   return type.format.RpcFileField;
});
