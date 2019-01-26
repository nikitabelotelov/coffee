/* global define, require */
define('WS.Data/Display/Enum', [
   'Types/display',
   'Types/util'
], function(
   display,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Display/Enum', 'Module is deprecated and will be removed in 19.200. Use Types/display:Enum instead.');

   return display.Enum;
});
