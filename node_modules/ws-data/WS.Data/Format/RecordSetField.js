/* global define */
define('WS.Data/Format/RecordSetField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/RecordSetField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.RecordSetField instead.');

   return type.format.RecordSetField;
});
