/* global define */
define('WS.Data/Entity/Model', [
   'Types/entity',
   'Types/util',
   'WS.Data/Di',
   'WS.Data/Utils',
   'Core/core-extend',
   'Core/core-merge',
   'Core/helpers/Function/throttle'
], function(
   type,
   util,
   Di,
   Utils,
   coreExtend,
   coreMerge,
   throttle
) {
   'use strict';

   util.logger.error('WS.Data/Entity/Model', 'Module is deprecated and will be removed in 19.200. Use Types/entity:Model instead.');

   /**
    * Выводит предупреждения не чаще, чем раз в 300мс
    */
   var warning = throttle(Utils.logger.error, 300);

   var Model = coreExtend.extend(type.Model, {
      _moduleName: 'WS.Data/Entity/Model',

      constructor: function WSDataEntityModel(options) {
         type.Model.call(this, options);
      },

      // region Deprecated methods

      /**
       * Возвращает значения всех свойств в виде объекта ключ-значение
       * @return {Object}
       * @example
       * Получим значения всех свойств в виде объекта:
       * <pre>
       *    var article = new Model({
       *       adapter: 'adapter.xml',
       *       rawData: '<?xml version="1.0"?><response><id>1</id><title>Article 1</title></response>'
       *    });
       *    article.toObject();//{id: 1, title: 'Article 1'}
       * </pre>
       * @deprecated Метод будет удален в 3.18.10, используйте {@link WS.Data/Chain/Abstract#toObject}.
       */
      toObject: function() {
         warning(this._moduleName + '::toObject(): method is deprecated and will be removed in 3.19.10. Use WS.Data/Chain/DestroyableMixin::toObject() instead. See https://wi.sbis.ru/docs/WS/Data/Chain/DestroyableMixin/methods/toObject/ for details.');
         var data = {};
         this.each(function(field, value) {
            data[field] = value;
         });
         return data;
      },

      setChanged: function(changed) {
         warning('WS.Data/Entity/Model: method setChanged() is deprecated and will be removed in 3.19.10.');
         this._isChanged = !!changed;
         if (!this._isChanged) {
            this._clearChangedFields();
         }
      }

      // endregion Deprecated methods
   });


   Object.defineProperty(Model, 'RecordState', Object.getOwnPropertyDescriptor(type.Record, 'RecordState'));
   Object.defineProperty(Model, 'CACHE_MODE_ALL', Object.getOwnPropertyDescriptor(type.Record, 'CACHE_MODE_ALL'));
   Object.defineProperty(Model, 'CACHE_MODE_OBJECTS', Object.getOwnPropertyDescriptor(type.Record, 'CACHE_MODE_OBJECTS'));

   // Emulate class infrastructure exactly how it was before TypeScript for the best compatibility
   Model.superclass = Object.getPrototypeOf(type.Model).prototype;

   // deprecated
   Di.register('model', Model);
   Di.register('entity.model', Model);
   Di.register('entity.$model', Model, {instantiate: false});

   return Model;
});
