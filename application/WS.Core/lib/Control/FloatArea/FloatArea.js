define('Lib/Control/FloatArea/FloatArea', [
   "Core/core-extend",
   'Core/helpers/isNewEnvironment',
   'Core/helpers/Function/once',
   'Core/helpers/Object/find',
   'Core/helpers/Function/forAliveOnly',
   'Core/helpers/Function/memoize',
   'require',
   "Core/helpers/Object/isEmpty",
   "Core/WindowManager",
   'Env/Event',
   "Core/CommandDispatcher",
   'Env/Env',
   "Lib/Control/TemplatedArea/TemplatedArea",
   "Lib/FloatAreaManager/FloatAreaManager",
   "Lib/Control/ModalOverlay/ModalOverlay",
   "Lib/Mixins/LikeWindowMixin",
   'Browser/TransportOld',
   'Core/markup/ParserUtilities',
   "Core/core-instance",
   'Core/core-clone',
   'Core/helpers/Function/shallowClone',
   "Core/ControlBatchUpdater",
   "Lib/Mixins/PendingOperationParentMixin",
   "Core/Deferred",
   'Core/helpers/Hcontrol/screen',
   'Core/helpers/Hcontrol/trackElement',
   'Core/helpers/Hcontrol/doAutofocus',
   'Core/helpers/Hcontrol/getScrollWidth',
   "is!browser?Lib/LayoutManager/LayoutManager",
   'Vdom/Vdom',
   'Core/helpers/Array/findIndex',
   "Core/Context",
   "css!Lib/Control/FloatArea/FloatArea",
   "is!browser?/cdn/jquery-ui/1.12.1.2/jquery-ui-position-min.js",
   "i18n!Lib/Control/FloatArea/FloatArea"
], function(
   cExtend,
   isNewEnvironment,
   once,
   objectFind,
   forAliveOnly,
   memoize,
   require,
   isEmptyObject,
   WindowManager,
   EnvEvent,
   CommandDispatcher,
   Env,
   TemplatedArea,
   FloatAreaManager,
   ModalOverlay,
   LikeWindowMixin,
   TransportOld,
   ParserUtilities,
   cInstance,
   coreClone,
   cShallowClone,
   ControlBatchUpdater,
   PendingOperationParentMixin,
   Deferred,
   screenJS,
   trackElement,
   doAutofocus,
   getScrollWidth,
   LayoutManager,
   Vdom
) {
   'use strict';

   var
      USE_ANIMATION = FloatAreaManager._useAnimation(),
      nop = function () {},
      USE_CSS3 = FloatAreaManager._useCss3(),
      BROWSER = Env.constants.browser,
      USE_SHADOWS = !BROWSER.isIE || BROWSER.IEVersion > 8, //В IE8 тени не работают - используем вместо них бордюр
      //см. комментарий у класса ws-float-area-no-height-calc
      //и ещё: у IE 10 (не говоря уже о <= 9) не работает табличная вёрстка тут - (ws-float-area-no-height-calc)
      //  height: 100%, установленная на ws-float-area-stack-panel-shadow, в некоторых случаях приводит к обрезанию содержимого,
      //  большего 100%. см. задачу -
      //    Ошибка в разработку от 29.03.2016 №1172698804 нет аккордеона и скролла в карточке контаргента на вкладке госорганы в браузере ИЕ
      //    https://inside.tensor.ru/opendoc.html?guid=857574a5-3807-4422-8220-85c873904e08
      USE_STACK_PANEL_HEIGHT_RECALC = BROWSER.isIE,
      BODY,
      CHILD_WINDOW_CLASSES = ['Lib/Control/FloatArea/FloatArea', 'Lib/Control/Window/Window'],
      ANIMATION_LENGTH = 150,
      MIN_ANIMATION_LENGTH = 20,
      MAX_STACK_PANEL_COUNT = 8,
      DEFAULT_SIZE = 200,    //Значение, которое будет использоваться для размеров области по-умолчанию
      HOVER_TIMEOUT = 1000,  //Длительность таймера, по истечении которого панель будет скрыта (при использовании опции {@link Lib/Control/FloatArea/FloatArea#hoverTarget})
      SHOW_DELAY = 300,      //Дефолтная задержка показа панели. Используется это значение, если указана опция {@link Lib/Control/FloatArea/FloatArea#hoverTarget}, иначе - 0
      logger = Env.IoC.resolve('ILogger'),
      logError = logger.error.bind(logger, 'Lib/Control/FloatArea/FloatArea'),
      CommandDispatcher = CommandDispatcher,
      positionResult = {},
      createBatchUpdateWrapper = ControlBatchUpdater.createBatchUpdateWrapper.bind(ControlBatchUpdater);

   function getBody() {
      if (!BODY) {
         BODY = Env.constants.isBrowserPlatform && $('body');
      }
      return BODY.length && BODY;
   }

   /**
    * @typedef {{direction: string, side: string, valign: string, offset: {x: number, y: number}, fitWindow: boolean, flipWindow: boolean}} AreaOptions
    * @typedef {{at: string, my: string, getFlipped: Function}} PositionOptions
    */

   /**
    * @param {jQuery} element
    * @param {jQuery} target
    * @param {AreaOptions} options
    * @return {function}
    */
   function getPositionFn(element, target, options) {

      function usingWithPositionArrow(position, feedback) {
         if (options.arrow) {
            var e_x1 = feedback.element.left,
               e_y1 = feedback.element.top,
               e_x2 = e_x1 + feedback.element.width,
               e_y2 = e_y1 + feedback.element.height,
               t_x1 = feedback.target.left,
               t_y1 = feedback.target.top,
               t_x2 = t_x1 + feedback.target.width,
               t_y2 = t_y1 + feedback.target.height,
               arrowWidth = 20,
               arrowHeight = 10,
               arrow, pos, indent;

            if (t_y1 - e_y2 >= arrowHeight || e_y1 - t_y2 >= arrowHeight) {
               var l = Math.max(e_x1, t_x1),
                  r = Math.min(e_x2, t_x2);
               indent = t_x1 > e_x1 ? t_x1 - e_x1 : 0;
               if (r-l >= arrowWidth) {
                  arrow = e_y2 < t_y1 ? 'bottom' : 'top';
                  pos = (r-l)/2 + indent;
               }
            }
            else if (t_x1 - e_x2 >= arrowHeight || e_x1 - t_x2 >= arrowHeight) {
               var u = Math.max(e_y1, t_y1),
                  d = Math.min(e_y2, t_y2);
               indent = t_y1 > e_y1 ? t_y1 - e_y1 : 0;
               if (d-u >= arrowWidth) {
                  arrow = e_x2 < t_x1 ? 'right' : 'left';
                  pos = (d-u)/2 + indent;
               }
            }

            if (arrow) {
               var arrowClass = 'ws-float-area-arrow-' + arrow;

               var prop = (arrow == 'left' || arrow == 'right') ? 'top' : 'left';

               if (!element._arrowBefore) {
                  element._arrowBefore = $('<div class="arrowBefore ' + arrowClass + '"></div>');
                  element._arrowBefore.appendTo(element);
               }
               if (!element._arrowAfter) {
                  element._arrowAfter = $('<div class="arrowAfter ' + arrowClass + '"></div>');
                  element._arrowAfter.appendTo(element);
               }
               element._arrowBefore.css(prop, pos);
               element._arrowAfter.css(prop, pos);
            }
         }
         // im.dubrovin из за дробных значений флоат ария дергается при открытии
         // task: 1173373629
         position.left = parseInt(position.left, 10);
         position.top = parseInt(position.top, 10);

         // save the position, then to understand where the popup opened
         positionResult.elementLeft = position.left;

         if (!options.isStack && options.restrictionContainer){
            var restrictionContainer = $(options.restrictionContainer),
               restrictionContainerWidth = restrictionContainer.width(),
               restrictionContainerOffsetLeft = restrictionContainer[0].getBoundingClientRect().left,
               elementWidth = element.width(),
               dif = (elementWidth + position.left) -  (restrictionContainerWidth + restrictionContainerOffsetLeft);
            if (restrictionContainer.length && dif > 0) {
               position.left -= dif + 1; //1px под тень
            }
         }

         if (position.left < 0) {
            position.left = 0;
         }
         if (position.top < 0) {
            position.top = 0;
         }

         element.css(position);
      }

      /**
       * @typedef {{vertical: string, horizontal: string, left: number, right: number, top: number, bottom: number}} WindowIntersections
       * @typedef {{vertical: boolean, horizontal: boolean}} TargetIntersections
       * @typedef {{left: number, top: number, width: number, height: number}} Bounds
       * @typedef {{element: Bounds}} FeedbackBounds
       * @typedef {{vertical: {side: string, offset: Number}, horizontal: {side: string, offset: Number}}} MyAtParsed
       */

      /**
       * @param {Bounds}  bounds
       * @return {WindowIntersections}
       */
      function getWindowIntersections(bounds) {
         var
            scrollingContent = element.closest('.ws-body-scrolling-content'),
            winWidth = $(window).width(), winHeight = $(window).height(),
            screenPos = screenJS.toScreen(bounds),
            result;

         if (scrollingContent.length > 0) {
            winWidth -= getScrollWidth();
         }

         screenPos = screenJS.toScreen(bounds);
         result = {
            left:   -screenPos.left,
            right:  screenPos.left + bounds.width - winWidth,
            top:    -screenPos.top,
            bottom: screenPos.top + bounds.height - winHeight,
            vertical: '',
            horizontal: ''
         };

         if (result.right > 0) {
            result.horizontal = 'right';
         } else if (result.left > 0) {
            result.horizontal = 'left';
         }

         if (result.bottom > 0) {
            result.vertical = 'bottom';
         } else if (result.top > 0) {
            result.vertical = 'top';
         }

         return result;
      }

      /**
       * @param {AreaOptions} options
       * @return {PositionOptions}
       */
      function convertOptions(options) {
         function addOffset(offsetSide, offset) {
            var offsetStr = offset ? (offset > 0 ? '+' : '') + offset  : '';
            return offsetSide + offsetStr;
         }

         var
            positionOptions = {
            },
            DIR_REVERSE = {
               top: 'bottom',
               bottom: 'top',
               left: 'right',
               right: 'left',
               center: 'center',
               middle: 'middle'
            },
            valign = options.verticalAlign,
            side = options.side,
            offset = options.offset,
            offsetX = Math.floor(Number(offset.x) || 0),
            offsetY = Math.floor(Number(offset.y) || 0),
            myH, myV, atH, atV,
            direction = options.direction;

         // jQuery position принимает положение как center а мы храним как middle
         if (valign === 'middle') {
            valign = 'center';
         }

         switch(direction) {
            case 'top':
            case 'bottom':
               myH = side;
               myV = DIR_REVERSE[direction];
               break;

            case 'left':
            case 'right':
               myH = DIR_REVERSE[direction];
               myV = 'top';
               break;
         }

         var
            initialMyH = addOffset(myH, offsetX),
            initialMyV = addOffset(myV, offsetY);

         atH = side;
         atV = valign;
         positionOptions.my = initialMyH + ' ' + initialMyV;
         positionOptions.at = atH + ' ' + atV;
         positionOptions.myH = initialMyH;
         positionOptions.myV = initialMyV;
         positionOptions.atH = atH;
         positionOptions.atV = atV;
         positionOptions.of = target;
         positionOptions.collision = 'none';

         positionOptions.fitByOffset = function(windowIntersections, elementScreenBounds) {
            var
               horizontalFit = options.fitWindow === 'horizontal' || options.fitWindow === 'both' || options.fitWindow === true,
               verticalFit = options.fitWindow === 'vertical' || options.fitWindow === 'both' || options.fitWindow === true,
               dX = 0, dY = 0;

            if (horizontalFit) {
               if (windowIntersections.left > 0) {
                  dX = windowIntersections.left;
               } else if (windowIntersections.right > 0) {
                  dX = -Math.min(windowIntersections.right, elementScreenBounds.left);
               }
            }

            if (verticalFit) {
               if (windowIntersections.top > 0) {
                  dY = windowIntersections.top;
               } else if (windowIntersections.bottom > 0) {
                  dY = -Math.min(windowIntersections.bottom, elementScreenBounds.top);
               }
            }

            var fittedMyH = addOffset(this.myHFlipped, offsetX + dX),
               fittedMyV = addOffset(this.myVFlipped, offsetY + dY);

            return {
               my: fittedMyH + ' ' + fittedMyV,
               at: this.at,
               of: target,
               myH: fittedMyH,
               myV: fittedMyV,
               atH: this.atH,
               atV: this.atV,
               collision: 'none'
            };
         };

         /**
          * @param {WindowIntersections} windowIntersections
          * @return {{my: string, at: string}}
          */
         positionOptions.getFlipped = function (windowIntersections) {
            var
               horizontalFlip = options.flipWindow === 'horizontal' || options.flipWindow === 'both' || options.flipWindow === true,
               verticalFlip = options.flipWindow === 'vertical' || options.flipWindow === 'both' || options.flipWindow === true,
               myHFlipped, myVFlipped, offsetSignX, offsetSignY, myFlipped, atFlipped, atHFlipped, atVFlipped, flippedResult;

            if (windowIntersections.horizontal === 'right' && horizontalFlip) {
               myHFlipped = 'right';
            } else if (windowIntersections.horizontal === 'left' && horizontalFlip) {
               myHFlipped = 'left';
            } else {
               myHFlipped = myH;
            }

            if (windowIntersections.vertical === 'top' && verticalFlip) {
               myVFlipped = 'top';
            } else if (windowIntersections.vertical === 'bottom' && verticalFlip) {
               myVFlipped = 'bottom';
            } else {
               myVFlipped = myV;
            }

            offsetSignX = myHFlipped === myH ? 1 : -1;
            offsetSignY = myVFlipped === myV ? 1 : -1;

            var flippedMyH = addOffset(myHFlipped, offsetX * offsetSignX),
               flippedMyV = addOffset(myVFlipped, offsetY * offsetSignY);

            myFlipped = flippedMyH + ' ' + flippedMyV;

            atHFlipped = myH !== myHFlipped ? DIR_REVERSE[atH] : atH;
            atVFlipped = myV !== myVFlipped ? DIR_REVERSE[atV] : atV;

            atFlipped = atHFlipped + ' ' + atVFlipped;

            flippedResult = {
               my: myFlipped,
               at: atFlipped,
               of: target,
               fitByOffset: positionOptions.fitByOffset,
               myHFlipped: myHFlipped,
               myVFlipped: myVFlipped,
               myH: flippedMyH,
               myV: flippedMyV,
               atH: atHFlipped,
               atV: atVFlipped,
               collision: 'none'
            };

            //im.dubrovin:  откатил мердж по ошибке 1172675308
            //if (options.flipWindow) {
            return flippedResult;
            /*} else {
               positionOptions.fitByOffset = fitByOffset;
               myHFlipped = myH;
               myVFlipped = myV;
               atFlipped = positionOptions.at;
               return positionOptions;
            }*/
         };

         return positionOptions;
      }

      /**
       * @param {PositionOptions} positionOptions
       * @param {{result: PositionOptions}} resultContainer
       * @param {{left: number, top: number}} pos
       * @param feedback
       */
      function usingForFlip(positionOptions, resultContainer, pos, feedback) {
         var initialOptions = {};
         positionResult.targetLeft = feedback && feedback.element && feedback.element.left;
         if ('my' in positionOptions) {
            initialOptions.my = positionOptions.my
         }

         if ('at' in positionOptions) {
            initialOptions.at = positionOptions.at
         }

         if ('of' in positionOptions) {
            initialOptions.of = positionOptions.of
         }

         if ('collision' in positionOptions) {
            initialOptions.collision = positionOptions.collision
         }
         var
            intersectionsBeforeFlip = getWindowIntersections(feedback.element),
            horizontalFit = options.fitWindow === 'horizontal' || options.fitWindow === 'both' || options.fitWindow === true,
            verticalFit = options.fitWindow === 'vertical' || options.fitWindow === 'both' || options.fitWindow === true,
            flippedOpts = positionOptions.getFlipped(intersectionsBeforeFlip);


         function usingForFit(pos, feedback) {
            var
               intersectionsAfterFlip = getWindowIntersections(feedback.element),
               boundsAfterFlip = screenJS.toScreen(feedback.element),
               fittedOpts;

            if (intersectionsAfterFlip.horizontal || intersectionsAfterFlip.vertical) {
               fittedOpts = flippedOpts.fitByOffset(intersectionsAfterFlip, boundsAfterFlip);

               if (horizontalFit && verticalFit) {
                  resultContainer.result = fittedOpts;
               } else if (horizontalFit) {
                  fittedOpts.my = fittedOpts.myH + ' ' + (intersectionsAfterFlip.vertical ? positionOptions.myV : flippedOpts.myV);
                  fittedOpts.at = fittedOpts.atH + ' ' + (intersectionsAfterFlip.vertical ? positionOptions.atV : flippedOpts.atV);
                  resultContainer.result = fittedOpts;
               } else if (verticalFit) {
                  fittedOpts.my = (intersectionsAfterFlip.horizontal ? positionOptions.myH : flippedOpts.myH) + ' ' + fittedOpts.myV;
                  fittedOpts.at = (intersectionsAfterFlip.horizontal ? positionOptions.atH : flippedOpts.atH) + ' ' + fittedOpts.atV;
                  resultContainer.result = fittedOpts;
               } else {
                  resultContainer.result = initialOptions;
               }
            } else {
               resultContainer.result = flippedOpts;
            }
            resultContainer.result.using = usingWithPositionArrow;
         }

         flippedOpts.using = usingForFit;
         element.position(flippedOpts);
      }

      return function() {
         var
            resultContainer = {},
            positionOptions = convertOptions(options);

         positionOptions.using = usingForFlip.bind(undefined, positionOptions, resultContainer);
         element.position(positionOptions);
         return resultContainer.result;
      };
   }

   function forStackOnly(func) {
      return function() {
         if (this._options.isStack) {
            return func.apply(this, arguments);
         }
      };
   }

   function forNonStackOnly(func) {
      return function() {
         if (!this._options.isStack) {
            return func.apply(this, arguments);
         }
      };
   }

   var forAliveOnly = forAliveOnly;

   function forReadyOnly(func, selfArg) {
      return function() {
         var self = selfArg || this,
            args = arguments;

         return this.getReadyDeferred().addCallback(function() {
            if (!self.isDestroyed()) {
               return func.apply(self, args);
            }
         });
      };
   }

   /**
    * Всплывающая панель
    * Панель, которая либо выезжает с левого края, либо появляется с правого края с fadeIn
    * При открытии панели происходит поиск контрола, для которого установлен CSS-класс ws-autofocus.
    * <ol>
    * <li>Если подходящий контрол найден, на него устанавливается фокус методом {@link setActive}. В случае, если класс установлен на панель, фокус устанавливается на дочерний компонент панели согласно установленным tabindex. В случае, если класс установлен на компонент внутри панели, то поиск будет происходить внутри нее;</li>
    *    <li>Если такой контрол не найден:
    *       <ul><li>В случае загрузки страницы активируется первый попавшийся компонент.</li></ul>
    *       <ul><li>В случае загрузки панели происходит поиск согласно установленным tabindex. Если таких компонентов несколько, фокус устанавливается на первый найденный. Если ничего активировать не удается, фокус устанавливается на саму панель.</li></ul>
    *    </li>
    * </ol>
    * @author Крайнов Д.О.
    * @class Lib/Control/FloatArea/FloatArea
    * @cssModifier ws-float-area-header-background Класс, задающий цвет пользовательской шапки.
    * @cssModifier ws-float-area-header-border Класс, задающий цвет бордера для пользовательской шапки.
    * @extends Lib/Control/TemplatedArea/TemplatedArea
    * @control
    * @public
    */
   var FloatArea = cExtend.mixin(TemplatedArea, [LikeWindowMixin, PendingOperationParentMixin]).extend(/** @lends Lib/Control/FloatArea/FloatArea.prototype */{
      /**
       * @event onClose Происходит перед закрытием панели.
       * @remark
       * Событие происходит в момент начала анимации закрытия всплывающей панели.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       */
      /**
       * @event onBeforeShow Происходит перед началом показа панели или при первой загрузке шаблона.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * Перед началом анимации открытия панели проверяем отступы - не превышают ли они размеры текущего документа.
       * <pre>
       *     onBeforeShow: function() {
       *        var offSet = this.getOffset();
       *        if (offset.x > $(document).width()) {
       *           offSet.x=0;
       *        }
       *        if (offSet.y > $(document).height()) {
       *           offSet.y=0;
       *        }
       *        this.setOffset(offSet);
       *     }
       * </pre>
       */
      /**
       * @event onAfterShow Происходит при показаной панели и готовых контролах.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @remark
       * Событие срабатывает после выполнения обоих пунктов:
       * <ol>
       *    <li>показа панели,</li>
       *    <li>готовности контролов на этой панели.</li>
       * </ol>
       * Событие наступает на каждый показ панели.
       * @example
       * Устанавливаем значение в поле ввода (Строка 1) после показа всплывающей панели:
       * <pre>
       *    floatArea.subscribe('onAfterShow', function(){
       *       if (this.isVisible()) {
       *          this.getTopParent().getChildControlByName('Строка 1').setValue('какое-то значение');
       *       }
       *    })
       * </pre>
       */
      /**
       * @event onAfterClose Происходит после закрытия панели.
       * @remark
       * Событие срабатывает после окончания анимации закрытия панели, когда её больше не видно.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param [result] Параметр приходит из команды {@link close}, передаётся в обработчик события.
       * @example
       * По окончании анимации закрытия панели откроем другую всплывающую панель:
       * <pre>
       *     floatArea.subscribe('onAfterClose', function(){
       *        //открываем вторую всплывающую панель
       *        helpers.showFloatArea({
       *           name: this.getName() + '2',
       *           template: "Окно выбора",
       *           //кнопка открытия первой всплывающей панели
       *           target: btn
       *        });
       *     })
       * </pre>
       * @see close
       */
      /**
       * @event onBeforeClose Происходит перед началом закрытия панели.
       * @remark
       * Событие срабатывает перед началом анимации закрытия всплывающей панели.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param [result] Параметр приходит из команды {@link close}, передаётся в обработчик события.
       * @return {Boolean} Можно запретить закрытие панели, если передать false.
       * @see hide
       * @see close
       */
      /**
       * @event onChangeMaximizeState Происходит при клике на кнопку разворачивания/сворачивания панелей.
       * @remark
       * Событие работает только при включенной опции {@link canMaximize}.
       * @return {Boolean} Значение true - ширина панели меняется, false - не меняется.
       */
      /**
       * @event onTargetVisibilityChange Происходит после смены видимости элемента, установленного в опции {@link target}.
       * @remark
       * Событие срабатывает после смены элемента, установленного в опции {@link target}. После того как событие произошло, Lib/Control/FloatArea/FloatArea закрывается.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @return {Boolean} Можно отключить закрытие панели при смене видимости элемента, установленного в опции {@link target}. Это производят в обработчике события:
       * <pre>
       *     myObj.subscribe('onTargetVisibilityChange', function(eventObject){
       *        eventObject.setResult(false);
       *     });
       * </pre>
       */
      /**
       * @event onScroll Происходит на прокрутку панели из стека.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {Object} scrollData Объект с данными прокрутки.
       * @param {jQuery} scrollData.element Блок, оборачивающий и прокручивающий содержимое панели.
       * @param {Number} scrollData.clientHeight Клиентская высота (высота видимой области) у блока прокрутки.
       * @param {Number} scrollData.scrollTop Позиция прокрутки.
       * @param {Number} scrollData.scrollHeight Высота содержимого панели.
       * @remark
       * Если (clientHeight + scrollTop) === scrollHeight, то панель докрутилась до низа.
       */
      $protected: {
         _options: {
            /**
             * @cfg {Boolean} Устанавливает поведение: будет ли панель подстраиваться по ширине под своё содержимое.
             * @name Lib/Control/FloatArea/FloatArea#autoWidth
             * @description
             * Возможные значения:
             * <ul>
             *    <li>true - контрол будет подстраиваться по ширине под своё содержимое.</li>
             *    <li>false - не будет подстраиваться по ширине.</li>
             * </ul>
             * @see width
             * @see autoHeight
             */
            /**
             * @cfg {Boolean} Устанавливает поведение: будет ли панель подстраиваться по высоте под своё содержимое.
              * @name Lib/Control/FloatArea/FloatArea#autoHeight
             * @description
             * Возможные значения:
             * <ul>
             *    <li>true - контрол будет подстраиваться по высоте под своё содержимое.</li>
             *    <li>false - не будет подстраиваться по высоте.</li>
             * </ul>
             * @see height
             * @see autoWidth
             */
            /**
             * @cfg {String|jQuery|HTMLElement} Элемент, к углам которого будет прижиматься контрол.
             *
             * В случае, если указана опция {@link fixed} === true, опция {@link target} игнорируется,
             * и target-ом считается окно браузера (window), поскольку элемент с фиксированным позиционированием располагается
             * в системе координат окна, а не документа.
             * Подробнее см. описание опции {@link fixed}.
             * Актуально только при использовании {@link isStack} === false (для нестековых панелей), для стековых же эта опция игнорируется.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          // всплывающая панель привязывается к кнопке, её вызывающей
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see animation
             * @see slide
             * @see verticalAlign
             * @see direction
             * @see isStack
             * @see fixed
             */
            target: '',
            /**
             * @cfg {String} Горизонтальная позиция панели относительно элемента, заданного в опции target
             *
             * Позиционирование панели по горизонтали относительно {@link target}'а.
             * Актуально при использовании {@link isStack} === false.
             * Возможные значения:
             * <ol>
             *    <li>'left': панель привязывается с левому краю элемента {@link target}'а,</li>
             *    <li>'right': панель привязывается с правому краю элемента {@link target}'а,</li>
             *    <li>'center': панель привязывается к центру элемента (по горизонтали), выезжает вниз или вверх в зависимости от опции {@link direction},
             *        привязка же к верхнему или нижнему краю элемента определяется опцией {@link verticalAlign}.</li>
             * </ol>
             * Горизонтальный край панели, который привязывается к заданному в этой опции краю элемента, указывается в опции {@link direction} (она же определяет направление анимации).
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          //панель выезжает справа налево
             *          direction: 'left',
             *          //верхний край панели привязан к верхнему краю target
             *          verticalAlign: 'top',
             *          //правый край панели привязан к правому краю target
             *          side: 'right',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see verticalAlign
             * @see direction
             * @see target
             * @see isStack
             */
            side: 'left',
            /**
             * @cfg {Number|String} Устанавливает ширину всплывающей панели.
             * @remark
             * Использование опции актуально, когда для всплывающей панели установлены опции {@link autoWidth}=false и {@link keepSize}=false.
             * @see height
             * @see autoWidth
             * @see keepSize
             */
            width: 0,
            /**
             * @cfg {Number|String} Устанавливает высоту всплывающей панели.
             * @remark
             * Для стековой панели (см. {@link isStack}) по умолчанию установлена высота в 100% (на всю высоту экрана).
             * Использование опции актуально, когда для всплывающей панели установлены опции {@link autoHeight}=false, {@link keepSize}=false и {@link isStack}=false.
             * @see width
             * @see autoHeight
             * @see keepSize
             */
            height: 0,
            /**
             * @cfg {String} Устанавливает тип анимации, с которой будет появляться всплывающая панель.
             * @remark
             * Возможные значения:
             * <ul>
             *    <li>slide - панель выезжает; для конфигурации дополнительно применяют опции {@link side} и {@link direction});</li>
             *    <li>fade - медленное появление панели за счёт постепенного уменьшения прозрачности;</li>
             *    <li>off - панель отображается без анимации.</li>
             * </ul>
             * Длительность анимации устанавливает {@link animationLength}.
             * @example
             * <pre>
             *    helpers.showFloatArea({
             *       opener: this,
             *       name: this.getName()+'-floatArea',
             *       template: "Окно всплывающей панели",
             *       isStack: true,
             *       animation: 'fade',
             *       target: this.getContainer(),
             *       overlay: false,
             *    });
             * </pre>
             * @see target
             * @see direction
             * @see verticalAlign
             * @see animationLength
             */
            animation: 'slide',
            /**
             * @cfg {Boolean} Будет ли автоматически скрываться панель
             *
             * Всплывающая панель может автоматически скрыться, когда активируется какой-то контрол на несвязанной области.
             * Чтобы избежать скрытия панели, нужно передавать параметр "opener" дочерним окнам.
             * При установке этой опции в false закрыть панель можно будет только кликом на крестик или клавишей esc.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          direction: 'top',
             *          animationLength: 1500,
             *          //задаём отсутствие автоматического скрытия панели
             *          autoHide: false,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see opener
             */
            autoHide: true,
            /**
             * @cfg {Boolean} Будет ли панель автоматически удаляться после скрытия
             *
             * То есть, будет ли команда {@link hide} работать так же, как команда {@link close}.
             * По умолчанию этот параметр выключен: команда {@link hide} прячет панель, но не удаляет, а команда {@link close} прячет и удаляет.
             * Если же значение данной опции задать true, то команда {@link hide} работает так же, как и {@link close}, и панель удаляется
             * сразу после закрытия, т.е. удаляется экземпляр класса Lib/Control/FloatArea/FloatArea.
             * Внешне отследить применение этой опции нельзя. Можно проверить методом isDestroyed.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          //задаём автоматическое удаление вызванной панели
             *          autoCloseOnHide: true,
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see hide
             * @see close
             * @see autoHide
             */
            autoCloseOnHide: false,
            /**
             * @cfg {String} Вертикальная позиция панели относительно элемента, заданного в опции target
             *
             * Актуально при использовании {@link isStack} === false.
             * Возможные значения:
             * <ol>
             *    <li>'top': панель привязывается к верхнему краю {@link target}'а </li>
             *    <li>'middle': панель привязывается к середине {@link target}'а </li>
             *    <li>'bottom': панель привязывается к нижнему краю {@link target}'а </li>
             * </ol>
             * Вертикальный край панели, который привязывается к заданному в этой опции краю элемента, указывается в опции {@link direction} (она же определяет направление анимации).
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          //панель выезжает справа-налево
             *          direction: 'left',
             *          //середина панели по вертикали привязана к середине target по высоте
             *          verticalAlign: 'middle',
             *          //правый край панели привязан к правому краю target
             *          side: 'right',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see side
             * @see target
             * @see direction
             * @see isStack
             */
            verticalAlign: 'top',
            /**
             * @cfg {String} Направление выезжания панели
             *
             * Актуально при использовании {@link isStack} === false.
             * Возможные значения:
             * <ol>
             *    <li>'' -  в сторону, обратную расположению по горизонтали (side),</li>
             *    <li>'top' - панель выезжает вверх,</li>
             *    <li>'left' - панель выезжает влево,</li>
             *    <li>'right' - панель выезжает вправо,</li>
             *    <li>'bottom' - панель выезжает вниз.</li>
             * </ol>
             * @example
             * Можно расположить панель в верхнем правом углу блока и заставить выезжать вверх.
             * Любое сочетание расположения и направления разрешено.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          //панель выезжает снизу-вверх
             *          direction: 'top',
             *          //правый край панели привязан к правому краю target
             *          side: 'right',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see verticalAlign
             * @see side
             * @see target
             * @see isStack
             * @see animation
             */
            direction: '',
            /**
             * @cfg {Number} Длительность анимации
             *
             * Если не указать, то берётся дефолтное (150 мс)
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          direction: 'top',
             *          //задаём скорость анимации открытия/закрытия панели - медленнее дефолтного значения
             *          animationLength: 1500,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see animation
             */
            animationLength: ANIMATION_LENGTH,
            /**
             * @cfg {Number} Стартовая ширина для анимации
             *
             * Опция актуальна при типе анимации slide и направлении выезжания влево/вправо.
             * Данной опцией устанавливается начальная ширина анимации открытия панели. По умолчанию панель выезжает с нуля.
             * Можно настроить появление панели, например, с видимой половиной.
             * В случае установки начальных размеров, соответствующих действительным размерам панели, то анимация выезжания
             * будет выглядеть как анимация появления.
             * Если панель выезжает влево, то соответственно задаётся ширина части панели слева, которая будет видна при
             * начале анимации.
             * Если панель выезжает вправо, то соответственно задаётся ширина части панели справа.
             * Значение по умолчанию -5 нужно, чтобы анимация закрытия окна не подтормаживала.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          direction: 'right',
             *          //задаём начальную ширину при анимации открытия в половину панели (ширина панели 500)
             *          startWidth: 250,
             *          animationLength: 2000,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see animation
             * @see target
             * @see startHeight
             * @see side
             */
            startWidth: -5,
            /**
             * @cfg {Number} Стартовая высота для анимации
             *
             * Опциия актуальна при типе анимации slide и направлениях выезжания вверх/вниз.
             * Данной опцией устанавливается начальная высота анимации открытия панели. По умолчанию панель выезжает с нуля.
             * Можно настроить появление панели, например, с видимой половиной.
             * В случае установки начальных размеров, соответствующих действительным размерам панели, то анимация выезжания
             * будет выглядеть как анимация появления.
             * Если панель выезжает вверх, то в данной опции задаётся высота верхней части панели, с которой начнётся анимация.
             * Если панель выезжает вниз, то наоборот, задаётся высота нижней части.
             * Значение по умолчанию -5 нужно, чтобы анимация закрытия окна не подтормаживала.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          direction: 'top',
             *          animationLength: 2000,
             *          //панель начнёт выезжать с открытой верхней половиной (высота панели 400)
             *          startHeight: 200,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see animation
             * @see target
             * @see startWidth
             * @see direction
             */
            startHeight: -5,
            /**
             * @cfg {Object} Отступ относительно блока
             *
             * Задаётся объектом {x: number, y: number}.
             * Положительные значения y смещают панель вниз, отрицательные - вверх.
             * Положительные значения x смещают панель вправо, отрицательные - влево.
             * Отступ не зависит от направления показа панели или чего-либо ещё.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          direction: 'right',
             *          //задаём смещение панели относительно установленных привязок к target - кнопке открытия панели
             *          //смещаем вправо и вниз
             *          offset: {
             *             x: 100,
             *             y: 200
             *          },
             *          animationLength: 2000,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             * @see setOffset
             * @see getOffset
             */
            offset: {
               x: 0,
               y: 0
            },
            /**
             * @cfg {Boolean} Будет ли панель иметь position: fixed. В случае, если указана опция fixed === true, опция {@link target} игнорируется,
             * и target-ом считается окно браузера (window), поскольку элемент с фиксированным позиционированием располагается в системе координат окна, а не документа.
             *
             * Не работает, если указать {@link isStack} === true. То есть, для стековых панелей игнорируется.
             * @see isStack
             * @see target
             */
            fixed: false,
            /**
             * @cfg {Boolean} Должна ли панель следовать за {@link target} при смене его позиции
             * @see isStack
             * @see target
             */
            trackTarget: true,
            /**
             * @cfg {Boolean} Надо ли показывать панель при создании
             *
             * Возможные значения:
             * <ol>
             *    <li>true - надо показывать панель при создании,</li>
             *    <li>false - не надо показывать.</li>
             * </ol>
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Шаблон",
             *          target: this.getContainer(),
             *          //отменяем показ сразу при создании
             *          autoShow: false
             *       });
             *    },
             *    //покажем панель после загрузки - установим соответствующий обработчик на "Шаблон" панели
             *    onAfterLoad: function(){
             *       this.show();
             *    }
             * </pre>
             * @see catchFocus
             */
            autoShow: true,
            /**
             * @cfg {Boolean} Переносить ли фокус на панель при открытии
             *
             * Возможные значения:
             * <ol>
             *    <li>true - переносить фокус на панель при открытии,</li>
             *    <li>false - не переносить фокус на панель.</li>
             * </ol>
             * @see autoShow
             */
            catchFocus: true,
            /**
             * @cfg {String|jQuery|HTMLElement} Элемент: при наведении мыши на него панель скроется
             *
             * Если будет указано, то при наведении мыши на этот указанный элемент панель будет скрываться, а при уходе
             * выше с элемента и с панели она будет скрываться. Имеет смысл использовать вместе с {@link autoShow} = false.
             * Рекомендуется использовать через {@link helpers.showHoverFloatArea} ({@link autoShow} тогда будет равно false).
             * @see autoShow
             * @see showDelay
             */
            hoverTarget: undefined,
            /**
             * @cfg {Number} Задержка показа панели
             *
             * Особенно актуально при использовании опции {@link hoverTarget}.
             * Если не указывать, будет 0, если не используется {@link hoverTarget}, или cConstants.FloatArea.showDelay в противном случае.
             * Опция задаёт задержку (в миллисекундах) между вызовом панени и началом анимации открытия.
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: false,
             *          direction: 'right',
             *          animationLength: 2000,
             *          //задаём задержку показа
             *          showDelay: 10000,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer(),
             *          overlay: false,
             *       });
             *    }
             * </pre>
             * @see hoverTarget
             */
            showDelay: undefined,
            /**
             * @cfg {Boolean|String} Нужно ли отображать панель в пределах окна
             *
             * При значении false возможна ситуация, когда всплывающая панель не умещается в окне интернет-браузера,
             * например, при уменьшении его размеров.
             * Опция может принимать значения 'horizontal' и 'vertical' - эти значения означают, что панель будет
             * пытаться вписаться в окно только по горизонтальной или вертикальной координате соответственно.
             * Опция актуальна для не стековых панелей.
             * @example
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: false,
             *          //задаём отображение всплывающей панели в пределах окна
             *          fitWindow: true,
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             */
            fitWindow: false,
            /**
             * @cfg {Boolean|String} Нужно ли инвертировать расположение панели, если она выходит за пределы окна
             *
             * Если также выставлена опция fitWindow, то сначала панель попытается инвертировать свое положение,
             * а потом попробует вписаться в пределы окна.
             * Инвертирование происходит по принципу http://jqueryui.com/position/
             * Например, если панель показана с direction='right', и панель не впишется в правый край окна браузера,
             * то панель 'отразится' влево, если не впишется в нижний край окна - то отразвится вверх, а если не
             * впишется ни вправо ни вниз, то отразится и влево и вверх.
             * Опция может принимать значения 'horizontal' и 'vertical' - эти значения означают, что панель будет
             * инвертировать свое положение только по горизонтальной или вертикальной координате соответственно.
             * Опция актуальна для не стековых панелей.
             * @example
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: false,
             *          //задаем отображение всплывающей панели с функцией инвертирования
             *          flipWindow: true,
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             */
            flipWindow: true,
            /**
             * @cfg {Boolean} Показывать ли тень от панели целиком
             *
             * Возможные значения:
             * <ol>
             *    <li>true - показывать тень от панели целиком,</li>
             *    <li>false - обрезать тень от панели по краям, к которым привязана панель.</li>
             * </ol>
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          direction: 'right',
             *          animationLength: 2000,
             *          //задаём наличие тени со всех сторон
             *          fullShadow: true,
             *          verticalAlign: 'bottom',
             *          target: this.getContainer()
             *       });
             *    }
             * </pre>
             */
            fullShadow: false,
            /**
             * @cfg {String} Расположение крестика внутри панели
             *
             * Для FilterFloatArea задаёт и расположение тени.
             * Возможные значения:
             * <ol>
             *    <li>right - крестик справа,</li>
             *    <li>left - крестик слева.</li>
             * </ol>
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: true,
             *          //задаём расположение крестика на панели слева
             *          controlsSide: 'left',
             *          target: this.getContainer(),
             *          overlay: false
             *       });
             *    }
             * </pre>
             * @see direction
             * @see side
             * @see verticalAlign
             */
            controlsSide: 'right',
            /**
             * @cfg {Boolean} Нужно ли использовать поведение "стека всплывающих панелей"
             *
             * Возможные значения:
             * <ol>
             *    <li>true - панель стековая,</li>
             *    <li>false - панель не стековая.</li>
             * </ol>
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          //укажем, что панель стековая
             *          isStack: true,
             *          //зададим наличие оверлея
             *          overlay: true
             *       });
             *    }
             * </pre>
             * @see overlay
             * @see opener
             * @see controlsSide
             * @see hideSideBar
             */
            isStack: false,
            /**
             * @cfg {String} Уникальный селектор контейнера, по которому ограничивается позиционирование нестековых панелей
             * Работет только для нестековых панелей
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: true,
             *          overlay: true,
             *          restrictionContainer: '#container'
             *       });
             *    }
             * </pre>
             * @see isStack
             */
            restrictionContainer: false,
            /**
             * @cfg {Boolean} Скрыть ли аккордеон при открытии панели
             *
             * Будет ли скрываться боковая панель (если она есть) при открытии данной панели.
             * Только при использовании {@link isStack} === true! То есть актуально для стека панелей.
             * Повлиять на скрытие аккордеона можно только при вызове первой панели.
             * Возможные значения:
             * <ol>
             *    <li>true - скрыть аккордеон,</li>
             *    <li>false - не скрывать.</li>
             * </ol>
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: true,
             *          //оставляем аккордеон
             *          hideSideBar: false,
             *          overlay: true
             *       });
             *    }
             * </pre>
             * @see isStack
             */
            hideSideBar: true,

            /**
             * @cfg {Boolean} Использовать ли оверлей. Синоним опции modal
             *
             * @deprecated Опция устарела, и значит то же самое, что и опция modal (для унификации с классом Window).
             * Пользуйтесь опцией modal, и смотрите примеры по ней.
             * @see modal
             */
            overlay: false,

            /**
             * @cfg {Boolean} Модальность. Определяет, является ли панель модальной.
             * Опция аналогична опции modal из класса Window.
             *
             * Возможные значения:
             * <ol>
             *    <li>false - панель будет немодальной, то есть, не будет закрывать остальной интерфейс</li>
             *    <li>true - панель будет модальной: всё, кроме панели, скрыто и недоступно для взаимодействия</li>
             * </ol>
             * @example
             * Текст обработчика клика на кнопку:
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Окно всплывающей панели",
             *          isStack: true,
             *          modal: true
             *       });
             *    }
             * </pre>
             */
            modal: false,

            /**
             * @cfg {Boolean} Опция аналогична такой же опции в классе {@link Lib/Control/Window/Window Window}
             *
             * Задаёт наличие кнопки закрытия панели (под "рамкой" подразумеваются стандартные элементы управления окна:
             * заголовок, кнопки закрытия, разворота и т.д.). По умолчанию включена.
             * В отсутствии крестика закрыть панель можно после перевода фокуса на неё нажатием клафиши Esc.
             * @example
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Шаблон",
             *          target: this.getContainer(),
             *          //убираем кнопку закрытия
             *          border: false
             *       });
             *    }
             * </pre>
             */
            border: true,
            /**
             * @cfg {Boolean} Показывать кнопку разворачивания/сворачивания панелей
             *
             * Задаёт наличие кнопки разворачивания/сворачивания панелей слева от крестика.
             * Значение ширины в свернутом состоянии задается опцией {@link minWidth}, в развернутом {@link maxWidth}
             * Задать первоначальное состояние развернута/свернута можно через опцию {@link maximized}
             */
            canMaximize: false,
            maxWidthWithoutSideBar: false,
            /**
             * @cfg {Boolean} Первоначальное состояние, в котором находится панель при открытии: свернута/развернута
             *
             * Значение по умолчанию: false. Работает только при включенной опции {@link canMaximize}
             */
            maximized: false,
            /**
             * @cfg {String} Заголовок плавающей панели
             *
             * Текст, отображаемый в заголовке плавающей панели.
             * @translatable
             */
            caption: undefined,

            /**
             * @cfg {Boolean} Устанавливает фиксацию стандартного заголовка всплывающей панели созданного опцией caption. Если вы создаете кастомный заголовок с помощью .ws-window-titlebar-custom, то вы должны самостоятельно расставить классы для фиксации заголовка и кнопки закрытия диалога.
             * @remark
             * Подробнее о данном функционале читайте <a href='https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/fixed-header/'>здесь</a>.
             * @example
             * <pre>
             *     <option name="stickyHeader">true</option>
             * </pre>
             */
            stickyHeader: false,

            /**
             * @cfg {String} Устанавливает отображение уголка.
             * @remark
             * Отображает у нестековой панели уголок, направленный на target. Позиционируется по центру общего промежутка панели и цели.
             * Только при использовании {@link isStack} === false, т.е. актуально для нестековых панелей.
             * @example
             * <pre>
             *    openFloatArea: function(){
             *       helpers.showFloatArea({
             *          opener: this,
             *          name: this.getName()+'-floatArea',
             *          template: "Шаблон",
             *          target: this.getContainer(),
             *          //Отображаем уголок
             *          arrow: true
             *       });
             *    }
             * </pre>
             */
            arrow: false,

            /**
             * @cfg {Boolean} Опция позволяет задать момент начала показа панели: после загрузки и конструирования всех контролов или до.
             * При showOnControlsReady=true панель сначала загружает шаблон, конструируются все контролы, после чего она показывается.
             * При showOnControlsReady=false панель сначала верстает корневой компонент со всеми вложенными шаблонами (не создавая контролов), после чего
             * показывается, после чего уже оживляются контролы внутри.
             * Это (showOnControlsReady=false) позволяет визуально ускорить показ и создание панели.
             */
            showOnControlsReady: true,
            _maximizeButton: undefined,
            disableCSS3AnimationEvent: false, //Опция отключает подписку на transitionEnd, т.к. в некоторых случаях он может не стрельнуть
            task1173269044: false,
            closeChildWindows: true // закрывать связанные по опенерам панели при дестрое

         },
         _horizontalAlignment: 'Left',
         _loaded: false,
         _loadStarted: false,
         _closeButton: undefined,
         _overflow: undefined,
         _containerShadow: undefined,
         _visibleRoot: undefined,
         _visibleRootWrapper: undefined,
         _generatedTitleContainer: undefined,
         _target: undefined,
         _hoverTarget: undefined,
         _state: '',
         _stateStage: '',
         _visible: false,
         _collapsedSides: {},
         _hoverTimer: undefined,
         _locksShowed: 0,
         _childWindows: [],   // Используем массив, на случай одинаковых id. Если когда-то будут обязательно уникальные id, то это можно будет переделать
         _showTimer: undefined,
         _keysWeHandle: [
            Env.constants.key.tab,
            Env.constants.key.enter,
            Env.constants.key.esc
         ],
         _zIndex: 0,
         _caption: undefined,
         _maxWidthSet: undefined,
         _firstSizeCalcOnShow: false,
         _autoShow: false,
         _touchX: 0,
         _touchDistance: 0,
         _addedToStack: false,
         _result: undefined,
         _saving: undefined,
         _beforeAnimationTimer: undefined,
         _transitionEndHandler: undefined,
         _showDeferred: undefined,
         _hideFinishFn: undefined,
         _windowResizeHandler: undefined,
         _userTitle : undefined,        //jQuery - ссылка на "ручной заголовок" - пользовательский загловок
         _useCss3: false,
         _useAnimation: false,
         _noStackShadowClassPostfix: 'standart',
         _inApplyBatchUpdateIntermediate: 0,
         _memoizedFuncs: {},
         _childPanelSizes: {},
         _animationQueue: undefined,
         _scrollUnsub: undefined,
         _prevPositionOptions: undefined,
         _showOnControlsReady: true,
         _isShowCanceled: false, //Прервали ли открытие панели
         _focusState: undefined,
         /* im.dubrovin: переменная необходима для отслеживания изменения выстоты контейнера флоат арии(увеличилась/уменьшилась) */
         _prevHeight: 0
      },
      $constructor: function(cfg){
         this._isModal = this._isModal || this._options.overlay;

         this._publish('onClose', 'onShow', 'onBeforeClose', 'onAfterClose', 'onScroll', 'onTargetVisibilityChange');

         this.subscribeTo(EnvEvent.Bus.channel('navigation'), 'onBeforeNavigate', forAliveOnly(this._onBeforeNavigate, this));

         var declCmd = function(command, fn) {
            var handler = function() {
               fn.apply(this, arguments);
               return true;
            };
            CommandDispatcher.declareCommand(this, command, handler);
         }.bind(this);

         declCmd('show', this.show);
         declCmd('hide', this.hide);
         declCmd('close', this.close);

         FloatAreaManager._addArea(this);
         EnvEvent.Bus.globalChannel().notify('onFloatAreaCreating', this);
         this._captionClickHandler = this._captionClickHandler.bind(this);

         this._overflow[0].wsControl = this;

         this._zIndex = this._prepareZIndex();

         this._visibleRootWrapper.css('z-index', this._zIndex);

         if (this._isModal) {
            this.subscribeTo(ModalOverlay, 'onClick', function(event) {
               //Если оверлей показан для этой панели (она модальная и выше всех других модальных), то нужно закрыться
               if (this.isVisible() &&  ModalOverlay.isShownForWindow(this)) {
                  event.setResult(true);
                  this.sendCommand('hide');
               }
            }.bind(this));
         }

         this._animationQueue = Deferred.success(undefined);

         //При множественном клике открывается N панелей, они не успевают проставить свой zIndex, из-за этого
         //уже открытые панели (с autoHide = true) при выполнении _hideUnnecessaryAreas не понимают, что должны закрыться
         //Вызываю _hideUnnecessaryAreas сразу для верхней панели, все "нижние", которые должны закрыться - закроются
         FloatAreaManager._hideUnnecessaryAreas(this);
         this._checkOpener();

         if (this._options.isCompoundTemplate) {
            //margin с css учитываю в позиционировании
            var cStyle = getComputedStyle(this._visibleRoot[0]);
            var marginTop = parseInt(cStyle.marginTop, 10);
            var marginLeft = parseInt(cStyle.marginLeft, 10);
            var offset = {};

            this._options.offset = this._options.offset || {};

            offset.x = this._options.offset.x || marginLeft || 0;
            offset.y = this._options.offset.y || marginTop || 0;

            //Сбрасываем пользовательские отступы с контейнера, т.к. уже учли их в расчетах позиционирования
            this._visibleRoot[0].classList.add('ws-float-area__reset-margin');

            this.setOffset(offset);
         }
      },

      _prepareZIndex: function() {
         if (isNewEnvironment()) {
            var opener = this.getOpener();
            var openerPopup = opener && opener._container && opener._container.closest('.controls-Popup, .controls-FloatArea, .ws-window:not(".controls-CompoundArea")');
            var openerPopupZIndex = openerPopup && openerPopup.css('z-index');
            if (openerPopupZIndex) {
               return parseInt(openerPopupZIndex, 10) + 5; //Выше vdom-окна, над которым открывается попап
            }
         }
         return WindowManager.acquireZIndex(this._isModal, false, !!this._options.hoverTarget);
      },

       _checkOpener: function() {
         if (isNewEnvironment() && !this._options._openFromAction) {
            Env.IoC.resolve('ILogger').error('FloatArea', 'Компонент открыт напрямую без использования хэлперов открытия. \n' +
               'Для правильной работы компонента окно должно быть открыто через action. \n' +
               'Подробности: https://wi.sbis.ru/doc/platform/developmentapl/interface-development/ws4/components/templates/open-compound-template/');
         }
      },

      _modifyOptions: function(cfg){
         if (cfg.canMaximize){
            cfg.componentOptions.isPanelMaximized = cfg.maximized;
         }
         if (!cfg.enabled) {
            logger.log('Lib/Control/FloatArea/FloatArea', 'Задана опция enabled = false. Дизаблить можно только дочерний компонент панели, для этого enabled нужно передать в componentOptions.');
            cfg.componentOptions.enabled = false;
            cfg.enabled = true;
         }
         return cfg;
      },

      /***
       * Переопределённый метод базового класса {@link Lib/Control/AreaAbstract/AreaAbstract#_activateParent}. Здесь он не делает ничего,
       * поскольку в дочернюю плав. панель нельзя перейти из родительского контрола по табу.
       * @private
       */
      _activateParent: function() {
         return false;
      },

      _onBeforeNavigate: function(event, activeElement, isIconClick){
         if (!isIconClick) {
            this.sendCommand('hide', true);
         }
      },

      /**
       * Возвращает опции для FloatAreaManager'а
       * @returns {Object}
       * @private
       */
      _getManagerOptions: function() {
         return {
            hideSideBar: this._options.hideSideBar
         };
      },
      /**
       * Добавляет себя в FloatAreaManager
       * @private
       */
      _initStack: forStackOnly(function(){
         if(!this._addedToStack){
            this._addedToStack = true;
            FloatAreaManager._setAreaInfo(this, this._getManagerOptions());
         }
      }),
      /**
       * Проверяет, с какой стороны должна быть расположена панель
       * @private
       */
      _prepareSideOptions: function(){
         if(this._options.side !== 'left' && this._options.side !== 'right' && this._options.side !== 'center'){
            this._options.side = 'left';
            logError('Incorrect _options.side');
         }
         if(this._options.verticalAlign !== 'top' &&
            this._options.verticalAlign !== 'bottom' &&
            this._options.verticalAlign !== 'middle'){
            this._options.verticalAlign = 'top';
            logError('Incorrect _options.verticalAlign');
         }
         if(this._options.animation !== 'slide' && this._options.animation !== 'fade' && this._options.animation !== 'off'){
            this._options.animation = 'slide';
            logError('Incorrect _options.animation');
         }
         if (this._options.isStack) {
            this._options.side = 'right';
            this._options.target = getBody();
            this._options.fixed = false;
         } else if (this._options.fixed) {
            this._options.target = $(window);
         } else if (!this._options.target) {
            this._options.target = getBody();
         }
      },
      /**
       * Проверяет, указано ли допустимое направление анимации
       * @private
       */
      _checkDirectionLegalValues: function(){
         if(this._options.direction !== '' &&
            this._options.direction !== 'left' && this._options.direction !== 'right' &&
            this._options.direction !== 'top' && this._options.direction !== 'bottom'){
            this._options.direction = '';
            logError('Incorrect direction');
         }
      },
      /**
       * Расчитывает направление для анимации, если это необходимо
       * @private
       */
      _checkAutoDirection: function(){
         if(this._options.direction === ''){
            if(this._options.side === 'left'){
               this._options.direction = 'right';
            }
            else if(this._options.side === 'right'){
               this._options.direction = 'left';
            }
            else if(this._options.verticalAlign === 'top'){
               this._options.direction = 'bottom';
            }
            else if(this._options.verticalAlign === 'bottom'){
               this._options.direction = 'top';
            }
            else{
               this._options.direction = 'left';
               if(this._options.animation === 'slide'){
                  logError('Unspecified direction');
               }
            }
         }
      },
      /**
       * Просчитывает стороны, где не должно быть теней
       * @private
       */
      _prepareCollapsedSides: function(){
         var side = this._options.side,
            dir = this._options.direction,
            valign = this._options.verticalAlign,
            isStack = this._options.isStack;

         if (!USE_SHADOWS) {
            this._collapsedSides = {'left': true, 'right': true, 'top': true, 'bottom': true};
         }
         else if (this._options.fullShadow) {
            // Если просят полную тень - все стороны видны
            this._collapsedSides = {'left': false, 'right': false, 'top': false, 'bottom': false};
         } else if (isStack) {
            // В стэке тень видна только слева
            this._collapsedSides = {
               left: false,
               right: true,
               top: true,
               bottom: true
            }
         } else {
            // Во всех остальных случаях смотрим на side, dir, valign
            this._collapsedSides = {
               left: (side === 'left'  && dir !== 'left') || (side === 'right' && dir === 'right'),
               right: (side === 'right' && dir !== 'right') || (side === 'left'  && dir === 'left'),
               top: (valign === 'top' && dir !== 'top') || (valign === 'bottom' && dir === 'bottom'),
               bottom: (valign === 'bottom' && dir !== 'bottom') || (valign === 'top'    && dir === 'top')
            }
         }
      },
      /**
       * Инициализация остальных обычных параметров
       * @private
       */
      _prepareGeneralOptions: function(){
         this._options.width = parseInt(this._options.width, 10);
         if(isNaN(this._options.width)){
            this._options.width = DEFAULT_SIZE;
         }
         this._width = this._options.width;
         this._options.height = parseInt(this._options.height, 10);
         if(isNaN(this._options.height)){
            this._options.height = DEFAULT_SIZE;
         }
         this._height = this._options.height;
         this._autoShow = this._options.autoShow;
         if(this._options.showDelay === undefined){
            if(this._hoverTarget){
               this._options.showDelay = SHOW_DELAY;
            }
            else{
               this._options.showDelay = 0;
            }
         }
      },
      /**
       * Подготавливает элементы
       * @protected
       */
      _prepareElements: function(){
         FloatArea.superclass._prepareElements.apply(this, arguments);

         this._prepareSideOptions();

         this._checkDirectionLegalValues();
         this._checkAutoDirection();

         this._prepareCollapsedSides();
         this._prepareGeneralOptions();

         this._prepareArea();
         this._prepareHover();
         this._prepareKeydown();

         if (this._options.fixed) {
            this._target = $(this._options.target);
         } else {
            this.setTarget(this._options.target);
         }
      },

      _getAreaType: function(){
         var result;

         if (this._options.isStack) {
            result = 'STACK';
         } else {
            result = 'NO_STACK';
         }

         return result;
      },

      _handleStackScroll: function(event) {
         var element;
         if (this.hasEventHandlers('onScroll')) {
            element = $(event.target);
            this._notify('onScroll', {
               element: element,
               clientHeight: element.height(),
               scrollTop: element.prop('scrollTop'),
               scrollHeight: element.prop('scrollHeight')
            });
         }
      },

      _onChildPanelResize: function(event, size) {
         this._childPanelSizes[size.id] = size.top + size.height + this._visibleRoot.scrollTop()
            // task: 1173290212
            // im.dubrovin : при появлении не стековаой флоат арии страница крутится вверх(подробнее описано в LayoutManager)
            // если на момент ресайза , страница прокручена нужно учесть это при расчете высоты
            - LayoutManager.getMainScrollingContainer().offset().top;
         if (size.height === 0) {
            delete this._childPanelSizes[size.id];
         }
         this._notifyOnSizeChanged(true);
      },

      /**
       * Создаёт основные области
       * @private
       */
      _prepareArea: function(){
         this._options.animationLength = parseInt(this._options.animationLength, 10) || 0;
         this._useCss3 = USE_CSS3 && (this._options.useCss3 === undefined || this._options.useCss3);
         this._useAnimation = USE_ANIMATION && this._options.animation !== 'off' && (this._options.animationLength > MIN_ANIMATION_LENGTH);
         this._options.startWidth = parseInt(this._options.startWidth, 10) || 0;
         this._options.startHeight = parseInt(this._options.startHeight, 10) || 0;

         var contentRoot = FloatAreaManager._getFloatAreaContentRoot(),
            target = $(this._options.target),
            //Если target лежит в блоке основного содержимого (_getFloatAreaContentRoot), то панель нужно положить туда.
            //Это нужно для того, чтобы панель, привязанная к элементу, лежащему в блоке основного содержимого,
            //анимировалась вместе с этим блоком.
            parentRoot = !this._options.isStack && target.closest(contentRoot).length > 0
            //task: 1173357457
            //im.dubrovin: моедальные окна не должны находится лежать в скролл контейнере, т.к. это приводит к прокрутке содержимого под модальностью
            && !this._isModal ?
               contentRoot :
               FloatAreaManager._getFloatAreaBodyContainerRoot(),
            titleBlock;

         //TODO fix 3.7.4.240
         if (this._options.task1173269044) {
            parentRoot = FloatAreaManager._getFloatAreaBodyContainerRoot()
         }


         var areaType = this._getAreaType();
         var blockInit = {
            'STACK': {
               _visibleRoot: function(div) {
                  var clazz = FloatAreaManager._useTouch() ? 'ws-float-area-stack-scroll-wrapper-touch' : 'ws-float-area-stack-scroll-wrapper-notouch';
                  div.css('right', -FloatAreaManager._bodyScrollWidth());
                  div.addClass(clazz);
                  div.bind('scroll', this._handleStackScroll.bind(this));

                  if (!this._needPanelHeightRecalc()) {
                     div.addClass('ws-float-area-no-height-calc');
                  }

                  div.bind('mousedown mouseup click', function(e) {
                     //Нужно для автозакрывателей разных диалогов:
                     //клик на крутилку прокруточного блока не должен доходить до
                     //документа, поскольку из-за этого могут закрываться всякие автозакрывающиеся штуки,
                     //что неправильно: клик на полосу прокрутки ничего закрывать не должен
                     // (а ни на что другое в прокруточном блоке кликнуть не получится)
                     if (div.is(e.target)) {
                        e.stopPropagation();
                     }
                  });
                  /**
                   * Ошибка в разработку от 20.12.2015 №1216910
                   * Скролирую на iPad тело диалога, скроллируется аккордеон - не должен
                   * https://inside.tensor.ru/opendoc.html?guid=5f838394-c319-4c74-a701-2a68bc52e214
                   */
                  div.bind('touchmove', function(e) {
                     e.originalEvent.isFloatArea = true;
                  });
               },

               _visibleRootWrapper: function(div) {
                  div.prependTo(parentRoot);
               },

               _containerShadow: function(div) {
                  div.removeClass('ws-area');
                  div.bind('wsFloatAreaResize', this._onChildPanelResize.bind(this))
               }
            }
         }[areaType];

         if (this._options.border && this._options.stickyHeader && this._options.caption) {
            titleBlock = ['ws-window-titlebar-wrapper', 'ws-float-area__close-button-wrapper', 'ws-sticky-header__block',
               ['ws-window-titlebar ws-hidden', '_generatedTitleContainer']];
         } else {
            titleBlock = ['ws-window-titlebar ws-hidden', '_generatedTitleContainer'];
         }

         var blockProps = {
            'NO_STACK': [parentRoot,
               [this._options.className || '', 'ws-float-area ws-float-area-panel-overflow', 'ws-float-area-nostack-panel-overflow', 'ws-hidden',
                  (this._options.fixed ? ' ws-float-area-nostack-panel-overflow-fixed' : ''),
                  '_overflow', '_visibleRoot', '_visibleRootWrapper',
                  ['ws-float-area-nostack-panel-shadow', 'ws-float-area-nostack-panel-shadow-' + this._noStackShadowClassPostfix,
                     '_containerShadow',
                     titleBlock, [this._container]]]],

            'STACK': [parentRoot,
               [this._options.className || '', 'ws-float-area-stack-cut-wrapper', '_visibleRootWrapper', 'ws-sticky-header__wrapper', 'ws-hidden',
                  ['ws-sticky-header__header-container', 'ws-sticky-header__float-area_header-container'],
                  ['ws-float-area-stack-scroll-wrapper', '_visibleRoot', 'ws-scrolling-content', 'ws-sticky-header__scrollable-container',
                     ['ws-float-area-panel-external-jeans'],
                     ['ws-float-area ws-float-area-panel-overflow', 'ws-float-area-stack-panel-overflow', '_overflow',
                        ['ws-float-area-stack-panel-shadow', '_containerShadow',
                           titleBlock, [this._container]]]]]]
         };

         function buildStructure(block) {
            var div, i, blockEl, ln = block.length;
            if (typeof block[0] === 'string') {
               div = $('<div></div>');
               i = 0;
            } else {
               div = block[0];
               i = 1;
            }

            while (i < ln) {
               blockEl = block[i];
               if (typeof blockEl === 'string') {
                  if (blockEl) {
                     if (blockEl.charAt(0) === '_') {
                        this[blockEl] = div;
                     } else {
                        div.addClass(blockEl);
                     }
                  }
               } else {
                  div.append(buildStructure.call(this, blockEl));
               }
               i++;
            }

            return div;
         }

         buildStructure.call(this, blockProps[areaType]);

         for (var fieldName in blockInit) {
            if (blockInit.hasOwnProperty(fieldName)) {
               var
                  func = blockInit[fieldName];
               func.call(this, this[fieldName]);
            }
         }
         var shadowClasses = Object.keys(this._collapsedSides).reduce(function(memo, key) {
            if (!this._collapsedSides[key]) {
               memo.push('ws-float-area-shadow-offset-' + key);
            }
            return memo;
         }.bind(this), []).join(' ');;

         if (this._options.isStack) {
            //У стековой панели отступы надо ставить у блока _overflow, а то _containerShadow на айпаде - это table-cell,
            //у которого отступ (margin) нельзя задать
            this._overflow.addClass(shadowClasses);
         } else {
            this._containerShadow.addClass(shadowClasses);
         }

         if (this._useCss3 && this._useAnimation) {
            this._containerShadow.addClass('ws-float-area-animation-' + this._options.animation);
            this._setAnimationDurationProperty(this._getAnimationLength());
            this._containerShadow.bind('transitionend', forAliveOnly(this._transitionEnd, this));
         }
      },

      _getAnimationLength: function() {
         return this._options.animationLength / 1000 + 's';
      },

      _setAnimationDurationProperty: function(animLength) {
         this._containerShadow.css({
            '-webkit-transition-duration': animLength,
            '-moz-transition-duration': animLength,
            'transition-duration': animLength
         });
      },

      _transitionEnd: function() {
         if (this._transitionEndHandler && !this._options.disableCSS3AnimationEvent) {
            var handler = this._transitionEndHandler;
            this._transitionEndHandler = null;
            handler.call(this);
         }
      },

      _setMinMaxSizes: function(){
         this._container.css({
            'min-width': this._options.minWidth
         });
         //Установим ширину сразу, т.к. все данные для этого есть. В случае чего, пересчет ширины вызовется с батча
         //Нужно здесь, т.к. после вызова .reload() панель у нас уже видна, и получается, что мы выставили min-width, а потом, когда стрельнул батч, нужную ширину,
         //что приводит к скачку контейнера.
         this._maxWidthSet = -1;
         this._updateMinMaxWidthHeight();
      },

      _getCssIntProp: function(prop, prefix, element) {
         var
            funcs = this._memoizedFuncs,
            funcName = prefix + '-' + prop;

         if (!funcs[funcName]) {
            funcs[funcName] = memoize(function() {
               return parseInt(element.css(prop), 10) || 0;
            }, funcName);
         }

         return funcs[funcName]();
      },

      _getShadowCssIntProp: function(prop) {
         return this._getCssIntProp(prop, 'shadow', this._containerShadow);
      },

      _getOverflowCssIntProp: function(prop) {
         return this._getCssIntProp(prop, 'overflow', this._overflow);
      },

      /**
       * Создаёт кнопку для закрытия панели
       * @private
       */
      _prepareCloseButton: function(){
         var side = this._options.controlsSide !== 'center' ? this._options.controlsSide : 'right',
            events = 'click touchend';
         //ipad генерирует клик на элементе который расположен под кнопкой, если закрывать панель на touch события и ни какие prevetDefaul его не останавливают
         //по ссылке с href клик генерируется всегда
         if (Env.detection.isMobileSafari) {
            this._closeButton = $('<a sbisname="floatAreaCloseButton" href="javascript:void(0)" class="ws-float-close sbisname-window-title-close ws-float-close-' + side + '"></a>');
            events = 'click';
         } else {
            this._closeButton = $('<div sbisname="floatAreaCloseButton" class="ws-float-close sbisname-window-title-close ws-float-close-' + side + '"></div>');
         }
         this._closeButton.bind(events, function (e) {
            e.stopPropagation();
            if (e.type === 'touchend') {
               e.preventDefault();
            }
            // в случае firefox при клике на кнопку событие focusout не содержит relatedTarget, и setActive(false) мы не зовем, поэтому позовем его тут
            if (Env.detection.firefox) {
               var activeControl = this.getActiveChildControl(undefined, true);
               if (activeControl) {
                  activeControl.setActive(false);
               }
            }

            // при нажатии на кнопку закрытия панели сначала закрываю все открытые из нее панели
            FloatAreaManager._hideUnnecessaryAreas(this);
            this.sendCommand('hide');
         }.bind(this));
         this._closeButton.css('margin-' + side, this._getShadowCssIntProp('margin-' + side));
         this._addCommandButton(this._closeButton);
      },

      _hasMaximizeButton: function(){
         var hasValues = isFinite(this._options.maxWidth) && this._options.minWidth > 0;
         return this._options.canMaximize && hasValues && (this._options.maxWidth !== this._options.minWidth);
      },

      _addMaximizeButton: function(){
         var side = this._options.controlsSide !== 'center' ? this._options.controlsSide : 'right';
         this._maximizeButton = $('<div class="ws-float-area-maximize-btn ws-float-extend-' + side + '" title="' + rk('Свернуть') + '/' + rk('Развернуть') + '"></div>');
         //запрещаем кнопке брать на себя фокус, т.к. потом он восстанавливается не туда, куда надо
         this._maximizeButton.mousedown(function(e){
            e.preventDefault();
         });
         this._maximizeButton.click(function () {
            this._setMaximizeMode(!this._options.maximized);
         }.bind(this));
         this._changeMaximizePanelMode(true);
         this._addCommandButton(this._maximizeButton);
      },

      _addCommandButton: function(button){
         var closeButtonContainer,
            captionContainer = $('.ws-window-titlebar:first', this.getContainer().parent());
         if (this._options.isStack && FloatAreaManager._useTouch()) {
            //Хак нужен для того, чтобы в айпаде кнопка не перекрывалась
            //основным содержимым панели
            button.css({
               'overflow': 'auto'
            });
         }

         captionContainer.on('click', this._captionClickHandler);

         // Если заголовок панели зафиксирован, то крестик и кнопка ресайза должны находиться в нём.
         closeButtonContainer = this._overflow.closest('.ws-float-area-stack-cut-wrapper').find('.ws-float-area__close-button-wrapper:first');
         //Из-за того, что крестик рисуется не на шаблоне, в зависимости от нижеописанных условий нужно найти контейнер, в котором он будет позиционироваться,
         //чтобы при анимации отображения/скрытия панели, он выезжал вместе с темплейтом
         if (closeButtonContainer.length !== 1){
            if (captionContainer.length){
               closeButtonContainer = captionContainer.next();
            }
            else if (this._getTemplateComponent()){
               //Если заголовок не фиксирован, то пытаемся положить крестик в темплейт. Но дочерний компонент может быть еще не оживлен(option ShowOnControlsReady = false)
               closeButtonContainer = this._getTemplateComponent().getContainer();
            }
            else {
               button.toggleClass('ws-hidden', !this.isVisible());
               closeButtonContainer = this._overflow;
            }
         }
         closeButtonContainer.append(button);
      },

      _captionClickHandler: function() {
         //Шапка не принимает активность, переводим активность на саму панель
         this.setActive(true);
      },

      _destroyCommandButtons: function(){
         if (this._closeButton) {
            this._closeButton = undefined;
         }
         if (this._maximizeButton) {
            this._maximizeButton = undefined;
         }
      },

      _setVisibilityCommandButtons: function(visible){
         if (this._closeButton) {
            this._closeButton.toggleClass('ws-hidden', !visible);
         }
         this._setVisibleMaximizeButton(visible)
      },

      _setVisibleMaximizeButton: function(visible, needChangeMaximizeMode){
         visible = this._showMaximizeButon === false ? this._showMaximizeButon : visible;
         if (this._maximizeButton) {
            this._maximizeButton.toggleClass('ws-hidden', !visible);
            if (needChangeMaximizeMode){
               this._changeMaximizePanelMode(visible);
            }
         }
      },

      _changeMaximizePanelMode: function(visible){
         this._visibleRoot.toggleClass('ws-float-area-has-maximized-button', visible);
         this._visibleRootWrapper.toggleClass('ws-float-area-has-maximized-button', visible);
      },

      _setMaximizeMode: function(mode, dontNotify){
         //Если данных для работы кнопки недостаточно и мы ее на панель не добавили - ничего не делаем
         if (!this._maximizeButton) {
            return;
         }
         var newWidth = mode ? this._options.maxWidth : this._options.minWidth,
            maxWidth = FloatAreaManager._getMaxWidthForAreaNew(this, this._options.minWidth, this._options.maxWidthWithoutSideBar),
            templateComponent = this._getTemplateComponent();

         if (maxWidth == this._options.minWidth) { //Если minWidth == maxWidth - кнопка не нужна, т.к. по сути ничего сделать не может
            this._showMaximizeButon = false;
            this._setVisibleMaximizeButton(false, true);
            newWidth = maxWidth;
         }
         else {
            if (newWidth > maxWidth) {
               newWidth = maxWidth;
            }
            this._showMaximizeButon = true;
            if (this.isShow()){
               this._setVisibleMaximizeButton(true, true);
            }
         }

         this._options.maximized = mode;
         this._visibleRoot.toggleClass('ws-float-area-maximized-mode', mode);
         this._visibleRootWrapper.toggleClass('ws-float-area-maximized-mode', mode);

         this._updateAreaWidth(newWidth);
         this._updateStickyHeaderWidth();

         FloatAreaManager._changeMaximizeMode();
         if (templateComponent){
            templateComponent._notifyOnSizeChanged();
            templateComponent._options.isPanelMaximized = mode; //меняем состояние на шаблоне
            if (!dontNotify){
               templateComponent._notify('onChangeMaximizeState', mode);
            }
         }
         this._notify('onChangeMaximizeState', mode);

         if (Env.detection.isIE10) {
            //После смены ширины панели, у флексового родительского контейнера вкладок, для дочерних НЕ флексовых контейнеров не всегда
            //пересчитывается доступная ширина, из-за чего они ужимаются там где не должны.
            //Можно сделать дочерние контейнеры флексовыми и тогда баг IE уходит (но это не точно). в итоге вызываю пересчет размеров узла для IE напрямую.
            var tabs = $('.controls-TabButton', this.getContainer());
            tabs.css('width', 'auto');
            setTimeout(function() {
               tabs.css('width', '');
            }, 150);
         }
      },

      _updateAreaWidth: function(newWidth) {
         //внутри контейнера ws-float-area лежит контейнер, равный ему по ширине, но с бордером слева
         //Внутри контейнера с бордером лежит контент. Получается, что контент размещается в контейнере на 1px меньше чем он сам => newWidth + ширина бордера
         this._visibleRoot.find('.ws-float-area').css('width', newWidth + this._getBorderLeftWidth());
         this.getContainer().css('width', newWidth);
      },

      _getBorderLeftWidth: function() {
        return parseInt($('.ws-float-area-stack-panel-shadow', this._visibleRoot).css('border-left-width'), 10);
      },

      _getTemplateComponent: function(){
         return this.getChildControls(undefined, false)[0];
      },

      /**
       * Стартует таймер, по истечении которго панель закроется
       * @private
       */
      _startHoverTimer: function(event){
         this._stopTimer('_hoverTimer');
         this._stopTimer('_showTimer');

         if (this.isOpened()) {
            if (this._stateStage === 'delay') {
               this._cancelShow();
            }
            else {
               this._hoverTimer = setTimeout(forAliveOnly(function(){
                  //Если ховер на панели - не закрываем окно
                  if (!this.isLockShowed() && !this._isPanelHovered && !this._isLinkedPanel(event)) {
                     this.sendCommand('hide');
                  }
               }, this), HOVER_TIMEOUT);
            }
         }
      },

      _isLinkedPanel: function(event) {
         if (!event) {
            return false;
         }

         var target = $(event.relatedTarget);

         // Если увели ховер на инфобокс - не закрываемся
         var isInfoBox = target.closest('.ws-info-box').length;
         if (isInfoBox) {
            return true;
         }

         // Если увели ховер на вдомный попап, связанный с текущей floatArea по опенерам, то не закрываемся
         var popupContainer = target.closest('.controls-Popup')[0];
         if (popupContainer) {
            // popupContainer.controlNodes может быть пуст, если popup уже задестроен
            var popupInstance = popupContainer.controlNodes[0] && popupContainer.controlNodes[0].control;
            var popupOpener = popupInstance && popupInstance._options.opener;
            if (popupOpener) {
               var popupOpenerContainer = $(popupOpener._container.closest('.ws-float-area-show-complete'))[0];
               var popupOpenerInstance = popupOpenerContainer && popupOpenerContainer.wsControl;
               return popupOpenerInstance === this;
            }
         }
         return false;
      },

      /**
       * Обработчик наведения мыши на элемент
       * @private
       */
      _elementMouseOver: function(){
         this._stopTimer('_hoverTimer');
         this.show();
      },
      /**
       * Возвращает true, если мы считаем указанную область открытой
       * @param {Lib/Control/AreaAbstract/AreaAbstract} area Указанная область
       * @returns {Boolean}
       * @private
       */
      _hasStoredChildArea: function(area) {
         return this._childWindows.indexOf(area) > -1;
      },
      /**
       * Обработчик закрытия/уничтожения дочернего окна. Ловятся оба события, так как окно могут уничтожить до его закрытия
       * @param {Lib/Control/AreaAbstract/AreaAbstract} area Дочернее окно
       * @private
       */
      _childWindowClose: function(event, area) {
         if (this._hasStoredChildArea(area)) {
            this._childWindows.splice(this._childWindows.indexOf(area), 1);
         }
      },

      /**
       * Обрабатывает открытие дочерних окон
       * @param {Object} event jQuery-событие
       * @param {Lib/Control/AreaAbstract/AreaAbstract} area Область
       * @private
       */
      _childWindowCreate: function (event, area) {
         if (this.isOpened()) {
            var classFound = !!objectFind(CHILD_WINDOW_CLASSES,  cInstance.instanceOfModule.bind(undefined, area)) ||  cInstance.instanceOfMixin(area, 'SBIS3.CONTROLS/Mixins/PopupMixin');
            if (classFound) {
               var closeHandler = this._childWindowClose.bind(this, null, area);
               if (!this._hasStoredChildArea(area)) {
                  this._childWindows.push(area);
               }
               area.subscribe('onDestroy', forAliveOnly(closeHandler, this));
               if (this._hoverTarget && area.hasEvent('onAfterClose')) {
                  area.subscribe('onAfterClose', forAliveOnly(this._startHoverTimer, this));
               }
            }
         }
      },
      /**
       * Подписывается на наведение/уведение мыши с элемента
       * @private
       */
      _bindHoverEvents: function(){
         this._hoverTarget
            .bind('mouseenter.wsFloatAreaHover', forAliveOnly(this._elementMouseOver, this))
            .bind('mouseleave.wsFloatAreaHover', forAliveOnly(this._startHoverTimer, this));
      },
      _subscribeToMouseEvents: function() {
         var self = this;
         this.getContainer().on('mousemove.wsFloatAreaHover', function() {
            self._isPanelHovered = true;
         });
         this.getContainer().on('mouseout.wsFloatAreaHover', function() {
            self._isPanelHovered = false;
         });
      },
      /**
       * Инициализирует события, связанные с наведением мыши (опция {@link hoverTarget})
       * @private
       */
      _prepareHover: function(){
         this.setHoverTarget(this._options.hoverTarget, false);

         this._overflow.bind('wsWindowOpen', this._childWindowCreate.bind(this));
         this._overflow.bind('wsWindowClose', this._childWindowClose.bind(this));

         if(this._hoverTarget){
            this._overflow.hover(this._stopTimer.bind(this, '_hoverTimer'), forAliveOnly(this._startHoverTimer, this))
               .bind('wsSubWindowOpen', forAliveOnly(this.lockShowed, this))
               .bind('wsSubWindowClose', forAliveOnly(this.unlockShowed, this));
         }
      },
      _prepareArrow: forNonStackOnly(function() {
         var arrow = this._options.arrow;
         if (arrow == 'left' || arrow == 'right' || arrow == 'top' || arrow == 'bottom') {
            var arrowClass = 'ws-float-area-arrow-' + arrow;
            this._visibleRoot.addClass(arrowClass);
         }
      }),
      /**
       * Из-за того, что sticky header выносит элементы изнутри контейнера float area выше, до контейнера float area не долетают события нажатия клавиш.
       * Нужно обрабатывать нажатия клавиш и у контейнера sticky header.
       * @private
       */
      _prepareKeydown: forStackOnly(function() {
         var stickyHeaderContainer = this._overflow.closest('.ws-float-area-stack-cut-wrapper').find('.ws-sticky-header__float-area_header-container');
         this._initKeyboardMonitor(stickyHeaderContainer);
      }),

      /**
       * Начинает загрузку и показывает контрол
       */
      _loadDescendents: function(){
         return this._loadTemplate();
      },

      _preparePanel: function() {
         this._loaded = true;
         this._initStack();

         this._maxWidthSet = undefined;//Сбрасываем на случай повторного вызова _onLoad

         this._destroyCommandButtons(); //Убиваем кнопку, которую создавали сами - новая пришла

         var userTitleContainer = this.getContainer().find('.ws-Window__title-border').first();
         if (userTitleContainer.length !== 0) {
            //Ручной заголовок, сделанный в джинне
            this._userTitle = userTitleContainer.find('[sbisname=windowTitle] span pre').first();
            this._userTitle.empty();
         } else {
            //Ручной заголовок, сделанный в вёрстке, в пользовательском компоненте. На него нужно повесить стандартный класс заголовка
            this._userTitle = this.getContainer().find('.ws-window-titlebar-custom').first();
            this._userTitle.addClass('ws-window-titlebar');
         }

         // Если есть опция "border" и нет заголовка вручную, то рисуем крестик
         // В случае с ручным заголовком крестик должен быть свой
         if (this._options.border && userTitleContainer.length === 0) {
            this._prepareCloseButton();
            if (this._hasMaximizeButton()){
               this._addMaximizeButton();
            }
            else {
               //Если открывается новый темплейт в уже открытой панели - нужно убрать старые классы
               this._changeMaximizePanelMode(false);
            }
         }

         this._caption = this._options.caption !== undefined ? this._options.caption : this._options.title;

         this._setTitleContainer();



         this.setTitle(this._caption);

         var css = {};
         if (!this._options.keepSize) {
            if (!this._options.autoWidth) {
               css['width'] = this._options.width + 'px';
               css['overflow-x'] = 'auto';
            }else{
               css['overflow-x'] = 'hidden';
            }

            if (!this._options.autoHeight && !this._options.isStack) {
               css['height'] = this._options.height + 'px';
               css['overflow-y'] = 'auto';
            }else{
               css['overflow-y'] = 'hidden';
            }
         }

         if (this._options.isStack) {
            //для стековой панели высота, установленная после загрузки шаблона, не нужна
            //нужно её убрать, чтобы работала height: 100%, заданная в классе ws-area
            //auto ставить нельзя, а то растягивание на height: 100% перестанет работать
            css['height'] = '';
         }

         if (!isEmptyObject(css)) {
            this._container.css(css);
         }
      },

      _templateInnerCallbackBeforeReady: function() {
         if (this._showOnControlsReady) {
            this._preparePanel();
         }
      },

      _showControls: function() {
         FloatArea.superclass._showControls.apply(this, arguments);

         if(this._autoShow && this._showOnControlsReady){
            this._showInternal(false);//При загрузке не надо ждать таймаута перед показом
         }
      },

      _loadControls: createBatchUpdateWrapper('FloatArea.loadControls', function(pdResult, template, parentId, checkDestroyed, errorHandler) {
         var
            loadControlsBase = FloatArea.superclass._loadControls,
            isCompoundControl = template instanceof TransportOld.CompoundControlTemplate,
            controlConfig, constructor, vStorage, markup, markupContext, contextCreated,
            args, timeout, result;

         this._showOnControlsReady = this._options.showOnControlsReady || !isCompoundControl || !this._autoShow;
         if (this._showOnControlsReady) {
            //Меняем состояние, если _showOnControlsReady == true, иначе ждем когда отработает батч
            if (this._focusState !== 'afterShow') {
               this._focusState = 'afterLoadControls';
            }
            result = loadControlsBase.apply(this, arguments);
         } else {
            controlConfig = cShallowClone(this._collectControlsToBuild(template, parentId)[0]);
            constructor = require(controlConfig.type);
            vStorage = null;

            //Повторяю функциональность поля record в конструкторе
            if (this._options.buildMarkupWithContext) {
               contextCreated = this._createContext(controlConfig, this.getLinkedContext());
               markupContext = contextCreated.context;
            }
            else {
               markupContext = null;
            }

            markup = ParserUtilities.buildMarkupForClass(constructor, controlConfig, markupContext, vStorage, this._options);
            if (markup) {
               this._container.html(markup);
            }


            if (contextCreated && contextCreated.craftedContext) {
               /**
                * Ранее контролы на FloatArea оживали после шаблонизации
                * внутри reviveComponents в классе CompoundControl
                * Новые контролы рождаются при шаблонизации и цепляются
                * к контексту построения.
                * Разрушать его нельзя до разрушения FloatArea.
                * В reviveComponents контролы только расставляются по дому
                * */
               this.once('onDestroy', function () {
                  markupContext.destroy();
               });
            }

            this._preparePanel();
            this._showInternal(false);

            //Нужно выждать таймаут, чтобы панель с разметкой успела отрисоваться, иначе она отрисуется только после того,
            //как пройдут конструкторы контролов
            args = [].slice.call(arguments);
            //временно включаю такую задержку, чтобы анимация успела отработать до начала построения контролов
            timeout = this._useAnimation ? this._options.animationLength * 1.3 : 0;

            //Если панель уже показана(попали сюда после .reload()), то таймаут на ожидание завершения анимации не нужен, сразу отрисовываем внутренности
            if (this._state === 'show') {
               setTimeout(forAliveOnly(function() {
                  loadControlsBase.apply(this, args);
                  this._runBatchDelayedFunc('_loadControls - ' + this._id, function() {
                     if (this._focusState === 'afterShow') {
                        this._setFocus();
                        this._focusState = null;
                     }
                     else {
                        this._focusState = 'afterLoadControls';
                     }
                  });
               }, this), timeout);
            } else {
               this._focusState = 'afterLoadControls';
               loadControlsBase.apply(this, args);
            }

            result = pdResult;
         }

         return result;
      }),

      _setFocus: function() {
         if (this._options.catchFocus) {
            doAutofocus(this._container);
         } else {
            this.setActivationIndex(WindowManager.getMaxActivisionIndex() + 1);
         }
      },

      _isTargetVisible: function() {
         function visibleParent(elem) {
            return (elem.parent().length === 0 || elem.css('display') === 'none' || elem.css('visibility') === 'hidden') ?
               elem : visibleParent(elem.parent());
         }

         var result = this._target.get(0) === window;
         if (!result) {
            result = visibleParent(this._target).is(document);
         }

         return result;
      },

      /**
       * Пересчитывает позицию области
       * @private
       */
      _recalcPosition: forNonStackOnly(function(offsetHint, forceVisible, usePreviousPosition){ // При использовании стека панелей расположением управляет FloatAreaManager

         function isFixedState($element) {
            var isFixed = false;
            if ($element.css('position') === 'fixed') {
               return true;
            }
            $element.parents().each(function(i, elem){
               if ($(elem).css('position') === 'fixed') {
                  isFixed = true;
                  return false;
               }
            });
            return isFixed;
         }

         var options = this._options;


         //Compatible from vdom
         if (this._options.nativeEvent) {
            var cssPos = {
               top: this._options.nativeEvent.clientY,
               left: this._options.nativeEvent.clientX,
               margin: 0
            };
            this._overflow.css(cssPos);
            return;
         }

         if((this.isVisible() || forceVisible) && (options.fixed || offsetHint || this._isTargetVisible())) { // Если пришел offsetHint значит это извещение от  domHelpers.trackElement, а значит объект видимый
            if (options.fixed) { //фиксированный элемент можно позиционировать в любом состоянии
               var
                  offset = options.offset || {},
                  offsetX = parseInt(offset.x, 10) || 0,
                  offsetY = parseInt(offset.y, 10) || 0,
                  css = {
                     left: '',
                     right: '',
                     top: '',
                     bottom: ''
                  },
                  ovr = this._overflow,
                  win = Env.constants.$win,
                  sideSigns = {left: -1, right: 1, top: -1, bottom: 1},
                  offsetXSign = sideSigns[options.side] * -1,
                  offsetYSign = sideSigns[options.verticalAlign] * -1,
                  scrollingContainerFixedOffsets = LayoutManager.getScrollingContainerFixedOffsets(),
                  marginH, marginV;

               if (options.side !== 'center') {
                  marginH = this._getShadowCssIntProp('margin-' + options.side);
                  css[options.side] = offsetX * offsetXSign + marginH * sideSigns[options.side] +
                     (scrollingContainerFixedOffsets[options.side] || 0);
               } else {
                  css['left'] = (win.width() - ovr.outerWidth()) / 2 + offsetX * (options.side === 'left' ? 1 : -1);
               }

               if (options.verticalAlign !== 'center') {
                  marginV = this._getShadowCssIntProp('margin-' + options.verticalAlign);
                  css[options.verticalAlign] = offsetY * offsetYSign + marginV * sideSigns[options.verticalAlign] +
                     (scrollingContainerFixedOffsets[options.verticalAlign] || 0);
               } else {
                  css['top'] = (win.height() - ovr.outerHeight()) / 2 + offsetY * (options.side === 'top' ? 1 : -1);
               }

               this._overflow.css(css);
            } else {
               var containerHeight = this.getContainer().height();

               /* im.dubrovin: При уменьшении высоты всплывашки сначала должен отработать LayoutManager,
               а изменение позиции уже позже. Сейчас LayoutManager не правильно разсчитывает высоту подложки.
               Нужно пересмотреть и переписать позиционирование,  с учетом формирования подложки*/
               if(this._prevHeight <= containerHeight){
                  var isTargetFixed = isFixedState(this._target), positionFn;

                  this._overflow.toggleClass('ws-float-area-nostack-panel-overflow-fixed', isTargetFixed);

                  if (!usePreviousPosition || !this._prevPositionOptions) {
                     positionFn = getPositionFn(this._overflow, this._target, options, isTargetFixed);
                     this._prevPositionOptions = positionFn();
                  }
                  this._overflow.position(this._prevPositionOptions);

                  // Для слоя совместимости вешаю классы, которые дают шаблону информцию о позиционировании
                  if (this._options.isCompoundTemplate) {
                     this._overflow.toggleClass('controls-Popup-align-horizontal-left', (positionResult && positionResult.elementLeft !== parseInt(positionResult.targetLeft, 10)));
                  }
               }

               this._prevHeight = containerHeight;
            }
         }
      }),
      /**
       * Обрабатывает изменения размеров
       * @private
       */
      _onResizeHandler: function(){
         FloatArea.superclass._onResizeHandler.apply(this, arguments);
         this._resizeInner();
      },
      _resizeInner: function() {
         /* task: 1173397139
          im.dubrovin: тут по ошибке 1172670112 пытались отключить fitWindow выставив usePreviusPosition(3-ий папраметр _recalcPosition) в тру.
          Т.к. эт не так делается и уже не актуально это делать, отменю правку */
         this._recalcPosition();
         this._updateStickyHeaderWidth();
         this._sizeUpdated();

         if (this._firstSizeCalcOnShow) {
            this._getScrollContainer().scrollTop(0);
            this._firstSizeCalcOnShow = false;
         }
      },

      _updateStickyHeaderWidth: function(){
         var stickyHeaderWrapper = this.getContainer().closest('.ws-float-area-stack-cut-wrapper'),
            stickyHeaderContainer = stickyHeaderWrapper.children('.ws-sticky-header__header-container');
         if (stickyHeaderContainer && stickyHeaderContainer.length){
            //используем данную конструкцию вместо outerWidth, поскольку outerWidth метод в jQuery 3 не учитывает ширину скролла.
            var contentWidth = stickyHeaderWrapper.children('.ws-sticky-header__scrollable-container')[0].getBoundingClientRect().width;
            stickyHeaderContainer.css('width', contentWidth + 'px');
         }
      },
      /**
       * Обработчик смены размеров детей
       * @private
       */
      _onSizeChangedBatch: function(){
         FloatArea.superclass._onSizeChangedBatch.apply(this, arguments);
         this._recalcPosition();
         this._sizeUpdated();

         if (this._firstSizeCalcOnShow) {
            this._getScrollContainer().scrollTop(0);
            this._firstSizeCalcOnShow = false;
         }
      },
      show: function(){
         this._prevPositionOptions = null;
         return this._showInternal(true);
      },
      /**
       *
       * Перезагрузить(переустановить) текущий шаблон.
       */

      reload: function(hideDependentAreas, updateWidth) {
         this._loaded = false;
         var containerStyle = this._container.prop('style');
         //Если не установлена ширина на контейнере панели - установим ее, чтобы при перезагрузке шаблона панель не уменьшалась
         //до 0px по ширине(т.к. задестроится шаблон, который и растягивал панель)
         var hasWidth = !!containerStyle.width;
         if (!hasWidth) {
            containerStyle.width = getComputedStyle(this._container[0]).width;
         }
         return this.setTemplate(this.getCurrentTemplateName()).addCallback(function(res){
            //_updateMinMaxWidthHeight выставляет width, только если установлен maxWidth
            //В остальных случаях при перезагрузки шаблона делаю это вручную
            var mainContainer = this.getContainer().closest('.ws-float-area'),
                containerStyle = this.getContainer().prop('style');
            if (!hasWidth) {
               containerStyle.width = '';
            }
            if ((this._maxWidthSet === this._getMaxPanelWidth()) && !updateWidth){
               if (containerStyle.width !== this._width) {
                  // this._width берется либо по dimensions, либо по установленному шаблону
                  // Максимальная доступная ширина может быть меньше, чем установлена пользователем, нужно это учитывать
                  // К примеру из-за размеров экрана или отображения панелей лесенкой.
                  this._width = Math.min(parseInt(this._width, 10), this._getMaxPanelWidth()) + 'px';
                  if (this._width) {
                     if (this._hasMaximizeButton()){
                        this._setMaximizeMode(this._options.maximized, true); //Сохраняем разворот, если есть maximizeButton
                     }
                     else {
                        containerStyle.width = this._width;
                        mainContainer.width(parseInt(containerStyle.width));
                     }
                  }
               }
            }
            else {
               this._updateMinMaxWidthHeight();//Если у нового шаблона другие размеры - установим их
               mainContainer.width(parseInt(containerStyle.width)); //Для основного контейнера тоже изменим ширину
            }

            // После перезагрузки шаблона зовем фокусировку. Логика такая же, как при открытии панели.
            // Делаем фокусировку асинхронно, чтобы все дочерние компоненты успели построиться и могли принять фокус.
            setTimeout(function() {
               // на всякий случай проверим, не задестроилась ли панель
               if (!this.isDestroyed()) {
                  this._setFocus();
               }
            }.bind(this), 10);
            if (hideDependentAreas){
               FloatAreaManager._hideDependentAreas(this);
            }
            return res;
         }.bind(this));
      },
      _getScrollContainer: function() {
         return this._visibleRoot;
      },

      _needRecalkInvisible: function() {
         return this._inApplyBatchUpdateIntermediate > 0;
      },

      _applyBatchUpdateIntermediate: function() {
         this._inApplyBatchUpdateIntermediate++;
         try {
            ControlBatchUpdater.applyBatchUpdateIntermediate('FloatArea.' + 'applyBatchUpdateImmediate');
         } finally {
            this._inApplyBatchUpdateIntermediate--;
         }
      },

      /**
       * Показывает контрол
       * @returns {Boolean}
       * @private
       */
      _showInternal: forAliveOnly(function(withTimeout) {
         var self = this;
         this._cancelHide();

         if (!this._loaded) {
            this._autoShow = true;
         }
         else if (!this.isDestroyed()) {  //панель может убиться в cancelHide, поскольку там вызывается hideFinishFn, которая может вызвать destroy у панели.
            if (!this.isOpened() && this._state !== 'show') {
               this._state = 'show';
               this._stateStage = 'delay';

               //На ios не даем открыть больше 8 панелей, т.к. большее количество приводит к падению вкладки браузера
               if (Env.constants.browser.isMobileIOS && FloatAreaManager._stack.length >= MAX_STACK_PANEL_COUNT) { //>=, т.к. в _stack новую панель еще не положили
                  require(['SBIS3.CONTROLS/Utils/InformationPopupManager'], function(InformationPopupManager) {
                     InformationPopupManager.showMessageDialog({
                        status: 'error',
                        message: rk('На вашем устройстве закончились ресурсы для открытия еще одного окна СБИС. Пожалуйста, закройте лишние окна и повторите попытку заново.')
                     });
                  });
                  this._cancelShow();
                  return;
               }

               var doShow = this._createBatchUpdateWrapper('FloatArea._showInternal.doShow ' + this.getId(), function(){
                  this._stopAnimation();

                  if (this._target && !this._isTargetVisible()) {
                     this.hide();
                  }
                  else {
                     this._stateStage = 'beforeShow';

                     //Тут менеджер перенастроит body (выключит прокрутку и т.п.), если нужно,
                     //И расчёт размеров панели будет правильным
                     FloatAreaManager._beforeShowStarted(this);

                     //Стековой панели нужно поставить начальную мин. высоту, чтобы она не могла оказаться меньше высоты окна в результате
                     //изменения внутренних размеров прикладным кодом без вызова пересчёта (такое тоже бывает)
                     //Также нужно сделать начальную подгонку ширины.
                     this._updateVisibleRootRightPadding();
                     this._updateMinMaxWidthHeight(true, true);

                     //панель должна иметь хоть какие-то размеры перед событием onBeforeShow (окнчательность размеров не гарантируется, но некоторым нужно хотя бы так (см. коммит)
                     this._visibleRootWrapper.css('visibility', 'hidden');//нужно, чтоб не было "прыжка" у панели - в IE8 может быть заметно
                     this._visibleRootWrapper.removeClass('ws-hidden');
                     if (!this._options.isStack) {
                        //Нестековую панель перед показом надо спозиционировать по таргету
                        //из trackElement по таргету она в недопоказанном состоянии не работает
                        this._recalcPosition(undefined, true);
                     }

                     this._notify('onBeforeShow');

                     //Обработчик onBeforeShow может закрыть панель, так что нужно проверить её состояние перед началом анимации
                     if (this._state === 'show') {
                        this._stateStage = 'show';
                        this._showDeferred = new Deferred();

                        this.moveToTop();

                        this._notifyFloatAreaZIndexChanged();

                        //Если контрол показывается из невидимого состояния, в котором прошла загрузка (и кончился пакет),
                        // и, из-за загрузки в невидимом состоянии, есть отложенные изменения,
                        // то надо их применить внутри текущего пакета, то есть, добавить их к текущему пакету.
                        // Тогда ранее загруженная невидимая панель пересчитается в конце этого пакета.
                        this._checkDelayedRecalk();
                        this._notifyOnSizeChanged(true);

                        this._firstSizeCalcOnShow = true;

                        if (this._useAnimation) {
                           this._toggleAnimationClasses(true);
                           this._applyBatchUpdateIntermediate();
                           this._recalcPosition(undefined, true);
                           this._getScrollContainer().scrollTop(0);

                           this._doAnimation(this._getAnimationStartValue(), this._getAnimationEndValue(), this._finishShow.bind(this), 0);
                           FloatAreaManager._addToAnimationQueue(this._showDeferred, this._animationQueue);
                        } else {
                           // сначала панель с внутренними компонентами должна появиться, и только потом делаем _finishShow с переносом активности
                           setTimeout(function() {
                              self._applyBatchUpdateIntermediate();
                              self._finishShow();
                           }, 0);
                        }

                        FloatAreaManager._showStarted(this);
                        this._notify('onShow');//TODO: убрать это событие, проверить, не пользуется ли кто им, и убрать остальную связь с FloatAreaManager через события
                     } else {
                        //Если обработчик onBeforeShow закрыл или удалил панель, то надо переключить
                        //обратно состояния менеджера панелей (включить обратно прокрутку в body, если надо)
                        FloatAreaManager._beforeClose(this);
                        FloatAreaManager._afterClose(this);
                        //вообще-то, в этой ветке _showDeferred и так undefined, поскольку в ней панель скрыта из onBeforeShow,
                        //но вдруг чего... лучше обнулим _showDeferred, чтоб гарантировать отсутствие подвисших пакетов
                        this._showDeferred = undefined;
                     }

                     /* task: 1173272371
                      * im.dubrovin: генерация хтмл с помощью js должна быть заменена на xhtml шаблон, пока хинт вешаю так */
                     if(this._caption){
                        this.getContainer().parent().find('.ws-window-titlebar').attr('title', this._caption).css('z-index', 2);
                     }

                     return this._showDeferred;
                  }
               });

               if (withTimeout) {
                  this._showTimer = setTimeout(doShow, this._options.showDelay);
               }
               else {
                  doShow();
               }
            }
         }
         return true;
      }),
      _setTitleContainer: forAliveOnly(function() {
         this._createTitle();
      }),

      _createTitle: function(){
         var toggleTitleContainer = function (show) {
            this._generatedTitleContainer.toggleClass('ws-hidden', !show);
            this._container.css('padding-top', show ? this._generatedTitleContainer.outerHeight() + 'px' : '');
         }.bind(this);

         if (this._userTitle.length) {
            toggleTitleContainer(false);

            if (this._title.closest(this._userTitle).length === 0) {
               this._userTitle.prepend(this._title);
            }

            this._title.addClass('ws-float-area-title').toggleClass('ws-hidden', !this._caption);
         } else if (this._options.border && this._caption) {
            if (this._title.closest(this._generatedTitleContainer).length === 0) {
               this._generatedTitleContainer.empty().append(this._title);
            }
            this._title.addClass('ws-float-area-title ws-float-area-title-generated');
            toggleTitleContainer(true);
         } else {
            toggleTitleContainer(false);
         }
      },
      /**
       *
       * Установить заголовок панели. только для стековых
       * @param {String} title - новое название заголовка.
       */
      _setTitle: forReadyOnly(function(title){
         // Почему сделал так: TemplatedAreaAbstract меняет document.title, а нам этого делать нельзя
         this._caption = title;
         this._title.text(title);
         this._createTitle();
         this._notifyOnSizeChanged(true);
      }),
      /**
       *
       * Перемещает панель выше открывшей области или выше всех, если её нет.
       * Также перемещает все дочерние панели и окна, которые связаны с этой панелью через опцию opener.
       * @example
       * После панели переместить её выше остальных.
       * <pre>
       *    floatArea.subscribe('onAfterShow', function() {
       *       this.moveToTop();
       *    });
       * </pre>
       */
      moveToTop: function(){
         //Если панель открыта и не самая верхняя - переместим ее наверх
         if (this.isOpened() && (FloatAreaManager._getMaxZIndex() !== this.getZIndex())) {
            WindowManager.releaseZIndex(this._zIndex);

            this._zIndex = this._prepareZIndex();

            WindowManager.setVisible(this._zIndex);
            this._visibleRootWrapper.css('z-index', this._zIndex);

            //Поднимаем также дочерние панели и окна, чтоб родительская панель их не перекрыла, поднявшись сама.
            this._childWindows.forEach(function (area) {
               area.moveToTop();
            });

            ModalOverlay.adjust();
         }
      },
      /**
       * Возвращает z-index области
       * @return {*}
       */
      getZIndex: function(){
         return this._zIndex;
      },

      /**
       *
       * Скрыть контрол.
       * Если включена опция {@link autoCloseOnHide}, то ещё и удаляет её после скрытия (с этой опцией метод hide работает так же, как и метод {@link close}).
       * @param {Boolean} [force=true]
       * @returns {Boolean} Удалось ли закрыть панель.
       * Это может не удастся, если:
       * <ol>
       *    <li>обработчик события {@link onBeforeClose} запретил закрывать панель,</li>
       *    <li>есть связанные панели или диалоги, которые не дают закрыть панель,</li>
       *    <li>наследник FloatArea - RecordFloatArea может показывать перед закрытием диалог сохранения, результатом
       *    которого является отмена закрытия панели.</li>
       * </ol>
       * @example
       * При клике на кнопку (btn) скрыть всплывающую панель (floatArea).
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       floatArea.hide();
       *    });
       * </pre>
       * @command
       * @see autoCloseOnHide
       * @see close
       * @see onBeforeClose
       */
      hide: forAliveOnly(function(force){
         this._result = undefined;
         force = force === undefined ? true : force;
         return this._options.autoCloseOnHide ? this.close(this._result, force) : this._hide(force, nop);
      }),

      _shouldHideByFocusMoveTo: function(controlToFocus) {
         var
            self = this,
            // Собираем список родительских контролов с помощью DOMEnvironment, потому что он
            // учитывает vdom-контролы
            parentList = Vdom.DOMEnvironment._goUpByControlTree(controlToFocus._container),
            shouldHide = !controlToFocus.isDestroyed();

         // Проверяет, есть ли среди родителей controlToFocus контрол, удовлетворяющий
         // проверке checkFn
         function findHideBlockerParent(checkFn) {
            for (var i = 0; i < parentList.length; i++) {
               if (checkFn(parentList[i])) {
                  return true;
               }
            }
            return false;
         }

         // Не нужно закрывать область, если фокус ушел на контрол внутри этой области, или если
         // фокус ушел в окно с большим z-index (например во всплывающий диалог)
         shouldHide = shouldHide && !findHideBlockerParent(function (control) {
            return control === self ||
               !!( cInstance.instanceOfMixin(control, 'Lib/Mixins/LikeWindowMixin') && control.getZIndex && control.getZIndex() > self.getZIndex());
         });

         // Не нужно закрывать область, если фокус ушел на контрол внутри панели с hoverTarget
         shouldHide = shouldHide && !findHideBlockerParent(function (control) {
            return control instanceof FloatArea && !!control._options.hoverTarget;
         });

         /* task: 1173431005
          im.dubrovin: При уходе фокуса на заметку закрытие ари не должно происходить;
          в 230 делаю так, в 240 нужно будет сделать через LikeWindowMixin */
         shouldHide = shouldHide && (!findHideBlockerParent(function (control) {
            return  cInstance.instanceOfModule(control,'Notes/View/Dynamic');
         }) || !self._options.isStack);

         return shouldHide;
      },

      _notifyFloatAreaZIndexChanged: function() {
         if (this._options.isStack) {
            var zIndex = FloatAreaManager._getMaxZIndex();
            EnvEvent.Bus.globalChannel().notify('FloatAreaZIndexChanged', zIndex);
         }
      },

      _hideInner: function(afterHideFn) {
         //Конец скрывания контрола
         function finishHide(deferred){
            var deactivateFn = function() {
               this._state = '';
               this._visible = false;
               this._stateStage = '';
               // стреляю событием об изменении состояния видимости области, чтобы у внутренних компонентов была точка,
               // где они бы могли перерисоваться на показ панели. Это костыльное решение, правильнее было бы звать superclass.hide()
               this._notify('onAfterVisibilityChange', false);
               WindowManager.releaseZIndex(this._zIndex);
               // отдавая zIndex, зануляем его, чтобы он больше нигде не возвращался повторно
               // если панель уничтожится через destroy сразу в обход hide, zIndex будет отдан там.
               // https://inside.tensor.ru/opendoc.html?guid=2ce4272c-6a6d-46fc-ad88-49b6412931ee
               this._zIndex = null;
               ModalOverlay.adjust();

               this._notifyFloatAreaZIndexChanged();
            }.bind(this);

            try {
               //скроем панель перед возможным переключением режима body менеджером, иначе в IE9 может вёрстку перекосить на полсекунды
               this._visibleRootWrapper.addClass('ws-hidden');

               //Вызываем это сначала, чтобы у пользовательских обработчиков было бы
               //уже окончательное состояние панели и менеджера
               FloatAreaManager._afterClose(this);
               WindowManager.deactivateWindow(this, deactivateFn);
            }
            finally {
               this._notify('onClose');//TODO: убрать это событие, проверить, не пользуется ли кто им, и убрать остальную связь с FloatAreaManager через события

               //onAfterClose должен быть тут самым последним, чтобы активность уже перешла на другой контрол,
               //например, вернулась на браузер, открывший панель, или ушла в тот контрол, на который кликнули,
               //закрыв тем самым панель. Браузер, открывший панель, ловит onAfterClose, и смотрит по своему признаку активности,
               //фокусировать ли активную строку.
               this._notify('onAfterClose', this._result);

               deferred.callback();

               if (!this.isDestroyed()) {
                  //Класс-индикатор успешного окончания скрытия. Нужен для интеграционных тестов, чтоб они отлавливали
                  //момент окончания уезжания (или другого способа показа) панели
                  this._container.addClass('ws-float-area-hide-complete');
                  afterHideFn.call(this);
               }
            }
         }

         var oldShowStage,
            result = !this.isOpened();
         if (!result) {
            //Сюда я могу попасть только если панель уже показана (_state='', _visible=true),
            //или находится в процессе показа (_state='show', _visible=false).
            //Я заканчиваю процесс показа на каком-то этапе, и в зависимости от этого этапа выбираю действия на прятании панели.
            oldShowStage = this._cancelShow();

            this._state = 'hide';

            // хак для ipad, чтобы клавиатура закрывалась когда дестроится панель
            if (Env.detection.isMobileIOS) {
               $(document.activeElement).trigger('blur');
            }

            this._runInBatchUpdate('FloatArea.hide.animation - ' + this._id + ' ' + this._options.template, function () {
               var finishDfr = new Deferred();

               finishDfr.addErrback(function (e) {
                  return e;
               });

               try {
                  // Создаем функцию, которая может быть вызвана лишь один раз
                  // Нужно на случай, если, например начали анимацию, затем отменили закрытие после чего анимация закончилась
                  this._hideFinishFn = once.call(finishHide.bind(this, finishDfr));

                  FloatAreaManager._beforeClose(this);

                  this._setVisibilityCommandButtons(false);
                  this._toggleTrackTarget(false);

                  if (this._useAnimation && oldShowStage === 'show') {
                     this._doAnimation(null, this._getAnimationStartValue(), this._hideFinishFn, FloatAreaManager._getPanelHideAnimationDelay());
                     FloatAreaManager._addToAnimationQueue(finishDfr, this._animationQueue);
                  } else {
                     this._hideFinishFn();
                  }
               } catch (e) {
                  finishDfr.errback(e);
               }
               return finishDfr;
            });
         }
         return result;
      },

      _addHidePending: function(afterHideFn) {
         if (!this._hasHidePendig) {
            var dfr = new Deferred();
            this._hasHidePendig = true;
            dfr.addCallback(function () {
               this._hasHidePendig = false;
               var saving = this._saving;
               this._saving = undefined;
               return this.finishChildPendingOperations(saving);
            }.bind(this));
            return this.waitAllPendingOperations(dfr.addCallback(this._hideInner.bind(this, afterHideFn)));
         }
         return true;
      },

      /**
       *
       * @param force
       * @param afterHideFn
       * @returns {Boolean|Core/Deferred}
       * @private
       */
      _hide: function(force, afterHideFn){
         function childAreaCloseInitiator() {
            // Условие выхода из рекурсии
            if(!needToCloseAreas.length) {
               // Если все окна закрыты (или ничего закрывать не надо), то начинаем закрывать себя
               //если окно уже закрывается, то второго закрытия запускать не нужно, а то будут дублироваться события типа onBeforeClose и т.п.
               result = this._addHidePending(afterHideFn);
               if (closeDeferred instanceof Deferred) {
                  // Если мы тут не первый раз и ждём окончания, то сообщим о нём
                  closeDeferred.callback();
               }
               // Мы не ожидаем закрытия других панелей и можем выйти сразу
               return true;
            }
            var
               self = this,
               lastArea = needToCloseAreas[needToCloseAreas.length-1],
               afterCloseOrDestroy = forAliveOnly(function() {
                  unsubscribeAll.call(this);

                  // Уменьшаем "итератор"
                  needToCloseAreas.pop();
                  // Уходим снова в рекурсию
                  childAreaCloseInitiator.apply(self);
               }),
               beforeClose = forAliveOnly(function(eventObject, result) {
                  // Если отменили закрытие окна, то отписываемся от всех наших обработчиков
                  if (eventObject.getResult() === false) {
                     unsubscribeAll.call(this);
                     if (closeDeferred instanceof Deferred) {
                        closeDeferred.errback();
                     }
                  }
               }),
               confirmDialog = forAliveOnly(function(eventObject, result) {
                  // Если отменили закрытие RecordFloatArea, то отписываемся от всех наших обработчиков
                  if (result === false) {
                     unsubscribeAll.call(this);
                  }
               });

            function unsubscribeAll() {
               this.unsubscribe('onDestroy', afterCloseOrDestroy);
               this.unsubscribe('onAfterClose', afterCloseOrDestroy);
               this.unsubscribe('onBeforeClose', beforeClose);
               this.unsubscribe('onConfirmDialogSelect', confirmDialog);
            }

            lastArea.once('onDestroy', afterCloseOrDestroy);
            lastArea.once('onAfterClose', afterCloseOrDestroy);
            lastArea.once('onBeforeClose', beforeClose);
            lastArea.once('onConfirmDialogSelect', confirmDialog);

            //Дочерние панели и окна надо закрывать через close, чтобы они не болтались в памяти (всё равно при новом открытии родителя сами не откроются)
            //Ещё это нужно потому, что у окна метод close кидает события, а метод hide - нет, в отличе от панели.
            lastArea.close();

            return false;
         }

         // если панель уже закрывается, ничего не делаем
         if (this._state === 'hide') {
            return false;
         }

         var flag, result;

         force = force === undefined ? true : force;
         this._state = 'hide';
         /**
          * Стреляем onBeforeClose при вызове _hide, иначе это происходит только при первом закртии
          */
         flag = this._notify('onBeforeClose', this._result);
         result = flag !== false;

         if (result && this._state === 'hide') {
            this._closeVDOMInfobox();
            this._state = '';
            result = this._loaded;

            var
               closeDeferred = true,
               needToCloseAreas = [];
            if (result) {
               if (!this.isLockShowed(force, needToCloseAreas) && this._state !== 'hide') {
                  result = !(this._state || this._visible);
                  if (result) {
                     afterHideFn.call(this);
                  }
                  else {
                     // Пытаемся рекурсивно цепочкой закрыть окна
                     if (!childAreaCloseInitiator.apply(this)) {
                        // если закроем не сразу, то вернём деферред
                        closeDeferred = new Deferred();
                        this._deferClose = true;
                        closeDeferred.addCallbacks(function() {
                           this._deferClose = false;
                        }.bind(this), function (e) {
                           return e;
                        });
                     }
                  }
               }
            } else {
               this._autoShow = false;
            }
            return closeDeferred === true ? result : closeDeferred;

         } else if (this._state === 'hide') {
            //если обработчик onBeforeClose не поменял состояние, вызвав show или деструктор, то состояние надо сбросить, "закончив" скрытие панели
            //если же поменял, то трогать его не надо
            this._state = '';
            return false;
         }
      },

      _closeVDOMInfobox: function() {
         // Перед закрытием окна закрываем вдомные инфобоксы, которые на нем открыты
         // Вызываем обработчик, который в вдоме вызывается перед закрытием окна
         if (!isNewEnvironment()) {
            var ManagerWrapperControllerModule = 'Controls/Popup/Compatible/ManagerWrapper/Controller';
            if (requirejs.defined(ManagerWrapperControllerModule)) {
               var ManagerWrapperController = requirejs(ManagerWrapperControllerModule);
               if (ManagerWrapperController.getGlobalPopup()) {
                  ManagerWrapperController.getGlobalPopup()._popupBeforeDestroyedHandler(null, null, null, this.getContainer()[0]);
               }
            }
         }
      },

      /**
       *
       * Закрыть и уничтожить панель.
       * @param {*} result "Результат" закрытия панели - передаётся в соответствующий паораметр {@link onAfterClose}.
       * @param {Boolean} [force=true] Принудительное закрытие панели:
       * <ul>
       *    <li>true - закрывать панель, даже если есть открытые из неё панели (вместе с этими открытыми панелями);</li>
       *    <li>false - не закрывать панель, если из неё открыты другие панели.</li>
       * </ul>
       * @returns {Boolean} Удалось ли закрыть панель. Это может не удастся, если:
       * <ol>
       *    <li>обработчик события {@link onBeforeClose} запретил закрывать панель,</li>
       *    <li>есть связанные панели или диалоги, которые не дают закрыть панель,</li>
       *    <li>наследник FloatArea - RecordFloatArea может показывать перед закрытием диалог сохранения, результатом
       *    которого является отмена закрытия панели.</li>
       * </ol>
       * @example
       * При клике на кнопку (btn) закрыть всплывающую панель (floatArea) и удалить экземплят класса.
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       floatArea.close();
       *    });
       * </pre>
       * @command
       * @see onBeforeClose
       * @see onAfterClose
       * @see ok
       * @see cancel
       */
      close: forAliveOnly(function(result, force) {
         force = force === undefined ? true : force;
         var
            tmpResult = this._result,
            hideResult;

         this._result = result;
         this._saving = result; // с каким ответом завершить пендинги, если они есть
         hideResult = this._hide(force, this.destroy);
         if(hideResult === true) {
            return true;
         } else {
            /* При форсированом закрытии не дожидаемся закрытия всех чайлд окон / панелей , передаем результат сразу*/
            if(force){
               this._result = result;
            }else{
               /* Ждпем закрытия окон / панелей , переданный в клоуз результат пока не сохраняем */
               this._result = tmpResult;
            }
         }
         return false;
      }),
      /**
       *
       * Выполнить команду {@link close} с результатом true.
       * При вызове этого метода в {@link onAfterClose} в параметр result придёт true.
       * @returns {Boolean} Удалось ли закрыть панель.
       * @example
       * При клике на кнопку (btn) закрыть всплывающую панель (floatArea) и удалить экземплят класса.
       * <pre>
       *    var floatArea = this.getTopParent();
       *    btn.subscribe('onClick', function() {
        *       floatArea.ok();
        *    });
       * </pre>
       * @see close
       * @see onAfterClose
       * @see onBeforeClose
       * @see cancel
       */
      ok: function() {
         return this.close(true);
      },
      /**
       *
       * Выполнить команду {@link close} с результатом false.
       * При вызове этого метода в {@link onAfterClose} в параметр result придёт false.
       * @returns {Boolean} Удалось ли закрыть панель.
       * @example
       * При клике на кнопку (btn) закрыть всплывающую панель (floatArea) и удалить экземплят класса.
       * <pre>
       *     var floatArea = this.getTopParent();
       *     btn.subscribe('onClick', function() {
        *       floatArea.cancel();
        *    });
       * </pre>
       * @see close
       * @see onAfterClose
       * @see onBeforeClose
       * @see ok
       */
      cancel : function() {
         return this.close(false);
      },

      isVisible: function(){
         return !this._state && this._visible;
      },
      /**
       * Показана ли панель (то же самое, что и isVisible. для совместимости) //TODO решить проблему дублирования isVisible и isShow (не только в этом классе)
       * @return {Boolean}
       */
      //TODO решить проблему дублирования isVisible и isShow
      isShow: function(){
         return this.isVisible();
      },
      /**
       *
       * Получить признак открытости панели.
       * @return {Boolean} Возможные значения:
       * <ol>
       *    <li>true - панель сейчас открывается или уже открыта;</li>
       *    <li>false - панель закрывается или закрыта.</li>
       * </ol>
       * @example
       * Устанавливаем значение в поле ввода (Строка 1) после показа всплывающей панели:
       * <pre>
       *    floatArea.subscribe('onAfterShow', function(){
       *       if (this.isOpened()) {
       *          this.getTopParent().getChildControlByName('Строка 1').setValue('какое-то значение');
       *       }
       *    })
       * </pre>
       * @see isVisible
       * @see isCompletelyVisible
       * @see isShow
       */
      isOpened: function(){
         return (this._visible && this._state === '') || this._state === 'show';
      },
      /**
       * Останавливает анимацию, если она была
       * @private
       */
      _stopAnimation: function() {
         if (this._state && this._useAnimation) {
            this._containerShadow.stop(true);
            this._toggleAnimationClasses(false);
         }
      },

      _stopTimer: function(fieldName) {
         if (this[fieldName]) {
            clearTimeout(this[fieldName]);
            this[fieldName] = undefined;
         }
      },

      _getAnimationStartValue: function() {
         var
            metric = this._options.direction,
            translateAxis,
            translateSign,
            metricFn, startMetric, value,
            result;
         if (this._options.animation === 'slide') {
            if(metric === 'left' || metric === 'right'){
               translateAxis = 'X';
               translateSign = metric === 'left' ? 1 : -1;
               metricFn = 'outerWidth';
               startMetric = 'startWidth';
            }
            else {
               translateAxis = 'Y';
               translateSign = metric === 'top' ? 1 : -1;

               metricFn = 'outerHeight';
               startMetric = 'startHeight';
            }

            value = this._containerShadow[metricFn](true) - this._options[startMetric];
            result = ['transform', 'translate' + translateAxis + '(' + value * translateSign + 'px)'];
         } else if (this._options.animation === 'fade') {
            result = ['opacity', '0'];
         } else if (this._options.animation !== 'off') {
            throw new Error(rk('Ошибочная опция animation'));
         }

         return result;
      },

      _getAnimationEndValue: function() {
         var metric = this._options.direction,
            result;
         if (this._options.animation === 'slide') {
            result = ['transform', 'translateX(' + 0 + 'px)'];
         } else if (this._options.animation === 'fade') {
            result = ['opacity', '1'];
         } else if (this._options.animation !== 'off') {
            throw new Error(rk('Ошибочная опция animation'));
         }

         return result;
      },

      _toggleAnimationClasses: function(toggle) {
         (this._options.animation !== 'fade') && this._overflow.toggleClass('ws-float-area-animate', toggle);
      },

      /**
       * @private
       */
      _doAnimation: function(startValue, endValue, finishFn, startDelay){
         this._stopAnimation();
         this._toggleAnimationClasses(true);

         var toggleCss3Transition = function(value) {
            if (this._useCss3) {
               this._containerShadow.css({'transition-property': value ? '' : 'none'});
            }
         }.bind(this);

         var finishAnimation = function() {
            //для очистки transform сначала снимем duration, иначе свойство применится через установленную задержку
            //Нужно для того, чтобы на момент снятий класса ws-float-area-animate у нас не висело св-во transform, которое мешает
            //позиционированию fixed контейнеров. (нужно, к примеру, для OperationsPanelExpand, ScrollPager)
            this._setAnimationDurationProperty('');
            this._containerShadow.css(endValue[0], '');

            setTimeout(function() {
               this._setAnimationDurationProperty(this._getAnimationLength());
               this._toggleAnimationClasses(false);
            }.bind(this), 0);
            this._containerShadow.css({
               'will-change': 'auto'
            });
            finishFn();
         }.bind(this);

         if (startValue) {
            toggleCss3Transition(false);
            this._containerShadow.css(startValue[0], startValue[1]);
            this._visibleRootWrapper.css('visibility', 'visible');
         }

         var doAnimation = function() {
            var obj;
            //Если панель появляется через изменение прозрачности (animation === 'fade'), то перед запуском анимации делаем крестик видимым.
            //Иначе получается, что появляется панель, а только после того, как отработает анимация, появляется крест.
            //Определяю, что сейчас запускается анимация отображения панели, через endValue: в этом случае [0] = 'opacity', [1] = 1
            if (this._options.animation === 'fade' && endValue[0] == 'opacity' && endValue[1] == 1){
               this._setVisibilityCommandButtons(true);
            }
            if (this._useCss3) {
               this._containerShadow.css({
                  'will-change': 'transform'
               });
               requestAnimationFrame(function() {
                  toggleCss3Transition(true);
                  this._transitionEndHandler = finishAnimation;
                  this._containerShadow.css(endValue[0], endValue[1]);

                  var animLength = this._options.animationLength;
                  if (this._options.disableCSS3AnimationEvent) {
                     setTimeout(finishAnimation, animLength);
                  }
                  FloatAreaManager._fixCss3TransitionEndEvent(this._containerShadow.get(0),
                     endValue[0], endValue[1], animLength);
               }.bind(this));

            } else {
               obj = {};
               obj[endValue[0]] = endValue[1];
               this._containerShadow.animate(obj, this._options.animationLength, finishAnimation);
            }
         }.bind(this);

         this._stopTimer('_beforeAnimationTimer');

         //тут приходится делать таймаут, чтобы правильно прошло выключение-включение анимации
         this._beforeAnimationTimer = setTimeout(doAnimation, Math.max(startDelay, 10));
      },
      /**
       * Конец показа контрола - активирует контролы, меняет состояние
       * @private
       */
      _finishShow: forAliveOnly(function(){
         this._state = '';
         this._visible = true;
         // стреляю событием об изменении состояния видимости области, чтобы у внутренних компонентов была точка,
         // где они бы могли перерисоваться на показ панели. Это костыльное решение, правильнее было бы звать superclass.show()
         this._notify('onAfterVisibilityChange', true);

         if (this._isModal) {
            WindowManager.setVisible(this.getZIndex());
            ModalOverlay.adjust();
         }

         try
         {
            this._toggleTrackTarget(true);
            this._setVisibilityCommandButtons(true);
            this._visibleRootWrapper.css('visibility', 'visible');

            this.moveToTop();
            FloatAreaManager._finishShow(this);

            // сначала ставим фокус себе, а потом пробуем отдать его внутрь панели
            if (this._options.catchFocus) {
               //Этот хак нужен для мобильных устройств, чтобы убрать виртуальную клавиатуру, лежащую под панелью
               //(если фокус перешёл на какое-то поле ввода сразу перед показом панели - такое бывает)
               //А также нужно поднять свой индекс активации, чтобы при удалении дочерних контролов во время анимации панели
               // фокус не возвращался бы на другую область, лежащую вне панели, и не срабатывало бы автозакрытие панели по уходу фокуса с её контролов
               //moveFocusToSelf всё это делает
               this._moveFocusToSelf();
            }

            //В IE (даже 10-м) глючит фокусировка элемента, которая вызывается из обработчика onAfterShow.
            //Элемент там как бы не совсем дорисован оказывается. Чтобы гарантировать готовность элемента после
            //показа панели, отложим событие ненадолго, пусть там всё прорисуется.
            this._runBatchDelayedFunc('onAfterShow', function() {
               //setTimeout(funcHelpers.forAliveOnly(this._notify.bind(this, 'onAfterShow'), this), 10);

               //Если showOnControlsReady == true, то на onaftershow компоненты уже инициализированы и способны принять фокус
               if (this._focusState === 'afterLoadControls') {
                  this._setFocus();
                  this._focusState = null;
               }
               else {
                  this._focusState = 'afterShow';
               }
               // task: 1173470707
               // im.dubrovin: из за js прорисовк имеем проблемы с попаданием в нужное время при перетаскивании стики хедера,
               // времено увеличивю таймер пока не сделан нормальный xhtml шаблон
               setTimeout(function() {
                  //Нотифай onAfterShow отложенный, панель могу быстро закрыть, в этом случае не нужно стрелять событием
                  if (!this.isDestroyed() && !this._isShowCanceled) {
                     this._notify('onAfterShow');
                  }

                  this._isShowCanceled = false;
               }.bind(this), 400);
            });

            // Почти всегда после инициализации панели срабатывает _onResizeHandler и по нему обновляется размер
            // контейнера для заголовков. Но не всегда.
            // В фаирфоксе срабатывает не всегда. В хроме на некоторых панелях не срабатывает при первом открытии.
            // Обновляяем размер контейнера для фиксированных заголовков принудительно.
            this._updateStickyHeaderWidth();
         }
         finally
         {
            var dfr = this._showDeferred;
            this._showDeferred = undefined;
            dfr.callback();

            //Класс-индикатор успешного окончания показа. Нужен для интеграционных тестов, чтоб они отлавливали
            //момент окончания выезжания (или другого способа показа) панели
            this._container.addClass('ws-float-area-show-complete');
            this._toggleAnimationClasses(false);

            // После инициализайии убираем фикс сделанный по ошибке https://inside.tensor.ru/opendoc.html?guid=18b57e4c-234c-4f85-9062-135330879d46&des=
            // Скролбары уже инициализарованы и фикс больше не нужен. Навешиваем класс убирающий фикс. См core.less.
            if (Env.detection.isMobileSafari) {
               setTimeout(forAliveOnly(function () {
                  this.getContainer().closest('.ws-float-area-stack-panel-overflow').addClass('ws-ipad-scrolling-content-fix');
               }.bind(this), this), 2000);
            }
         }
      }),

      _stopTimers: function() {
         this._stopTimer('_showTimer');
         this._stopTimer('_beforeAnimationTimer');
         this._stopTimer('_hoverTimer');
      },

      _cancelShow: function() {
         // при отмене открытия нужно убедиться, что батч на открытие панели не подвис в пакете, иначе он засорится
         if (ControlBatchUpdater.haveBatchUpdate()) {
            ControlBatchUpdater.endBatchUpdate('FloatArea._showInternal.doShow ' + this.getId());
         }
         //Убираем класс-индикатор успешного окончания показа.
         this._container.removeClass('ws-float-area-show-complete');

         this._stopTimers();

         var stage = this._stateStage;
         if (this._state === 'show') {
            this._isShowCanceled = true; //Панель закрыли, в момент открытия
            try {
               this._stopAnimation();

               //Если останавливаем показ на этом этапе, то нужно просто спрятать основной блок,
               // и не заканчивать анимацию, ничего не показывая, как не нужно её заканчивать и на этапе 'delay'
               if (stage === 'beforeShow') {
                  this._visibleRootWrapper.addClass('ws-hidden');
               }

               if (this._showDeferred) {
                  var dfr = this._showDeferred;
                  this._showDeferred = undefined;//страховка на случай, если исключение вылетит в вызове dfr.callback(), и он где-то в коде обработчиков ошибок напорется на старый this._showDeferred
                  dfr.callback();
               }
            } finally {
               this._state = '';
               this._stateStage = '';
            }
         }
         return stage;
      },

      _cancelHide: function() {
         //Убираем класс-индикатор успешного окончания скрытия.
         this._container.removeClass('ws-float-area-hide-complete');
         // Если окно в процессе показа, то думаю не стоит убивать таймеры в функции отмены скрытия
         if (this._state !== 'show') {
            this._stopTimers();
         }

         if (this._state === 'hide') {
            try {
               this._stopAnimation();

               if (this._hideFinishFn) {
                  var fn = this._hideFinishFn;
                  this._hideFinishFn = function () {};//страховка на случай, если исключение вылетит в вызове _hideFinishFn, и он где-то в коде обработчиков ошибок напорется на старый this._hideFinishFn
                  fn();
               }
            } finally {
               this._state = '';
            }
         }
      },

      /**
       *
       * Может ли контрол получать фокус
       * @return {Boolean} Признак может ли контрол получать фокус.
       * Возможные значения:
       * <ol>
       *    <li>true - контрол может получать фокус,</li>
       *    <li>false - не может.</li>
       * </ol>
       * @see catchFocus
       */
      canAcceptFocus: function(){
         return this._visible;
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
       * Обрабатывает нажатие клавиш на панели
       * @param {Object} e Объект события
       * @return {Boolean}
       * @private
       */
      _keyboardHover: function(e){
         var topFloatAreaInfo,
            topFloatArea;

         //Если зажат shift - открываем диспетчер задач хрома
         if(!e.shiftKey && e.which === Env.constants.key.esc){
            e.stopPropagation();
            e.stopImmediatePropagation();


            //Если нажали esc, а у нас есть панель выше текущей в состоянии открытия,
            //значит надо закрыть эту открывающуюся панель, т.к. нажатие esc могло предназначаться только ей,
            //но из-за того, что фокус на нее не успел перейти, нажатие на клавишу она отловить не смогла
            topFloatAreaInfo = FloatAreaManager._getTopFloatArea();
            topFloatArea = topFloatAreaInfo && topFloatAreaInfo.control;
            if (topFloatArea !== this && !!topFloatArea._state) {
               topFloatArea.sendCommand('hide')
            }
            else {
               this.sendCommand('hide');
            }
            return false;
         }
         return FloatArea.superclass._keyboardHover.apply(this, arguments);
      },
      /**
       * Колбек загрузки дочерних контролов. onBeforeShow и onAfterShow теперь в другом месте
       * @protected
       */
      _childrenLoadCallback: function () {},

      _toggleTrackTarget: forNonStackOnly(function(toggle) {
         var haveTarget = this._target && this._target.length,
            win = Env.constants.$win,
            untrack = function() {
               win.unbind('resize', this._windowResizeHandler);
               if (haveTarget) {
                  trackElement(this._target, false);
               }
            }.bind(this);

         if (!this._options.trackTarget) {
            return;
         }
         if (!this._windowResizeHandler) {
            this._windowResizeHandler = function() {
               this._recalcPosition(undefined, undefined, true);
            }.bind(this);
         }

         untrack();//перед подпиской надо отписаться, на всякий случай, чтобы несколько подписок подряд работали как одна
         if (toggle) {
            win.bind('resize', this._windowResizeHandler);
            if (!this._options.fixed && haveTarget) {
               trackElement(this._target)
                  .subscribe('onMove',
                     forAliveOnly(
                        function (event, offset, isInitial) {
                           if (this._options.closeOnTargetScroll && !isInitial) {
                              this.close();
                           }
                           else {
                              this._recalcPosition(offset, undefined, !isInitial);
                           }
                        },
                        this
                     )
                  ).
               subscribe('onVisible',
                  forAliveOnly(
                     function (event, visibility) {
                        var result = this._notify('onTargetVisibilityChange', visibility);
                     },
                     this
                  )
               );
            }
         }
      }),

      destroy: function(){
         this._cancelShow();
         this._cancelHide();

         this._toggleTrackTarget(false);

         WindowManager.releaseZIndex(this._zIndex);
         ModalOverlay.adjust();

         FloatAreaManager._removeArea(this);
         $('.ws-window-titlebar:first', this.getContainer().parent()).off('click', this._captionClickHandler);
         FloatArea.superclass.destroy.apply(this, arguments);
         this._visibleRootWrapper.remove();
         if(this._hoverTarget){
            this._hoverTarget.unbind('.wsFloatAreaHover');
         }

         //Дочерние панели и окна, для которых эта панель была не родителем, а opener-ом, тоже нужно прибить.
         //Сами они не убиваются, потому что эта панель у них не родитель, а opener.
         //Массив клонируем, потому что на закрытие панели панель удаляется из this._childWindows
         var childWindows = this._childWindows.map(function(child) {
            return child;
         });
         if (this._options.closeChildWindows) {
            childWindows.forEach(function(child) {
               if (!child.isDestroyed()) {
                  child.destroy();
               }
            });
         }
         if (!this._options.fixed) {
            this.setTarget(null);
         }

         for (var key in this._memoizedFuncs) {
            if (this._memoizedFuncs.hasOwnProperty(key)) {
               var fn = this._memoizedFuncs[key];
               if (fn && fn.reset) {
                  fn.reset();
               }
               delete this._memoizedFuncs[key];
            }
         }
         memoize.clear(this);

         var dummyJq = $();
         this._target = dummyJq;
         this._options.target = dummyJq;
         this._visibleRoot = dummyJq;
         this._visibleRootWrapper = dummyJq;
         this._overflow = dummyJq;
         this._containerShadow = dummyJq;
         this._generatedTitleContainer = dummyJq;
         this._hoverTarget = dummyJq;
         this._prevPositionOptions = null;
      },
      /**
       *
       * Признак будет ли скрыта панель при уходе с неё фокуса.
       * @return {Boolean} Возвращает, будет ли автоматически скрываться панель при уходе фокуса на несвязанную область.
       * Возможные значения:
       * <ol>
       *    <li>true - панель будет автоматически скрываться при уходе фокуса,</li>
       *    <li>false - не будет скрываться.</li>
       * </ol>
       * @see autoHide
       * @see autoCloseOnHide
       */
      isAutoHide: function(){
         return this._options.autoHide;
      },

      _updateMinMaxWidthHeight: forStackOnly(function(setMinHeight, setHeight) {
         var containerStyle,
            minWidth = this._options.minWidth,
            maxWidth = this._getMaxPanelWidth(),
            haveMaxWidth = this._options.maxWidth !== Infinity,
            containerMinHeight;

         if (this._options._isCompatibleArea && this._options.minimizedWidth && this._options.maximized === false) {
            minWidth = maxWidth = this._options.minimizedWidth;
         }

         if (this._maxWidthSet !== maxWidth) {
            containerStyle = this._container.prop('style');

            this._maxWidthSet = maxWidth;

            containerStyle.maxWidth = maxWidth + 'px';

            this._getFixedWidth.reset();

            if (this._hasMaximizeButton()){
               this._setMaximizeMode(this._options.maximized, true);
            }
            else if (haveMaxWidth) {
               containerStyle.width = Math.max(minWidth, Math.min(this._options.maxWidth, maxWidth)) + 'px';
            }
            else if (Env.constants.browser.isIE && minWidth > 0 && containerStyle.width === '' && getBody().hasClass('engine-OnlineBaseInnerMinCoreView')) {
               //В нормальных браузерах если не задано свойтсво width - ширина панели будет равна значению min-width, если дочерние компоненты не растягивают контейнер шире.
               //В IE вылезла бага - если дочерние узлы имеют display:flex, то ширина задается по свойству max-width. //Flex используется на minCore
               //Устанавливаю для IE поведения как и во всех браузерах
               containerStyle.width = minWidth + 'px';
            }
         }

         //см. комментарий на класс ws-float-area-no-height-calc
         if (this._needStackPanelHeightRecalc() && (setMinHeight || setHeight)) {
            containerStyle = containerStyle || this._container.prop('style');
            containerMinHeight = this._getContainerMinHeight() + 'px';
            if (setMinHeight) {
               containerStyle.minHeight = containerMinHeight;
            }
            if (setHeight) {
               containerStyle.height = containerMinHeight;
            }
         }
      }),

      _getMaxPanelWidth: function() {
         if (this._hasMaximizeButton()){
            return FloatAreaManager._getMaxWidthForAreaNew(this, this._options.minWidth, this._options.maxWidthWithoutSideBar);
         }
         return Math.max(this._options.minWidth, FloatAreaManager._getMaxWidthForArea(this, this._options.minWidth));
      },

      _needStackPanelHeightRecalc: function(){
         return this._needPanelHeightRecalc() && this._options.isStack;
      },

      _needPanelHeightRecalc: function() {
         return USE_STACK_PANEL_HEIGHT_RECALC && this.getContainer().closest('.ws-float-area__height-auto').length;
      },

      _postUpdateResizer: function() {},

      isBlockLayout: function () {
         return this._options.className.indexOf('ws-float-area__height-auto') === -1;
      },

      _updateVisibleRootRightPadding: forStackOnly(function() {
         var offset = FloatAreaManager._getPanelRootPaddingRight(this, !this.isBlockLayout());
         if (offset > 0) {
            this._visibleRoot.css('padding-right', offset);
            this._visibleRootWrapper.css('right', 0);
         } else {
            this._visibleRoot.css('padding-right', 0);
            this._visibleRootWrapper.css('right', offset);
         }
      }),

      _getContainerMinHeight: function() {
         var genTitle = this._generatedTitleContainer,
            generatedTitleHeight = genTitle.hasClass('ws-hidden') ? 0 : genTitle.outerHeight();

         return FloatAreaManager._getWindowHeight() - generatedTitleHeight;
      },

      _sizeUpdated: function(externalChange){
         var
            containerStyle = this._container.prop('style'),
            childMaxHeight = Object.keys(this._childPanelSizes).reduce(function(memo, key) {
               return Math.max(memo, this._childPanelSizes[key]);
            }.bind(this), 0),
            containerMinHeight;

         //см. комментарий у класса ws-float-area-no-height-calc
         if (this._needStackPanelHeightRecalc()) {
            containerMinHeight = Math.max(childMaxHeight, this._getContainerMinHeight());

            if (containerStyle.height !== 'auto') {
               containerStyle.height = 'auto';
            }

            if (containerStyle.minHeight) {
               containerStyle.minHeight = '';
            }

            if (this._container.height() <= containerMinHeight) {
               containerStyle.height = containerMinHeight + 'px';//100% ставить нельзя - IE8 хочет, чтобы было абсолютное значение, причём не всегда...
               this._getFixedHeight.reset();
            }
         } else {
            this._overflow.css('min-height', childMaxHeight + 'px');
         }
         this._updateMinMaxWidthHeight(true, false);

         if (externalChange) {
            this._updateVisibleRootRightPadding();
            this._onResizeHandler();
         }

         if (this.isVisible()) {
            FloatAreaManager._updateSideBarVisibility();
         }

         /* task: 1173330288
         im.dubrovin:  Для стековых панелей FloatAreaManager контролирует '-webkit-overflow-scrolling' т.к. там включаать инерционный скролл
         можно только у верхней флоат арии, для не тековых панелей следующий хак актуален */
         if(!this._options.isStack){
            //Хак для айпада (сафари) - почему-то без этого кода не работает прокрутка пальцем (св-во -webkit-overflow-scrolling: touch)
            //у некоторых плавающих панелей, причём на одном содержимом панели работает, а на другом - нет.
            //Вкючение-выключение св-ва webkit-overflow-scrolling (через класс ws-float-area-stack-scroll-wrapper-touch)
            //заставляет прокрутку работать
            if (BROWSER.isMobilePlatform && FloatAreaManager._useTouch() && window.requestAnimationFrame) {
               window.requestAnimationFrame(function(root) {
                  var
                     off = {'-webkit-overflow-scrolling': 'auto'},
                     on = {'-webkit-overflow-scrolling': ''};

                  root.css(off);
                  window.requestAnimationFrame(forAliveOnly(root.css.bind(root, on), this));
               }.bind(this, this._visibleRoot));
            }
         }
      },

      /**
       * Плавающие панели не обрабатывают изменение размеров окна браузера - его обрабатывает FloatAreaManager.
       */
      _subscribeToWindowResize: function() {
      },

      /**
       * Не нужно для всплывающей панели?
       * @private
       */
      _restoreSize: function() {
      },
      /**
       * Пересчитывает отсутпы для нормальных областей. Нам это не нужно
       * @private
       */
      _calculatePositionHorisontal: function(){
      },
      /**
       * Пересчитывает отсутпы для нормальных областей. Нам это не нужно
       * @private
       */
      _calculatePositionVertical: function(){
      },
      toggle: function(){
         if(this._state == 'show' || this._visible){
            this.hide();
         }
         else{
            this.show();
         }
      },
      /**
       *
       * Задать блок, у которого будет показана панель.
       * Актуально для НЕ стека панелей.
       * @param {jQuery} target jQuery-объект, у которого должна быть показана панель
       * @see getTarget
       * @see target
       * @see isStack
       */
      setTarget: forNonStackOnly(function(target){
         if (this._options.fixed) {
            throw new Error(rk('Опция fixed не совместима с заданием target-а - при fixed=true таргетом всегда будет window'));
         }

         this._toggleTrackTarget(false);

         if (this._scrollUnsub) {
            this._scrollUnsub();
         }
         if (target) {
            this._target = $(target);
            //Опция, которая отключает отслеживание прокрутки колесика мыши.
            if (!this._options._dontCheckScrollParent) {
               this._scrollUnsub = FloatAreaManager.scrollParentFloatArea(this._visibleRoot, this._target);
            }
         } else {
            this._target = $();
            this._scrollUnsub = null;
         }

         if (this.isVisible()) {
            this._toggleTrackTarget(true);
         }

         //Если новый target лежит не в блоке основного содержимого (_getFloatAreaContentRoot), то перетащим
         //панель в body, иначе перетащим её в контейнер содержимого.
         //Это нужно для того, чтобы панель, привязанная к элементу, лежащему в блоке основного содержимого,
         //анимировалась вместе с этим блоком.
         var contentRoot = FloatAreaManager._getFloatAreaContentRoot(),
            wrapper = this._visibleRootWrapper;
         if (
            //task: 1173357457
         //im.dubrovin: моедальные окна не должны находится лежать в скролл контейнере, т.к. это приводит к прокрутке содержимого под модальностью
         !this._isModal &&

         this._target.closest(contentRoot).length) {
            if (!wrapper.closest(contentRoot).length) {
               if (this._options.task1173269044) {
                  contentRoot = FloatAreaManager._getFloatAreaBodyContainerRoot()
               }
               wrapper.appendTo(contentRoot);
            }
         } else {
            if (wrapper.closest(contentRoot).length) {
               wrapper.appendTo(getBody());
            }
         }
      }),
      /**
       *
       * Установить отступ от блока, у которого должна быть показана панель.
       * Положительные значения y смещают панель вниз, отрицательные - вверх.
       * Положительные значения x смещают панель вправо, отрицательные - влево.
       * Отступ не зависит от направления показа панели или чего-либо ещё.
       * @param {Object} offset Отступ в формате: {x: Number, y: Number}.
       * @example
       * Перед началом анимации открытия панели проверяем отступы - не превышают ли они размеры текущего документа.
       * <pre>
       *     onBeforeShow: function() {
       *        var offSet = this.getOffset();
       *        if (offset.x > $(document).width()) {
       *           offSet.x=0;
       *        }
       *        if (offSet.y > $(document).height()) {
       *           offSet.y=0;
       *        }
       *        //устанавливаем отступы после проверки
       *        this.setOffset(offSet);
       *     }
       * </pre>
       * @see offset
       * @see getOffset
       * @see target
       * @see setTarget
       * @see getTarget
       */
      setOffset: function(offset){
         this._options.offset = offset;
         this._recalcPosition(null, true); //forceVisible = true, т.к. setOffset могут позвать из обработчика на onBeforeShow
      },
      /**
       *
       * Получить текущий блок, у которого показывается панель.
       * Привязать панель можно только к контролу. Например, нельзя вызвать всплывающую панель с текста.
       * @return {jQuery} Блок, у которого показывается панель.
       * @see setTarget
       * @see target
       */
      getTarget: function(){
         return this._target;
      },
      /**
       *
       * Получить отступы панели.
       * Отступ не зависит от направления показа панели или чего-либо ещё.
       * @return {Object} Возвращает объект с отступами панели: {x: Number, y: Number}.
       * @example
       * Перед началом анимации открытия панели проверяем отступы - не превышают ли они размеры текущего документа.
       * <pre>
       *     onBeforeShow: function() {
       *        //получаем текущие отступы
       *        var offSet = this.getOffset();
       *        if (offset.x > $(document).width()) {
       *           offSet.x=0;
       *        }
       *        if (offSet.y > $(document).height()) {
       *           offSet.y=0;
       *        }
       *        this.setOffset(offSet);
       *     }
       * </pre>
       * @see offset
       * @see setOffset
       */
      getOffset: function(){
         return  coreClone(this._options.offset);
      },
      /**
       *
       * Сохранить информацию о контроле.
       * О том, что это дочерний контрол, был активен только у себя, чтобы родительские области
       * пытались закрыть панель при возвращении фокуса на родительскую панель.
       * @param {Lib/Control/Control} child Дочерний контрол.
       */
      storeActiveChild: function(child){
         this.setChildActive(child);
      },
      /**
       *
       * Получить имя шаблона, установленного в область.
       * @return {String} Имя установленного в данную область шаблона.
       */
      getTemplateName: function(){
         return this._options.template;
      },
      /**
       *
       * Заставляет панель быть показанной, несмотря на уведение мыши.
       * Считает количество вызовов, т.е. если вызвать lockShowed два раза, то потребуется вызвать {@link unlockShowed} точно также два раза.
       * Актуально для {@link hoverTarget}.
       * @see unlockShowed
       * @see isLockShowed
       * @see hoverTarget
       */
      lockShowed: function(){
         ++this._locksShowed;
      },
      /**
       *
       * "Отвязывает" панель, позволяя ей закрываться, если на ней нет мыши.
       * Актуально при использовании {@link hoverTarget}.
       * @see lockShowed
       * @see isLockShowed
       * @see hoverTarget
       */
      unlockShowed: function(){
         if(--this._locksShowed === 0 && this._hoverTimer){
            this._startHoverTimer();
         }
      },
      /**
       *
       * Привязан ли показ панели
       * @param {Boolean} [forceUnlock=false]
       * @param {Array} [childAreas] Массив панелей, которые нужно будет скрыть.
       * @returns {Boolean}
       * @see lockShowed
       * @see unlockShowed
       */
      isLockShowed: function(forceUnlock, childAreas) {
         childAreas  = childAreas  || [];
         forceUnlock = forceUnlock || false;

         var ffAreasIndex = [],
            i, l, child;
         // Если счетчик не нулевой значит он изменен публичными методами - есть блокировка
         if (this._locksShowed > 0) {
            // если окна все скрыты - считаем что блокирующих нет
            return true;
         } else {
            // Если счетчик нулевой, проверим связанные окна
            for (i = 0, l = this._childWindows.length; i < l; i++) {
               child = this._childWindows[i];
               if ( cInstance.instanceOfModule(child, 'Deprecated/Controls/FilterFloatArea/FilterFloatArea')) {
                  ffAreasIndex.push(i);
                  continue;
               }
               // проверим что среди них есть хотябы одно видимое
               if (child.isVisible() || (child instanceof FloatArea && child.isOpened())) {
                  if(!forceUnlock) {
                     return true;
                  }
                  childAreas.push(this._childWindows[i]);
               }
            }
            //Если есть открытые filterFloatAreas, то закроем сначала их
            if (ffAreasIndex.length) {
               for (i = 0, l = ffAreasIndex.length; i < l; i++) {
                  this._childWindows[ffAreasIndex[i]].hide();
               }
            }
            // если видимых нет
            return false;
         }
      },
      /**
       *
       * Задать элемент, при наведении на который будет показана панель.
       * @param {jQuery|undefined} target Элемент
       * @param {Boolean} [stop] Нужно ли останавливать таймер, по окончании которого панель закроется.
       * @see getHoverTarget
       */
      setHoverTarget: function(target, stop){
         if(this._hoverTarget){
            this._hoverTarget.unbind('.wsFloatAreaHover');
         }
         this._options.hoverTarget = target;
         this._hoverTarget = $(this._options.hoverTarget).length ? $(this._options.hoverTarget) : undefined;
         if(this._hoverTarget){
            this._bindHoverEvents();
            this._subscribeToMouseEvents();
            this.once('onAfterShow', forAliveOnly(function() {
               //Может быть ситуация, когда физически таргет находится не в ховере (например над ним висит overlay)
               //Если в этом случае не нужно закрывать панели, то таргет должен эмулировать ховер с помощью аттрибута data-mouse-hover
               if (!this._hoverTarget.is(':hover') && !this.getContainer().is(':hover') && !this._hoverTarget.attr('data-mouse-hover')) {
                  this._startHoverTimer();
               }
            }, this));
         }
         if(stop){
            this._stopTimer('_hoverTimer');
         }
      },
      /**
       *
       * Получить элемент, при наведении на который будет показана панель.
       * @returns {jQuery|undefined} Элемент, при наведении на который будет показана панель
       * @see setHoverTarget
       */
      getHoverTarget: function(){
         return this._hoverTarget;
      },
      //TODO: убрать, когда у всплывающих панелей не будет родительских контролов
      focusCatch: function(event){
         WindowManager.disableLastActiveControl();
         if(event.shiftKey){
            WindowManager.focusToFirstElement();
         }
         else{
            WindowManager.focusToLastElement();
         }
         return true;
      },
      /**
       *
       * Установить скрывать ли аккордеон (боковую панель).
       * Актуально в случае стека панелей, опция {@link isStack} установлена в true.
       * Работает только при вызове первой панели. Т.е. если аккордеон скрыли, то при открытии следующих панелей его уже
       * нельзя вернуть.
       * Возможные значения:
       * <ol>
       *    <li>true - скрывать (по умолчанию),</li>
       *    <li>false - не скрывать аккордеон.</li>
       * </ol>
       * @param {Boolean} hideSideBar Скрыть ли аккордеон.
       * @see hideSideBar
       * @see isStack
       */
      setHideSideBar: function(hideSideBar) {
         this._options.hideSideBar = hideSideBar;
      },
      _templateOptionsFilter: function(){
         var s = FloatArea.superclass._templateOptionsFilter.apply(this, arguments);
         return s.concat('border', 'caption');
      },

      // на iPad при появлении всплывахи над FloatArea при проведении пальцем над всплывахой - скроллится FloatArea (бажное поведение iPad с инетным скроллом)
      // приходится отключать инертный скролл в момент показа всплывахи и включать обратно при скрытии
      setHasPopupInside: function(hasPopupInside){
         if (this._options.isStack && Env.detection.isMobileIOS){
            FloatAreaManager._toggleHasPopupInside(this.getId() , hasPopupInside);
            //this._visibleRoot.toggleClass('ws-ios-overflow-scrolling-auto', hasPopupInside);
         }
      }
   });

   return FloatArea;
});
