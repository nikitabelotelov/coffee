define("Lib/Type/TReaderParams/TReaderParams", ["Lib/Type/CustomType"], function (CustomType) {

   "use strict";

   /**
    * Тип TReaderParams
    * @class Lib/Type/TReaderParams/TReaderParams
    * @extends Lib/Type/CustomType
    * @author Бегунов А.В.
    * @generateJson
    * @deprecated
    * @category Выбор
    * @public
    */
   var TReaderParams = CustomType.extend(/** @lends Lib/Type/TReaderParams/TReaderParams.prototype */{
      $protected: {
         _options: {
            /**
             * @cfg {String} Тип используемого адаптера
             */
            adapterType: undefined,
            /**
             * @cfg {Object} Параметры адаптера
             */
            adapterParams: {
               /**
                * @cfg {Object} Данные
                */
               data: undefined
            },
            /**
             * @cfg {String} Схема базы данных
             *
             *
             */
            dbScheme: undefined,
            /**
             * @cfg {String} Связанный объект
             *
             *
             */
            linkedObject: undefined,
            /**
             * @cfg {String} Имя метода объекта
             *
             *
             * Итоговый запрос: linkedObject.queryName
             */
            queryName: undefined,
            /**
             * @cfg {String} Имя метода, определяющего формат записи
             *
             *
             * Возможен выбор декларативного метода, возвращающего набор записей.
             * При указанном методе набор полей, пришедших в прочитанной записи будет идентичным набору полей, возвращаемых указанным методом формата.
             */
            format: undefined,
            /**
             * @cfg {String} Имя метода создания записи
             *
             *
             * Добавить описание
             */
            createMethodName: undefined,
            /**
             * @cfg {String} Имя метода чтения записей
             *
             *
             * При редактировании записи будут прочитаны указанным методом.
             */
            readMethodName: undefined,
            /**
             * @cfg {String} Имя метода изменения записи
             *
             *
             * Добавить описание
             */
            updateMethodName: undefined,
            /**
             * @cfg {String} Имя метода удаления записи
             *
             *
             * Добавить описание
             */
            destroyMethodName: undefined,
            /**
             * @cfg {String} Имя метода копирования записи
             *
             *
             * Добавить описание
             */
            copyMethodName: undefined
         }
      },
      isConfigured: function () {
         // опция сконфигурирована, если указан объект, либо заполнены статические данные.
         return this._options.linkedObject || this._options.adapterParams.data;
      }
   });
   return TReaderParams;
});