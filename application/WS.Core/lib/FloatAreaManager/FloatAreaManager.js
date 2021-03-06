/* Ответственный за модуль: Дубровин Игорь Михайлович */

/** Класс по работе со всплывающими панелями, имеющими флаг isStack. Организует их взаимное расположение, размеры, взаимодействие
 * @author NefedovAO
 */
define('Lib/FloatAreaManager/FloatAreaManager', [
   'Env/Env',
   "Core/Deferred",
   "Core/WindowManager",
   'Env/Event',
   'Core/helpers/Function/shallowClone',
   "Core/core-instance",
   "Lib/LayoutManager/LayoutManager",
   'Core/helpers/Object/find',
   'Core/helpers/Array/findIndex',
   'Core/helpers/Function/memoize',
   'Core/helpers/Hcontrol/getScrollWidth',
   'Core/dom/wheel',
   "Core/Abstract",
   "css!Lib/FloatAreaManager/FloatAreaManager"
],
   function(Env, Deferred, WindowManager, EnvEvent, shallowClone, cInstance, LayoutManager, objectFind, arrayFindIndex, memoize, getScrollWidth, wheel) {
   'use strict';
   //TODO Надо починить анимацию в IE9. Причина неработоспособности - переход на jQuery Position
   var CFloatArea = 'Lib/Control/FloatArea/FloatArea',
       USE_ANIMATION = Env.constants.browser.chrome && !Env.constants.browser.isMobilePlatform,
       MINIMUM_DISTANCE_MULTIPLIER = 0.05,
       MINIMAL_PANEL_DISTANCE      = 50,
       MINIMAL_PANEL_WIDTH         = 50,
       MINIMAL_PANEL_DISTANCE2     = 10,
       MIN_CONTENT_WIDTH           = 1000,
       ANIMATION_MAX_WAIT = 700,
       USE_CSS3 = USE_ANIMATION &&
                  !Env.constants.browser.isMobileSafari && //на айпаде анимация через css3 при выдвижении панели глючит (сначала реестр выезжает, потом панель, а надо одновременно),
                                                        // хотя в конечную точку приходит правильно.
                                                        //выключаем до лучших времён - когда дойдут руки отладить эту анимацию на айпаде.
                  Env.constants.compatibility.cssTransform && Env.constants.compatibility.cssAnimations;

   function BODY() {
      return typeof window !== 'undefined' && (BODY.value || (BODY.value = $('body')));
   }

   function MINWIDTH() {
      return typeof window !== 'undefined' && (MINWIDTH.value || (MINWIDTH.value = $('#min-width')));
   }

   /**
    * Возвращает значение, которое не меньше минимума и не больше максимума (мин < макс, иначе возьмёт макс)
    * @param {Number} value Значение
    * @param {Number} min Минимум
    * @param {Number} max Максимум
    * @returns {Number}
    */
   function clamp(value, min, max) {
      if (value < min) {
         value = min;
      }
      if (value > max) {
         value = max;
      }
      return value;
   }

   /**
    * Информация о панели
    */
   var AreaInfo = function() {
      this.size = {
         width: 0,
         height: 0
      };
   };

   AreaInfo.prototype = {
      control: undefined,          //Сам контрол
      right: 0,                  //Правая координата
      methods: undefined,        //Объект с дополнительными методами от всплывающей панели (недоступны снаружи класса)
      hideSideBar: true,        //Нужно ли скрывать боковую панель при открытии данной панели
      id: '',                    //Идентификатор панели. "content" в случае главной панели
      scrollTop: 0,              //Вертикальный скролл самой панели
      preparedToShow: false
   };

   AreaInfo.prototype.width = function() {
      return this.control._containerShadow.width();
   };

   /**
    * @author Бегунов А.В.
    * @class Lib/FloatAreaManager/FloatAreaManager
    * @public
    * @deprecated
    * @singleton
    */
   var FloatAreaManager = /** @lends Lib/FloatAreaManager/FloatAreaManager.prototype*/{
      /**
       * Объект со всеми простыми панелями
       */
      _areas: {},
      /**
       * Объект вида "идентификатор панели" => "информация о панели"
       */
      _areaInfos: {},
      /**
       * jQuery-объект, в котором содержится основное содержимое страницы
       */
      _$content: undefined,
      _contentIsBody: true,
      /**
       * Родительский элемент содержимого
       */
      _$contentParent: undefined,
      /**
       * Боковая панель
       */
      _$sideBar: undefined,
      /**
       * Видна ли боковая панель
       */
      _sideBarVisible: true,
      /**
       * Ширина боковой панели. Если её нет, возвращает 0
       */
      _sideBarWidth: 0,
      /**
       * Стек из AreaInfo - открытые панели
       */
      _stack: [],

      /*
          Флоат ария с максимальным z-index
      */
      _topFloatArea: null,

      /***
       * Коллекция максимизированных окошек. Они тут тоже нужны, поскольку для них мы выключаем прокрутку у body, так же, как и для
       * стековых панелей.
       */
      _maximizedWindows: [],

      /* task: 1173330288
      im.dubrovin: По ошибке необходимо отключать на мобильных устройствах -webkit-overflow-scrolling: touch ,
      у контейнеров которые не лежат в самой верхней открытой floatArea, для этого тут их можно сохнанять в виде controlId : jqueryBlock
      им будет добавляться/удаляться класс 'ws-ios-overflow-scrolling-auto' */
      _scrollableContainers: {},

      /**
       * Контейнер, в котором будут лежать все панели
       */
      _$floatAreaContainer: undefined,
      /**
       * Ширина контейнера со всплывающими панелями
       */
      _floatAreaContainerWidth: 0,
      /**
       * Флаг того, что в данный момент ставится размер панели данным контролом
       */
      _settingAreaSize: false,
      /**
       * Правая тень. Передвигаем её, чтобы была корректная высота блока и она не анимировалась
       */
      _$rightShadow: undefined,

      /**
       * Максимальная ширина блока с панелями
       * Если мы на обычном сайте - MAX_CONTENT_WIDTH
       * Иначе не ограничено
       */
      _maxContentWidth: 0,

      _hasAnyFloatArea: false,

      _animationLength: 0,
      _panelHideAnimationDelay: 0,
      _minContentWidth: MIN_CONTENT_WIDTH,
      _animationQueue: undefined,
      _transitionEndHandler: undefined,

      _prevBodyMargin: undefined,
      _isCalculatingVariables: false, //Флаг: высчитали ли уже актуальные переменные
      /**
       * Корневой блок, в котором лежит содержимое страницы.
       * Поверх этого содержимого будет показываться стек плавающих панелей.
       * Этот блок должен быть помечен в html-шаблоне страницы классом ws-float-area-stack-root, и лежать в блоке,
       * растянутом на 100% высоты экрана, чтобы была возможной его прокрутка при показанном стеке панелей.
       * @returns {jQuery}
       * @private
       */
      _getFloatAreaContentRoot: function() {
         var root = $('.ws-float-area-stack-root:first');
         if (root.length === 0) {
            root = $('body');
         }
         return root;
      },
      _getFloatAreaBodyContainerRoot: memoize(function() {
         var blackbox = $('.vdom-black-box');
         if (!blackbox.length) {
            if ($('.ws-focus-in').length){
               return $('<div class="ws-float-area-body-container-root"></div>').insertAfter('.ws-focus-in');
            } else {
               return $('<div class="ws-float-area-body-container-root"></div>').prependTo('body');
            }
         } else {
            return $('<div class="ws-float-area-body-container-root"></div>').appendTo('.vdom-black-box');
         }
      }, '_getFloatAreaBodyContainerRoot'),

      _bodyCanScroll: function() {
         return this._bodyScrollWidth() !== 0;
      },

      _bodyScrollWidth: memoize(function() {
         var overflowY = BODY().css('overflow-y');
         return (overflowY !== 'hidden' && overflowY !== 'visible') ? getScrollWidth() : 0;
      }, '_bodyScrollWidth'),

      //ХАК: Исправляем глюк фаерфокса с событием transitionend: оно может не срабатывать почему-то, хотя анимация как бы кончилась.
      //Опрашиваем свойство по таймауту, и сигналим событие вручную.
      _fixCss3TransitionEndEvent: function (element, prop, endValue, animLength) {
         function propOk(curVal) {
            var curValS = '' + curVal,
                endValS = '' + endValue;

            //Проблема в том, что если запускается построение 2х панелей, то анимация для какой-либо из них прерывается(зависит от порядка открытия)
            //Этот метод "вручную" проверяет, завершилась ли анимация и нотифаит событие до узла
            //$element.css('transform') возвращает matrix(...), хотя засетили в свойство translateX(0px). Подвожу это условие под существующую логику
            if (curValS === 'matrix(1, 0, 0, 1, 0, 0)') {
               curValS = 'translateX(0px)';
            }
            return (curValS === endValS) ||
                   (curValS === '0'   && endValS === '0px') ||
                   (curValS === '0px' && endValS === '0');
         }

         var maxWait = Math.max(animLength * 3, ANIMATION_MAX_WAIT);

         setTimeout(function() {
            var $element = $(element),
               startTime = +(new Date()),
               intervalId;

            if (propOk($element.css(prop))) {
               $element.trigger('transitionend');
            } else {
               intervalId = setInterval(function() {
                  if (propOk($element.css(prop))) {
                     clearInterval(intervalId);
                     $element.trigger('transitionend');
                  } else {
                     var time = +(new Date());
                     if (time - startTime > maxWait) {
                        clearInterval(intervalId);
                     }
                  }
               }, 50);
            }
         }, animLength);
      },

      _addToAnimationQueue: function(dfr, queue) {
         return queue.addBoth(function(res) {
            var timeout = Deferred.fromTimer(ANIMATION_MAX_WAIT);
            return Deferred.nearestOf([dfr, timeout]);
         });
      },

      /**
       *
       * Инициализирует важные штуки
       */
      _init: function() {
         this._calcVariables();
         $(window).bind('resize.wsFloatAreaManager', this._resize.bind(this));
         WindowManager.subscribe('onAreaFocus', this._focusMoved.bind(this));
         EnvEvent.Bus.channel('navigation').subscribe('onAccTransform', this._onAccTransform.bind(this));
      },

      _calcVariables: function() {
         if (!this._isCalculatingVariables) {
            this._animationQueue = Deferred.success(undefined);

            if (this._$content) {
               this._$content.unbind('transitionend');
            }
            this._$content = this._getFloatAreaContentRoot();
            this._$vdomContent = $('.controls-Popup__stack-target-container');
            this._$content.bind('transitionend', function() {
               if (this._transitionEndHandler) {
                  var handler = this._transitionEndHandler;
                  this._transitionEndHandler = undefined;
                  handler.call(this);
               }
            }.bind(this));

            // Вычисляем реальную максимально возможную ширину контента
            this._maxContentWidth = this._$content.parents().toArray().reduce(function(maxWidth, element){
               // Значение может быть указано в процентах. Ищем только явное значение
               var maxW = $(element).css('max-width');
               var elemMaxWidth;
               if (maxW.indexOf('%') === -1) {
                  elemMaxWidth = parseInt(maxW, 10);
               }
               if (!isNaN(elemMaxWidth) && elemMaxWidth > 0) {
                  if (elemMaxWidth < maxWidth) {
                     maxWidth = elemMaxWidth;
                  }
               }
               return maxWidth;
            }, parseInt(this._$content.css('max-width'), 10) || Infinity);

            // Если явного значения не нашли - максимальную ширину выставляем по экрану
            if (this._maxContentWidth === Infinity) {
               this._maxContentWidth = document.body.clientWidth;
            }
            //если $content - это body, то _$contentParent - тоже body, потому что иначе это будет документ, а с ним нельзя работать
            // как с обычным dom-элементом (классы задавать и т.п.)
            this._contentIsBody = this._$content.is('body');
            this._isNewPageTemplate = $('body').hasClass('ws-new-page-template');
            this._$contentParent = this._contentIsBody || this._isNewPageTemplate ? this._$content : this._$content.parent();
            this._$sideBar = $('.ws-float-area-stack-sidebar, .navSidebar__sideLeft, .online-Sidebar');
            this._sideBarWidth = this._$sideBar.width() || 0;
            this._$rightShadow = $('.ws-float-area-stack-right-shadow');
         }
      },
      _onAccTransform: function () {
         var sb = this._$sideBar.width() || 0;
         if (sb > 0) {
         // не сохраняем 0 ширину, иначе _canHideSidebar вернет false, из-за чего перестанет работать _updateSideBarVisibility
         // TODO завести состояние можно или нет скрывать sideBar и в _canHideSidebar проверять это состояние, а не ширину.
            this._sideBarWidth = sb;
            this._calcSizeParams.reset();
         }
      },

      /**
       * Если у элемента нет скролла, то прокручивает скролл на стековой панели (если целевым является элемент, лежащий в стековой панели).
       * Если же скролл есть, то элемент прокручивается по событию прокрутки колеса мыши.
       * @param element Прокручиваемый элемент
       * @param attachTarget Элемент, к которому "привязан" element
       * (см. документацию по функции {@link helpers.trackElement}, или опции target у {@link CFloatArea}
       * @returns {Function} Функция, отписывающая от события прокрутки колеса над элементом
       * Если подписки не произошло, возвращается null
       */
      scrollParentFloatArea: function(element, attachTarget) {
         // проверяет, можно ли прокрутить скролл на элементе
         function checkScrollable(element, deltaY) {
            return element.scrollHeight > element.offsetHeight &&
               /auto|scroll/.test($(element).css('overflow-y')) &&
               (deltaY < 0 && element.scrollTop !== 0 ||
               deltaY > 0 && element.scrollTop !== element.scrollHeight - element.clientHeight);
         }
         function hasScrollable(target, deltaY) {
            // проверка есть ли у самого таргета скролл, который можно прокрутить
            if (checkScrollable(target, deltaY)) {
               return true;
            }

            // проверка есть ли предков таргета скролл, который можно прокрутить
            return target.parents().filter(function() {
               return !!checkScrollable(this, deltaY);
            }).length;
         }
         function wheelCallback(event) {
            var target = $(event.target, document),
               deltaY = -event.wheelDelta;

            if (!hasScrollable(target, deltaY)) {
               event.stopPropagation();
               event.preventDefault();
               var sw = $(scrollWrapper);
               sw.scrollTop(sw.scrollTop() + deltaY);
            }
         }

         if (!element || !attachTarget) {
            return null;
         }

         var scrollWrapper = attachTarget.parents().filter(function() {
            return $(this).is('.ws-float-area-stack-scroll-wrapper');
         });

         if (!scrollWrapper.length) {
            return null;
         }

         wheel($(element), wheelCallback);

         return function() {
            var wheelEvent = Env.constants.compatibility.wheel;
            $(element).unbind(wheelEvent, wheelCallback);
         }
      },

      _getPanelHideAnimationDelay: function() {
         return this._stack.length === 1 ? this._panelHideAnimationDelay : 0;
      },

      _useAnimation: function () {
           return USE_ANIMATION;
       },

      _useCss3: function () {
          return USE_CSS3;
      },

      /**
       * Подгоняет плавающие панели, привязанные к своим блокам, после прокрутки родительских стековых панелей или области основного содержимого,
       * в режиме выдвинутых стековых панелей.
       * @private
       */
      _updateAreaPositions: function() {
         for (var key in this._areas) {
            if (this._areas.hasOwnProperty(key)) {
               var
                  area = this._areas[key];
               if (area.isVisible() && !area._options.isStack) {
                  area._recalcPosition();
               }
            }
         }
      },

      _resetWindowSizes: function() {
         this._getWindowHeight.reset();
         this._calcSizeParams.reset();
      },
      /**
       * Обработчик изменения размеров окна
       * @private
       */
      _resize: function() {
         var width = this._$sideBar.width() || 0;
         //скрытый аккордеон не должен влиять на _updateSideBarVisibility,
         //а то будет бесконечный цикл: скрыли аккордеон - места стало больше - показали его опять,
         //места стало меньше - опять скрыли - и т.п.
         if (width !== 0) {
            this._sideBarWidth = width;
         }

         this._recalculateShadow();

         var resize = function() {
            this._resetWindowSizes();

            //Ресайзить нужно все панели. Внутри нестековой может находиться popup, который должен устанавливать свои размеры в зависимости от размеров окна браузера
            for (var key in this._areas){
               if (this._areas.hasOwnProperty(key)){
                  this._areas[key]._sizeUpdated(true);
               }
            }
            this._updateSideBarVisibility();

         }.bind(this);
         this._resetEmptyPaddingState();

         //TODO: странное поведение с получением $(window).height() при ужатии окна. появляется как-бы гориз. скролл, после первой корректировки
         // (первого resize) он пропадает, и во втором resize уже идёт правильный $(window).height(), без гориз. скролла.
         resize();
         resize();
      },

      _getWindowHeight: memoize(function() {
         return Env.constants.$win.height();
      }, '_getWindowHeight'),
       /**
        * Метод задания минимальной ширины содержимого страницы.
        * @remark
        * По умолчанию стоит значение 1000px. При ширине экрана меньшего размера появится горизонтальный скролл.
        * Если содержимое страницы позволяет задать меньшую ширину, то для избавления от скролла можно установить
        * данным методом значение меньше 1000px.
        * @param minWidth Минимальная ширина.
        */
      setContentMinWidth: function(minWidth) {
         // TODO 16 - magic number? Отступы от контента справа и слева
         this._minContentWidth = (minWidth + this._sideBarWidth + 16) || MIN_CONTENT_WIDTH;
         MINWIDTH().css('min-width', this._minContentWidth);
         this._resize();
      },

      _getPanelRootPaddingRight: function(area, withScroll) {
         if (this._$vdomContent.length) {
            //Сайт теперь может отобрааться по центру, одной ширины контентной области недостаточно для расчетов
            return window.innerWidth - this._$vdomContent[0].getBoundingClientRect().right;
         }

         area._updateMinMaxWidthHeight(); // для того, чтобы панель установила себе размеры
         var
            bodyRight = BODY().get(0).getBoundingClientRect().right,
            contentParent = this._$contentParent.get(0),
            needBodyRight = this._needBodyRight(area) || !contentParent,
            //округляем, т.к. иногда получается дробное число, из-за этого в хроме иконки шрифтами рендерятся со смещением (прыгают)
            contentParentRight = Math.ceil(needBodyRight ? bodyRight : contentParent.getBoundingClientRect().right),
            scrollDiff = withScroll ? this._bodyCanScroll() || getScrollWidth() : 0,
            rightPadding = Math.max(0, bodyRight - contentParentRight - scrollDiff),
            areaWidth = parseInt(area._container.prop('style').width, 10),
            isEmptyPadding = this._hasAreaWithEmptyPadding() || (document.body.clientWidth < areaWidth + rightPadding);

         //Если панель не влезает по горизонтали в экран, то позиционируем ее по правому краю окна браузера
         //В этом случае все последующие панели должны открываться от правого края
         
         var info = this._areaInfos[area.getId()];
         // бывают случаи, что сюда попадаем до того, как информация попала в this._areaInfos
         // например люди зовут #win.resize в beforeShow и срабатывает обработчик события ресайза.
         // Для таких случае проверим наличие информации, чтоб не возникало ошибок в консоли
         if (info) {
            info.isEmptyPadding = isEmptyPadding;
         }

         return isEmptyPadding ? 0 : rightPadding;
      },

      _hasAreaWithEmptyPadding: function() {
         var hasEmptyPaddingArea = false;
         var areas = this._areaInfos;
         Object.keys(areas).forEach(function(areaId) {
            if (areas[areaId].isEmptyPadding) {
               hasEmptyPaddingArea = true;
            }
         });
         return hasEmptyPaddingArea;
      },

      _resetEmptyPaddingState: function() {
         var areas = this._areaInfos;
         Object.keys(areas).forEach(function(areaId) {
            areas[areaId].isEmptyPadding = false;
         });
      },

      _calcSizeParams: memoize(function() {
         var winWidth = Env.constants.$win.width() - getScrollWidth(),
             contentWidth = clamp(winWidth, this._minContentWidth, this._maxContentWidth),
             minimumPanelDistance = Math.floor(contentWidth * MINIMUM_DISTANCE_MULTIPLIER + this._sideBarWidth);

         return {
            contentWidth: contentWidth,
            minimumPanelDistance: minimumPanelDistance,
            minimumPanelDistanceNoAcc: Math.floor(contentWidth * MINIMUM_DISTANCE_MULTIPLIER)
         };
      }, '_calcSizeParams'),

      _canHideSidebar: function() {
         //если блок осн. содержимого - это body, то не сдвигаем его, а то и панели съедут
         return this._sideBarWidth > 0;
      },
      /**
       * Обновляет видимость боковой панели
       * @private
       */
      _updateSideBarVisibility: function() {
         var
            widthParams, maxWidth, isVisible, sideBarWidth, animationFunc, delay;

         function notifyNavigation(sideBarVisible) {
            return EnvEvent.Bus.channel('navigation').notify('accordeonVisibilityStateChange', sideBarVisible);
         }

         if (this._canHideSidebar()) {
            widthParams = this._calcSizeParams();
            maxWidth = this._stack.reduce(function(max, info) {
               return Math.max(max, info.width());
            }, 0);
            isVisible = widthParams.contentWidth - maxWidth >= widthParams.minimumPanelDistance;

            if (isVisible !== this._sideBarVisible) {
               this._sideBarVisible = isVisible;
               notifyNavigation(this._sideBarVisible);

               //todo: придрот при показе/скрытии аккордеона
               //Открывается floatArea, в ней лежит tabControl, при переключении вкладки загружается темплейт
               //После загрузки темплейта какой-то магией BatchUpdater'a и AreaAbstract запускается ресайз реестра
               //Размеры расчитываются без ширины аккордеона(что и логично, если он скрыт). При закрытии панели появляется аккордеон, но никто пересчет размеров не вызывает
               //Делаю пересчет размеров реестра при показе аккордеона вручную
               $(window).trigger('resize');
            }
         }
      },

      _getMaxWidthForAreaNew: function(area, minWidth, withoutSideBar) {
         var options = area._options,
            newWidth = Math.min(this._getMaxPanelWidth(withoutSideBar), options.maxWidth);
         if (newWidth < minWidth){
            return minWidth;
         }
         else if (newWidth < MINIMAL_PANEL_WIDTH){
            return MINIMAL_PANEL_WIDTH;
         }
         return newWidth;
      },

      _getMaxPanelWidth: function(withoutSideBar) {
         var widthParams = this._calcSizeParams();
         return widthParams.contentWidth - (withoutSideBar ? widthParams.minimumPanelDistanceNoAcc : widthParams.minimumPanelDistance);
      },

      _getMaxWidthForArea: function(area, minWidth) {
         var
            widthParams = this._calcSizeParams(),
            areaIdx = arrayFindIndex(this._stack, function(info) {
               return info.control === area;
            }),
            prevAreaIdx = areaIdx !== -1 ? areaIdx - 1 : this._stack.length - 1,
            prevWidth = prevAreaIdx !== -1 ? this._stack[prevAreaIdx].width() : widthParams.contentWidth,
            options = area._options,
            panelOffset, result;

         switch (prevAreaIdx) {
            case -1: panelOffset = widthParams.minimumPanelDistance; break;
            case 0: panelOffset = MINIMAL_PANEL_DISTANCE; break;
            default: panelOffset = MINIMAL_PANEL_DISTANCE2;
         }

         if (options.autoWidth || options.maxWidth !== Infinity) {
            result = Math.max(prevWidth - panelOffset, MINIMAL_PANEL_WIDTH);
            if (prevAreaIdx === -1 && result < minWidth) {
               result = Math.max(prevWidth - widthParams.minimumPanelDistanceNoAcc, MINIMAL_PANEL_WIDTH);
            }
         } else {
            // autoWidth отключен, maxWidth бесконечен. Ограничиваем максимальную ширину панели.
            // Ширина панели не может быть меньше MIN_CONTENT_WIDTH * (1 - MINIMUM_DISTANCE_MULTIPLIER)
            result = Math.max(widthParams.contentWidth - widthParams.minimumPanelDistanceNoAcc, MINIMAL_PANEL_WIDTH);
         }

         return result;
      },

      /**
       * Скрывает панели, которые должны быть скрыты из-за того, что фокус перешёл
       * @param {CFloatArea} area Панель, которую нужно закрыть
       * @param {Object} hiddenAreas Объект с идентификаторами панелей, которые нужно закрыть
       * @private
       */
      _hideAreaWithParents: function(area, hiddenAreas) {
         var opener;

         // Скрываем панель только в том случае, если она польностью видна (т.е. не находится в состоянии анимации)
         if (!area.isDestroyed() && area.isVisible()) {
            area.hide(true);
            opener = area.getOpener();
            if (opener) {
               opener = opener.getParentByClass(CFloatArea);
            } else {
               opener = area.getParentByClass(CFloatArea);
            }
            if (opener && opener.isVisible() && opener.isAutoHide() && !opener.isLockShowed() && opener.getId() in hiddenAreas) {
               this._hideAreaWithParents(opener, hiddenAreas);
            }
         }
      },
      /**
       * Скрывает области, которые должны закрыться после перехода фокуса
       * @param {Lib/Control/AreaAbstract/AreaAbstract} area Область, на которую перешёл фокус
       * @private
       */
      _hideUnnecessaryAreas: function(area) {
         var hiddenAreas = {},
             areas = shallowClone(this._areas);
         for (var key in areas) {
            if (areas.hasOwnProperty(key)) {
               var
                  panel = areas[key];
               if (panel && area !== panel && panel.isVisible() && panel.isAutoHide() && panel._shouldHideByFocusMoveTo(area)) {
                  hiddenAreas[panel.getId()] = true;
               }
            }
         }
         this._hideAreas(areas, hiddenAreas);
      },
      _hideDependentAreas: function (area) {
         var hiddenAreas = {},
            areas = shallowClone(this._areas);

         for (var key in areas) {
            if (areas.hasOwnProperty(key)) {
               var
                  panel = areas[key];
               if (panel && panel.getOpener() && panel.getOpener() === area) {
                  hiddenAreas[panel.getId()] = true;
               }
            }
         }
         this._hideAreas(areas, hiddenAreas);
      },
      _hideAreas: function (areas, hiddenAreas) {
         var self = this;
         for (var areaId in hiddenAreas) {
            if (hiddenAreas.hasOwnProperty(areaId)) {
               self._hideAreaWithParents(areas[areaId], hiddenAreas);
            }
         }
      },
      /**
       * Обрабатывает переход фокуса в другую область
       * @param {Env/Event:Object} event Событие
       * @param {Lib/Control/AreaAbstract/AreaAbstract} area Область, в которую перешёл фокус
       * @private
       */
      _focusMoved: function(event, area) {
         if (this._needHideAreas(area)) {
            this._hideUnnecessaryAreas(area);
         }
         this._prevArea = area;
      },

      _needHideAreas: function(area) {
         // надо вызывать _hideUnnecessaryAreas только если уходим с FloatArea.
         // Событие onAreaFocus может быть вызвано несколько раз за пределами FloatArea во время попытки ее закрытия.
         // Если обработается более одного события, закрытие панели нельзя будет отменить в onBeforeClose
         // https://inside.tensor.ru/opendoc.html?guid=9c3ad3ca-5a75-4f93-95d1-e19665acbf4a&des=
         if (!this._prevArea) {
            return false;
         }

         var isFloatArea = cInstance.instanceOfModule(this._prevArea, CFloatArea) || this._prevArea.getParentByClass(CFloatArea);
         var isTargetOnFloatArea;
         var isIgnored;
         if (this._prevArea.getContainer) {
            //У некоторых компонентов, к примеру редактирования по месту, не задан парент. Для определения того, лежит ли prevArea в панели использую closest
            isTargetOnFloatArea = this._prevArea.getContainer().closest('.ws-float-area, .controls-FloatArea').length;
         }

         // Если на области висит класс controls-FloatArea__ignoreFocus, то клик по этой области не приводит к закрытию попапов по focusOut.
         // Нужно для попапов, которые должны отображаться независимо от остальных окон на странице.
         if (area.getContainer) {
            isIgnored = area.getContainer().closest('.controls-FloatArea__ignoreFocus').length;
         }
         return !isIgnored && (isFloatArea || isTargetOnFloatArea);
      },

      /**
       * Вызывается перед показом панели, до её отображения на экране.
       * Нужно, чтобы при показе первой панели менеджер панелей убрал прокрутку с body и включил margin,
       * тем самым обеспечив правильный начальный расчёт размеров панели.
       * @param {CFloatArea} area Панель
       */
      _beforeShowStarted: function(area) {
         if (area._options.isStack) {
            var id = area.getId(),
                info = this._areaInfos[id];

            info.preparedToShow = false;
            this._hideUnnecessaryAreas(info.control);

            if(Env.constants.browser.isMobilePlatform){
               // task: 1173330288
               // im.dubrovin: перед добавлением флоат арии в стек верхней по z-index панели отключаю инерционную проктутку
               this._setTopFloatAreaWebkitOverflowScrolling('auto');
            }
            this._stack.push(info);
            // im.dubrovin: добавленной флоат арии в стек верхней по z-index панели включаем инерционную проктутку
            if(Env.constants.browser.isMobilePlatform){ // временные решения багов -webkit-overflow-scrolling
               var topFloatArea = this._setTopFloatAreaWebkitOverflowScrolling('touch'),
               $topFloatAreaContainer  = (topFloatArea === false)? false : topFloatArea.getContainer();
               this._strictOverflowScrollingOnScrollContainersUnderTopFloatArea($topFloatAreaContainer);
            }
            this._checkToggleContentScroll();
         }
      },

      /**
       * Вызывается после начала показа панели, когда она показана на экрана и начала выезжать.
       * Тут на основе уже правильных начальных размеров панели рассчитывается размер оверлея, а также сдвигается боковуха, если нужно.
       * @param {CFloatArea} area Панель
       */
      _showStarted: function(area) {
         if (area._options.isStack) {
            var id = area.getId(),
               info = this._areaInfos[id];

            if (this._stack.length === 1) {
               this._animationLength = info.control._options.animationLength;
               this._panelHideAnimationDelay = USE_ANIMATION ? Math.max(10, this._animationLength * 0.1) : 0;
            }

            //Если есть анимация, то нужно сделать два просчёта видимости боковухи: первый в начале анимации, а второй в конце после расчёта авторазмеров выехавшей панели
            //Если анимации нет, то нужен только второй расчёт
            if (USE_ANIMATION) {
               this._updateSideBarVisibility();
            }
            info.preparedToShow = true;
         }
         this._addOverflowScrollingClass(area);
      },

      _finishShow: function(area){
         if (area._options.isStack) {
            if (this._stack.length > 1) {
               this._hideShadow(this._areaInfos[area.getId()]);
            }
         }
         this._updateSideBarVisibility();
      },

      _hideShadow: function(areaInfo){
         var width = areaInfo.control.getContainer().width();
         for (var i = 0, l = this._stack.length - 1; i < l; i++) {
            var area = this._stack[i].control;
            if (area !== areaInfo.control && area.getContainer().width() === width){
               this._toggleAreaShadow(area, false);
            }
         }
      },

      _showShadow: function(areaInfo){
         var width = areaInfo.control.getContainer().width();
         for (var i = this._stack.length - 1; i > -1; i--) {
            var area = this._stack[i].control;
            if (area.getContainer().width() === width){
               this._toggleAreaShadow(area, true);
               return;
            }
         }
      },

      _toggleAreaShadow: function(area, toggle){
         area.getContainer().closest('.ws-float-area-stack-panel-shadow').toggleClass('ws-float-area-stack-panel-no-shadow', !toggle);
      },

      _beforeClose: function(area) {
         if (area._options.isStack) {
            var id = area.getId(),
                info = this._areaInfos[id];

            this._removeAreaFromStack(info, false);
            this._showShadow(info);
         }
      },

      _recalculateShadow: function(){
         var shadowSize = [];
         for (var i = this._stack.length - 1; i > -1; i--) {
            var area = this._stack[i].control,
                areaWidth = area.getContainer().width(),
                isShadowedSize = shadowSize.indexOf(areaWidth) > -1;
            this._toggleAreaShadow(area, !isShadowedSize);
            if (!isShadowedSize) {
               shadowSize.push(areaWidth);
            }
         }
      },

      _afterClose: function(area) {
         if (area._options.isStack) {
            this._checkToggleContentScroll();
         }
         if (this._prevArea === area) {
            this._prevArea = null;
         }
      },

      _changeMaximizeMode: function(){
         this._recalculateShadow();
      },

      /**
       * Добавляет панель в обработку стек-панелей
       * @param {CFloatArea} area Панель
       * @param {Object} options Опции панели, необходмые менеджеру
       */
      _setAreaInfo: function(area, options) {
         var id = area.getId(),
             info = new AreaInfo();

         info.control = area;
         info.hideSideBar = options.hideSideBar;
         info.id = id;

         this._areaInfos[id] = info;
      },
      /**
       *
       * Добавить панель в список всех панелей.
       * @param {CFloatArea} area Добавляемая панель.
       */
      _addArea: function(area) {
         //Из-за порядка паковки FloatAreaManager мог высчитать свои переменные до построения основного шаблона страницы,
         //что приведет к неверным рассчетам. Пересчитываю значения, когда начинается работа с панелью
         this._calcVariables();
         this._isCalculatingVariables = true;
         this._areas[area.getId()] = area;

         this._addOverflowScrollingClass(area);
      },
      /**
       *
       * Перестать обрабатывать указанную панель.
       * @param {CFloatArea} area Панель
       */
      _removeArea: function(area) {
         var id = area.getId(),
            info = this._areaInfos[id];
         if (info) {
            delete this._areaInfos[id];
            this._removeAreaFromStack(info, true);
         }
         delete this._areas[id];

         this._removeOverflowScrollingClass();
      },

      _addOverflowScrollingClass: function(area) {
         BODY().addClass('ws-float-area-overflow-scrolling-auto'); //Убираем overflow-scrolling со всех скролл контейнеров
         this._removeTouchFixClass();
         area.getContainer().addClass('ws-float-area__touchScroll-fix'); //Включаем overflow-scrolling внутри новой панели
      },

      _removeOverflowScrollingClass: function() {
         if (!this._hasVisibleArea()) {
            $(Env.constants.$body).removeClass('ws-float-area-overflow-scrolling-auto');
         } else {
            this._removeTouchFixClass();
            if (this._getTopFloatArea()) {
               this._getTopFloatArea().control.getContainer().addClass('ws-float-area__touchScroll-fix');
            }
         }
      },

      _hasVisibleArea: function() {
         for (var i in this._areas) {
            if (this._areas.hasOwnProperty(i)) {
               if (this._areas[i].isVisible()) {
                  return true;
               }
            }
         }
         return false;
      },

      _removeTouchFixClass: function() {
         for (var id in this._areas) {
            if (this._areas.hasOwnProperty(id)) {
               this._areas[id].getContainer().removeClass('ws-float-area__touchScroll-fix');
            }
         }
      },

      _useTouch: function() {
         return Env.constants.compatibility.touch &&
                getScrollWidth() === 0;
      },

      _haveMaximizedWindows: function() {
         return this._maximizedWindows.length > 0;
      },

      _needBodyRight: function (area) {
         //Если панель отображается во весь экран, либо над панелью, которая отображается во весь экран, то считаем ее координаты от края окна
         var maxZindex = -1;
         for (var i = 0, l = this._maximizedWindows.length; i < l; i++) {
            if (this._maximizedWindows[i] === area) {
               return true;
            }
            if (this._maximizedWindows[i].getZIndex() > maxZindex) {
               maxZindex = this._maximizedWindows[i].getZIndex();
            }
         }
         return maxZindex > -1 && area.getZIndex() > maxZindex;
      },

      _setWindowMaximized: function(win, isMaximized) {
         var
            oldHaveMaximizedWindows = this._haveMaximizedWindows(),
            found = arrayFindIndex(this._maximizedWindows, function(w) {
               return w === win;
            }) !== -1;

         if (isMaximized && !found) {
            this._maximizedWindows.push(win);
         } else if (!isMaximized && found) {
            this._maximizedWindows = this._maximizedWindows.filter(function(w) {
               return w !== win;
            });
         }

         if (oldHaveMaximizedWindows !== this._haveMaximizedWindows()) {
            this._checkToggleContentScroll();
            this._resize();
         }
      },

      /**
       * Переключает скролл на основном содержимом по необходимости
       * @private
       */
      _checkToggleContentScroll: function () {
         var toggle = (this._stack.length + this._maximizedWindows.length) > 0;
         if (toggle !== this._hasAnyFloatArea) {
            this._hasAnyFloatArea = toggle;
            LayoutManager.setHasAnyFloatArea(toggle);
         }
      },

      _removeAreaFromStack: function(info, checkToggleContentScroll) {
         var index = this._stack.indexOf(info),
             result = index !== -1;

         if (result) {
            // task: 1173330288
            // im.dubrovin: перед удалением флоат арии из стека верхней по z-index панели отключаю инерционную проктутку
            if(Env.constants.browser.isMobilePlatform){
               this._setTopFloatAreaWebkitOverflowScrolling('auto');
            }

            this._stack.splice(index, 1);

            if(Env.constants.browser.isMobilePlatform){// временные решения багов -webkit-overflow-scrolling
               // im.dubrovin: после удаления флоат арии из стека верхней по z-index панели включаю инерционную проктутку
               var topFloatArea = this._setTopFloatAreaWebkitOverflowScrolling('touch'),
               $topFloatAreaContainer  = (topFloatArea === false) ? false : topFloatArea.getContainer();
               this._strictOverflowScrollingOnScrollContainersUnderTopFloatArea($topFloatAreaContainer);
            }

            if (checkToggleContentScroll) {
               this._checkToggleContentScroll();
            }

            if (this._canHideSidebar()) {
               this._updateSideBarVisibility();
            }
         }
         this._removeOverflowScrollingClass();
         return result;
      },

      _compareZIndex: function(fa1, fa2) {
         if (fa1.control.getZIndex() < fa2.control.getZIndex()) {
            return -1;
         }
         if (fa1.control.getZIndex() > fa2.control.getZIndex()) {
            return 1;
         }
         return 0;
      },
      _getMaxZIndex: function() {
         var zIndex = WindowManager.getDefaultZIndex();

         objectFind(this._stack.sort(this._compareZIndex), function(value) {
            var currZIndex = value.control.getZIndex();
            zIndex = currZIndex > zIndex ? currZIndex : zIndex;
            return false;
         });
         return zIndex;
      },

      // task: 1173330288
      // im.dubrovin: возвращает верхнюю по z-index floatArea'у
      _getTopFloatArea: function(){
         if(this._stack.length > 0){
            this._stack.sort(this._compareZIndex);
            return this._stack[this._stack.length - 1];
         }else{
            return false;
         }
      },
      // task: 1173330288
      // im.dubrovin: устанавливает верхней по z-index панели '-webkit-overflow-scrolling' в указанное значение
      _setTopFloatAreaWebkitOverflowScrolling: function(value){
         var topFloatArea = this._getTopFloatArea();
         if(topFloatArea){
            topFloatArea.control._visibleRoot.css('-webkit-overflow-scrolling', value);
            this._topFloatArea = topFloatArea.control;
            return this._topFloatArea;
         }else{
            return false;
         }
      },

      // task: 1173330288
      // im.dubrovin: отклчает инерционный сролл у скролл контейнеров(кроме тех котоые находяться в $topFloatAreaContainer)
      _strictOverflowScrollingOnScrollContainersUnderTopFloatArea: function($topFloatAreaContainer){

         for (var key in this._scrollableContainers) {
            if (this._scrollableContainers.hasOwnProperty(key)) {
               var
                  $scrollableContainer = this._scrollableContainers[key];
               // im.dubrovin: если нет ни одной стековой панели блокировать инерционную прокрутку смысла нет
               if($topFloatAreaContainer === false){
                  $scrollableContainer.css('-webkit-overflow-scrolling', 'touch');
               }else{
                  // im.dubrovin: если скролл контейнер не находится в верхней флоат арии то блокируем в нем инерционную прокрутку
                  if($topFloatAreaContainer.find($scrollableContainer).length === 0){
                     $scrollableContainer.css('-webkit-overflow-scrolling', 'auto');
                  }else{
                     $scrollableContainer.css('-webkit-overflow-scrolling', 'touch');
                  }
               }
            }
         }
      },

      /* task: 1173377605
      im.dubrovin: pupup на верхней по z-index флоат арии должен отключать инерционный скролл на флоат ариях
      и скролл контейнерах под собой, и включать обратно при скрытии */

      // метод вызывается FloatArea'ей когда в нем появляется popup или закрываются все popup'ы
      _toggleHasPopupInside: function(parentAreaId, hasPopupInside){
         if(Env.constants.browser.isMobilePlatform){
            if(this._topFloatArea && this._topFloatArea.getId() === parentAreaId){
               if(hasPopupInside){
                  this._setTopFloatAreaWebkitOverflowScrolling('auto');
                  for (var key in this._scrollableContainers) {
                     if (this._scrollableContainers.hasOwnProperty(key)) {
                        this._scrollableContainers[key].css('-webkit-overflow-scrolling', 'auto');
                     }
                  }
               } else {
                  var topFloatArea = this._setTopFloatAreaWebkitOverflowScrolling('touch'),
                  $topFloatAreaContainer  = (topFloatArea === false) ? false : topFloatArea.getContainer();
                  this._strictOverflowScrollingOnScrollContainersUnderTopFloatArea($topFloatAreaContainer);
               }
            }
         }
      }


   };

   // При выполнении на сервере не делаем инициализацию
   if (typeof window !== 'undefined') {
      // До готовности DOM этот вызов не имеет смысла. Скорее всего мы получим в этом случае
      // неработоспособный FloatAreaManager
      $(function(){
         FloatAreaManager._init();
      });
   }

   return FloatAreaManager;
});
