/* global define */
define('WS.Data/Source/ICrud', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Source/ICrud', 'Module is deprecated and will be removed in 19.200. Use Types/source:ICrud instead.');

   var ICrud = {
      '[Types/_source/ICrud]': true,
      '[WS.Data/Source/ICrud]': true
   };

   return ICrud;
});
