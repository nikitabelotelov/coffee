/* global define */
define('WS.Data/Display/Search', [
   'Types/display',
   'Types/util'
], function(
   display,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Display/Search', 'Module is deprecated and will be removed in 19.200. Use Types/display:Search instead.');

   return display.Search;
});
