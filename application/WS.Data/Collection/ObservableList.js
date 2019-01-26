/* global define */
define('WS.Data/Collection/ObservableList', [
   'Types/collection',
   'Types/util'
], function(
   collection,
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/ObservableList', 'Module is deprecated and will be removed in 19.200. Use Types/collection:ObservableList instead.');

   return collection.ObservableList;
});
