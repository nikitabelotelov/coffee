/* global define */
define('WS.Data/Format/ObjectField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/ObjectField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.ObjectField instead.');

   return type.format.ObjectField;
});
