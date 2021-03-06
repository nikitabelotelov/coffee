define("Lib/Type/TDataSource/TDataSource", [
   'Core/helpers/getType',
   "Lib/Type/CustomType",
   "Lib/Type/TReaderParams/TReaderParams"
], function (getType, CustomType, TReaderParams) {

   "use strict";

   /**
    * Тип TDataSource
    * @class Lib/Type/TDataSource/TDataSource
    * @extends Lib/Type/CustomType
    * @author Бегунов А.В.
    * @generateJson
    * @category Выбор
    * @public
    */
   var TDataSource = CustomType.extend(/** @lends Lib/Type/TDataSource/TDataSource.prototype */{
      $protected: {
         _options: {
            /**
             * @cfg {Object} Контекст
             * @noShow
             */
            context: '',
            /**
             * @typedef {Object} FilterParam
             * @property {string} fieldName Имя поля
             * @property {boolean} [autoreload=true] Перезагружать данные при изменении поля в контексте
             * @property {boolean} [saveToState=false] Перезагружать данные при изменении поля в контексте
             */
            /**
             * @cfg {Object.<string, string|function|FilterParam>} Параметры фильтрации
             * @editor FilterParamsEditor
             * @example
             * <pre>
             *    filterParams: {
             *       'param' : 'val1',
             *       'param2' : 'val2'
             *    }
             * </pre>
             * @see sorting
             */
            filterParams: {},
            /**
             * @cfg {Object} Массив обязательных параметров
             */
            requiredParams: [],
            /**
             * @cfg {String} Тип ридера данных
             * @variant ReaderUnifiedSBIS
             * @variant ReaderSBIS
             * @variant ReaderSBISSpecial
             * @variant mockReader
             * @variant StraightArgsReader
             * @see readerParams
             */
            readerType: 'ReaderUnifiedSBIS',
            /**
             * @cfg {Object} Параметры ридера
             * @editor TReaderParamsEditor
             * @example
             * <pre>
             *    readerParams: {
             *       dbScheme: '',
             *       linkedObject: 'Календарь',
             *       queryName: 'Список',
             *       format: 'test1Method',
             *       createMethodName: 'Список',
             *       readMethodName: 'Список',
             *       updateMethodName: 'Список',
             *       destroyMethodName: 'Список'
             *    }
             * </pre>
             * @see readerType
             */
            readerParams: TReaderParams,
            /**
             * @cfg {Boolean} Разрешить первичный запрос данных на бизнес-логике
             * @remark
             * При значении данной опции false представление данных построится без записей. В этом случае для заполнения
             * данными необходимо вызвать, например, метод {@link Deprecated/Controls/DataViewAbstract/DataViewAbstract#reload}.
             * @example
             * <pre>
             *     <option name="firstRequest">false</option>
             * </pre>
             */
            firstRequest: true,
            /**
             * @cfg {Boolean} Настройка режима постраничной навигации
             * @variant full полная загрузка
             * @variant parts постраничная загрузка
             * @variant '' нет постраничного вывода
             * @example
             * <pre>
             *    <option name="usePages">full</option>
             * </pre>
             * @see pageNum
             * @see rowsPerPage
             */
            usePages: '',
            /**
             * @cfg {Number} Текущая показанная страница
             * @example
             * <pre>
             *     <option name="pageNum">5</option>
             * </pre>
             * @see rowsPerPage
             * @see usePages
             */
            pageNum: 0,
            /**
             * @cfg {Number} Число записей на странице
             * @example
             * <pre>
             *     <option name="rowsPerPage">50</option>
             * </pre>
             * @see pageNum
             * @see usePages
             */
            rowsPerPage: 2,
            /**
             * @cfg {Array.<Array.<String|Boolean>>} Настройки сортировки
             * @remark
             * В каждом массиве первым элементом является имя сортируемого поля,
             * а вторым элементом - тип сортировки (true - по убыванию, false - по возрастанию).
             * @example
             * <pre>
             *     <options name="sorting" type="array">
             *        <options type="array">
             *           <option>Билет №</option>
             *           <option type="boolean">true</option>
             *        </options>
             *     </options>
             * </pre>
             * @see firstRequest
             * @see filterParams
             */
            sorting: null,
            /**
             * @cfg {Boolean} Ждать предыдущего запроса
             * @example
             * <pre>
             *     <option name="waitForPrevQuery">true</option>
             * </pre>
             */
            waitForPrevQuery: false,
            /**
             * @cfg {String} Поле иерархии
             * Это имя поля источника данных, по значению которого устанавливается иерархическая связь между записями.
             * @example
             * <pre>
             *     <option name="hierarchyField">Раздел</option>
             * </pre>
             */
            hierarchyField: ''
         }
      },
      isConfigured: function () {
         return this._options.readerParams.isConfigured();
      },
      /**
       * @returns {object} объект TDataSource без лишних полей
       */
      getRaw: function () {
         var object = {};

         for (var opt in this) {
            if (this.hasOwnProperty(opt)) {
               var
                  value = this[opt],
                  type = getType(value);
               if (!/^_/.test(opt) && type !== 'function') {
                  if (type === 'object') {
                     object[opt] = TDataSource.prototype.getRaw.apply(value);
                  } else {
                     object[opt] = value;
                  }
               }
            }
         }
         return object;
      }
   });
   return TDataSource;
});
