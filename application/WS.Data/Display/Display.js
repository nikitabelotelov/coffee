/* global define, require */
define('WS.Data/Display/Display', [
   'Types/display',
   'Types/util'
], function(
   display,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Display/Display', 'Module is deprecated and will be removed in 19.200. Use Types/display:Abstract instead.');

   return display.Abstract;
});
