/* global define */
define('WS.Data/Di', [
   'Types/di',
   'Types/util'
], function(
   di,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Di', 'Module is deprecated and will be removed in 19.200. Use Types/di instead.');

   return di.default ? di.default : di;
});
