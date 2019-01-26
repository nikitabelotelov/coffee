/* global define */
define('WS.Data/Format/TimeIntervalField', [
   'Types/entity',
   'Types/util'
], function(
   type,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Format/TimeIntervalField', 'Module is deprecated and will be removed in 19.200. Use Types/entity:format.TimeIntervalField instead.');

   return type.format.TimeIntervalField;
});
