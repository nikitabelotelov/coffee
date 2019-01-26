/* global define */
define('WS.Data/Collection/ISourceLoadable', [
   'Types/util'
], function(
   util
) {
   'use strict';

   util.logger.error('WS.Data/Collection/ISourceLoadable', 'Module is deprecated and will be removed in 19.200.');

   /**
    * Интерфейс коллекции, загружаемой через источник данных
    * @interface WS.Data/Collection/ISourceLoadable
    * @author Мальцев А.А.
    */

   var ISourceLoadable = /** @lends WS.Data/Collection/ISourceLoadable.prototype */{
      '[WS.Data/Collection/ISourceLoadable]': true,

      /**
       * @event onBeforeCollectionLoad Перед загрузкой данных из источника
       * @param {Core/EventObject} event Дескриптор события.
       * @param {String} mode=WS.Data/Collection/ISourceLoadable/MODE_REPLACE Режим загрузки
       * @param {WS.Data/Collection/IEnumerable} target Объект, в который производится загрузка
       */

      /**
       * @event onAfterCollectionLoad После загрузки данных из источника
       * @param {Core/EventObject} event Дескриптор события.
       * @param {String} [mode=WS.Data/Collection/ISourceLoadable/MODE_REPLACE] Режим загрузки
       * @param {WS.Data/Source/DataSet} dataSet Набор данных
       * @param {WS.Data/Collection/IEnumerable} target Объект, в который производится загрузка
       */

      /**
       * @event onBeforeLoadedApply Перед вставкой загруженных данных в коллекцию
       * @param {Core/EventObject} event Дескриптор события.
       * @param {String} [mode=WS.Data/Collection/ISourceLoadable/MODE_REPLACE] Режим загрузки
       * @param {WS.Data/Collection/IEnumerable} collection Коллекция, полученная из источника
       * @param {WS.Data/Collection/IEnumerable} target Объект, в который производится загрузка
       * @example
       * <pre>
       *    grid.subscribe('onBeforeLoadedApply', function(eventObject, mode, collection){
       *       collection.add('My own list item at 1st position', 0);
       *    });
       * </pre>
       */

      /**
       * @event onAfterLoadedApply После вставки загруженных данных в коллекцию
       * @param {Core/EventObject} event Дескриптор события.
       * @param {String} [mode=WS.Data/Collection/ISourceLoadable/MODE_REPLACE] Режим загрузки
       * @param {WS.Data/Collection/IEnumerable} collection Коллекция, полученная из источника
       * @param {WS.Data/Collection/IEnumerable} target Объект, в который производится загрузка
       * @example
       * <pre>
       *    grid.subscribe('onAfterLoadedApply', function(eventObject, mode, collection){
       *       collection.add('My own list item at 1st position', 0);
       *    });
       * </pre>
       */


      /**
       * @cfg {WS.Data/Source/ISource} Источник данных
       * @name WS.Data/Collection/ISourceLoadable#source
       */
      _$source: undefined,

      /**
       * Возвращает источник данных
       * @return {WS.Data/Source/Base}
       */
      getSource: function() {
         throw new Error('Method must be implemented');
      },

      /**
       * Устанавливает источник данных
       * @param {WS.Data/Source/Base} source
       */
      setSource: function(source) {// eslint-disable-line no-unused-vars
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает признак, что коллекция уже была загружена из источника
       * @return {Boolean}
       */
      isLoaded: function() {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает признак, что запрос на выборку был изменен c момента последнего load()
       * @return {Boolean}
       */
      isQueryChanged: function() {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает общее кол-во записей выборки или признак, что еще есть записи (если общее кол-во записей не определено)
       * @return {Number|Boolean}
       */
      getQueryTotal: function() {
         throw new Error('Method must be implemented');
      },

      /**
       * Возвращает признак, что еще не все записи загружены
       * @return {Boolean}
       */
      hasMore: function() {
         throw new Error('Method must be implemented');
      },

      /**
       * Загружает данные из источника в коллекцию
       * @param {String} [mode=WS.Data/Collection/ISourceLoadable/MODE_REPLACE] Режим загрузки
       * WS.Data/Collection/ISourceLoadable/MODE_REPLACE - заменить
       * WS.Data/Collection/ISourceLoadable/MODE_APPEND - добавить в конец
       * WS.Data/Collection/ISourceLoadable/MODE_PREPEND - добавить в начало
       * @return {Core/Deferred} Асинхронный результат выполнения, первым аргументом придет WS.Data/Source/DataSet
       */
      load: function(mode) {// eslint-disable-line no-unused-vars
         throw new Error('Method must be implemented');
      }
   };

   /**
    * @const {String} Режим загрузки - замена
    */
   ISourceLoadable.MODE_REPLACE = 'r';

   /**
    * @const {String} Режим загрузки - добавление в конец
    */
   ISourceLoadable.MODE_APPEND = 'a';

   /**
    * @const {String} Режим загрузки - добавление в начало
    */
   ISourceLoadable.MODE_PREPEND = 'p';

   return ISourceLoadable;
});
