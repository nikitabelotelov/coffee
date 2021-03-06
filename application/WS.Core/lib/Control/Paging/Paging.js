/**
 * Created with JetBrains PhpStorm.
 * User: tm.baeva
 * Date: 15.04.13
 * Time: 14:26
 * To change this template use File | Settings | File Templates.
 */
define("Lib/Control/Paging/Paging", [
   "Core/Deferred",
   "Lib/Control/Control",
   "tmpl!Lib/Control/Paging/Paging",
   'html!Lib/Control/Paging/Pages_list',
   "css!Lib/Control/Paging/Paging",
   "i18n!Lib/Control/Paging/Paging"
], function(cDeferred, Control, dotTplFn, PagesListTpl) {

   "use strict";

   /**
    * @class Lib/Control/Paging/Paging
    * @extends Lib/Control/Control
    * @author Крайнов Д.О.
    * @control
    * @category Decorate
    * @public
    * @deprecated С версии 3.17.310 использование запрещено!
    */

   var Paging = Control.Control.extend(/** @lends Lib/Control/Paging/Paging.prototype */{
      /**
       * @event onPageChange При изменении страницы
       *
       * Происходит при смене текущей страницы: при клике по номеру страницы или стрелке перехода на другую страницу.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Number} number номер новой страницы
       * @param {Core/Deferred} deferred для режима частичной постраничной навигации.
       * Необходимо вызвать функцию на успех с аргументом типа Boolean: есть ли следующая страница.
       * @example
       * <pre>
       *    paging.subscribe('onPageChange', function(event, pageNumber){
       *       $ws.single.ControlStorage.getByName('table').setPage(page);
       *    });
       * </pre>
       */
      _dotTplFn: dotTplFn,
      $protected: {
         _options: {
            /**
             * @cfg {Number} Количество записей на странице
             *
             * Задает количество записей, отображаемых на одной странице
             * Изменяется методом setPageSize
             * <pre>
             *    paging.setPageSize(200);
             * </pre>
             */
            recordsPerPage : undefined,
            /**
             * @cfg {Number} Номер текущей страницы
             *
             * Номер текущей страницы, с которой необходимо построить навигацию
             * По умолчанию строится с первой, но если контрол, с которым работает пэйджинг заведомо изначально на другой странице, то потребуется указать этот параметр
             */
            currentPage : 1,
            /**
             * @cfg {Number} Общее количество записей
             *
             * Указывает контролу постраничной навигации начальное количество записей выборки
             * Для режима отображения полного пэйджинга задается числом (число записей в выборке)
             * <pre>
             *    recordsCount: 123
             * </pre>
             * Для режима отображения частичного пэйджинга задается true/false - есть ли следующая страница
             * <pre>
             *    recordsCount: true
             * </pre>
             */
            recordsCount : undefined,
            /**
             * @cfg {Number} Количество страниц для перехода
             *
             * Сколько страниц до и после текущей нужно отобразить для возможности перехода на них
             */
            pagesLeftRight : 3,
            /**
             * @cfg {Boolean} Использовать режим частичной навигации
             *
             * Задаёт какой режим навигации использовать: полный или частичный.
             * @see onPageChange
             * @see update
             */
            onlyLeftSide : false,
            /**
             * @cfg {Boolean} Отобржать стрелку "вперед"
             *
             * Отображать ли стрелку для перехода на следующую страницу
             */
            rightArrow : undefined
         },
         _listTpl: undefined, //Шаблон содержимого
         _block: [],          //содержит в себе массив с блоками
         _maxPage: 0,         //максимальная страница, на которую удалось дойти
         _hasAfterMax: true   //есть ли страницы после последней известной страницы
      },
      $constructor: function(){
         if(this._options.onlyLeftSide && this._options.rightArrow === undefined && (this._options.recordsCount === undefined ||
               this._options.currentPage === undefined || this._options.recordsPerPage === undefined)){
            throw new Error('Не указано количество записей для Control/Paging');
         }
         this._options.recordsCount = parseInt(this._options.recordsCount, 10);
         this._options.currentPage = parseInt(this._options.currentPage, 10);
         this._options.recordsPerPage = parseInt(this._options.recordsPerPage, 10);
         this._options.pagesLeftRight = parseInt(this._options.pagesLeftRight, 10);
         this._publish('onPageChange');
         this._block = this._container.find('.ws-paging');
         this._maxPage = this._options.currentPage;
         this._build();
      },
      /**
       * Добавляет новый контейнер для отрисовки
       *
       * @param {jQuery} container Корректный jQuery-элемент, содержащий в себе коллекцию элементов для отрисовки
       */
      addContainer: function(container){
         for(var i = 0, len = container.length; i < len; ++i){
            this._container.push(container[i]);
            container[i].wsControl = this;
            this._block.push($('<div class="ws-paging"></div>'));
            container.eq(i).append(this._block[this._block.length - 1]);
         }
         this._build();
      },

      /**
       * Переопределённый метод инициализации контейнера, в отличие от родительского, содержит больше фигурных скобок и поддержку нескольких id в строке
       * @param {Object} cfg
       */
      _initContainer: function(cfg){
         if('element' in cfg){
            if(typeof(cfg.element) == 'string'){ // Given an IDs
               var ids = cfg.element.split(',');
               this._container = $();
               for(var i = 0; i < ids.length; ++i){
                  this._container.push($('#' + ids[i].trim()).get(0));
               }
            }
            else{
               if('jquery' in cfg.element){// Given jQuery object
                  this._container = cfg.element;
               }
               else{
                  if(cfg.element.nodeType){ // Given HTMLElement
                     this._container = $(cfg.element);
                  }
               }
            }
         }
      },

      /**
       * Проверяет правильность контейнера. В отличие от стандартного, проверяет на равенство 1, а больше 0
       */
      _isCorrectContainer: function(){
         return this._container !== undefined && ('jquery' in this._container) && this._container.length >= 1;
      },

      /**
       *
       * Обновить отображение навигации.
       * Обновляет отображение навигации, включая установку текущей страницы и количества записей.
       * @param {Number} [currentPage] Текущая страница.
       * @param {Number} [recordsCount] Общее количество записей.
       * @param {boolean} [rightArrow] Отображать стрелку перехода на следующую страницу. Только для режима частичной навигации.
       * @example
       * <pre>
       *    //при изменении фильтров обновим пэйджинг
       *    table = $ws.single.ControlStorage.getByName('tableView');
       *    table.subscribe('onFilterChange', function(){
       *       var table = this,
       *           rs = table.getRecordSet();
       *       paging.update(rs.getPageNumber(), rs.hasNextPage());
       *    })
       * </pre>
       * @see onlyLeftSide
       */
      update : function(currentPage, recordsCount, rightArrow){
         if(this._options.currentPage == currentPage && recordsCount === undefined &&
               rightArrow === undefined){
            return;
         }
         if(rightArrow !== undefined){
            var page = currentPage || this._options.currentPage;
            if(page >= this._maxPage || !rightArrow){
               this._maxPage = page;
               this._hasAfterMax = !!rightArrow;
            }
         }
         currentPage = currentPage !== undefined ? currentPage : this._options.currentPage;
         recordsCount = recordsCount !== undefined ? recordsCount : this._options.recordsCount;
         this._options.currentPage = currentPage;
         this._options.recordsCount = recordsCount;
         this._options.rightArrow = rightArrow;
         this._build();
      },

      /**
       * Сбрасывает максимальную страницу. Необходимо, к примеру, при смене фильтрации
       */
      clearMaxPage: function(){
         this._maxPage = 0;
         this._hasAfterMax = true;
         this._build();
      },

      /**
       * Обработчик получения новой информации о количестве страниц / или наличия следующей страницы
       * @param {Number} pageNum Номер страницы
       * @param {Array|Boolean|Number} res Новая информация
       * @private
       */
      _pageLoaded: function(pageNum, res){
         if(res instanceof Object){
            this.update(res[0], res[1], res[2]);
         }
         else{
            this.update(pageNum, undefined, res);
         }
      },

      /**
       * Обрабатывает клика по элементу
       * @param {Object} event Событие, содежит в data pageNum - номер страницы, кото
       * @return {Boolean}
       * @private
       */
      _blockClick: function(event) {
         var target = $(event.currentTarget),
             pageNum;
         if (!this._options.enabled || !target.hasClass('ws-paging-active')) {
            return false;
         }

         if (target.hasClass('ws-paging-first')) {
            pageNum = 1;
         } else if (target.hasClass('ws-paging-prev')) {
            pageNum = this._options.currentPage - 1;
         } else if (target.hasClass('ws-paging-next')) {
            pageNum = this._options.currentPage + 1;
         } else if (target.hasClass('ws-paging-end')) {
            pageNum = this._options.onlyLeftSide ? 0 : Math.ceil(this._options.recordsCount / this._options.recordsPerPage);
         } else {
            pageNum = parseInt(target.text(), 10);
         }
         this.setPage(pageNum);
      },

      /**
       * Функция :
       *  - очищает все кнопки
       *  - создаёт их заново
       */
      _build : function(){
         if (this._listTpl) {
            if (!this.isDestroyed()) {
               this._buildCallback();
            }
         }
         else {
            if(!this.isDestroyed()) {
               this._listTpl = PagesListTpl;
               this._buildCallback();
            }
         }
      },

      _buildCallback: function() {
         var
            maxPage,
            countPages,
            pagesTpl;
         this._block.empty();
         this._container.show();
         maxPage = (this._options.onlyLeftSide ? this._maxPage : Math.ceil(this._options.recordsCount / this._options.recordsPerPage));
         countPages = Math.max(this._options.currentPage, maxPage);
         if(countPages <= 1 && (!this._options.onlyLeftSide || !this._options.rightArrow)){
            this._container.hide();
         } else {
            pagesTpl = $(this._listTpl({ countPages: countPages, context: this, block: this._block, options: this._options }));
            $(pagesTpl).bind('click', this._blockClick.bind(this));
            this._block.append(pagesTpl);
         }
      },

      /**
       *
       * Метод установки набора данных.
       * Компонент навигации следит за изменением страницы в установленном наборе самостоятельно.
       * Иначе придется менять текущую страницу из кода.
       * @param {Deprecated/RecordSet} recordset набор данных, связанный с постраничной навигацией
       * @example
       * <pre>
       *    //установим пэйджингу рекордсет таблицы
       *    table = $ws.single.ControlStorage.getByName('tableView');
       *    paging.setRecordSet(table.getRecordSet());
       * </pre>
       */
      setRecordSet: function(recordset){
         var self = this;
         recordset.subscribe('onPageChange', function(eventState, page){
            self.update(page + 1);
         });
      },

      /**
       *
       * Установить размер страницы.
       * @param {Number} count Количество записей на странице.
       * @example
       * <pre>
       *    paging.setPageSize(200);
       * </pre>
       */
      setPageSize: function(count){
         this._options.recordsPerPage = count;
         this._build();
      },

      /**
       * Устанавливает текущую страницу
       * @param pageNum Номер устанавливаемой страницы
       */
      setPage: function(pageNum) {
         if (typeof pageNum === 'number') {
            var result = new cDeferred();
            if(this._options.onlyLeftSide){
               result.addCallback(this._pageLoaded.bind(this, pageNum));
            }
            else{
               this.update(pageNum);
            }
            this._notify('onPageChange', pageNum, result);
            return false;
         }
      },

      /**
       * Возвращает номер текущей страницы
        * @returns {Number}
       */
      getPage: function() {
         return this._options.currentPage;
      },
      /**
       * Устанавливает номер текущей страницы. Внимание, только номер!
       * Сделано для табличного представления, отображения только выбранных записей (showSelection)
       * @private
       * @param pageNum Номер устанавливаемой страницы
       */
      setCurrentPage: function(pageNum) {
         this._options.currentPage = pageNum;
      },
      destroy: function () {
         if (this._block) {
            this._block.empty().remove();
            this._block = null;
         }
         Paging.superclass.destroy.apply(this, arguments);
      }

   });

   return Paging;

});
