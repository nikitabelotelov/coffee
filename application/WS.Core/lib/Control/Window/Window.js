/**
 * Модуль "Компонент Окно".
 *
 * @description
 */
define('Lib/Control/Window/Window', [
   "Core/core-extend",
   'Core/helpers/isNewEnvironment',
   'require',
   "Core/core-instance",
   'Core/helpers/Function/callNext',
   'Core/helpers/Function/forAliveOnly',
   "Core/WindowManager",
   "Core/CommandDispatcher",
   'Env/Env',
   'Core/helpers/Hcontrol/doAutofocus',
   "Lib/Control/TemplatedAreaAbstract/TemplatedAreaAbstract",
   "Lib/Control/ModalOverlay/ModalOverlay",
   "Lib/FloatAreaManager/FloatAreaManager",
   "Lib/Mixins/LikeWindowMixin",
   "Lib/Mixins/PendingOperationParentMixin",
   "Core/Deferred",
   'Env/Event',
   'Core/dom/wheel',
   'Core/dom/getTouchEventCoords',
   'Core/dom/getTouchEventClientCoords',
   "css!Lib/Control/FloatArea/FloatArea",
   "i18n!Lib/Control/Window/Window"
], function(
   cExtend,
   isNewEnvironment,
   require,
   cInstance,
   callNext,
   forAliveOnly,
   WindowManager,
   CommandDispatcher,
   Env,
   doAutofocus,
   TemplatedAreaAbstract,
   ModalOverlay,
   FloatAreaManager,
   LikeWindowMixin,
   PendingOperationParentMixin,
   Deferred,
   EnvEvent,
   wheel,
   getTouchEventCoords,
   getTouchEventClientCoords
) {

   'use strict';

   var PADDING = 10,
       ANIMATION_LENGTH = 150;
   var defaultOptions = (Env.constants.defaultOptions || {})['Lib/Control/Window/Window'] || {};

   function withRecalc(func, self) {
      var result = function() {
         var res;
         try {
            this._updateCount++;
            res = func.apply(this, arguments);
         } finally {
            this._updateCount--;
            if (this._updateCount === 0 && res !== false) {

               this._updateCount++;//Защита от зацикливания расчёта...
               try {
                  this._adjustWindowPosition();
                  this._onResizeHandler();
               } finally {
                  this._updateCount--;
               }
            }
         }

         return res;
      };

      return self ? result.bind(self) : result;
   }

   /**
    * Класс контрола "Окно".
    * Можно перемещать по экрану с помощью мыши, менять его размер, разворачивать на весь экран.
    * У платформенных {@link modal модальных окон} минимальный z-index установлен как 1000, максимальный 32000.
    * При открытии окна происходит поиск контрола, для которого установлен CSS-класс ws-autofocus.
    * <ol>
    *    <li>Если подходящий контрол найден, на него устанавливается фокус методом {@link setActive}. В случае, если класс установлен на окно, фокус устанавливается на дочерний компонент окна согласно установленным tabindex. В случае, если класс установлен на компонент внутри окна, то поиск будет происходить внутри него;</li>
    *    <li>Если такой контрол не найден:
    *       <ul><li>В случае загрузки страницы активируется первый попавшийся компонент.</li></ul>
    *       <ul><li>В случае загрузки окна происходит поиск согласно установленным tabindex. Если таких компонентов несколько, фокус устанавливается на первый найденный. Если ничего активировать не удается, фокус устанавливается на само окно.</li></ul>
    *    </li>
    * </ol>
    * @class Lib/Control/Window/Window
    * @public
    * @extends Lib/Control/TemplatedAreaAbstract/TemplatedAreaAbstract
    * @author Крайнов Д.О.
    * @control
    */
   var Window = cExtend.mixin(TemplatedAreaAbstract, [LikeWindowMixin, PendingOperationParentMixin]).extend(/** @lends Lib/Control/Window/Window.prototype */{
      /**
       * @event onBeforeClose Перед закрытием окна
       *
       * Событие, возникающее перед закрытием окна.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Boolean} arg "результат работы" окна, заданный при вызове {@link Lib/Control/Window/Window#close}
       * @return При возврате false из события окно не будет закрыто.
       * @example
       * <pre>
       * window.subscribe('onBeforeClose', function(event, result) {
       *     // Если окно закрыто со статутсом, отличным от "успех",
       *     // т.е. НЕ через ok() или close(true) - отменим закрытие
       *     if(result !== true) {
       *         event.setResult(false);
       *     }
       * });
       * </pre>
       */
      /**
       * @event onAfterClose После закрытия окна.
       *
       * Событие, возникающее после закрытия окна
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Boolean} arg "Результат работы" окна.
       * <pre>
       *    window.subscribe('onAfterClose',function(event){
       *      alert("Закрыто окно " + this.describe());
       *    });
       * </pre>
       */
      /**
       * @event onMove Во время перемещения окна
       *
       * Событие, возникающее во время перемещения окна.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Number} x Координата x (абсцисса).
       * @param {Number} y Координата y (ордината).
       * <pre>
       * window.subscribe('onMove', function(event) {
       *   self.calcTooltipPosition();
       * });
       * </pre>
       */
      /**
       * @event onAfterMove После перемещения окна
       *
       * Событие, возникающее после перемещения окна.
       * <pre>
       * window.subscribe('onAfterMove', function(event) {
       *   self.calcTooltipPosition();
       * });
       * </pre>
       */
      $protected: {
         _window : undefined,
         _windowContent : undefined,
         _updateCount: 0,
         _titleBar : undefined,
         _resizeBar : undefined,
         _resizeBtn : undefined,
         _isShow : false,
         _isMaximized : false,
         _isCenteredV : false,
         _isCenteredH : false,
         _isAnimated: false, // флаг показывающий отработала ли анимация при показе
         _isAnimating: false,// флаг, анимируется ли окно сейчас
         _animatedWindows: false,
         _leftOpt: undefined,
         _topOpt: undefined,
         _maximizeBtn : undefined,
         _left : undefined,
         _top : undefined,
         _dRender: null,
         _zIndex: 0,
         _startCoords: null,
         _options : {
            /**
             * @cfg {Boolean} Модальность. Определяет, является ли окно модальным.
             *
             * Возможные значения:
             * <ol>
             *    <li>false - окно будет немодальным, то есть, не будет закрывать остальной интерфейс</li>
             *    <li>true - окно будет модальным: всё, кроме окна, скрыто и недоступно для взаимодействия</li>
             * </ol>
             */
            modal: false,
            /**
             * @cfg {Boolean} Возможно изменение размера
             *
             * Признак, может ли пользователь произвольно менять размер окна.
             * <pre>
             *     <option name="resizable">false</option>
             * </pre>
             */
            resizable : true,
            /**
             * @cfg {String} Заголовок окна
             *
             * Текст, отображаемый в заголовке окна. При отображении окна текст заголовка добавляется в title документа.
             * При скрытии - восстанавливается.
             * @translatable
             */
            caption: undefined,
            windowState: true,
            /**
             * @cfg {Boolean} Отключить элементы управления окном
             * @remark Позволяет скрыть из заголовка окна кнопку "Развернуть окно/ Свернуть окно",
             * а из правого нижнего угла - кнопку управления размерами окна.
             * @see border
             * @example
             * <pre>
             *    disableActions: true
             * </pre>
             */
            disableActions : false,
            /**
             *
             */
            deprecated : false,
            /**
             * @cfg {Boolean} Имеет ли рамку
             *
             * Под "рамкой" подразумеваются стандартные элементы управления окна. Заголовок, кнопки закрытия, разворота и т.д.
             */
            border : true,
            /**
             * @cfg {Boolean|undefined} Показывать развернутым
             *
             * Развернуть ли окно на весь экран сразу при показе.
             * Если определено, то имеет приоритет над соответствующим параметром шаблона.
             */
            maximize : undefined,
            /**
             * @cfg {Number} Расстояние от окна до верхней границы экрана
             *
             * Если top и left не заданы, окно центрируется
             */
            top : undefined,
            /**
             * @cfg {Number} Расстояние от окна до левой границы экрана
             *
             * Если top и left не заданы, окно центрируется
             */
            left : undefined,
            /**
             * Не обрабатываем опцию parent для окна - оно не может иметь родительский контрол
             *
             */
            parent: null,
            /**
             * @cfg {String} Заголовок окна
             *
             * @translatable
             */
            title: '',
            /**
             * @cfg {Boolean|undefined} Анимировать окно
             * Анимировать ли окно при показе.
             * Если опция не undefined, то берется её значения, иначе берется значение cConstants.animatedWindows
             */
            animatedWindows: undefined,

            /**
             * @cfg {Boolean} Закрывать ли окно при клике на оверлей
             * Если окно является модальным, у окна есть оверлей (затемнение сзади, перекрывающее область за окном).
             * По умолчанию при клике на этот оверлей окно скрывается, но с помощью этой опции стандартного поведения можно избежать.
             */
            closeOnOverlayClick: true,

            /**
             * @cfg {Boolean} Определяет возможность перемещения компонента по странице
             */
            draggable: true,

            origWidth: 0,
            needSetDocumentTitle: true, //нужно ли менять текст вкладки браузера
            origHeight: 0,
            needRecalcPositionOnSizeChange: true,
            //Если содержимое окна больше высоты экрана, то установим height равным высоте экрана, чтобы работал ScrollContainer
            task_1174068748: false,
            adjustPositionAfterResize: false // Обновлять позицию окна при ресайзе контента и смене ориентации на моб. устройствах
         },
         _keysWeHandle : [
            Env.constants.key.esc,
            Env.constants.key.tab,
            Env.constants.key.enter,
            Env.constants.key.left,
            Env.constants.key.right
         ],
         _haveTitle: false,
         _haveContentTitleBlock: false,
         _mouseMoveHandler: null,
         _mouseUpHandler: null,
         _absolutePosition: false
      },
      $constructor : function(cfg) {
         this._mouseMoveHandler = this._mouseMove.bind(this);
         this._mouseUpHandler = this._mouseUp.bind(this);

         this._animatedWindows = this._options.animatedWindows === undefined ? defaultOptions.animatedWindows : this._options.animatedWindows;
         this._leftOpt = this._options.left === undefined ? defaultOptions.left : this._options.left;
         this._topOpt = this._options.top === undefined ? defaultOptions.top : this._options.top;
         this._moveWindowWithRecalc = withRecalc(this._moveWindow, this);

         this._dRender = new  Deferred();
         this._publish('onBeforeClose', 'onAfterClose', 'onMove', 'onAfterMove');

         [['close', this.close], ['ok', this.ok], ['cancel', this.cancel], ['maximize', this._maximizeWindow], ['rebuildTitleBar', this._rebuildTitleBar]].forEach(
                             function(args) { CommandDispatcher.declareCommand(this, args[0], args[1])}.bind(this));

         if (cfg.resizeable !== undefined) {
            this._options.resizable = cfg.resizeable;
         }


         /* есть мнение что позишн фикст есть пережиток прошлого и работает он только если окно не ресайзишь, а на сафари еще при перевороте ломается,
         и так как тестеры окна н расайзят а айпады переворачивают. Можно конечно свалить на филод линк, т.к. по идеи пикер должен быть внутри фикст
         области и двигаться с ней, но я не вижу тут смысла использовать фикст вообще , так что рискнем и сделаем так : */
         var positionConfig = {
            left: parseInt(this._options.left, 10),
            top: parseInt(this._options.top, 10)
         };
         // this._absolutePosition = cConstants.browser.isMobileSafari;

         //На ios для размеров компонента во все окно браузера делаем фиксированную позицию. Если позиция абсолютная, то идет логика расчета top позиции относительно окна браузера и,
         //из-за наличия клавиатуры, window.scrollTop возращает значение > 0, хотя по факту пользователь не скролил страницу. В следствие этого компонент находится не в самом верху.
         //Фиксированная позиция решит эту проблему и избавит от ненужных в данном случае рассчетов, т.к. окно должно занимать всю видимую часть страницы и иметь фиксированную позицию left:0, top: 0
         if (Env.constants.browser.isMobileSafari && !this._options.resizable && this._options.maximize){
            this._absolutePosition = false;
            positionConfig.right = 0;
         } else {
            this._absolutePosition = true;
         }

         this._window = this._createControl().css(positionConfig);

         this.subscribe('onAfterLoad', function(){
            if (this._options.deprecated){
               this.close();
               require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function(InformationPopupManager) {
                  InformationPopupManager.showMessageDialog({
                     status: 'error',
                     message: rk('У Вас недостаточно прав для просмотра.')
                  });
               });
            } else if (this._options.visible) {
               this.show(); // Внутри show() стреляют onBefore- и onAfterShow
            }
         });

         if (Env.constants.browser.isIE) {
            this.subscribe('onBatchFinished', function(){
               // Очистим тень
               this._window.addClass('clear-box-shadow');
               // Почитаем стили чтобы вызвать reflow/restyle
               this._container.width();
               // Вернем тень на место
               this._window.removeClass('clear-box-shadow');
            });
         }

         //при показе/скрытии клавы - перепозиционируемся по центру
         this._adjustWindowPositionSelf = this._mobileInput.bind(this);
         if (Env.constants.compatibility.touch){
            EnvEvent.Bus.globalChannel().subscribe('MobileInputFocus', this._adjustWindowPositionSelf);
            EnvEvent.Bus.globalChannel().subscribe('MobileInputFocusOut', this._adjustWindowPositionSelf);
         }

         if (this._isModal && this._options.closeOnOverlayClick) {
            this.subscribeTo(ModalOverlay, 'onClick', function(event) {
               //Если оверлей показан для этого окна (оно модальное и выше всех других модальных), то ему нужно закрыться
               if (this.isVisible() &&  ModalOverlay.isShownForWindow(this) ) {
                  this._moveFocusToSelf(); //клик должен быть отловлен окном, чтобы убрать фокус с сфокусированного элемента
                  event.setResult(true);
                  this.close();
               }
            }.bind(this));
         }
         EnvEvent.Bus.globalChannel().notify('onWindowCreated', this);
         this._checkOpener();

         if (this._options.adjustPositionAfterResize) {
            this._orientationChangeHandler = this._orientationChangeHandler.bind(this);
            window.addEventListener('orientationchange', this._orientationChangeHandler);
         }
      },

      _checkOpener: function() {
         if (isNewEnvironment() && !this._options._openFromAction) {
            Env.IoC.resolve('ILogger').error('Window', 'Компонент открыт напрямую без использования хэлперов открытия. \n' +
               'Для правильной работы компонента окно должно быть открыто через action. \n' +
               'Подробности: https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ws4/components/templates/open-compound-template/');
         }
      },

      _mobileInput: function (event) {
         var isFocusIn = event.name === 'mobileinputfocus';

         // Если пользователь сам задал координаты - перепозиционироваться не нужно.
         // Проверка на опцию adjustPositionAfterResize сделана для того, чтобы не разломать весь старый код, а включить такое поведение по месту.
         if (this._options.adjustPositionAfterResize && (this._options.top || this._options.left)) {
            return;
         }
         //По уходу фокуса, после скрытия клавиатуры, вызываю пересчет позиции, т.к. иногда позиция сбивается. why? jquery? magic? don't know
         setTimeout(function () {
            if (!isFocusIn) {
               this._adjustWindowPosition();
            }
         }.bind(this), 350); //задержка на анимацию клавиатуры
      },

      /***
       * Переопределённый метод базового класса {@link Lib/Control/AreaAbstract/AreaAbstract#_activateParent}. Здесь он не делает ничего,
       * поскольку в дочернее Window нельзя перейти из родительского контрола по табу.
       * @private
       */
      _activateParent: function() {
         return false;
      },

      _templateInnerCallback: withRecalc(function() {
         return Window.superclass._templateInnerCallback.apply(this, arguments);
      }),

      _getTemplateComponent: function(){
         return this.getChildControls(undefined, false)[0];
      },

      _templateInnerCallbackBeforeReady: function() {
         var
             left = parseInt(this._leftOpt, 10),
             top = parseInt(this._topOpt, 10),
             height;

         this._left = isNaN(left) ? 0 : left;
         this._top = isNaN(top) ? 0 : top;
         this._isCenteredV = isNaN(top);
         this._isCenteredH = isNaN(left);

         // Если maximize не определено - смотрим на windowState. Иначе - смотрим только на maximize
         this._isMaximized = !!(this._options.maximize !== undefined ?
            this._options.maximize :
            this._options.windowState && this._options.windowState == 'maximized');

         this.getContainer().toggleClass('ws-window-maximized',this._isMaximized);

         this._createTitleBar();

         if (this._options.resizable && !(this._options.autoWidth && this._options.autoHeight)) {
            this._resizeBtn = $('<div></div>')
               .addClass('ws-window-resize')
               .bind('mousedown touchstart', function(event) {
                  this._isResizing = true;
                  return this._mouseDown(event);
               }.bind(this))
               .appendTo(this._window);
         }

         this._container.append('<div style="clear: both;">');

         if (this._isOptionDefault('height') && this._options.autoHeight) {
            height = 'auto';
         } else if (this._haveTitle && !this._haveContentTitleBlock) {
            //высоту окна надо увеличивать для автогенерированного заголовка, и заголовка из ws-window-titlebar-custom,
            //потому что его высоту почему-то прикладники не учитывают
            height = parseInt(this._height, 10);
            if (!isNaN(height)) {
               height += this._titleBar.height();
            } else {
               height = this._height;
            }
         } else {
            height = this._height;
         }

         this.setSize({
            width: this._isOptionDefault('width') && this._options.autoWidth  ? 'auto': this._width,
            height: height
         });

         this._dRender.callback();
      },

      //Мин-макс размеры окна ставятся в функции _adjustWindowPosition
      _setMinMaxSizes: function() {
      },

      _postUpdateResizer: function(width, height) {
      },

      /**
       * @returns {string}
       */
      describe: function() {
         return 'Window#' + this.getId() + ' template: ' + (this._currentTemplateInstance && this._currentTemplateInstance.getName() || this._options.template);
      },

      _loadDescendents: function() {
         return this._loadTemplate();
      },

      /**
       * Самостоятельно сигналим onBeforeShow/onAfterShow, поэтому этот метод должен делать ничего
       * @private
       */
      _childrenLoadCallback: function() {
      },

      _setTemplateDimensions: function(dimensions) {
         if (dimensions.width && this._isOptionDefault('width')) {
            this._width = dimensions.width;
         }

         if (dimensions.height && this._isOptionDefault('height')) {
            this._height = dimensions.height;
         }
      },
      /**
       * Может ли обрабатывать события клавиш
       * @returns {Boolean}
       * @protected
       */
      _isAcceptKeyEvents: function(){
         return true;
      },
      /**
       * Обработка клавиатурных= нажатий
       * @param {Event} e
       * @return {Boolean} результат работы метода
       */
      _keyboardHover: function(e){
         if (e.which in this._keysWeHandle) {
            if (e.which == Env.constants.key.esc) {
               this.close();
               return false;
            }
            if (e.which == Env.constants.key.left || e.which == Env.constants.key.right) {
               return this._switchingBetweenButtons(e);
            }

            if (this.isEnabled()) {
               return Window.superclass._keyboardHover.apply(this, arguments);
            } else {
               return true;
            }
         }
         return true;
      },
      /**
       * Переключение между кнопками диалога при помощи клавиш клавиатуры
       * @param {Event} event
       */
      _switchingBetweenButtons: function(event){
         var activeControl = WindowManager.getActiveWindow().getActiveChildControl(),
             children = this.getChildControls(),
             indexOfActiveBtn = 0,
             btns = [], i,
             newIndex;

         if (activeControl && !(cInstance.instanceOfModule(activeControl, 'Deprecated/Controls/Button/Button'))) {
            return true;
         }

         for (i = 0; i < children.length; i++) {
            if (cInstance.instanceOfModule(children[i], 'Deprecated/Controls/Button/Button')) {
               btns.push(children[i]);
            }
         }
         for (i = 0; i < btns.length; i++) {
            if (btns[i].isActive()) {
               indexOfActiveBtn = i;
               break;
            }
         }
         if (event.which == Env.constants.key.left) {
            newIndex = indexOfActiveBtn - 1;
         }
         if (event.which == Env.constants.key.right) {
            newIndex = indexOfActiveBtn + 1;
         }

         //будем переходить по кругу
         newIndex = (btns.length + newIndex) % btns.length;

         if (btns[newIndex]) {
            btns[indexOfActiveBtn].setActive(false);
            btns[newIndex].setActive(true);
         }

         return false
      },
      /**
       * Инициализация окна
       * @return {Lib/Control/Window/Window} созданное окно
       */
      _createControl : function () {
         var modalClass = this._isModal ? 'ws-modal' : '',
             positionClass = this._absolutePosition ? 'ws-absolute' : 'ws-fixed',
             styleObj = {opacity: 0},
             wsWindow;

         if (this._absolutePosition) {
            //Задаю базовые координаты, без них абсолютный контейнер находится в основном потоке и может растянуть контейнер.
            //если появится скролл, то после позиционирования этот скролл пропадет и будет виден небольшой скачек окна
            styleObj.left = 0;
            styleObj.top = 0;
         }

         wsWindow = $('<div></div>', {tabindex: 0}) //Создание самого окна
            .appendTo(document.body)
            .css(styleObj)
            .addClass(positionClass + ' ws-window radius ' + [modalClass, this._options.cssClassName, this._options.className].join(' '));

         this._windowContent = $('<div>', {style: 'z-index: 0'})
            .addClass('ws-window-content radius')
            .appendTo(wsWindow);

         //Добавить в окно наш контейнер
         this._container.prependTo(this._windowContent);
         this._container.css('z-index', 0);

         wheel(wsWindow, function(event) {
            var target = $(event.target, wsWindow),
                delta = event.wheelDelta,
            //сперва добавим в коллекцию таргет, а уже потом - его родителей
                collection = target.toArray().concat(target.parentsUntil(wsWindow).toArray()),
                hasScrollable = collection.filter(function(elem) {
                   var $elem = $(elem),
                       overProp = $elem.css('overflow-y');

                   return (overProp === 'auto' || overProp === 'scroll') && //крутилки разрешены
                          ((delta < 0 && (elem.scrollHeight - $elem.scrollTop()) > elem.offsetHeight) || //элемент можно прокрутить вниз
                           (delta > 0 &&  $elem.scrollTop() > 0) //элемент можно прокрутить вверх
                          );
                }).length > 0;

            //если не находим того, кого внутри окна можно прокрутить, то блокируем событие, чтобы не крутилось содержмое основного документа
            if (!hasScrollable) {
               event.stopPropagation();
               if (!target.is('object')) {
                  event.preventDefault();
               }
            }
         });

         wsWindow.get(0).wsControl = this;

         return wsWindow;
      },

      _setupTitleVisibility: function() {
         this._title.toggleClass('ws-hidden', this._title.html().trim().length === 0);
      },

      /**
       * @command rebuildTitleBar
       * @description Перерисовывает пользовательскую шапку окна.
       * @remark Может пригодиться, если у шаблона (см. опция template) вызван метод rebuildMarkup. Напомним, что создание пользовательской шапки производится путём добавления в корневой тег шаблона html-контейнера с CSS-классом ".ws-window-titlebar-custom".
       * Конфигурация шапки для диалога редактирования описана {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/forms-and-validation/windows/editing-dialog/create/#_2 здесь}.
       */
      _rebuildTitleBar: function() {
         var customTitles = this._window.find('.ws-window-titlebar-custom.ws-window-titlebar');
         customTitles.remove();
         this._createTitleBar();
      },

      /**
       * Создает строку заголовка окна, добавляет в нее название
       */
      _createTitleBar: function () {
         var //блок с заголовком нужно искать вглубь, поскольку может быть ситуация с окном в окне (см. описание ошибки в коммите)
             customTitle = this._window.find('.ws-window-titlebar-custom').eq(0),
             contentTitleBlock = this._container.find('.ws-Window__title-border').eq(0),
             titleBarClasses, caption, innerTitle, mouseDownHandler, dblClickHandler;

         this._haveContentTitleBlock = contentTitleBlock.length > 0;
         this._haveTitle = this._options.border || this._haveContentTitleBlock;

         if (this._haveTitle) {
            if (this._haveContentTitleBlock) {
               this._titleBar = contentTitleBlock;
            } else if (customTitle.length > 0) {
               this._titleBar = customTitle;
            } else {
               this._titleBar = $('<div></div>');
            }

            //TODO: 3.7.0 - убрать радиус и пересечения ws-window-titlebar с другими классами
            //ws-window-titlebar - этот класс нужен только если _titleBar создаётся здесь, в коде окна.
            //если заголовок пользовательский (haveContentTitleBlock - сделан в Джинне), то там свои стили стоят - ws-window-titlebar
            //ему не нужен (ещё причина: ws-window-titlebar определяет свои правила для шрифтов, которые могут испортить текст в заголовке, созданном джинном)
            titleBarClasses = this._haveContentTitleBlock ? 'radius' : 'ws-window-titlebar radius';

            mouseDownHandler = function(event) {
               if (!this._targetIsHeaderControl(event)) {
                  event.preventDefault();
               }
            }.bind(this);

            dblClickHandler = function(event) {
              if (!this._targetIsHeaderControl(event)) {
                this._maximizeWindow();
              }
            }.bind(this);

            this._titleBar.addClass(titleBarClasses)
                          .mousedown(mouseDownHandler)
                          .dblclick(dblClickHandler)
                          .prependTo(this._window)
                          .append('<div>&nbsp;</div>');

            if (!this._haveContentTitleBlock) {
               this._title.addClass('ws-window-title').prependTo(this._titleBar);
               this._createTitleButtons();
               this._applyDrag(this._titleBar);
            } else {
               this._title.detach();
               //Если заголовок был сделан в Джинне, то таскать нужно только за текст
               //заголовка, поскольку иначе контролы в заголовке будут начинать таскание,
               //и отфильтровать их в _mouseDown невозможно - хз что туда положат
               innerTitle = this._titleBar.find('div[sbisname="windowTitle"]');
               if (innerTitle.length){
                  this._applyDrag(innerTitle);
               }
            }

            if (this._options.draggable) {
               this._window.addClass('ws-window-draggable');
            }
            this._titleBar.removeClass('ws-hidden');
            this._initKeyboardMonitor(this._titleBar);
            this._initKeyboardMonitor(this._window);

            caption = this._options.caption !== undefined ? this._options.caption : this._options.title;
            if (caption) {
               this.setTitle(caption);
            }
            this._setupTitleVisibility();
         } else if (this._titleBar) {
            this._title.detach();
            this._titleBar.remove();
            this._titleBar = undefined;

            this._window.removeClass('ws-window-draggable');
         }
      },
      _applyDrag: function(to) {
         if (this._options.draggable) {
            to.bind('mousedown touchstart', this._mouseDown.bind(this));
         }
      },
      /**
       *
       * Добавляет обработчик на элемент для перетаскивания окна.
       * С помощью данного метода можно определить области окна, за которые будет осуществляться перетаскивание.
       * По умолчанию окно можно перетаскивать только за заголовок.
       * @param {jQuery} to Элемент, за который будет доступно перетаскивание окна.
       * @example
       * <pre>
       * // Разрешим перетаскивать окно за все дочерние DOM-элементы с CSS-классом drag-handle
       * window.applyDrag(window.getContainer().find('.drag-handle'));
       * </pre>
       */
      applyDrag: function(to) {
         this._applyDrag(to);
      },

      _makeLoadErrorHandler: function(parallelDeferred) {
         var inheritedHandler = Window.superclass._makeLoadErrorHandler.call(this, parallelDeferred);
         return function(e) {
            try {
               this._createTitleBar();
            } catch(error) {
               //Игнорируем ошибку, чтоб _createTitleButtons не испортила ничего.
            }
            //Обрабатываем ошибку унаследованным обработчиком.
            inheritedHandler.call(this, e);
         };
      },

      /**
       * Добавляет все кнопки на тайтлбар и вешает на них события.
       */
      _createTitleButtons: function(){
         var self = this;
         if (!this._options.disableActions){
            //кнопка "развернуть(восстановить) окно"
            if (this._options.resizable) {
               this._maximizeBtn = $('<a></a>')
                  .addClass('ws-window-titlebar-action maximize')
                  .click(function() {
                     self._maximizeWindow();
                  })
                  .prependTo(this._titleBar);
            }
            //кнопка "закрыть окно"
            $('<a></a>')
               .addClass('ws-float-close ws-float-close-right')
               .click(function() {
                  self._moveFocusToSelf(); //клик должен быть отловлен окном, чтобы убрать фокус с сфокусированного элемента
                  self.close();
                  return false;
               })
               .prependTo(this._titleBar);
         }
      },
      _updateDocumentTitle: function() {
         var
            title = this.getTitle(),
            docTitle = document.title,
            titleTxt = docTitle ? ' - ' + title : title,
            lastIndex = docTitle.lastIndexOf(titleTxt),
            lastIndexNoDash = docTitle.lastIndexOf(title);

         // Если есть что обновлять...
         if (this._options.needSetDocumentTitle && title &&
            (lastIndex !== (docTitle.length - titleTxt.length) || docTitle.length < titleTxt.length) &&
            (lastIndexNoDash !== (docTitle.length - title.length) || docTitle.length < title.length)) {
            document.title = document.title + titleTxt;
         }
      },
      _clearDocumentTitle: function() {
         var
            title = this.getTitle(),
            docTitle = document.title,
            titleTxt = docTitle ? ' - ' + title : title,
            lastIndex = docTitle.lastIndexOf(titleTxt),
            lastIndexNoDash = docTitle.lastIndexOf(title),
            sliceLn;

         if (title && (lastIndex === (docTitle.length - titleTxt.length) || lastIndexNoDash === (docTitle.length - title.length))) {
            sliceLn = lastIndex !== -1 ? lastIndex : lastIndexNoDash;
            document.title = docTitle.slice(0, sliceLn !== -1 ? sliceLn : docTitle.length);
         }
      },
      _setTitle : function(title){
         Window.superclass._setTitle.apply(this, arguments);
         this._window.find('div[sbisname="windowTitle"] span').text(title);
         this._setupTitleVisibility();
      },
      /**
       *
       * Получить z-index текущего окна
       * @return {Number} z-index
       */
      getZIndex : function() {
         return this._zIndex;
      },
      /**
       *
       * Сделать окно видимым.
       * Перед показом поднимает событие {@link Lib/Control/Window/Window#onBeforeShow}, изменяет заголовок документа добавляя в него
       * свой заголовок.
       * После того, как окно будет готово (прогружены все дочерние элементы), и, если не установлена опция noBringToTop,
       * - перемещает окно вперёд (относительно других окон) и поднимает событие {@link Lib/Control/Window/Window#onAfterShow}.
       * Не делает ничего, если окно уже показано.
       * @param {Boolean} [noBringToTop=false] Не поднимать окно наверх.
       * @see onBeforeShow
       * @see onAfterShow
       */
      show: function (noBringToTop) {
         // Если окно уже показано - ничего не делаем
         if (!this._isShow) {
            //Для ie с его рендером: перед позиционированием вешаю visibility: hidden, чтобы не было видно прыжков окна,
            //после того, как позиция пересчитается
            if (Env.detection.isIE) {
               this._window.addClass('ws-invisible');
            }
            this._dRender.addCallback(callNext.call(this._showRenderCallback.bind(this,noBringToTop),
               this._notifyBatchDelayed.bind(this, 'onAfterShow')));
         }
      },
      _showRenderCallback: function(noBringToTop) {
         withRecalc(function() {
               this._window.css('opacity', '');
               this._window.removeClass('ws-hidden');
               this._notify('onBeforeShow');

               this._updateDocumentTitle();

               this._isShow = true;

               this._checkDelayedRecalk();

               if (!noBringToTop) {//TODO ??? может, после пакета ??
                  this.moveToTop();
                  doAutofocus(this._container);
               } else {
                  WindowManager.setVisible(this._zIndex);
               }

               if (this._isModal) {
                  ModalOverlay.adjust();
               }

               // уведомляем о изменении видимости компонента
               this._notify('onAfterVisibilityChange', true);
         }, this)();
         if (Env.detection.isIE) {
            this._window.removeClass('ws-invisible');
         }
      },
      /**
       * Скрывает окно
       * @private
       */
      _hideWindow: function(){
         this._window.addClass('ws-hidden');
         this._isShow = false;
         WindowManager.popAndShowNext(this);
      },

      _restoreLastActiveOnHide: function() {
         // хак для ipad, чтобы клавиатура закрывалась когда дестроится окно
         if (Env.detection.isMobileIOS) {
            $(document.activeElement).trigger('blur');
         }
         //Отдаём фокус последней активированной области
         var lastActive = WindowManager.getActiveWindow();
         if (lastActive){
            lastActive.onBringToFront();
         }
      },

      _notifyMaximizedChange: function(newMaximized) {
         FloatAreaManager._setWindowMaximized(this, newMaximized);
      },

      /**
       *
       * Скрыть окно и передать фокус следующему.
       * Скрывате окно и передает фокус следующему.
       * Убирает из заголовка документа свой заголовок.
       * Не делает ничего, если окно уже скрыто.
       */
      hide: function(){
         // Если окно уже скрыто - ничего не делаем
         if (!this._isShow) {
            return;
         }
         this._notifyMaximizedChange(false);
         this._hideWindow();
         WindowManager.releaseZIndex(this._zIndex);
         this._clearDocumentTitle();

         this._restoreLastActiveOnHide();

         // освобождение zIndex при скрытии индикатора, чтобы не висели лишние zIndex в _acquiredIndexes
         this._releaseZIndex();

         if (this._isModal) {
            ModalOverlay.adjust();
         }

         // уведомляем о изменении видимости компонента
         this._notify('onAfterVisibilityChange', false);
      },

      isVisible: function() {
         return this._isShow;
      },

      /**
       * @command close
       * @description Закрывает окно.
       * @remark Поднимает события {@link Lib/Control/Window/Window#onBeforeClose} и {@link Lib/Control/Window/Window#onAfterClose}, передает в них аргумент, с которым был вызван сам.
       * Закрытие окна может быть отменено в событии {@link Lib/Control/Window/Window#onBeforeClose}.
       * После закрытия окно уничтожается и не может быть показано методом {@link show}.
       * @param {Boolean} [arg] "результат работы" окна, передается в события {@link Lib/Control/Window/Window#onBeforeClose} и {@link Lib/Control/Window/Window#onAfterClose}
       * @returns { Deferred} Deferred. Сработает когда окно будет закрыто
       * @command
       * @example
       * <pre>
       *    window.subscribe('onAfterClose', function(event, result) {
       *        // result == { someField: true }
       *        alert('Результат закрытия окна: ' + result.someField);
       *    });
       *
       *    window.close({ someField: true }); // console: 'Результат закрытия окна: true'
       * </pre>
       * @see show
       * @see onBeforeClose
       * @see onAfterClose
       */
      close: function (arg) {

         var self = this;
         this._saving = arg;

         /**
          * Ожидаем когда выполнятся операции, добавленные в области, и только потом выполняем отложенную операцию закрытия
          * @param hideFn отложенная операция закрытия окна
          */
         function waitPending(hideFn) {
            var dfr = new Deferred();
            dfr.addCallback(function() {
               var saving = self._saving;
               self._saving = undefined;
               return self.finishChildPendingOperations(saving);
            });

            return self.waitAllPendingOperations(dfr.addCallback(hideFn));
         }

         return this.getReadyDeferred().addCallback(forAliveOnly(function(){
            var self = this,
                flag = this._notify('onBeforeClose', arg),
                closeCallback = function() {
                   // По честному закроем окно перед уничтожением чтобы в onAfterClose окно было невидимо
                   self.hide();
                   self._notify('onAfterClose', arg);
                   // здесь тоже вызовется hide но ничего плохого не случится т.к. в hide стоит проверка
                   self.destroy();
                };
            // при закрытии уводим фокус с активного элемента в окне
            // сейчас крестик не принимает на себя фокус, и например с редактирования по месту фокус не уходит,
            // а надо чтобы уходил, чтобы пендинги завершились и не мешали окну закрыться
            var activeControl = this.getActiveChildControl(undefined, true);
            while (activeControl) {
               activeControl && activeControl.setActive(false);
               activeControl = activeControl.getParent();
            }

            if (flag !== false){
               if (this._animatedWindows && !this._isAnimating){
                  this._isAnimating = true;
                  this._window.animate(
                      {
                         "top": "-=" + this._window.height() + "px"
                      },
                      ANIMATION_LENGTH,
                      function(){
                         this._isAnimating = false;
                         // ожидаем, когда выполнятся операции внутри, и только потом закрываем окно
                         waitPending(closeCallback.bind(self));
                      });
               } else {
                  // ожидаем, когда выполнятся операции внутри, и только потом закрываем окно
                  waitPending(closeCallback);
               }
            }
         }, this));
      },
      _removeContainer: function() {
         this._window.empty().remove();
      },

      _releaseZIndex: function() {
         if (this._zIndex != 0) {
            WindowManager.releaseZIndex(this._zIndex);
            this._zIndex = 0;
         }
      },
      /**
       *
       * Уничтожает окно
       */
      destroy: function(){
         this._notifyMaximizedChange(false);

         this._window.get(0).wsControl = null;
         if (this._titleBar) {
            this._titleBar.unbind();
            this._window.find('div[sbisname="windowTitle"]').unbind();
            this._titleBar.empty().remove();
            this._titleBar = $();
         }

         this._resizeUnsub && this._resizeUnsub();
         this._releaseZIndex();

         if (Env.constants.compatibility.touch){
            EnvEvent.Bus.globalChannel().unsubscribe('MobileInputFocus', this._adjustWindowPositionSelf);
            EnvEvent.Bus.globalChannel().unsubscribe('MobileInputFocusOut', this._adjustWindowPositionSelf);
         }

         if (this._options.adjustPositionAfterResize) {
            window.removeEventListener('orientationchange', this._orientationChangeHandler);
         }

         Window.superclass.destroy.apply(this, arguments);
         if (this._windowContent) {
            this._windowContent.empty().remove();
            this._windowContent = $();
         }
         this.hide();
         this._window = $();
      },
      /**
       * @command ok
       * @description Закрывает окно с результатом "Успех".
       * @remark Вызов команды ok идентичен вызову команду close с аргументом true. Передаёт в обработчики событий onBeforeClose и onAfterClose значение true.
       * @returns { Deferred} Асинхронный результат
       * @command
       * @see onBeforeClose
       * @see onAfterClose
       */
      ok : function(){
         return this.close(true);
      },
      /**
       * @command cancel
       * @description Закрывает окно с результатом "Отмена".
       * @remark Вызов команды ok идентичен вызову команду close с аргументом false. Передаёт в обработчики событий onBeforeClose и onAfterClose значение false.
       * @returns { Deferred} Асинхронный результат.
       * @command
       * @see onAfterClose
       * @see onBeforeClose
       */
      cancel : function(){
         return this.close(false);
      },
      /**
       *
       * Готовит окно к движениям (убирает тени и уголки)
       */
      shadowsOff: function() {
         this._window.removeClass('radius');
         this._windowContent.removeClass('radius');
         if(this._titleBar){
            this._titleBar.removeClass('radius');
         }
      },
      /**
       *
       * Возвращает окну первоначальный вид после окончания движения (тени и уголки)
       */
      shadowsOn: function () {
         //TODO: проверить - должны они быть публичными???
         this._window.addClass('radius');
         this._windowContent.addClass('radius');
         if (this._titleBar){
            this._titleBar.addClass('radius');
         }
      },

      /**
       * Рассчитать ширину и высоту блока ресайзера во время изменения размера окна мышкой.
       * @param {{left: Number, top: Number}} resizerOffset
       * @param {Number} x
       * @param {Number} y
       * @return {{width: Number, height: Number}} размеры
       */
      _getResizerSize: function(resizerOffset, x, y){
         return {
            width : Math.max(0, x + this._windowWidthStart - this._clientXstart - resizerOffset.left),
            height : Math.max(0, y + this._windowHeightStart - this._clientYstart - resizerOffset.top)
         };
      },

      _updateZIndex: function() {
         var w = WindowManager,
            tmpZIndex = this._zIndex;

         w.releaseZIndex(this._zIndex);
         this._zIndex = this._getNewZIndex(w);
         w.setVisible(this._zIndex);

         if (tmpZIndex !== this._zIndex) {
            // в IE10 что-то плохо применяется z-index, а если его сначала сбрасывать все работает
            if (Env.detection.isIE10) {
               this._window.css('z-index', 0);
               setTimeout(function() {
                  this._window.css('z-index', this._zIndex);
                  this._adjustModalOverlay();
               }.bind(this), 0);
            } else {
               this._window.css('z-index', this._zIndex);
               this._adjustModalOverlay();
            }
         }
      },

      _getNewZIndex: function(manager) {
         return manager.acquireZIndex(this._isModal, this._isMaximized);
      },

      _adjustModalOverlay: function() {
         if (this._isModal) {
            ModalOverlay.adjust();
         }
      },

      _moveWindow: function(left, top) {
         this._isCenteredV = false;
         this._isCenteredH = false;
         this._isMaximized = false;
         this._left = left;
         this._top = top;
         this._updateZIndex();
      },

      /**
       *
       * Перемещает окно
       * @param {Number} left Смещение по горизонтали левого верхнего угла
       * @param {Number} top Смещение по вертикали левого верхнего угла
       */
      moveWindow: function(left, top) {
         this._moveWindowWithRecalc(left, top);
      },

      /**
       *
       * Изменяет размеры окна
       * @param {Object} size объект, описыващий размеры окна
       * @param {Number|String} [size.width] Ширина - число или строка 'auto'. Если не задано - 'auto'
       * @param {Number|String} [size.height] Высота - число или строка 'auto'. Если не задано - 'auto'
       */
      setSize: withRecalc(function(size) {
         var minWidth = parseInt(this._options.minWidth, 10) || 0,
             minHeight = parseInt(this._options.minHeight, 10) || 0,
             maxWidth = parseInt(this._options.maxWidth, 10) || Infinity,
             maxHeight = parseInt(this._options.maxHeight, 10) || Infinity;

         this._width = Math.min(maxWidth, Math.max(minWidth, parseInt(size.width, 10)));
         if (isNaN(this._width)) {
            this._width = 'auto';
         }

         this._height = Math.min(maxHeight, Math.max(minHeight, parseInt(size.height, 10)));
         if (isNaN(this._height)) {
            this._height = 'auto';
         }
      }),

      /**
       *
       * Центрируем окно
       */
      moveWindowToCenter: withRecalc(function() {
         this._isCenteredV = true;
         this._isCenteredH = true;
         this._isMaximized = false;
         this._updateZIndex();
      }),

      /**
       * Команда maximize
       * @description Развернуть окно или свернуть до начальных размеров.
       * @remark
       * Сначала команда проверяет конфигурацию окна в опции resizable, чтобы определить разрешено ли пользователям изменять размеры окна, удерживая правый нижний угол.
       * Когда resizable=false, команда не разворачивает и не сворачивает окно, а в ответе возвращается false.
       * Когда resizable=true, команда возвращает true, а выполнение команды различается в зависимости от типа действия.
       * При развёртывании окна в шапке скрывается кнопка "развернуть" и отображается кнопка "свернуть". Удаляется CSS-класс с именем "ws-window-draggable" из корневого div, в котором отображается окно. Скрывается кнопка из правого нижнего угла, через которую пользователь может менять размеры окна.
       * Окно разворачивается не на весь экран, а только по границам, что установлены в родительском окне (iframe, вкладка веб-браузера или другой контейнер) . При свёртывании окно восстанавливается до тех размеров, которыми обладало в момент развёртывания.
       * Напомним, что при наличии класса "ws-window-draggable" окно можно перемещать по экран, удерживая за шапку.
       */
      _maximizeWindow : withRecalc(function() {
         var res = this._options.resizable;
         if (res) {
            this._isMaximized = !this._isMaximized;
            this.getContainer().toggleClass('ws-window-maximized',this._isMaximized);

            this._updateZIndex();

            if (this._isMaximized) {
               if (this._maximizeBtn) {
                  this._maximizeBtn.addClass('fill');
               }
               this._window.removeClass('ws-window-draggable');

               if (this._resizeBtn) {
                  this._resizeBtn.hide();
               }
            } else {
               if (this._maximizeBtn) {
                  this._maximizeBtn.removeClass('fill');
               }

               if (this._options.draggable) {
                  this._window.addClass('ws-window-draggable');
               }

               if (this._resizeBtn) {
                  this._resizeBtn.show();
               }
            }
         }
         return res;
      }),

      /**
       *
       * Показать окно поверх всего если он видимый
       * @param {Boolean} [force] принудительый перенос вверх
       * @return {Number} максимальный z-index диалогов
       */
      moveToTop : function(force) {
         if (this._isShow) {
            var
               winMan = WindowManager;
            if (!force && !winMan.pushUp(this)) {
               return -1;
            }

            // Обновляем z-index
            this._updateZIndex();
            $('.ws-window-titlebar.active').removeClass('active');
            if (this._titleBar){
               this._titleBar.addClass('active');
            }
            return this._zIndex;
         } else {
            return -1;
         }
      },
      /**
       * Функционал подменен в окнах создающихся при индикаторах загрузки.
       *
       */
      isMovableToTop: function() {
         return true;
      },

     _targetIsHeaderControl: function(event) {
       var
         headerControlSel = '.ws-window-titlebar-action, .ws-component:not(html), .ws-float-close',
         parents = $(event.target).parents().add(event.target);

       return parents.closest(headerControlSel).length && !parents.closest('[sbisname="windowTitle"]').length;
     },

      /**
       * Событие опускания кнопки мыши
       * @param {Event} event
       * @return {Boolean} результат работы превент дефолт
       */
      _mouseDown : function(event) {
         if (this._isMaximized || this._targetIsHeaderControl(event))
         {
            return true;
         }

         //Фокус переходит в window, нужно закрыть все autoHide панели до пересчета z-index
         //Иначе window после moveToTop будет в самом верху и панели не закроются, т.к. будут считать,
         //что идет взаимодействие с компонентом, расположенном выше них
         FloatAreaManager._hideUnnecessaryAreas(this);

         this.moveToTop();
         // https://online.sbis.ru/opendoc.html?guid=96811f89-05ca-4aed-90fd-d8bdb34c0a4a
         // фокус устанавливаем mouseup,
         // иначе при драг-н-дропе у контролов внутри начнут работать обработчики на фокус при переносе окна
         //this.onBringToFront();

         var
            offsetWindow = this._window.offset(),
            coords = getTouchEventCoords(event);

         this._clientXstart = coords.x - offsetWindow.left;
         this._clientYstart = coords.y - offsetWindow.top;
         this._windowWidthStart = this._window.width();
         this._windowHeightStart = this._window.height();
         this._mouseStarted = true;
         this._startCoords = {
            left: this._left,
            top: this._top
         };

         if (this._isResizing) {
            var offsetContent = this._window.offset();
            this._resizeBar = $('<div></div>')
                .addClass('ws-window-resizebar')
                .fadeTo(0, 0.8)
                .appendTo(document.body)
                .css({
                   top: offsetContent.top - PADDING,
                   left: offsetContent.left - PADDING,
                   width: this._window.width(),
                   height: this._window.height(),
                   'z-index': WindowManager.getMaxZIndex() + 10
                });
         }

         Env.constants.$doc
            .bind('mousemove touchmove', this._mouseMoveHandler)
            .bind('mouseup touchend', this._mouseUpHandler);

         return event.preventDefault();
      },

      /**
       * Событие передвижения мыши
       * @param {Event} event
       * @return {Boolean} результат работы превент дефолт
       */
      _mouseMove : function(event) {
         if (this._mouseStarted) {
            if (this._isResizing){
               var coords = getTouchEventCoords(event);
               this._resizeBar.css(this._getResizerSize(this._resizeBar.offset(), coords.x, coords.y));
            } else {
               // iii 
               // https://inside.tensor.ru/opendoc.html?guid=74ad07ae-f305-45ee-9430-54be5fe3ba28&description=
               // Ошибка в разработку 08.04.2016 Не видно контент при перемещении окна вставки ссылки (см.скрин) Как повторить: - Меню пользовател...
               // this._windowContent.css('visibility', 'hidden');
               // this._titleBar.css('visibility', 'hidden');
               // iii

               var coords = getTouchEventClientCoords(event);
               this._moveWindow(coords.x - this._clientXstart, coords.y - this._clientYstart); //Не нужно пересчитывать размеры при d'n'd
               this._adjustWindowPosition();
            }
         }
         if (event.type !== 'touchmove') {
            //на touchmove подписка в пассивном режиме, там нельзя делать stopPropagation и preventDefault
            event.stopPropagation();
            event.preventDefault();
         }
      },

      /**
       * Событие поднятия кнопки мыши
       * @param {Event} event
       */
      _mouseUp : function(event) {
         // iii
         // this._titleBar.css('visibility', 'visible');
         // this._windowContent.css('visibility', 'visible');
         if (!Env.constants.browser.isIE) {
            this._window.fadeTo(0, 1);
         }

         this._window.removeClass('move');
         Env.constants.$doc.unbind('mousemove touchmove', this._mouseMoveHandler).unbind('mouseup touchend', this._mouseUpHandler);
         this._mouseStarted = false;
   
         this.onBringToFront();

         if (this._isResizing) {
            var resizerOffset = this._resizeBar.offset();

            this._resizeBar.remove();
            this._isResizing = false;

            var coords = getTouchEventCoords(event);
            this.setSize(this._getResizerSize(resizerOffset, coords.x, coords.y));
         }

         if (this._startCoords.left !== this._left || this._top !== this._startCoords.top) {
            this._notify('onAfterMove');
         }
      },

      /**
       * Возвращает, может ли получать фокус
       * @return {Boolean}
       */
      canAcceptFocus: function(){
         return this.isShow();
      },

      _restoreSize: function() {
      },

      _onResizeHandler : function(){
         if (this._options.adjustPositionAfterResize) {
            this._adjustWindowPosition();
         }
         Window.superclass._onResizeHandler.apply(this, arguments);
      },

      _orientationChangeHandler: function() {
         this._adjustWindowPosition();
      },

      _adjustWindowPosition: function() {
         if (this.isDestroyed()){
            return;
         }
         function prepCss(css) {
            var pixProps = ['width', 'height', 'max-width', 'max-height',
                            'min-width', 'min-height',
                            'margin-left', 'margin-right', 'margin-top', 'margin-bottom'];
            for (var key in css) {
               if (css.hasOwnProperty(key)) {
                  var
                     val = css[key];
                  if (pixProps.indexOf(key) !== -1) {
                     css[key] = (val === 'auto' || val === '') ? val : (val !== 0 ? val + 'px' : 0);
                  }
               }
            }
            return css;
         }
         if (this.isVisible()) {
            this._notifyMaximizedChange(this._isMaximized);
         }

         var isMobileSafari = Env.constants.browser.isMobileSafari,
             winWidth = isMobileSafari ? window.innerWidth : $(window).width(),
             winHeight = isMobileSafari ? window.innerHeight : $(window).height(),
             minMinWidth = this._options.border ? 100 : 0,
             minWidth,
             minHeight = this._options.minHeight,
             contentBlock = {},
             leftWin = this._left,
             topWin = this._top,
             titleBorderHeight = this._haveTitle ? this._titleBar.height() : 0,
             contentTitleBlockHeight = this._haveContentTitleBlock ? titleBorderHeight : 0,
             contentPadding = this._windowContent.outerHeight() - this._windowContent.height(),
             winPos = {}, oldPos = this._window.offset(),
             maxOuterWidth = Math.max(0, winWidth),
             maxOuterHeight = Math.max(0, winHeight),
             maxHeight = Math.max(maxOuterHeight - titleBorderHeight - contentPadding, 0),
             outerWidth, outerHeight, fixCss, hasXScroll, hasYScroll;

         if (this._isAnimating){
            return true;
         }

         if (this._height === 'auto') {
            if (this._isMaximized) {
               this._container.css('height', 'auto');
               contentBlock.height = this._container.height() < maxHeight ? maxHeight : 'auto';
            } else {
               if (this._options.task_1174068748) {
                  //Перед тем как считать высоту _container, сбросим её, т.к. мы уже до этого могли её проставить,
                  //и тогда при уменьшении окна, мы будем считывать не настоящую высоту, а установленную ранее
                  this._container.css('height', 'auto');
                  //FireFox после установки на блок height: auto не перерасчитывает высоту.
                  //Нужно явно запустить перерасчёт.
                  if (Env.detection.firefox) {
                     this._container.resize();
                  }
                  contentBlock.height = this._container.height() < maxHeight ? 'auto' : maxHeight;
               } else {
                  contentBlock.height = 'auto';
               }
            }

            contentBlock.minHeight = minHeight ?
                                     Math.max(0, minHeight - contentTitleBlockHeight) :
                                     '';
         } else if (this._isMaximized) {
            contentBlock.height = Math.max(0, maxOuterHeight - titleBorderHeight);
         } else {
            contentBlock.height = this._height - titleBorderHeight;
         }

         if (this._width === 'auto') {
            this._container.css({
               'width': 'auto',
               'min-width': ''
            });

            if (this._isMaximized) {
               this._container.css('width', 'auto');
               contentBlock.width = this._container.width() < maxOuterWidth ? maxOuterWidth : 'auto';
            } else {
               contentBlock.width = 'auto';
               if (!this._options.task_1174068748) {
                  contentBlock.display = 'table';
               }
            }

            minWidth = Math.max(this.isVisible() ? this.getMinWidth() : this._options.minWidth, minMinWidth);
            contentBlock.minWidth = minWidth || '';
         } else if (this._isMaximized) {
            contentBlock.width = maxOuterWidth;
         } else {
            contentBlock.width = this._width;
         }

         this._windowContent.css(prepCss({
            'overflow-x': 'hidden',
            'overflow-y': 'hidden',
            'margin-top': titleBorderHeight,
            'max-width': maxOuterWidth,
            'max-height': maxHeight,
            'width': ''
         }));

         this._container.css(prepCss({
            width: contentBlock.width,
            height: contentBlock.height,
            display: contentBlock.display,
            'min-height': contentBlock.minHeight,
            'min-width': contentBlock.minWidth,
            position: 'relative',
            'overflow': 'visible'
         }));

         //на _windowContent стоит width: auto, в Edje после перетаскивания окна, контейнер ужимается до минимума,
         // хотя на дочернем узле стоит правильный width.
         //На всякий случай сделал только для ie, по идее безболезненно можно для всех браузеров выставлять
         if (Env.detection.isIE12) {
            this._windowContent.css('width', contentBlock.width);
         }

         fixCss = {};
         if (this._windowContent.prop('scrollHeight') > maxHeight + contentPadding) {
            fixCss['overflow-y'] = 'scroll';
            hasYScroll = true;
         }
         this._windowContent.css(fixCss);

         fixCss = {};
         if (this._windowContent.prop('scrollWidth') > maxOuterWidth) {
            fixCss['overflow-x'] = 'scroll';
            hasXScroll = true;
         }

         if (Env.constants.compatibility.touch && (hasXScroll || hasYScroll)) {
            fixCss['-webkit-overflow-scrolling'] = 'touch';
         }

         if ((hasXScroll && hasYScroll) || this._isMaximized) {
            fixCss['width'] = maxOuterWidth;
         }

         this._windowContent.css(fixCss);

         // берем ширину всего окна с border и margin
         outerWidth = this._window.outerWidth(true);
         outerHeight = this._window.outerHeight(true);

         if (this._isMaximized)
         {
            winPos = {
               left: 0,
               top: 0
            };
         } else {
            winPos = {
               top: this._isCenteredV ? (winHeight - outerHeight) / 2 : Math.min(Math.max(0, topWin), winHeight - outerHeight),
               left: this._isCenteredH ? (winWidth - outerWidth) / 2 : Math.min(Math.max(0, leftWin), winWidth - outerWidth)
            };
         }

         if (this._absolutePosition) {
            var scrollTop = $(window).scrollTop(),
               scrollLeft = $(window).scrollLeft();
            winPos.top += scrollTop >= 0 ? scrollTop : 0;
            winPos.left += scrollLeft >= 0 ? scrollLeft : 0;
         }

         function setPos() {
            // На ios на изменение размеров контента неправильно раасчитывается позиция окна, если были заданы опции top и left
            // Ошибку в коде позиционирования искать бессмысленно, трогать этот код опасно для жизни. Лечу по месту.
            if (self._options.adjustPositionAfterResize && self._options.top) {
               var top = self._options.top;
               // Установить заданный top. Если контент не влез, подвинуть окно выше, но не за пределы экрана
               var dif = top + self._container[0].offsetHeight - window.innerHeight;
               if (dif > 0) {
                  top = Math.max(top - dif, 0);
               }
               winPos.top = top;
            }

            if (oldPos.left !== winPos.left || oldPos.top !== winPos.top) {
               //приводим к целому, потому что дробное позиционирование окна приводит к неожиданным багам
               //например в файрфокс в дробно спозиционированном окне едет выравнивание кнопок
               winPos.left = parseInt(winPos.left, 10);
               winPos.top = parseInt(winPos.top, 10);
               
               self._window.css(winPos);
               self._notify('onMove', winPos.left, winPos.top);
            }
         }
         // По причине того, что стандартные окна не поддерживают анимацию
         // временно реализовали подключение анимации по флагу
         // стандартное поведение не изменилось
         // Нужно перевести окна на Popup, потому что у них есть возможность анимации
         var self = this,
             needAnimatedWindow = this._animatedWindows && !this._isAnimated && !this._isAnimating;

         if (needAnimatedWindow) {
            winPos.top = -this._window.height();
            setPos();
            this._window.animate(
                {
                   "top": "+=" + this._window.height() + "px"
                },
                ANIMATION_LENGTH,
                withRecalc(function() {
                   self._isAnimating = false;
                   self._isAnimated = true;
                }, self));
            this._isAnimating = true;
         } else {
            setPos();
         }
      },

      _onSizeChangedBatch: function() {
         Window.superclass._onSizeChangedBatch.apply(this, arguments);

         // если фокус на редактируемом поле, значит вероятно показана экранная клавиатура, позиционироваться будет неправильно
         // Нет способа узнать, показана ли виртуальная клавиатура, а ее наличие уменьшает видимый размер экрана, но не изменяет фактический размер.
         // соответственно если спозиционировать окно скажем по центру, окно частично спрячется за клавиатурой.
         //https://inside.tensor.ru/opendoc.html?guid=d8a30190-15f3-4081-b192-317d302f2dd2#msid=s1465909471923
         // Баг воспроизводится так: мы открываем окно, оно позиционируется по центру, потом кликаем на выпадающий список, появляется клавиатура, которая пододвигает
         // окно вверх нативно, а потом _adjustWindowPosition ставит его обратно по центру. Тут мы исключаем этот сценарий. Позиционирование окна при инициализации
         // не должны пострадать, так как там есть свой вызов _adjustWindowPosition на завершении отображения окна.
         var ignoreAdjust = Env.constants.browser.isMobilePlatform && $(document.activeElement).is('input[type="text"], textarea, *[contentEditable=true]');
         if (!ignoreAdjust && this._options.needRecalcPositionOnSizeChange) {
            this._adjustWindowPosition();
         }
         return true;
      },

      _subscribeToWindowResize: function() {
         //Тут нужно делать пересчёт - обёртка withRecalc сделает его сама
         var windowResizeHandler = withRecalc(function () {}, this);
         Env.constants.$win.bind('resize', windowResizeHandler);
         this._resizeUnsub = function() {
            Env.constants.$win.unbind('resize', windowResizeHandler);
         }
      },

      _templateOptionsFilter: function(){
         var s = Window.superclass._templateOptionsFilter.apply(this, arguments);
         return s.concat('border', 'resizable', 'resizeable', 'caption', 'maximize', 'windowState', 'deprecated');
      },
      _resizeInner: function() {
         // считать размеры и положение нужно только после того, как окно показалось. иначе оно отрисуется не там где должно
         if (this.isVisible() && this._options.needRecalcPositionOnSizeChange) {
            withRecalc(function () {}, this)();
         }
      }
   });

   Window.setDefaultOptions = function(defOpt){
      defaultOptions = (defOpt || {})['Lib/Control/Window/Window'] || {};
   };
   
   return Window;
});
