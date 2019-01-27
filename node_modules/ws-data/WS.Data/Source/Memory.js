/* global define */
define('WS.Data/Source/Memory', [
   'Types/source',
   'Types/util',
   'WS.Data/Di',
   'Core/core-extend',
   'WS.Data/Source/DataSet',
   'WS.Data/Entity/Model',
   'WS.Data/Collection/RecordSet'
], function(
   source,
   util,
   Di,
   extend
) {
   'use strict';

   //util.logger.error('WS.Data/Source/Memory', 'Module is deprecated and will be removed in 19.200. Use Types/source:Memory instead.');

   var Memory = extend.extend(source.Memory, {
      '[WS.Data/Source/Memory]': true,
      '[WS.Data/Source/ISource]': true,
      '[WS.Data/Source/ICrud]': true,
      '[WS.Data/Source/Base]': true,
      _$model: 'entity.model',
      _$listModule: 'collection.recordset',
      _dataSetModule: 'source.dataset',

      // region Deprecated

      subscribe: function() {},

      unsubscribe: function() {},

      hasEventHandlers: function() {}

      // endregion Deprecated
   });

   Di.register('source.memory', Memory);

   return Memory;
});
