/* global define, Object */
define('WS.Data/Collection/RecordSet', [
   'Types/collection',
   'Types/util',
   'WS.Data/Utils',
   'WS.Data/Di',
   'Core/core-extend',
   'Core/helpers/Function/throttle'
], function(
   collection,
   util,
   Utils,
   Di,
   extend,
   throttle
) {
   'use strict';

   util.logger.error('WS.Data/Collection/RecordSet', 'Module is deprecated and will be removed in 19.200. Use Types/collection:RecordSet instead.');

   /**
    * Выводит предупреждения не чаще, чем раз в 300мс
    */
   var warning = throttle(Utils.logger.error, 300);

   var RecordSet = extend.extend(collection.RecordSet, {
      _moduleName: 'WS.Data/Collection/RecordSet',

      _defaultModel: 'entity.model',
      _$model: 'entity.model',

      constructor: function WSDataCollectionRecordSet(options) {
         RecordSet.superclass.constructor.call(this, options);
      },

      // region Deprecated methods

      toArray: function() {
         warning(this._moduleName + '::toArray(): method is deprecated and will be removed in 3.18.10. Use WS.Data/Chain/DestroyableMixin::toArray() instead. See See https://wi.sbis.ru/docs/WS/Data/Chain/DestroyableMixin/methods/toArray/ for details.');
         var items = [];
         this.each(function(item) {
            items.push(item);
         });
         return items;
      },

      /**
       * Возвращает отфильтрованный рекордсет.
       * @param {Function} filterCallback Функция обратного вызова, аргументом будет передана запись, для которой нужно вернуть признак true (запись прошла фильтр) или false (не прошла)
       * @return {WS.Data/Collection/RecordSet}
       * @deprecated Метод будет удален в версии платформы СБИС 3.18.10, используйте {@link WS.Data/Chain/Abstract#filter}.
       */
      filter: function(filterCallback) {
         warning(this._moduleName + '::filter(): method is deprecated and will be removed in 3.18.10. Use WS.Data/Chain/DestroyableMixin::filter() instead. See https://wi.sbis.ru/docs/WS/Data/Chain/DestroyableMixin/methods/filter/ for details.');

         var filterDataSet = new RecordSet({
            adapter: this._$adapter,
            idProperty: this._$idProperty
         });

         this.each(function(record) {
            if (filterCallback(record)) {
               filterDataSet.add(record);
            }
         });

         return filterDataSet.clone();
      }

      // endregion Deprecated methods
   });

   Di.register('collection.$recordset', RecordSet, {instantiate: false});
   Di.register('collection.recordset', RecordSet);

   return RecordSet;
});
