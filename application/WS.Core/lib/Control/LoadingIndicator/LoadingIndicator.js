/**
 * Модуль "Компонент индикатор".
 *
 * @description
 */
define('Lib/Control/LoadingIndicator/LoadingIndicator',
   [
   "Core/WindowManager",
   'Core/helpers/isNewEnvironment',
   "Lib/Control/Control",
   "tmpl!Lib/Control/LoadingIndicator/LoadingIndicator",
   "Lib/Control/Window/Window",
   "Lib/Control/ProgressBar/ProgressBar",
   "Lib/Control/ModalOverlay/ModalOverlay",
   "Core/helpers/String/escapeTagsFromStr",
   'Env/Env',
   "Core/Deferred",
   "css!Lib/Control/LoadingIndicator/LoadingIndicator",
   "i18n!Lib/Control/LoadingIndicator/LoadingIndicator"
],
   function(WindowManager, isNewEnvironment, Control, dotTplFn, Window, ProgressBar, ModalOverlay, escapeTagsFromStr, Env, Deferred) {

   'use strict';

    var DEFAULT_DELAY = 2000;
    var IndicatorsWindow = Window.extend({
       $protected : {
          _isIndicator: true,
          _isIndicatorVisible: true,
          _options: {
             resizable  : false,
             border     : false,
             autoHeight : true,
             autoWidth  : true
          },
          _keysWeHandle : [] //индикатор загрузки не должен реагировать на нажатие клавиш
       },

       $constructor: function() {
          //Отписываемся от клика на модальный оверлей - базовый класс Window на него подписывается, и закрывается при клике
          //индикатор загрузки не должен закрываться при клике не оверлей или не эскейпе
          this.unsubscribeFrom(ModalOverlay, 'onClick');
          this._window.addClass('ws-LoadingIndicator__window');
       },

       //т.к. loadingIndicator не перевели на vdom, рассчитываем его zindex отдельной логикой
       _getNewZIndex: function () {
          var vDomManagerController = requirejs.defined('Controls/Popup/Manager/ManagerController') && requirejs('Controls/Popup/Manager/ManagerController');
          var popupItems = vDomManagerController && vDomManagerController.getContainer() && vDomManagerController.getContainer()._popupItems;
          var zIndexStep = 10;
          if (isNewEnvironment() && popupItems) {
             var zIndex = popupItems.getCount() * zIndexStep + (zIndexStep / 2); //Выше всех текущих окон, но ниже следующего открываемого
             // Т.к. индикатор старый, то сообщим старому менеджеру о его zIndex'e, чтобы старый оверлей мог работать по своей старой логике
             WindowManager._modalIndexes.push(zIndex);
             return zIndex;
          }
          return IndicatorsWindow.superclass._getNewZIndex.apply(this, arguments);
       },

      //Окно загрузки не должно активироваться, и забирать у кого-либо фокус
       _moveFocusToSelf: function () {},
       onBringToFront: function () {},
       _activate: function () {},
       _restoreLastActiveOnHide: function () {},

       isMovableToTop: function() {
          var
             result = true,
             stack = WindowManager.getStack();
          for(var i = stack.length - 1; i >= 0; i--) {
             var stackItem = stack[i];
             if(stackItem.window._isIndicator) {
                if(stackItem.window === this) {
                   // Имеющийся индикатор. Результат зависит от того, видели мы раньше индикатор или нет.
                   return result;
                } else if(stackItem.visible()) {
                   // Мы встретили видимый индикатор.
                   result = false;
                } else {
                   // Мы встретили скрытый индикатор.
                   result = null;
                }
             }
          }
          // Новый индикатор, вставляем в стек.
          return true;
       }
    });
   
      var toggleDelayClasses = function(add) {
         var body = $(Env.constants.$body);

         if (this._options.showInWindow) {
            if (add) {
               /* Ненадо скрывать overlay, если он уже показан */
               if (!ModalOverlay.getState()) {
                  body.addClass('ws-LoadingIndicator-overlay-hidden')
               }
               body.addClass('ws-LoadingIndicator-hidden')
            } else {
               body.removeClass('ws-LoadingIndicator-hidden ws-LoadingIndicator-overlay-hidden');
            }
         } else {
            //Индикаторы, которые отображатся в окне, скрываем отдельно
            this._loadingIndicator.toggleClass('ws-LoadingIndicator-hidden', add);
         }
      };

      /**
       * Возвращает путь с готовым блоком картинки или sprite
       * @param {String} img Ссылка на картинку или sprite
       * @returns {String}
       */
      var getImageBlock = function(img) {
         var imgBlock = document.createElement('div');
         var isSpriteImage = (img.indexOf('sprite:') !== -1);

         if (!isSpriteImage) {
            $(imgBlock).append('<img src="' + img + '" />');
         }
         else {
            $(imgBlock).addClass(img.replace("sprite:", ""));
         }
         return imgBlock;
      };

      /* Окно при показе всегда показывает overlay,
         но, т.к. индикатор показывается с задержкей,
         этот overlay не должен показываться / подниматься в стэке z-index'ов.
         Поэтому после показа окна, надо вернуть z-index, который был до отображения. */
      var saveOverlayZIndex = function(self) {
         self._overlayZIndex = ModalOverlay.getZIndex();
      };
      
      var applySavedZIndexToOverlay = function(self) {
         if (self._overlayZIndex) {
            if (self._options.delay && ModalOverlay.getState()) {
               ModalOverlay._setZIndex(self._overlayZIndex);
            }
            self._overlayZIndex = null;
         }
      };
   
      /**
    * @class Lib/Control/LoadingIndicator/LoadingIndicator
    * @extends Lib/Control/Control
    * @author Крайнов Д.О.
    * @control
    * @public
    * @category Decorate
    * @deprecated Используйте классы {@link SBIS3.CONTROLS/WaitIndicator} или {@link Core/Indicator}.
    */
    var LoadingIndicator = Control.Control.extend(/** @lends Lib/Control/LoadingIndicator/LoadingIndicator.prototype */{
      $protected: {
         _loadingPic: '',        //контейнер для картинки
         _loadingIndicator: '',  //контейнер для текста, содержит контейнер с картинкой
         _loadingContainer: '',  //контейнер текста индикатора и картинки загрузки
         _loadingText: '',       //текст индикатора
         _picture: '',           //картинка, используется для смены src в методе
         _myWindow: null,        //окно, если нужно
         _myProgressBar: null,
         _progressBarContainer:'',
         _windowHeight: undefined,
         _windowWidth: undefined,
         _isVisible: false,

         _delay: null,

         _options: {
            /**
             * @cfg {String} Сообщение индикатора
             *
             * Опция задаёт текст, выводимый пользователю индикатором.
             * @example
             * Создание индикатора загрузки со своим ообщением:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        //зададим текст выводимого пользователю сообщения
             *        message: 'Ждите, идёт сохранение документа...'
             *     });
             *     setTimeout(function(){
             *        ind.hide();
             *     }, 2000);
             * </pre>
             * @see setMessage
             * @translatable
             */
            message: rk('Загрузка'),
            /**
             * @cfg {String} Картинка индикатора
             *
             * Опция замены картинки индикатора загрузки. Вместо стандартной иконки можно указать свою картинку
             * или файл с расширением *.gif.
             * @example
             * Созданием индикатора загрузки с заменой стандартной иконки:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        message: 'Ждите, идёт сохранение документа...',
             *        //указываем путь до картинки относительно корня сайта, т.е. до папки куда конвертируем ресурсы
             *        loadingPicture:'/resources/Indikator_zagruzki/Time.png'
             *     });
             *     setTimeout(function(){
             *        ind.hide();
             *     }, 2000);
             * </pre>
             * @see isShowLoadingPicture
             * @see setImg
             */
            loadingPicture: '/cdn/img/common/1.0.0/ajax-loader-indicator.gif',
            /**
             * @cfg {Boolean} Показывать ли картинку
             *
             * Опция задаёт наличие/отсутствие картинки индикатора загрузки.
             * Возможные значения:
             * <ol>
             *    <li>true - показывать картинку;</li>
             *    <li>false - не показывать, будет только текст без стандартной иконки.</li>
             * </ol>
             * @example
             * Создание индикатора загрузки только с сообщением:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        message: 'Ждите, идёт сохранение документа...',
             *        //отключаем картинку индикатора загрузки
             *        isShowLoadingPicture: false
             *     });
             *     setTimeout(function(){
             *        ind.hide();
             *     }, 2000);
             * </pre>
             * @see loadingPicture
             * @see setImg
             * @see message
             */
            isShowLoadingPicture: true,
            /**
             * @cfg {Boolean} Выводить ли индикатор в отдельном окне
             *
             * Возможные значения:
             * <ol>
             *    <li>true - выводить индикатор в отдельном окне;</li>
             *    <li>false - выводить индикатор в этом же окне. Необходимо позаботиться об элементе, на котором отрисовывать индикатор.</li>
             * </ol>
             * @example
             * Создание индикатора загрузки в том же окне:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        message: 'Ждите, идёт сохранение документа...',
             *        //отменяем вывод индикатора в отдельном окне
             *        showInWindow: false,
             *        //задаём элемент, на котором будет отрисован индикатор. Необходимо создать заранее
             *        element: 'loadingIndicator'
             *     });
             *     setTimeout(function(){
             *        ind.hide();
             *     }, 2000);
             * </pre>
             * @see modal
             * @see getWindow
             */
            showInWindow: true,
            /**
             * @cfg {Number} Высота индикатора
             *
             * @see width
             */
            height: 57,
            /**
             * @cfg {Number|String} Ширина индикатора
             *
             * @see height
             */
            width: '100%',
            /**
             * @cfg {Boolean} Модален ли индикатор
             *
             * Работает только для индикатора, выводимого в отдельном окне.
             * Возможные значения:
             * <ol>
             *    <li>true - индикатор модален;</li>
             *    <li>false - не модален.</li>
             * </ol>
             * @example
             * Создание индикатора загрузки в немодальном окне:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        message: 'Ждите, идёт сохранение документа...',
             *        showInWindow: true,
             *        //отменяем модальность окна индикатора загрузки
             *        modal: false
             *     });
             *     setTimeout(function(){
             *        ind.hide();
             *     }, 2000);
             * </pre>
             * @see showInWindow
             * @see getWindow
             */
            modal: true,
            /**
             * @cfg {Boolean} Отображать ли состояние
             *
             * Опция включения режима progressBar - индикатор загрузки в виде полосы, заполняемой цветом в соответствии
             * с состоянием готовности чего-либо.
             * Возможные значения:
             * <ol>
             *    <li>true - включить режим progressBar: отображать состояние индикатора. При этом необходимо настроить
             *    отображение состояния индикатора методом {@link setProgress};</li>
             *    <li>false - не отображать состояние.</li>
             * </ol>
             * @example
             * Создание индикатора загрузки в режиме progressBar:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        message: 'Сообщение',
             *        //включаем отображение состояния индикатора
             *        progressBar: true
             *     });
             *     var progress = 0;
             *     var int = setInterval(function () {
             *        ind.setProgress((progress += 25));
             *        ind.setMessage('Прогресс: ' + progress + '%');
             *        if (progress === 100) {
             *           clearInterval(int);
             *           ind.hide();
             *        }
             *     }, 500);
             * </pre>
             * @see showPercent
             * @see setProgress
             */
            progressBar: false,
            /**
             * @cfg {Boolean} Показывать ли проценты
             *
             * Опция задаёт наличие/отсутствие указания процентного состояния индикатора загрузки.
             * Возможные значения:
             * <ol>
             *    <li>true - отображать состояние индикатора в процентах;</li>
             *    <li>false - не отображать состояние в процентах.</li>
             * </ol>
             * @example
             * Создание индикатора загрузки в режиме progressBar с отменом показа процентного состояния:
             * <pre>
             *     var ind = new LoadingIndicator ({
             *        message: 'Сообщение',
             *        //включаем отображение состояния индикатора
             *        progressBar: true,
             *        //отключаем указание процентного состояния индикатора загрузки
             *        showPercent: false
             *     });
             *     var progress = 0;
             *     var int = setInterval(function () {
             *        ind.setProgress((progress += 25));
             *        //отображаем процентное состояние индикатора в тексте сообщения
             *        ind.setMessage('Прогресс: ' + progress + '%');
             *        if (progress === 100) {
             *           clearInterval(int);
             *           ind.hide();
             *        }
             *     }, 500);
             * </pre>
             * @see progressBar
             */
            showPercent: true,
            /**
             * @cfg {Boolean} Показывать индикатор с задержкой
             */
            delay: false
         }
      },
      $constructor: function(){
         if (!this._isNewEnvironment()) {
            this._redraw();
         }
      },
      getParent: function(){
         return this._parent;
      },
      isVisible: function() {
         return this._isVisible;
      },
      _setWindowVisibleProperty: function(visible) {
         var
            window = this.getWindow();
         if(window) {
            window._isIndicatorVisible = visible;
         }
      },
   
      _showDelay: function() {
         var self = this;
   
         if ((!this._delay || this._delay.isReady()) && this._options.delay) {
            toggleDelayClasses.call(this, true);
            WindowManager._delayedIndicator = this;
            this._getDelay().addCallback(function(res) {
               toggleDelayClasses.call(self, false);
               WindowManager._delayedIndicator = null;
               if (ModalOverlay.getState()) {
                  ModalOverlay.adjust();
               }
               return res;
            });
         }
      },
   
      _clearDelay: function() {
         if(this._delay) {
            if (WindowManager._delayedIndicator === this) {
               toggleDelayClasses.call(this, false);
            }
            this._delay.cancel();
            this._delay = null;
         }
      },

      _getDelay: function() {
         /* Делаю через deferred, т.к. ожидать отображение индикатора
            может сразу несколько подписчиков */
         return (!this._delay || this._delay.isReady()) ?
            (this._delay = Deferred.fromTimer(DEFAULT_DELAY)) :
             this._delay;
      },

      setDelay: function(delay) {
         this._options.delay = Boolean(delay);
      },

      show: function(){
         if (!this._isVisible) {
            this._showDelay();
            if (this._options.showInWindow) {
               if (this._myWindow) {
                  saveOverlayZIndex(this);
                  this._myWindow._isShow = false;
                  this._myWindow.show(true);
                  this._myWindow.moveWindowToCenter();
                  applySavedZIndexToOverlay(this);
               }
            } else {
               this._loadingIndicator.show();
            }
            this._isVisible = true;
         }
      },
      hide: function(){
         if (this._isVisible) {
            this._clearDelay();
            if (this._options.showInWindow){
               this._myWindow && this._myWindow.hide();
            } else {
               this._loadingIndicator.hide();
            }
            if (WindowManager.getCurrentVisibleIndicator() === this) {
               WindowManager.setCurrentVisibleIndicator(null);
            }
            this._isVisible = false;
         }
      },
      /**
       *
       * Установить текст сообщения индикатора загрузки.
       * Метод установки текста сообщения индикатора загрузки; замены текста сообщения, установленного опцией {@link message}.
       * Если текст не менять, то по умолчанию будет "Загрузка".
       * @param {String} message Текст сообщения.
       * @example
       * Создание индикатора загрузки в режиме progressBar с отменом показа процентного состояния:
       * <pre>
       *     var ind = new LoadingIndicator ({
       *        message: 'Сообщение',
       *        progressBar: true,
       *        showPercent: false
       *     });
       *     var progress = 0;
       *     var int = setInterval(function () {
       *        ind.setProgress((progress += 25));
       *        //устанавливаем новое сообщение индикатора с отображением процентного состояния в нём
       *        ind.setMessage('Прогресс: ' + progress + '%');
       *        if (progress === 100) {
       *           clearInterval(int);
       *           ind.hide();
       *        }
       *     }, 500);
       * </pre>
       * @see message
       */
      setMessage: function(message){
         if (this._isNewEnvironment()) {
            requirejs(['Controls/Popup/Manager/ManagerController'], function(ManagerController) {
               ManagerController.getIndicator().show({message: message});
            });
         } else {
            if(this._loadingText){
               this._loadingText.html(escapeTagsFromStr(message, ['script']));
               if(this._isVisible && this._myWindow) {
                  this._recalcWindowSize(this._myWindow._window);
               }
            }
         }
      },
      _recalcWindowSize: function(wind){
         var
               self = this,
               fRes = function(){
                  self._windowHeight = wind.height() || self._windowHeight;
                  self._windowWidth = wind.width() || self._windowWidth;
               };
         if(/none/.test(wind.css('display'))){
            wind.css({
               'display': 'block',
               'visibility': 'hidden'
            });
            fRes();
            wind.css({
               'display': 'none',
               'visibility': 'visible'
            });
         }
         else{
            fRes();
            this._myWindow.moveWindowToCenter();
         }
      },
       /**
        *
        * Закрыть индикатор загрузки.
        * @example
        * Создание индикатора загрузки с последующим закрытием его через 2 секунды:
        * <pre>
        *     var ind = new LoadingIndicator ({
        *        message: 'Ждите, идёт сохранение документа...'
        *     });
        *     setTimeout(function(){
        *        //закрываем индикатор загрузки с уничтожением экземпляра класа
        *        ind.close();
        *     }, 2000);
        * </pre>
        */
      close : function LoadingIndicatorClose(){
         this.destroy();
      },
      /**
       *
       * Установить/заменить картинку для индикатора загрузки.
       * @param {String} img Путь к картинке относительно корня сайта.
       * @example
       * Создание индикатора загрузки, меняющего иконку через 3 секунды:
       * <pre>
       *     var ind = new LoadingIndicator ({
       *        message: 'Ждите, идёт сохранение документа...'
       *     });
       *     setTimeout(function(){
       *        //меняем картинку через 3 секунды
       *        ind.setImg('/resources/Indikator_zagruzki/Time.png');
       *     }, 3000);
       *     setTimeout(function(){
       *        //закрываем индикатор загрузки с уничтожением экземпляра класа
       *        ind.hide();
       *     }, 6000);
       * </pre>
       * @see loadingPicture
       * @see isShowLoadingPicture
       */
      setImg: function(img){
         $(this._picture).removeClass().empty();
         $(this._picture).append(getImageBlock(img));
      },
      _redraw: function(){
         // Уже не пустой
         if (this._myWindow) {
            this._myWindow.close();
         }
         // Уже не пустой
         if (this._container && ( this._progressBarContainer || this._loadingIndicator)) {
            this._container.html('');
         }
         if (this._options.showInWindow) {
            this._container = $(dotTplFn(this._options));
            this._renderInd();
            var self = this;
            this._showDelay();
            
            saveOverlayZIndex(self);
            this._myWindow = new IndicatorsWindow({
               modal    : this._options.modal,
               animatedWindows: false,
               _openFromAction: true, //Не пишем ошибку в консоль на vdom в платформенных компонентах
               handlers : {
                  onDestroy: function() {
                     self._myWindow = null;
                  },

                  onReady: function(){
                     this._myIndicator = self;
                     this.getContainer().append('<div class="ws-win-loadingIndicator"></div>');
                     this.getContainer().find('.ws-win-loadingIndicator').append(self._container);
                     self._windowHeight = this._window.height();
                     self._windowWidth = this._window.width();
                  }
               }
            });
            applySavedZIndexToOverlay(self);
         } else {
            this._container.append($(dotTplFn(this._options)));
            this._renderInd();
            this._showDelay();
         }
      },
      /**
       * рисует индикатор
       */
      _renderInd: function(){
         this._loadingText = this._container.find('.ws-LoadingIndicator__message');
         if(this._options.progressBar){
            this._progressBarContainer = this._container.find('.ws-progressbar-container');
            var self = this;
            this._myProgressBar = new ProgressBar({
               element: self._progressBarContainer,
               width: 289,
               showPercent: self._options.showPercent
            });
         }
         else{
            //если ширина в процентах
            if(typeof(this._options.width) === 'string'){
               var str = this._options.width;
               if(str[str.length-1] != '%'){
                  this._options.width = parseInt(this._options.width,10) + 'px';
               }
            }else{
               this._options.width = this._options.width + 'px';
            }

            this._loadingIndicator = this._container.find('.ws-loading');
            this._loadingContainer = this._loadingIndicator.find('.ws-LoadingIndicator__loadingContainer');
            this._loadingIndicator.css({
               'text-align': 'center',
               'height': this._options.height,
               'width': this._options.showInWindow ? '100%' : undefined
            });
         }
         this._notify('onReady');
      },
       /**
        *
        * Получить окно индикатора
        * @returns {IndicatorsWindow|*}
        * @deprecated Не использовать
        */
      getWindow : function(){
         return this._myWindow;
      },
       /**
        *
        * Установить отображение изменения состояния индикатора загрузки.
        * @param {Number} percent Шаг отображения прогрузки.
        * @returns {Boolean} Возвращает признак, применилось ли состояние.
        * Возможные значения:
        * <ol>
        *    <li>true - состояние применилось;</li>
        *    <li>false - не удалось применить. Например, при попытке установить 125 процентов.</li>
        * </ol>
        * @example
        * Создание индикатора загрузки в режиме progressBar:
        * <pre>
        *     var ind = new LoadingIndicator ({
        *        message: 'Сообщение',
        *        //включаем отображение состояния индикатора
        *        progressBar: true
        *     });
        *     var progress = 0;
        *     var int = setInterval(function () {
        *        //устанавливаем отображение изменения состояния индикатора загрузки
        *        ind.setProgress((progress += 25));
        *        ind.setMessage('Прогресс: ' + progress + '%');
        *        if (progress === 100) {
        *           clearInterval(int);
        *           ind.hide();
        *        }
        *     }, 500);
        * </pre>
        * @see progressBar
        */
      setProgress : function(percent){
         percent = parseInt(percent, 10);
         if(percent >= 0 && percent <= 100 && this._myProgressBar !== null){
            this._myProgressBar.setProgress(percent);
            return true;
         }
         else {
            return false;
         }
      },
      destroy: function(){
         this._clearDelay();
         this.hide();
         LoadingIndicator.superclass.destroy.apply(this, arguments);
         this._myWindow && this._myWindow.destroy();
         this._myProgressBar && this._myProgressBar.destroy();
      }
   });

   function canShow(indic) {
      var
         seenVisibleIndicatorBefore = false,
         stack = WindowManager.getStack();
      for(var i = stack.length - 1; i >= 0; i--) {
         var stackItem = stack[i];
         if(stackItem.window._isIndicator) {
            if(stackItem.window === indic) {
               return !seenVisibleIndicatorBefore;
            } else if(stackItem.visible()) {
               seenVisibleIndicatorBefore = true;
            }
         }
      }
      // new indicator
      return true;
   }

   function runWithLock(lockName, fn) {
      return function() {
         if (!this[lockName]) {
            this[lockName] = true;
            try {
               return fn.apply(this, arguments);
            }
            finally {
               this[lockName] = false;
            }
         }
      };
   }

   var wsLoadingIndicator = LoadingIndicator.extend({
      $protected: {
         _showing: false,
         _hiding: false,
         _preventKeyDown: null,
         _keyboardLocked: false
      },

      $constructor: function() {
         this._preventKeyDown = function(e) {
            var
               F5 = 116,
               F12 = 123,
               //блокировать клавиатуру можно только тогда, когда индикатор показывается в отдельном окне,
               //zIndex которого выше zIndex-а всего остального.
               //если же индикатор лежит не в окне, а в своём контейнере, то блокировать клавиатуру не нужно,
               //потому что этот контейнер, скорее всего, немодальный
               // на вдом _myWindow нет, т.к. показывается всегда новый индикатор. ставлю защиту
               zIndex = this._options.showInWindow && this._myWindow ? this._myWindow.getZIndex() : 0;


               if (e.keyCode !== F5 && e.keyCode !== F12 && zIndex >= this._getMaxZIndex()) {
                  if (e.preventDefault) {
                     e.preventDefault();
                     e.stopPropagation();
                  } else {
                     e.returnValue = false;
                  }
               }
            }.bind(this);
      },

      _getMaxZIndex: function() {
         //В новом окружении смотрим z-index через мендежер-контейнер(умножаем на 10 так как это шаг в итерировании окон по z-index`у)
         //TODO Нужно вынести в константу переменную для итерирования z-index Ошибка: https://online.sbis.ru/opendoc.html?guid=65d9a0d7-2a96-4e64-8844-45243bc0a1db
         if (isNewEnvironment()) {
            var Controller = require('Controls/Popup/Manager/ManagerController');
            return Controller.getContainer()._popupItems.getCount() * 10;
         } else {
            return WindowManager.getMaxZIndex();
         }
      },

      _toggleKeyboardLocked: function(toggle) {
         if (this._keyboardLocked !== toggle) {
            this._keyboardLocked = toggle;
            if (toggle) {
               if (document.addEventListener) {
                  document.addEventListener('keydown', this._preventKeyDown, true);
               }
               else {
                  document.attachEvent('onkeydown', this._preventKeyDown);
               }
            } else {
               if (document.removeEventListener) {
                  document.removeEventListener('keydown', this._preventKeyDown, true);
               }
               else {
                  document.detachEvent("onkeydown", this._preventKeyDown);
               }
            }
         }
      },

      _initComplete: function() {
         // поместим индикатор на верхушку стэка
         // свойство visible содержит состояние как его ожидает пользователь индикатора
         wsLoadingIndicator.superclass._initComplete.apply(this, arguments);
         this.show();
      },

      hide: function() {
         if (this._isNewEnvironment()) {
            requirejs(['Controls/Popup/Manager/ManagerController'], function(ManagerController) {
               ManagerController.getIndicator().hide();
            });
         } else {
            runWithLock('_hiding', function() {
               if (this._options.showInWindow) {
                  this._setWindowVisibleProperty(false);
                  // если текущий индикатор - видимый
                  if (this == WindowManager.getCurrentVisibleIndicator()) {
                     // скроем его недекорированным методом
                     wsLoadingIndicator.superclass.hide.apply(this, arguments);
                  }
               } else {
                  wsLoadingIndicator.superclass.hide.apply(this, arguments);
               }

               this._toggleKeyboardLocked(false);
            }).call(this);
         }
      },

      show: function() {
         if (this._isNewEnvironment()) {
            requirejs(['Controls/Popup/Manager/ManagerController'], function (ManagerController) {
               ManagerController.getIndicator().show({delay: 2000});
            });
         } else {
            runWithLock('_showing', function() {
               if (this._options.showInWindow) {
                  if (this._myWindow) {
                     this._setWindowVisibleProperty(true);
                     if (canShow(this._myWindow)) {
                        WindowManager._pendingIndicator = this;
                        // скроем текущий видимый индикатор (если есть)
                        var
                           currentVisibleIndicator = WindowManager.getCurrentVisibleIndicator();
                        if (currentVisibleIndicator && this !== currentVisibleIndicator) {
                           // используем недекорируемый метод чтобы не трогать желаемое состояние
                           wsLoadingIndicator.superclass.hide.apply(currentVisibleIndicator, arguments);
                        }
                        // покажем текущий
                        wsLoadingIndicator.superclass.show.apply(this, arguments);
                        WindowManager.setCurrentVisibleIndicator(this);
                        WindowManager._pendingIndicator = null;
                     } else {
                        // Поднимем его в стеке насколько можно
                        WindowManager.pushUp(this._myWindow);
                     }
                  }
               } else {
                  wsLoadingIndicator.superclass.show.apply(this, arguments);
               }

               this._toggleKeyboardLocked(true);
            }).call(this);
         }
         this._toggleKeyboardLocked(true);
      },

      destroy: function() {
         if (this._isNewEnvironment()) {
            requirejs(['Controls/Popup/Manager/ManagerController'], function(ManagerController) {
               ManagerController.getIndicator().hide();
            });
         } else {
            this._toggleKeyboardLocked(false);

            WindowManager.popBack(this._myWindow);
            if(this._myWindow) {
               delete this._myWindow._myIndicator;
            }
         }
         wsLoadingIndicator.superclass.destroy.apply(this, arguments);
      },
      _isNewEnvironment: function() {
         // Отключил показ вдомных индикаторов, открываемых через старые контролы.
         // Сейчас получается разница в логике, новые индикаторы показываются всегда выше всех
         // Старые показываются выше окон, открытых на текущий момент
         // В старых шаблонах пользователи написали код с расчетом на такое поведение, что их окно может открыться поверх индикатора.
         return false;
      }
   });

   wsLoadingIndicator.toggleIndicator = (function () {
         var indicInstance;
         return function indicatorVisible(toggle, delay) {
            indicInstance = indicInstance || new wsLoadingIndicator({
               message: rk('Пожалуйста, подождите…')
            });
            if (!!toggle) {
               // Если передали Deferred
               if (toggle instanceof Deferred) {
                  // 1) Если он еще не готов.
                  // 2) toggle может быть в цепочке дефередов, такое может случиться, если какой-то callback
                  // в качестве результата вернул деферед, проверим, что цепочка не была запущена
                  if (!toggle.isReady() && !toggle.isCallbacksLocked()) {
                     // Покажем
                     indicInstance.setDelay(delay);
                     indicInstance.show();
                     // Подпишемся на завершение с любым статусом ...
                     toggle.addBoth(function (res) {
                        // и скроем индикатор
                        indicInstance.hide();
                        return res;
                     });
                  }
                  else { // Скроем индикатор, если Deferred сразу готов
                     indicInstance.hide();
                  }
               }
               else {
                  indicInstance.setDelay(delay);
                  indicInstance.show();
               }
            } else {
               indicInstance.hide();
            }
         }
      })();

   return wsLoadingIndicator;

});
