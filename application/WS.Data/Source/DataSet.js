/* global define */
define('WS.Data/Source/DataSet', [
   'Types/source',
   'Types/util',
   'WS.Data/Di',
   'Core/core-extend'
], function(
   source,
   util,
   Di,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Source/DataSet', 'Module is deprecated and will be removed in 19.200. Use Types/source:DataSet instead.');

   var DataSet = extend.extend(source.DataSet, {
      '[WS.Data/Source/DataSet]': true,
      _$model: 'entity.model',
      _$listModule: 'collection.recordset',
      getTotal: function() {
         var metaData = this.getMetaData();
         return metaData.hasOwnProperty('total') ? metaData.total : undefined;
      }
   });

   Di.register('source.dataset', DataSet);

   return DataSet;
});
