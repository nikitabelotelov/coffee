define('Lib/Control/Infobox/Infobox',
   [
      'Core/core-instance',
      'Core/helpers/Hcontrol/trackElement',
      'Core/Deferred',
      'Core/helpers/Hcontrol/isElementVisible',
      'Env/Env',
      'Core/helpers/String/escapeTagsFromStr',
      'Core/Abstract',
      'Core/helpers/Function/debounce',
      'tmpl!Lib/Control/Infobox/Infobox',
      'Core/WindowManager',
      'css!Lib/Control/Infobox/Infobox',
      'is!browser?/cdn/jquery-ui/1.12.1.2/jquery-ui-position-min.js'
   ],
   function(cInstance, trackElement, cDeferred, isElementVisible, Env, escapeTagsFromStr, Abstract, debounce, dotTplFn) {

   'use strict';

   var MAX_WIDTH_TO_SCREEN_RATIO = 1/2,
       MIN_INFOBOX_TARGET_CONTAINER_WIDTH = 44,
       INFOBOX_HIDE_DELAY = 300,
       INFOBOX_SHOW_DELAY = 300,
       INFOBOX_TRIANGLE_VERTICAL_PADDING = 22;

   /**
    * Класс, который применяют для отображения всплывающей подсказки с расширенными возможностями для конфигурации.
    * <br/>
    * DOM-элемент подсказки размещается в body. Если требуется обрабатывать какие-либо действия с элементами внутри подсказки (например клики по ссылкам), разумно повесить обработку на body через $.delegate.
    * В дополнение на активный элемент внутри подсказки разместить класс-маркер, по которому и ловить события.
    * <br/>
    * При клике на все DOM-элементы внутри body, которые отнесены к CSS-классу "load-more-link", устанавливаем функцию:
    * <pre>
    *    $('body').delegate('.load-more-link', 'click', function() { ... });
    * </pre>
    * Тело этой функции может быть таким:
    * <pre>
    *    var target = $(...); // this.getContainer(), для отображения рядом с контролом
    *    Infobox.show(target, "<p>some text <a href='#' class='load-more-link'>read more</a></p>");
    * </pre>
    *
    * @author Крайнов Д.О.
    * @class Lib/Control/Infobox/Infobox
    * @extends Core/Abstract
    * @public
    * @singleton
    */
   var Infobox = new (Abstract.extend(/** @lends Lib/Control/Infobox/Infobox.prototype */{
      /**
       *
       * @event onShow Происходит при открытии инфобокса.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {jQuery} element DOM-элемент, возле которого запрошено отображение инфобокса.
       * @see onBeforeShow
       * @see onHide
       * @see onChangeTarget
       */
      /**
       *
       * @event onHide Происходит при скрытии инфобокса.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @see onBeforeShow
       * @see onShow
       * @see onChangeTarget
       */
      /**
       *
       * @event onChangeTarget Происходит при смене элемента, возле которого отображается инфобокс.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {jQuery} previous DOM-элемент, с которого уходит инфобокс. Если он был ранее невидим, то параметр будет равен null.
       * @param {jQuery} next DOM-элемент, на который приходит инфобокс. Если он скрывается, параметр будет равен null.
       * @see onBeforeShow
       * @see onShow
       * @see onHide
       */
      /**
       *
       * @event onBeforeShow Происходит перед отображением инфобокса.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {jQuery} element DOM-элемент, возле которого запрошено отображение инфобокса.
       * @return При возврате false показ инфобокса будет отменён.
       * @example
       * <pre>
       *    Infobox.subscribe('onBeforeShow', function(event,element) {
       *       if (control.getContainer() === element) {
       *          event.setResult(false);
       *       }
       *    });
       * </pre>
       * @see onShow
       * @see onHide
       * @see onChangeTarget
       */
      $protected: {
         _box: undefined,
         _content: undefined,
         _hideTimer: undefined,
         _showTimer: undefined,
         _currentTarget: null,
         _message : '',
         _width: 'auto',
         _watchTimer: undefined,
         _measureText: null,
         _autoHide: false,
         _state: undefined,
         _infoboxContentDeferred: new cDeferred(),
         _infoboxContent: undefined,
         _isWaitingToShow: false,
         _watchLinkedPanel: false, //Флаг, который говорит, что не нужно закрывать инфобокс, если ховер ушел на контейнер с классом ws-infobox-linkedPanel
         _hideAfterDestroyContent: undefined
      },
      _dotTplFn: dotTplFn,
      $constructor: function(){
         this._publish('onShow', 'onHide', 'onChangeTarget', 'onBeforeShow');
         //Нельзя загрузить этот модуль в define, т.к. он отнаследован от Control.module.js, в котором в define загружается Infobox
         //Иначе получится циклическая зависимость
         if (typeof window !== 'undefined') { //Загружаем только на клиенте
            requirejs(['Lib/Control/InfoboxContent/InfoboxContent'], function(InfoboxContent) {
               this._infoboxContentDeferred.callback(InfoboxContent);
               return InfoboxContent;
            }.bind(this));
            this._hideAfterDestroyContent = this._hide.bind(this, true);
            $(window).on('resize', debounce(this._resizeHandler.bind(this), 50));
         }
      },
      _resizeHandler: function () {
         //Если есть таргет и инфобокс показан
         if (this.getCurrentTarget() && !this._isWaitingToShow) {
            this._resizeBox();
         }
      },

      getContainer: function() {
         return this._box;
      },
      _build: function(){
         var scrollingContainer = $('.ws-body-scrolling-content'), //Теперь в большинстве случаев скролл на странице находится на этом контейнере
             self = this;

         this._box = $(this._dotTplFn(this))
            .bind('mouseenter', function(){
               if(self._hideTimer){
                  clearTimeout(self._hideTimer);
               }
            })
            .bind('mouseleave', function(e) {
               if (this._autoHide) {
                  if (this._watchLinkedPanel) {
                     var target = e.relatedTarget.closest('.ws-infobox-linkedPanel');
                     if (target) {
                        this._linkedPanel = target;
                        return;
                     }
                  }
                  this.hide();
               }
            }.bind(this))
            .mousedown(function(e) {
               e.stopPropagation();
            });
         this._content = this.getContainer().find('.ws-infobox-content');
         if (!scrollingContainer.length){
            scrollingContainer = $(window);
         }
         scrollingContainer.bind('scroll', function () {
            self._hide();
         });
         $('.ws-infobox-close-button', this.getContainer()).bind('mousedown touchstart', function (e) {
            self.hide(0);
            e.stopPropagation();
            return false;
         });
         $('body').append(this.getContainer());
      },
      /**
       * Возвращает признак, по которому можно установить отображение инфобокса возле определенного DOM-элемента.
       * @param {jQuery|Element} element DOM-элемент.
       * @returns {Boolean}
       * @see getCurrentTarget
       * @see hasTarget
       */
      isCurrentTarget: function(element) {
         if(this._currentTarget && element) {
            return this._currentTarget == (element.get ? element.get(0) : element);
         } else {
            return false;
         }
      },
      /**
       * Возвращает DOM-элемент, возле которого отображается инфобокс.
       * @returns {Element|null} Текущий DOM-элемент, возле которого отображается инфобокс.
       * Если он ещё не открыт ни на одним из контролов или других элементов, то возвращается null.
       * @see isCurrentTarget
       * @see hasTarget
       */
      getCurrentTarget: function() {
         return this._currentTarget;
      },
      /**
       * Устанавливает текст, отображаемый в инфобоксе.
       * @param {String} text Текст, который будет отображён в инфобоксе. Допускается передавать вёрстку.
       * @example
       * В зависимости от значения флага изменять текст инфобокса.
       * <pre>
       *    var message1, message2;
       *    fieldCheckbox.subscribe('onChange', function(eventObject, value) {
       *       Infobox.setText(value ? message1 : message2);
       *    });
       * </pre>
       */
      setText: function(text) {
         this._setText(text);
         this._resizeBox();
         this._updateZIndex();
      },
      _setText: function(text){
         var insertedText = this._message = text;
         if (typeof this._message === 'string') {
            insertedText = escapeTagsFromStr(this._message, ['script']);
            if (!this._isInsertHTML(text)){
               insertedText = insertedText.replace(/\n/g, '<br>');
            }
         }

         this.getContainer().toggleClass('ws-infobox-has-title', !!this._title);
         if(this._content) {
            if (this._infoboxContentDeferred.isReady()) {
               this._createInfoboxContent(this._infoboxContentDeferred.getResult(), insertedText);
            }
            else {
               this._infoboxContentDeferred.addCallback(function(InfoboxContent) {
                  this._createInfoboxContent(InfoboxContent, insertedText);
                  return InfoboxContent;
               }.bind(this));
            }
         }
      },
      _createInfoboxContent: function(InfoboxContent, message) {
         if (this._infoboxContent) {
            var oldInfobox = this._infoboxContent;
            // КОСТЫЛЬ! вызываем дестрой предыдущего _infoboxContent отложенно, иначе будет преждевременно вызвана установка фокуса
            // например, есть datepicker с валидацией на фокусаут, убираем с него фокус и валидация говорит об ошибке
            // ошибка вызывает инфобокс, и тут зовется дестрой который внутри себя завершает пакет AreaAbstract_destroy
            // на завершение пакета срабатывает WindowManager.activateControl, которое возвращает фокус обратно на дейтпикер
            // и далее создается new InfoboxContent который снова переводит фокус и с дейтпикера снова уходит фокус и снова срабатывает валидация
            setTimeout(function () {
               oldInfobox.unsubscribe('onDestroy', this._hideAfterDestroyContent); //Не нужно, когда сами дестроим
               oldInfobox.destroy();
            }.bind(this), 0);
            this._infoboxContent._container.empty();
         }
         this._infoboxContent = new InfoboxContent({
            element: $('<div class="ws-infobox-content-root"></div>').appendTo(this.getContainer()),
            parent: this._getInfoboxParent(),
            message: message,
            title: this._title,
            infoboxSingleton: this,
            options: this._templateOptions,
            tabindex: 0,
            handlers: {
               onDestroy: this._hideAfterDestroyContent //Если подсказка на панели, то при дестрое панели, дестроится _infoboxContent
            }
         });

         // надо записать в wsControl контейнера правильный компонент, чтобы можно было до компонента достучаться из кнопки закрытия
         this.getContainer()[0].wsControl = this._infoboxContent;
      },
      _getInfoboxParent: function() {
         var parent = $(this.getCurrentTarget()).wsControl();
         while(!cInstance.instanceOfModule(parent, 'Lib/Control/AreaAbstract/AreaAbstract') && parent != null) {
            parent = parent.getParent();
         }
         return parent;
      },
      _isInsertHTML: function(data){
         var isHTML = false;
         try{
            isHTML = $(data).text() !== '';
         }
         catch(err){
         }
         return isHTML;
      },
      _clearShowTimer: function() {
         if(this._showTimer) {
            clearTimeout(this._showTimer);
            this._showTimer = undefined;
         }
      },
      _clearHideTimer: function() {
         if(this._hideTimer){
            clearTimeout(this._hideTimer);
            this._hideTimer = undefined;
         }
      },
      _clearWatchTimer: function() {
         if(this._watchTimer){
            clearTimeout(this._watchTimer);
            this._watchTimer = undefined;
         }
      },
      /**
       * Сбрасывает таймеры
       * @private
       */
      _clearTimers: function(){
         this._clearShowTimer();
         this._clearHideTimer();
      },
       /**
        * Возвращает признак: установлен ли для инфобокса DOM-элемент, возле которого он будет отображен.
        * @returns {Boolean} В значении true - инфобокс открыт.
        * @example
        * При готовности контрола открыть над ним инфобокс.
        * <pre>
        *    var message; //текст, отображаемый инфобоксом
        *    control.subscribe('onReady', function() {
        *       if (!Infobox.hasTarget()) {
        *          Infobox.show(this.getContainer(), message);
        *       }
        *    });
        * </pre>
        * @see getCurrentTarget
        * @see isCurrentTarget
        * @see show
        * @see setText
        */
      hasTarget: function() {
			return !!this._currentTarget;
      },
      /**
       * Смотрит за тем, что элемент, к которому привязана подсказка
       * 1. Находится в DOM (у него есть родитель 'html')
       * 2. У него нет невидимых родителей
       *
       * Иначе инициирует скрытие подсказки
       *
       * Этот метод выполняется по таймеру каждые 500мс
       * @private
       */
      _watchTargetPresent: function() {
         var $target = $(this.getCurrentTarget());

         if ($target.length && !isElementVisible($target)) {
            this._hide(true); //Если таргет пропал из dom - закрытие без задержек
         }
         else if (this._isCursorOut() && this._autoHide && (!this._linkedPanel || !$(this._linkedPanel).is(':visible'))) {
            this._linkedPanel = null;
            this.hide(INFOBOX_HIDE_DELAY);
         }
      },

      _isCursorOut: function() {
         var $target = $(this.getCurrentTarget()),
             isHovered,
             isFocused;
         //Функция показа может вызываться с задержкой (свойство delay при вызове метода show)
         //Если во время этой задержки таргет был удален из dom-дерева, то уже поздно делать проверки на ховер и фокус
         if (!$target.length) {
            return;
         }
         isHovered = this._isHovered($target) || this._isHovered(this.getContainer());
         isFocused = this._isFocused($target) || this._isFocused(this.getContainer());
         return !isHovered && !isFocused;
      },

      _isFocused: function(container) {
         //firefox нативно не уводит фокус со скрытого узла, нужна проверка на видимость.
         return !container.hasClass('ws-hidden') && (container[0] === document.activeElement || !!container.find(document.activeElement).length);
      },
      _isHovered: function(container) {
         return !!container.filter(':hover').length;
      },

      /**
       *
       * @typedef {String} PositionEnum
       * @variant tl Всплывающее окно отображается сверху относительно точки построения, выравнивается по левому краю.
       * @variant tc Всплывающее окно отображается сверху относительно точки построения, выравнивается по центру.
       * @variant tr Всплывающее окно отображается сверху относительно точки построения, выравнивается по правому краю.
       * @variant bl Всплывающее окно отображается снизу относительно точки построения, выравнивается по левому краю.
       * @variant bc Всплывающее окно отображается снизу относительно точки построения, выравнивается по центру.
       * @variant br Всплывающее окно отображается снизу относительно точки построения, выравнивается по правому краю.
       * @variant rt Всплывающее окно отображается справа относительно точки построения, выравнивается по верхнему краю.
       * @variant rc Всплывающее окно отображается справа относительно точки построения, выравнивается по центру.
       * @variant rb Всплывающее окно отображается справа относительно точки построения, выравнивается по нижнему краю.
       * @variant lt Всплывающее окно отображается слева относительно точки построения, выравнивается по верхнему краю.
       * @variant lc Всплывающее окно отображается слева относительно точки построения, выравнивается по центру.
       * @variant lb Всплывающее окно отображается слева относительно точки построения, выравнивается по нижнему краю.
       */
      /**
       * @typedef {String} modifiersEnum
       * @variant ws-infobox-type-error Модификатор, окно обводится в красную рамку. Используется для отображения ошибки.
       * @variant ws-infobox-type-lite Модификатор, окно имеет синий фон.
       * @variant ws-infobox-type-help Модификатор, окно имеет серый фон, используется для хелперов
       * @variant ws-infobox-title-red Модификатор, заголовок красного цвета
       * @variant ws-infobox-title-black Модификатор, заголовок черного цвета
       * @variant ws-infobox-title-green Модификатор, заголовок зеленого цвета
       * @variant ws-infobox-title-orange Модификатор, заголовок оранжевого цвета
       * @variant ws-infobox-full-width Модификатор, растягивающий ширину контентной области без учета крестика
       */
      /**
       *
       * Открывает всплывающую подсказку.
       * @param {Object} control Конфигурационный объект подсказки
       * @param {HTMLElement|jQuery} control.control DOM-элемент, около которого будет открыт инфобокс.
       * @param {String} control.message Содержимое инфобокса.
       * <ul>
       *     <li>Строка. В этом случае инфобокс отобразит текст, переданный строкой.</li>
       *     <li>Разметка с текстом. Теги не экранируются.</li>
       *     <li>Имя JS-модуля. Например, 'SBIS3.CONTROLS/TextBox'.</li>
       *     <li>Имя шаблона. Например, 'html!SBIS3.MyArea.MyComponent'.</li>
       * </ul>
       * Если значение для опции не установлено, инфобокс не будет отображен.
       * @param {String} [control.title] Текст, отображаемый в заголовке.
       * @param {Object} [control.templateOptions] Опции, с которыми инициализируется шаблон, переданный в message или title
       * @param {Number|String} [control.width='auto'] Ширина блока с подсказкой. Значение устанавливается в px. Если она не задана - будет автоширина в диапазоне [ 185px, ширинаЭкрана * 1/2 ].
       * @param {Number} [control.showDelay=200] Задержка перед отображением инфобокса. Значение устанавливается в мс.
       * @param {Number} [control.hideDelay=0] Через какое время скрыться инфобоксу после открытия. Значение устанавливается в мс. По умолчанию подсказка автоматически не скрывается.
       * @param {Function} [control.needToShow] Функция, определяющая надобность вызова подсказки. Если она не задана, то подсказка открывается всегда.
       * Если функция возвращает true, то это значит, что подсказка откроется. Если она вернёт false - значит подсказка не откроется.
       * @param {Boolean} [control.autoHide=false] Нужно ли скрывать подсказку при потере фокуса (или ховера) у подсказки или у цели.
       * @param {PositionEnum} [control.position='rl'] Способ позиционирования подсказки относительно таргета
       * @param {modifiersEnum} [control.modifiers] Доступные модификаторы для подсказки
       *
       * @example
       * Конфигурация инфобокса через единственный объект. При переходе фокуса на поле ввода (fieldString) открыть инфобокс.
       * <pre>
       *    fieldString.subscribe('onFocusIn', function() {
       *       var target = this.getContainer(), //получаем контейнер контрола
       *           options = {
       *              control: target, // Устанавливаем DOM-элемент, возле которого будет отображен инфобокс
       *              message: 'Пароль должен состоять из символов латинского алфавита и цифр', // Устанавливаем текст инфобокса
       *              width: 400, // Устанавливаем ширину инфобокса
       *              hideDelay: 5000 // Устанавливаем скрытие инфобокса через 5 секунд после появления
       *           };
       *       Infobox.show(options);
       *    });
       * </pre>
       * @see hide
       */
      show : function(control, message, width, showDelay, hideDelay, needToShow, autoHide){
         if (arguments.length === 1 && $.isPlainObject(arguments[0])) {
            var options = arguments[0],
                position = options.position,
                title = options.title,
                templateOptions = options.templateOptions,
                modifiers = options.modifiers;
            control = $(options.control);
            message = options.message;
            width = options.width;
            showDelay = typeof(options.showDelay) !== 'number' ? INFOBOX_SHOW_DELAY : options.showDelay;
            hideDelay = options.hideDelay;
            needToShow = options.needToShow;
            autoHide = options.autoHide;
            this._positionByTarget = options.positionByTarget || control;
            this._watchLinkedPanel = options.watchLinkedPanel;
         }
         else {
            control = $(control);
            showDelay = typeof(showDelay) !== 'number' ? INFOBOX_SHOW_DELAY : showDelay;
            this._positionByTarget = control; //выпилить по ошибке https://online.sbis.ru/opendoc.html?guid=fc084baa-cb70-4c19-8fb0-c7d97fdae7c4
            this._watchLinkedPanel = false;
         }

         if(!this._isCanShowInfobox(control, message, templateOptions, needToShow)) {
            return;
         }

         this._linkedPanel = null;
         this._isWaitingToShow = true;
         this._message = message;
			this._title = title;
         this._templateOptions = templateOptions;
			this._autoHide = !!autoHide;
         this._width = width === undefined ? 'auto' : width;
         this._position = position || 'tl';

         if(!this.getContainer()) {
            this._build();
         }

         this._setState('showing');
         this._subscribeToMoveTarget(control);
         this._clearShowTimer();
         if(this.isCurrentTarget(control) && !this._isWaitingToShow) {
            // Если мы уже на этом контроле - просто поменяем текст
            // Для этого скинем все задержки в 0,
            // это приведет к тому что подсказка поменяет текст и спозиционируется, если не влезла
            showDelay = 0;
         }
         this._currentTarget = control.get(0);
         this._updateZIndex(); // Обновляем z-index до показа подсказки. В случае, если в момент задержки показа покажется панель - подсказка должна быть под ней

         if(showDelay) {
            this._showTimer = setTimeout(function() {
               if (this._isTargetVisible($(this.getCurrentTarget())) && !this._autoHide || !this._isCursorOut()) {
                  this._show(control, modifiers, hideDelay);
               }
               else {
                  this._setState('hide');
                  this._hide(true);
               }
            }.bind(this), showDelay);
         }
         else {
            this._show(control, modifiers, hideDelay);
         }
      },

      _show: function(target, modifiers, hideDelay) {
         this._isWaitingToShow = false;
         if(this._notify('onBeforeShow', target) === false) {
            this._currentTarget = null;
            return;
         }
         this._setModifiers(modifiers);
         this._clearHideTimer();
         this._clearWatchTimer();
         // Если целевой элемент не является частью документа
         // Так же добавляю проверку на видимость, бывают случаи,
         // Когда после стандартной задержки элемент уже скрыт
         if(!this._isTargetVisible(target)){
            this._currentTarget = null;
            return;
         }

         //бывает такое что infobox показывается не у того контрола,
         // пробуем полечить это, ещё раз присваивая currentTarget перед показом
         if(!this._currentTarget) {
            this._currentTarget = target.get(0);
         }
         this._notify('onChangeTarget', this._currentTarget, target.get(0));

         this._setText(this._message);
         var self = this;
         if (this._infoboxContentDeferred.isReady()) {
            this._setInfoboxVisible(target, hideDelay);
         }
         else {
            this._infoboxContentDeferred.addCallback(function(InfoboxContent){
               self._setInfoboxVisible(target, hideDelay);
               return InfoboxContent;
            })
         }

      },

      _isCanShowInfobox: function(target, message, templateOptions, needToShowFunction) {
         var needToShow = typeof needToShowFunction === 'function' ? needToShowFunction() : true;
         var messageText = typeof message === 'function' ? message(templateOptions || {}) : message;
         return this._isTargetVisible(target) && !!messageText && needToShow;
      },

      //Состояния: hide, hiding, showing
      _setState: function(value) {
         this._state = value;
      },

      _getState: function() {
         return this._state;
      },

      _isTargetVisible: function(target) {
         var $positionByTarget = $(this._positionByTarget); //выпилить по ошибке https://online.sbis.ru/opendoc.html?guid=fc084baa-cb70-4c19-8fb0-c7d97fdae7c4
         return target.closest('html').length && isElementVisible(target) && $positionByTarget.closest('html').length && isElementVisible($positionByTarget);
      },

      _setInfoboxVisible: function(target, hideDelay) {
         this._resizeBox();
         this._watchTimer = setInterval(this._watchTargetPresent.bind(this), 500);
         this._setState('show');
         this._notify('onShow', target);
         if (hideDelay) {
            this.hide(hideDelay);
         }
      },

      _subscribeToMoveTarget: function(target) {
         this._unsubscribeToMoveTarget(); //Перед новой подпиской отпишемся от старого таргета, подписка может быть только 1
         this._targetChanges = trackElement(target, true);
         this._targetChanges.subscribe('onMove', this._onMoveTarget, this);
      },

      _unsubscribeToMoveTarget: function() {
         if (this._targetChanges) {
            this._targetChanges.unsubscribe('onMove', this._onMoveTarget, this);
            //Добавим проверку на наличе таргета, иначе если вызвать отписку от несуществующего таргета, то отписка произайдёт
            //от всех ранее подписанных элементов.
            if (this.hasTarget()) {
               trackElement(this.getCurrentTarget(), false);
            }
            this._targetChanges = null;
         }
      },

      _onMoveTarget: function(event, state, isInitial) {
         if (!isInitial) {
            this._unsubscribeToMoveTarget();
            this.hide(0);
         }
      },
      _setModifiers: function (modifiers) {
         var container = this.getContainer(),
            mod = ['ws-infobox-type-lite', 'ws-infobox-type-help', 'ws-infobox-type-error',
               'ws-infobox-title-red', 'ws-infobox-title-black', 'ws-infobox-title-green',
               'ws-infobox-title-orange', 'ws-infobox-full-width', 'ws-infobox-zero-padding'],
            modifiersArray;
         container.removeClass(mod.join(' '));
         if (modifiers) {
            modifiersArray = modifiers.split(' ');
            for (var i = 0, l = modifiersArray.length; i < l; i++) {
               if (mod.indexOf(modifiersArray[i] > -1)) {
                  container.addClass(modifiersArray[i]);
               }
            }
         }
      },
      _resizeBox : function(){
         var
            container = this.getContainer(),
            position = this._getPosition(),
            target = this._currentTarget,
            newWidth = this._width;

         if (this._state === 'hide' || this._state === 'hiding' || !target || !$(target).is(':visible')) { //не перепозиционируемся, если инфобокс скрыт
            return;
         }

         if (typeof newWidth === 'number') {
            container[0].style.width = newWidth + 'px';
         } else {
            newWidth = 'auto';
         }
         //Сделаем инфобокс видимым перед позиционированием
         //Нужно для того, чтобы при установке текста ширина контейнера установилась по содержимому
         //Пока контейнер скрыт у него не происходит перерасчет ширины, что приводит к ошибке позиционирования
         container.removeClass('ws-hidden');
         container.css({
            visibility: 'hidden',
            display: 'block',
            left: -10000,
            top: -10000
         });


         if(newWidth == 'auto') {
            container.css('width', '');
            container.css('max-width', Env.constants.$win.width() * MAX_WIDTH_TO_SCREEN_RATIO);
         }
         else{
            container.css('max-width', '');
         }
         container
            .css({
               visibility: 'visible'
            })
            .position({
               my: position.my,
               at: position.at,
               collision: 'flip',
               of: this._positionByTarget,
               using: function(pos, data) {
                  var triangleContainer = $('.ws-infobox-triangle', container);

                  if (data.vertical === 'middle') {
                     if (data.element.top === data.target.top){
                        data.vertical = 'top';
                     }
                     else if ((data.element.top + data.element.height) === (data.target.top + data.target.height)) {
                        data.vertical = 'bottom';
                     }
                  }

                  //Fix jquery position bug
                  if (this._position[0] === 't' || this._position[0] === 'b') { //фикс бага jquery только для позиционирования сверху или снизу от таргета
                     if (data.horizontal === 'center') {
                        if (data.element.left === data.target.left){
                           data.horizontal = 'left';
                        }
                        else if ((data.element.left + data.element.width) === (data.target.left + data.target.width)) {
                           data.horizontal = 'right';
                        }
                     }
                     else {
                        if (data.vertical !== 'middle') {
                           if (data.horizontal === 'left' && pos.left < data.target.left) {
                              data.horizontal = 'right';
                           }
                           else if (data.horizontal === 'right' && Math.abs((data.target.left + data.target.width) - (data.element.width + pos.left)) > 1) { //полупиксели
                              data.horizontal = 'left';
                           }
                        }
                     }

                     //Треугольник имеет отступ в 22px от края инфобокса, соответственно для маленьких контейнеров визуально
                     //позиционирование будет казаться кривым, т.к. подсказка расчитывает позицию от края таргета.
                     //Для таких контейров позиционируем треугольник по центру таргета
                     var target = data.target.element[0],
                        targetWidth = target.clientWidth || target.offsetWidth, //У inline узлов нет clientWidth
                        triangleOffset = INFOBOX_TRIANGLE_VERTICAL_PADDING,
                        offset;
                     if (targetWidth < MIN_INFOBOX_TARGET_CONTAINER_WIDTH) {
                        offset = Math.floor(triangleOffset - (targetWidth / 2));
                        if (data.horizontal == 'left') {
                           pos.left -= offset;
                        }
                        else if (data.horizontal == 'right') {
                           pos.left += offset;
                        }
                     }
                  }

                  //Полупиксели при jquery-позициоинровании, из-за чего иногда позиционирование при расчетах ошибается на 1px
                  //Инфобокс всегда должен быть в видимой части
                  var dif = (data.element.left + data.element.width) - window.innerWidth;
                  if (dif > 0) {
                     pos.left -= dif;
                  }

                  triangleContainer.toggleClass('ws-infobox-triangle-top', !position.isSide && data.vertical === 'top')
                     .toggleClass('ws-infobox-triangle-bottom', !position.isSide && data.vertical === 'bottom')
                     .toggleClass('ws-infobox-triangle-right', !position.isSide && data.horizontal === 'right')
                     .toggleClass('ws-infobox-triangle-left', !position.isSide && data.horizontal === 'left')
                     .toggleClass('ws-infobox-triangle-center', !position.isSide && data.horizontal === 'center')
                     .toggleClass('ws-infobox-triangle-vertical-top', position.isSide && data.vertical === 'top')
                     .toggleClass('ws-infobox-triangle-vertical-bottom', position.isSide && data.vertical === 'bottom')
                     .toggleClass('ws-infobox-triangle-vertical-middle', position.isSide && data.vertical === 'middle')
                     .toggleClass('ws-infobox-triangle-vertical-right', position.isSide && data.horizontal === 'right')
                     .toggleClass('ws-infobox-triangle-vertical-left', position.isSide && data.horizontal === 'left');

                  //Округление для ie, который при дробных значениях координат криво рисует тень
                  container.css({
                     top: Math.ceil(pos.top),
                     left: Math.ceil(pos.left)
                  });
               }.bind(this)
            });
      },
      _getPosition: function() {
         var offset = $('.ws-infobox-triangle').height(),
             position = this._position[0] || 't',
             align = this._position[1] || 'l',
             my, at,
             data = {
                t: 'top',
                b: 'bottom',
                c: 'center',
                l: 'left',
                r: 'right',
                invertr: 'left',
                invertl: 'right',
                invertt: 'bottom',
                invertb: 'top'
             };
         switch (position) {
            case 't':
            case 'b':
               my = data[align] + ' ' + data['invert' + position];
               at = data[align] + ' ' + data[position] + (position === 't' ? '-' : '+') + offset;
               break;
            case 'r':
            case 'l':
               my = data['invert' + position] + ' ' + data[align];
               at = data[position] + (position === 'l' ? '-' : '+') + offset + ' ' + data[align];
               break;
         }

         return {
            my: my,
            at: at,
            isSide: position === 'r' || position === 'l'
         }
      },
      _updateZIndex: function(){
         var target = $(this.getCurrentTarget()),
             floatArea,
             zindex;
         if (target) {
            //Если инфобокс внутри панели - то "верхние" панели должны его перекрывать
            floatArea = target.closest('.ws-float-area-stack-cut-wrapper');
            if (floatArea.length) {
               zindex = floatArea.css('z-index');
            }
         }
         this.getContainer().css('z-index', zindex || this._getNewZIndex());
      },
      _hide: function(noFade) {
         if (this._getState() === 'showing' || this._getState() === 'hide') {
            return;
         }
         this._setState('hide');
         this._clearWatchTimer();
         if (noFade || Env.detection.isIE10) { // ie10 не анимируется по нормальному, визуально на время исчезновения компонента ничего не происходит, не запускаю в нем анимацию
            this._hideCallback();
         }
         else {
            this.getContainer().stop().css('opacity', 1).fadeOut('fast', this._hideCallback.bind(this));
         }
      },
      _hideCallback: function() {
         this.getContainer().addClass('ws-hidden');
         this._notify('onChangeTarget', this._currentTarget, null);
         this._unsubscribeToMoveTarget();
         this._currentTarget = null;
         this._notify('onHide');
      },
      /**
       * Скрывает инфобокс.
       * @param {Number} [delay = 300] Задержка в миллисекундах перед скрытием инфобокса.
       * @example
       * При уходе фокуса с контрола скрыть инфобокс через 2 секунды.
       * <pre>
       *    control.subscribe('onFocusOut', function() {
       *       Infobox.hide(2000);
       *    });
       * </pre>
       * @see show
       */
      hide: function(delay){
         this._clearTimers();
         this._setState('hiding');
         if(this.getContainer()){
            if(delay === 0){
               this._hide();
            }
            else{
               var self = this;
               this._hideTimer = setTimeout(function(){
                  self._hide();
               }, ((delay === undefined || typeof(delay) !== 'number') ? INFOBOX_HIDE_DELAY : delay));
            }
         }
      },

      _getNewZIndex: function() {
         var target = this.getCurrentTarget(),
             popupsSelector = '.ws-smp-dlg, .controls-Menu__Popup:not(.ws-hidden), .controls-SubmitPopup_popup',
             targetWindow,
             zIndex;
         if (target) {
            //Если таргет на информационном диалоговом окне, то инфобокс должен быть выше этого окна.
            targetWindow = $(target).closest('.controls-Popup, .controls-SubmitPopup_popup, .ws-window:not(.ws-hidden):not(.controls-CompoundArea)')[0];
            if (targetWindow) {
               if (targetWindow.wsControl) {
                  zIndex = targetWindow.wsControl.getZIndex();
               }
               else {
                  //на vdom если инфобокс показывается с панели, то устанавливаем ему zindex относительно этой панели,
                  //иначе он становится выше всех vdom попапов (информационных или тех, которые окрыты из него)
                  zIndex = parseInt(targetWindow.style.zIndex, 10);
               }
               return zIndex + 1;
            }
         }
         // Подсказка должна быть ниже всех информационных окон и попапов от меню
         return this._highZIndex() + (!$('body').find(popupsSelector).length ? 1 : -1);
      },

      /**
       * Находит максимальный z-index
       * @param [parent] - элемент, с которого необходимо считать z-index
       * @param [limit] - максимальный лимит z-index
       * @returns {number}
       * @private
       *
       * @description
       * Метод считает z-index по стандарту W3C. Учитывает контекст позиций и свойство opacity
       * Более подробно: http://habrahabr.ru/post/166435/
       * (C)копипащено отсюда: http://stackoverflow.com/questions/4503969/how-do-i-get-the-element-with-the-highest-css-z-index-in-a-document/5439622#5439622
       * Проблемы:
       *  - Не учитывается transform (ведет себя аналогично opacity)
       *  - В IE 9-10 (11?) может вести себя не верно, из за того, что браузер наклал на стандарты и iframe и selection считает по своему,
       *    плюс opacity и transform не формируют новый контекст, если position = absolute/fixed
       */
      _highZIndex: function(parent, limit) {
         limit = limit || Infinity;
         parent = parent || document.body;

         var who, temp, max= 1, opacity, i= 0;
         var children = parent.childNodes, length = children.length;

         while(i < length) {
            who = children[i++];
            if (who.nodeType != 1 || this._deepCss(who, 'display') === 'none' || this._deepCss(who, 'visibility') === 'hidden' || $(who).hasClass('ws-info-box')) {
               // element nodes only
               continue;
            }
            opacity = this._deepCss(who, 'opacity');
            if (this._deepCss(who, 'position') !== 'static') {
               temp = this._deepCss(who, 'z-index');
               if (temp == 'auto') {
                  // positioned and z-index is auto, a new stacking context for opacity < 0. Further When z-index is auto ,it shall be treated as z-index = 0 within stacking context.
                  temp = (opacity < 1) ? 0 : this._highZIndex(who);
               } else {
                  temp = parseInt(temp, 10) || 0;
               }
            } else {
               // non-positioned element, a new stacking context for opacity < 1 and z-index shall be treated as if 0
               temp = (opacity < 1) ? 0 : this._highZIndex(who);
            }
            if (temp > max && temp <= limit) {
               max = temp;
            }
         }
         return max;
      },

      _deepCss: function(who, css) {
         var sty, val, dv= document.defaultView || window;
         if (who.nodeType == 1) {
            sty = css.replace(/\-([a-z])/g, function(a, b) {
               return b.toUpperCase();
            });
            val = who.style[sty];
            if (!val) {
               if (who.currentStyle) {
                  val= who.currentStyle[sty];
               } else if (dv.getComputedStyle) {
                  val= dv.getComputedStyle(who, '').getPropertyValue(css);
               }
            }
         }
         return val || '';
      }
   }))();


   Infobox.HIDE_TIMEOUT = 500;
   Infobox.SHOW_TIMEOUT = 500;
   Infobox.ACT_CTRL_HIDE_TIMEOUT = 10000;

   return Infobox;
});
