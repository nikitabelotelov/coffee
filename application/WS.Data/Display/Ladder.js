define('WS.Data/Display/Ladder', [
   'Types/display',
   'Types/util'
], function(
   display,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Display/Ladder', 'Module is deprecated and will be removed in 19.200. Use Types/display:Ladder instead.');

   return display.Ladder;
});
