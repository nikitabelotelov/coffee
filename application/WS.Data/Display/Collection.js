/* global define */
define('WS.Data/Display/Collection', [
   'Types/display',
   'Types/util',
   'WS.Data/Di'
], function(
   display,
   util,
   Di
) {
   'use strict';

   //Deprecated methods
   display.Collection.prototype.getByHash = display.Collection.prototype.getByInstanceId;
   display.Collection.prototype.getIndexByHash = display.Collection.prototype.getIndexByInstanceId;

   Di.register('display.collection', display.Collection);

   return display.Collection;
});
