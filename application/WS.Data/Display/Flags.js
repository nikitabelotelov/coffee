/* global define, require */
define('WS.Data/Display/Flags', [
   'Types/display',
   'Types/util'
], function(
   display,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Display/Flags', 'Module is deprecated and will be removed in 19.200. Use Types/display:Flags instead.');

   return display.Flags;
});
