/* global define */
define('WS.Data/Source/Base', [
   'Types/source',
   'Types/util',

   // Just for backward compatibility
   'WS.Data/Source/ISource',
   'Core/core-extend',
   'WS.Data/Source/DataSet',
   'WS.Data/Entity/Model',
   'WS.Data/Collection/RecordSet'
], function(
   source,
   util,
   ISource,
   extend
) {
   'use strict';

   util.logger.error('WS.Data/Source/Base', 'Module is deprecated and will be removed in 19.200. Use Types/source:Base instead.');

   var Base = extend.extend(source.Base, [ISource], {
      '[WS.Data/Source/Base]': true,
      _$model: 'entity.model',
      _$listModule: 'collection.recordset',
      _dataSetModule: 'source.dataset',

      // region Deprecated

      subscribe: function() {},

      unsubscribe: function() {},

      hasEventHandlers: function() {},

      _prepareQueryResult: function(data) {
         // FIXME: for SBIS3.CONTROLS/Date/RangeBigChoose/resources/CalendarSource
         return this._wrapToDataSet(data);
      }

      // endregion Deprecated
   });

   return Base;
});
