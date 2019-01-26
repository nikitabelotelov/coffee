/* global define */
define('WS.Data/Display/Tree', [
   'Types/display',
   'Types/util'
], function(
   display,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Display/Tree', 'Module is deprecated and will be removed in 19.200. Use Types/display:Tree instead.');

   return display.Tree;
});
