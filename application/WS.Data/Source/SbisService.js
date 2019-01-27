/* global define */
define('WS.Data/Source/SbisService', [
   'Types/source',
   'Types/util',
   'WS.Data/Di',
   'Core/core-extend',
   'Core/IoC',
   'WS.Data/Source/DataSet',
   'WS.Data/Entity/Model',
   'WS.Data/Collection/RecordSet'
], function(
   source,
   util,
   di,
   extend,
   IoC
) {
   'use strict';

   util.logger.error('WS.Data/Source/SbisService', 'Module is deprecated and will be removed in 19.200. Use Types/source:SbisService instead.');

   var SbisService = extend.extend(source.SbisService, {
      '[WS.Data/Source/SbisService]': true,
      '[WS.Data/Source/ISource]': true,
      '[WS.Data/Source/ICrud]': true,
      '[WS.Data/Source/Base]': true,
      '[WS.Data/Source/Rpc]': true,
      _$model: 'entity.model',
      _$listModule: 'collection.recordset',
      _dataSetModule: 'source.dataset',

      constructor: function(options) {
         // FIXME: support for deprecated option metaConfig.hasMore
         if (options && options.metaConfig instanceof Object && 'hasMore' in options.metaConfig) {
            options.options = options.options || {};
            options.options.hasMoreProperty = options.metaConfig.hasMore;
            delete options.metaConfig;
         }

         SbisService.superclass.constructor.call(this, options);
      },

      // region Deprecated methods

      prepareQueryParams: function(filter, sorting, offset, limit, hasMore) {
         util.logger.stack(this._moduleName + '::prepareQueryParams(): method is deprecated and will be removed in 3.18.10, use query() instead', 0, 'error');

         var Query = require('Types/source').Query;
         var query = new Query();
         query.where(filter)
            .offset(hasMore === undefined ? offset : hasMore)
            .limit(limit)
            .orderBy(sorting)
            .meta(hasMore === undefined ? {} : {hasMore: hasMore});

         var buildRecord = source.SbisServiceExt.buildRecord;
         var buildRecordSet = source.SbisServiceExt.buildRecordSet;
         var getSortingParams = source.SbisServiceExt.getSortingParams;
         var getPagingParams = source.SbisServiceExt.getPagingParams;
         var getAdditionalParams = source.SbisServiceExt.getAdditionalParams;

         var args = {
            'Фильтр': buildRecord(query ? query.getWhere() : null, this._$adapter),
            'Сортировка': buildRecordSet(getSortingParams(query), this._$adapter, this.getIdProperty()),
            'Навигация': buildRecord(getPagingParams(query, this._$options, this._$adapter), this._$adapter),
            'ДопПоля': getAdditionalParams(query)
         };

         return this.getAdapter().serialize(args);
      }

      // endregion Deprecated methods
   });

   SbisService.prototype.NAVIGATION_TYPE = source.SbisService.NAVIGATION_TYPE;

   di.register('source.sbis-service', SbisService);
   IoC.bindSingle('source.sbis-service', SbisService);

   return SbisService;
});