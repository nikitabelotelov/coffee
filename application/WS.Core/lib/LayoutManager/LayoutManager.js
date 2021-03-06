/**
 * Класс по работе с расположением элементов на странице.
 */
define('Lib/LayoutManager/LayoutManager',
   [
      'Env/Env',
      'Core/helpers/Object/find',
      'Env/Event',
      'Lib/StickyHeader/StickyHeaderManager/StickyHeaderManager', // подключен сюда для паковки на ПП, т.к. содержит общие для страницы/раскладки стили
      'is!browser?jquery'
   ], function(Env, objectFind, EnvEvent, StickyHeaderManager) {
   'use strict';

   // Область контента
   var contentArea;
   // Зарегистрированные обработчики
   var handlers = {};

   function findContent(idArray) {
      var res = objectFind(idArray, function(id) {
         return !!$(id).length;
      });
      return res ? $(res) : $();
   }

   var LayoutManager = {
      /**
       * Инициализация LayoutManager
       * @param cfg (contentArea) конфиг LayoutManager
       */
      configureLayoutBlocks: function(cfg) {
         if (cfg && cfg.contentArea) {
            contentArea = findContent(cfg.contentArea);
         }
      },

      /**
       * Возвращает набор блоков, представленных на странице
       * @returns {{contentArea: (jQuery)}}
       */
      getLayoutBlocks: function() {
        return {
          contentArea: contentArea
        };
      },

      /**
       * Возвращает true, если основной скролл на BODY, false если скролл убран с BODY на контейнер с классом 'ws-body-scrolling-content'
       * @returns {boolean} признак, что скролл на BODY (true), иначе скролл на контейнере с классом 'ws-body-scrolling-content'
       */
      isMainScrollingContainerBody: function(){
         return $('.ws-body-scrolling-content').length === 0;
      },
      /**
       * Возвращает контейнер основного контента со скроллом
       * Это либо контейнер с классом 'ws-body-scrolling-content', либо BODY
       * @returns {jQuery} контейнер основного контента со скроллом
       */
      getMainScrollingContainer: function(){
         var wsBodyScrollingContent = $('.ws-body-scrolling-content');
         return wsBodyScrollingContent.length ? wsBodyScrollingContent : $('body');
      },
      /**
       * Возвращает координаты (top, right, bottom, left) внутреннего содержимого контейнера со скроллом относительно BODY
       * @returns {Object} координаты (top, right, bottom, left) внутреннего содержимого контейнера со скроллом относительно BODY
       */
      getScrollingContainerFixedOffsets: function(){
         if (this.isMainScrollingContainerBody()) {
            var body = $('body')[0];
            return { top: 0, right: 0, bottom: 0, left: 0, clientWidth: body && body.clientWidth, clientHeight: body && body.clientHeight };
         }
         else {
            var mainScrollingContainer = this.getMainScrollingContainer()[0];
            return {
               top: 0,
               right: mainScrollingContainer.offsetWidth - mainScrollingContainer.clientWidth,
               bottom: mainScrollingContainer.offsetHeight - mainScrollingContainer.clientHeight,
               left: 0,
               clientWidth: mainScrollingContainer.clientWidth,
               clientHeight: mainScrollingContainer.clientHeight
            };
         }
      },

      /**
       * Регистрация обработчика события
       * @param event Событие
       * @param handler Обработчик
       */
      registerHandler: function(event, handler) {
         if (typeof event !== 'string' || event.trim() === '') {
            throw new Error('LayoutManager: При регистрации обработчика введено неправильное название события');
         }
         if (typeof handler !== 'function') {
            throw new Error('LayoutManager: При регистрации обработчика введен неправильный обработчик');
         }

         if (handlers.hasOwnProperty(event)) {
            EnvEvent.Bus.globalChannel().unsubscribe(event, handlers[event]);
         }
         EnvEvent.Bus.globalChannel().subscribe(event, handler);
         handlers[event] = handler;
      },

      init: function() {

         if (typeof window !== 'undefined') {
            this.registerHandler('ContentAbsoluteBlocksChanged', function (event, param) {
               if (!contentArea.length) {
                  return;
               }

               if (param.maxHeight > 0) {
                  // Сбрасываем min-height для правильного рассчета contentArea.get(0).scrollHeight, если min-height уже стояла
                  contentArea.css('min-height', '');
                  var needMaxHeight = (param.maxHeight > contentArea.get(0).scrollHeight),
                     height = (needMaxHeight) ? Math.max(contentArea.get(0).scrollHeight, param.maxHeight) : '';
                  if (height !== '') {
                     contentArea.css('min-height', height);
                  }
               } else {
                  contentArea.css('min-height', '');
               }
            });

            contentArea = findContent(Env.constants.layoutConfig.contentArea);
            //Хак: для отключения промотки body, при которой основной контейнер с содержимым съезжает вверх, и внизу
            //body остаётся пустое место. Это происходит, когда фокус приходит на нестековую плав. панель, которая
            //лежит в body (или основном контейнере), и вылезает за нижний край body (или осн. контейнера)
            //При фокусировке Хром (или ИЕ) пытается полностью показать эту панель (и фокусирующийся в ней блок), и проматывает
            //содержимое body вверх, при чём scrollTop у body при этом нулевой, так что это даже не поправишь никак в коде Control.focus (ControlBatchUpdater.registerDelayedAction('Control.focus'))
            //Значит, приходится на всякую прокрутку в body делать осн. контейнеру scrollIntoView, чтобы вернуть его на место.
            //Делать это нужно только тогда, когда у body overflow-y==hidden, поскольку в шаблонах у которых в body есть прокрутка,
            //такой лажи быть не может, там за границы прокрутки ничего при фокусе не уедет, да и вообще, там нельзя на прокрутку body ничего делать - её же пользователь может крутить.
            var body = $('body');
            body.on('scroll', function () {
               if (body.css('overflow-y') === 'hidden') {
                  this.getMainScrollingContainer().get(0).scrollIntoView(true);
               }
            }.bind(this));

            if(Env.detection.isMobileSafari){
               /**
                * Адовый костыль для Safari.
                * Когда в Safari одна вкладка - панели с вкладками нет, когда несколько - панель есть.
                * При появлении / пропадании вкладки Safari не пересчитывает высоту viewport-а, из-за чего:
                * а) при пропадании панели вкладок внизу страницы остаётся полоса без контента (высотой с панель).
                * б) при появлении верхняя часть страницы может быть скрыта под панелью.
                * Полоса снизу проявляется из-за того, что у html и у body высота 100% (если бы был скролл на body,
                * то высота viewport также была бы некорректной, но контент было бы видно из-за overflow: visible на viewport).
                * Никаких чётких событий поймать не получается.
                * Что мы тут делаем: при переключении вкладок немного ждём (т.к. высоты изменяются не сразу),
                * сравниваем высоты и при необходимости распираем document на недостающую высоту панели.
                * Также при обновлении вкладки с неправильной высотой viewport неправильная высота почему-то запоминается,
                * поэтому при загрузке страницы также проверяем и распираем при необходимости.
                * Костыль не лечит 100% случаев, т.к. иногда высота не пересчитывается вообще, иногда пересчитывается с огромной задержкой.
                * Связанная ошибка: https://inside.tensor.ru/opendoc.html?guid=d40ad892-f0d9-43eb-bf8f-0feb83bd0cc7
                * Баг зарегистрирован в Apple Bug Reporter под номером 28225370
                */
               var lastDiff = 0;
               var setSafariDocumentHeight = function setSafariDocumentHeight(diff){
                  $(document.documentElement).css('height', diff > 0 ? 'calc(100% + ' + diff + 'px)' : '');
                  lastDiff = diff > 0 ? diff : 0;
               };
               var checkSafariDocumentOnEvent = function checkSafariDocumentHeightOnEvent () {
                     for (var i = 1; i <= 4; i++) {
                         setTimeout(checkSafariDocument, Math.pow(i, 2)*100);
                     }
                  },
                  checkSafariDocument = function () {
                     checkSafariDocumentHeight();
                     checkSafariDocumentScroll();
                  },
                  checkSafariDocumentHeight = function checkSafariDocumentHeight (timeout) {
                     var diff = window.innerHeight - document.documentElement.clientHeight;
                     diff = diff > 0 ? diff : 0;
                     if(diff !== lastDiff){
                        setSafariDocumentHeight(diff);
                     }
                  },
                  checkSafariDocumentScroll = function () {
                     if (body.hasClass('ws-body-no-scroll') && body[0].scrollTop > 0){
                        body[0].scrollTop = 0;
                     }
                  };

               $(document).bind('visibilitychange', checkSafariDocumentOnEvent);
               $(window).bind('orientationchange', checkSafariDocumentOnEvent);

               checkSafariDocumentHeight();
               // на некоторых страницах высота пересчитывается не сразу после загрузки страницы.
               setTimeout(checkSafariDocumentHeight, 1000);
               /* конец адового костыля для Safari */
            }
         }
      },

      setHasAnyFloatArea: function(hasAnyFloatArea){
         if (Env.detection.isMobileIOS && !this.isMainScrollingContainerBody()){
            // на IOS при появлении всплывающей панели надо снимать стиль -webkit-overflow-scrolling: touch;
            // лечит ошибку: https://inside.tensor.ru/opendoc.html?guid=615d920b-a698-425b-8fdd-6c96b31db2f7
            this.getMainScrollingContainer().toggleClass('ws-ios-overflow-scrolling-auto', hasAnyFloatArea);
         }
      },

      /**
       * Метод прокручивает скролл элементов так, чтобы указанный элемент был виден на странице.
       * При прокрутке учитывает фикс.шапку.
       * @param {jQuery} $elem элемент, который должен стать видимым после скроллинга блоков, в которых он лежит
       * @param {Boolean} toBottom скроллить к нижней границе элемента, по умолчанию скролит к верхней
       * @param {Number} depth количество родительских контейнеров, лежащих в dom дереве ниже, которые будут проскролены
       * что бы элемент стал видимым. Учитываются только контейнеры на которых overflow-y установлен в auto или scroll.
       * По умолчанию равен бесконечности.
       */
      scrollToElement: function($elem, toBottom, depth){
         if (!$elem || !$elem.length){
            return;
         }
         depth = depth || Infinity;
         var scrollableParents = $elem.parents().filter(function checkScrollable(){
               if (depth <= 0) {
                  return false;
               }
               var
                  $item =  $(this),
                  overflowY = $item.css('overflow-y'),
                  isScrolling = (overflowY === 'auto' || overflowY === 'scroll' ||
                     this === document.documentElement ||
                     // На контенте скролл контейнера может висеть класс overflow: hidden, но его все равно нужно проскролить.
                     $item.hasClass('controls-ScrollContainer__content-overflowHidden'));
               if (isScrolling) {
                  depth--;
               }
               return isScrolling && this.scrollHeight > this.clientHeight;
            }),
            htmlElem = $('html')[0],
            bodyElem = $('body')[0],
            getOffset = function getOffset($elem){
               var elemOffset = $elem.offset();

               // у HTML и BODY offset().top всегда 0, для них надо взять положительное смещение от верха страницы, которое равно scrollTop у BODY
               // также вместо их реальной высоты надо взять clientHeight - это видимая высота
               if ($elem[0] === htmlElem || $elem[0] === bodyElem){
                  elemOffset.isHtmlOrBody = true;
                  elemOffset.top = bodyElem.scrollTop;
                  elemOffset.bottom = elemOffset.top + $elem[0].clientHeight;
               }
               else {
                  elemOffset.bottom = elemOffset.top + $elem.outerHeight();
               }

               // Под ie иногда скролируемая область недоскроливается на 1px если смещение - дробное число.
               // Округляем до целого в большую сторону что бы гарантированно докрутить до низа элемента.
               elemOffset.bottom = Math.ceil(elemOffset.bottom);
               return elemOffset;
            };
         for (var i = 0; i < scrollableParents.length; i++){
            var $parent = $(scrollableParents[i]),
               parentOffset = getOffset($parent),
               elemOffset = getOffset($elem),// после скролла контейнера offset меняется, поэтому не можем закешировать раз и навсегда
               elemToScroll = parentOffset.isHtmlOrBody ? bodyElem : $parent[0],
               stickyHeaderHeight = $parent.hasClass('ws-sticky-header__scrollable-container') ? StickyHeaderManager.getStickyHeaderMaxHeight($parent) : 0;
            if (parentOffset.bottom < elemOffset.bottom){
               if (toBottom) {
                  elemToScroll.scrollTop += elemOffset.bottom - parentOffset.bottom;
               } else {
                  elemToScroll.scrollTop += elemOffset.top - parentOffset.top - stickyHeaderHeight;
               }
            }
            else{
               if (parentOffset.top + stickyHeaderHeight > elemOffset.top){
                  if (toBottom) {
                     elemToScroll.scrollTop -= Math.max(parentOffset.bottom + stickyHeaderHeight - elemOffset.bottom, 0);
                  } else {
                     elemToScroll.scrollTop -= Math.max(parentOffset.top + stickyHeaderHeight - elemOffset.top, 0);
                  }
               }
            }
         }
      }
   };

   LayoutManager.init();

   return LayoutManager;
});
