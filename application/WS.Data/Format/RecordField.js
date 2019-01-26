/* global define */
define('WS.Data/Format/RecordField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/RecordField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.RecordField instead.');

   return type.format.RecordField;
});
