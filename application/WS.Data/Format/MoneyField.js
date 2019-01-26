/* global define */
define('WS.Data/Format/MoneyField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/MoneyField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.MoneyField instead.');

   return type.format.MoneyField;
});
