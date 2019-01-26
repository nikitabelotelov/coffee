/* global define */
define('WS.Data/Collection/IBind', [
   'Types/collection',
   'Types/util'
], function(
   collection,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/IBind', 'Module is deprecated and will be removed in 19.200. Use Types/collection:IObservable instead.');

   return collection.IObservable;
});
