/* global define */
define('WS.Data/Format/LinkField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/LinkField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.LinkField instead.');

   return type.format.LinkField;
});
