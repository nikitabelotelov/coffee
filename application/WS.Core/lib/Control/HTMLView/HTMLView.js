define('Lib/Control/HTMLView/HTMLView', [
   'Core/helpers/Number/randomId',
   'Core/helpers/Function/forAliveOnly',
   'Core/dom/wheel',
   'Core/dom/keyDown',
   'Core/helpers/Hcontrol/getScrollWidth',
   'Core/helpers/Hcontrol/hasScrollbar',
   'Core/helpers/Hcontrol/setElementCachedSize',
   "Core/ParallelDeferred",
   "Core/Deferred",
   'Env/Env',
   "Lib/Control/TemplatedAreaAbstract/TemplatedAreaAbstract",
   "Lib/Control/LoadingIndicator/LoadingIndicator",
   'Core/helpers/getResourceUrl',
   "css!Lib/Control/HTMLView/HTMLView"
], function(
   randomId,
   forAliveOnlyHelpers,
   wheel,
   keyDown,
   getScrollWidth,
   hasScrollbar,
   setElementCachedSize,
   cParallelDeferred,
   cDeferred,
   Env,
   TemplatedAreaAbstract,
   LoadingIndicator,
   getResourceUrl
) {

   'use strict';

   var LOADING_INDICATOR_TIMEOUT = 750;

   function imageLoaded(img) {
      //проверяем complete и при наличии naturalWidth ещё и его (это для хак для вебкита)
      return (img.complete && ((typeof img.naturalWidth === 'undefined') || img.naturalWidth > 0));
   }

   function urlWithHost(url) {
      var l = Env.constants.hosts.length,
         host = '';
      if (l > 0) {
         host = Env.constants.hosts[Math.floor(Math.random() * l)];
         if (url.substring(0, 1) == '.') {
            var curPath = window.location.pathname;
            curPath = curPath.substring(0, curPath.lastIndexOf('/') + 1);
            url = host + curPath + url.substring(2);
         } else {
            url = host + (url.substring(0, 1) == '/' ? '' : '/') + url;
         }
      }
      return url;
   }

   /**
    * Класс контрола, который используют для просмотра HTML-документа и, при необходимости, последующей печати его содержимого.
    * Отображение html-документа происходит внутри iframe, поэтому в такой документ не импортируются ни стили, ни скрипты из основного окна веб-страницы.
    * <br/>
    * <b>Внимание:</b> для отображаемого HTML-документа предустановлены два CSS-свойства:
    *
    * 1. Отступ в 0px:
    * <pre class="brush:css">
    * body {
    *    margin: 0;
    * }
    * </pre>
    *
    * 2. Ссылки для номеров телефона не будут подчеркнутыми:
    * <pre class="brush:css">
    * a[href^="tel:"] {
    *    text-decoration: none;
    *    color: inherit;
    * }
    * </pre>
    * Учтите эту особенность стилевого оформления при разработке и тестировании форм печати.
    * <br/>
    * Часто используемые действия:
    * <ul>
    *   <li>Для печати содержимого HTML-документа используйте метод {@link print}.</li>
    *   <li>Для подключения CSS-стилей в отображаемый HTML-документ используйте метод {@link addStyle}.</li>
    *   <li>Для получения/изменения содержимого HTML-документа используйте методы {@link getHTML} и {@link setHTML} соответственно.</li>
    * </ul>
    * <br/>
    * @class Lib/Control/HTMLView/HTMLView
    * @extends Lib/Control/TemplatedAreaAbstract/TemplatedAreaAbstract
    * @author Крайнов Д.О.
    * @control
    * @public
    * @category Decorate
    * @initial
    * <component data-component='Lib/Control/HTMLView/HTMLView' style='width: 400px; height: 300px'>
    *    <option name='docType'>url</option>
    *    <option name='url' value=''></option>
    * </component>
    */
   var HTMLView = TemplatedAreaAbstract.extend(/** @lends Lib/Control/HTMLView/HTMLView.prototype */{
      /**
       * @event onIframeCreate Происходит при создании внутреннего iframe.
       * @remark
       * В нём можно настроить, например, параметры безопасности у iframe.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {jQuery} iframe Созданный iframe, у которого можно настроить из события разные атрибуты и стили.
       */
      /**
       * @event onContentSet Происходит при установке контента.
       * @remark
       * Может быть инициировано из функции $constructor.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {String} str Тип документа (см. {@link docType}).
       * @param {String} html Отображаемый в контроле HTML-документ.
       */
      /**
       * @event onBeforePrint Происходит перед началом печати (см. {@link print}).
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @param {jQuery} iframe iframe, который печатается.
       * @see print
       */
       /**
        * @event onContentReady Происходит при готовности содержимого HTML-документа, устанавливаемого в контрол методом {@link setHTML}.
        * @param {Env/Event:Object} eventObject Дескриптор события.
        * @example
        * Пользовательский компонент (component) содержит в разметке контрол для отображения html-кода (htmlData).
        * component посылает событие onReady после того как данные готовы.
        * <pre>
        *    setHTMLContent: function( htmlData ) {
        *       var
        *          component = this,
        *          htmlViewControl = component.getChildControlByName("htmlViewContainer");
        *       htmlViewControl.subscribe("onContentReady", function(){
        *          component._notify( 'onReady' );
        *       });
        *       htmlViewControl.setHTML(htmlData);
        *    }
        * </pre>
        */
       /**
        * @cfg {String} Устанавливает шаблон страницы, которая будет отображена.
        * @remark
        * Опция актуальна, когда {@link docType} установлена в значение *template*.
        * @name Lib/Control/HTMLView/HTMLView#template
        */
      $protected: {
         _width: '',
         _height: '',
         _options: {
             /**
              * @cfg {String} Устанавливает тип документа, отображаемого в iframe.
              * @variant string Использует {@link string} в качестве источника для данных.
              * @variant url Использует {@link url} в качестве источника для данных.
              * @variant template Использует {@link template} в качестве источника для данных.
              */
            docType: 'string',
             /**
              * @cfg {String} Устанавливает адрес страницы, которая будет отображена в iframe.
              * @remark
              * Опция актуальна, когда {@link docType} установлена в значение *url*.
              * @see setUrl
              */
              url: '',
             /**
              * @cfg {String} Устанавливает HTML-разметку, которая будет отображена в iframe.
              * Опция актуальна, когда {@link docType} установлена в значение *string*.
              * @see setHTML
              */
              string: '',
             /**
              *
              */
            safeContent: false,
            /**
             * @cfg {String} Устанавливает адрес для автоматической подгрузки шрифтов семейства TensorFont.
             * @remark
             * Если установлена пустая строка, то в HTML-документ будет подключены шрифты по адресу, который по умолчанию определён в WS.
             */
            tensorFontsUrl: undefined,

            /**
             * Для контрола по умолчанию выключен функционал {@link Lib/Control/Control#activableByClick}. Причина: Lib/Control/HTMLView/HTMLView не должен активироваться по клику, или фокусу из внутреннего содержимого (iframe), потому что оно фокусируется при печати.
             * Это какие-то старые "хаки". Таким образом, опция отключена, чтобы HTMLView (он часто создаётся невидимым для печати и без родителя) может отобрать фокус у плавающей панели, и неожиданно закрыть её.
             */
            activableByClick: false
         },
         _iframeReady: undefined,      //Деферред готовности iFrame'а
         _dReady: undefined,           //Деферред готовности контрола
         _iframe: undefined,           //Элемент-iframe
         _iframeContainer: undefined,  //Элемент, содержащий в себе iframe
         _loaded: true,                //Загружен ли элемент
         _iframeId: '',
         _resizerHeight: 0,
         _resizerWidth: 0,
         _oldResizerHeight: 0,
         _oldResizerWidth: 0,
         _loadingIndicatorTimer: null
      },
      $constructor: function(){
         this._publish('onContentSet', 'onContentReady', 'onBeforePrint', 'onIframeCreate');
         this.once('onDestroy', function() {
            this._iframe = $();
            this._iframeContainer = $();
         });

         this.getContainer().addClass('ws-HTMLView');
         this._redraw();
      },

      _removeLoadingIndicator: function() {
         if (this._loadingIndicatorTimer) {
            clearTimeout(this._loadingIndicatorTimer);
         }

         var indicator = this._getIndicator();
         if (indicator) {
            indicator.destroy();
         }
      },

      _createLoadingIndicator: function() {
         if (this._loadingIndicatorTimer) {
            clearTimeout(this._loadingIndicatorTimer);
         }
         this._loadingIndicatorTimer = setTimeout(function() {
            new LoadingIndicator({
               showInWindow: false,
               element: $('<div />', {
                  'class': 'ws-HTMLView__loadingIndicator'
               }).appendTo(this._container)
            });
         }.bind(this), LOADING_INDICATOR_TIMEOUT);
      },

      _redraw: function() {
         var self = this;
         this._dReady = new cDeferred();
         this._iframeReady = new cDeferred();

         if (this._options.maxWidth === undefined) {
            this._options.maxWidth = Infinity;
         }

         if (this._options.maxHeight === undefined) {
            this._options.maxHeight = Infinity;
         }

         switch(this._options.docType){
            case 'string':
               if (this._options.string) {
                  this.setHTML(this._options.string);
               } else {
                  this._dReady.callback();
               }
               break;

            case 'url':
               if (this._options.url) {
                  this.setUrl(this._options.url);
               } else {
                  this._dReady.callback();
               }
               break;

            case 'template':
               this.setTemplate(this._options.template);
               break;

            default:
               throw new Error('HTMLView does not support this docType');
         }
         this._dReady.addCallback(forAliveOnlyHelpers(function() {
            self._dChildReady.done();
            self._isReady = true;
         }, self));
      },

      _getIndicator: function() {
         return this.getContainer().find('.ws-HTMLView__loadingIndicator').wsControl();
      },

      /**
      * Находит все изображения и дожидается их загрузки, запускает пересчёт авторазмеров
      * @private
      */
      _waitResources: function() {

         var document = this.getIframeDocument(),
             setAutoSize = forAliveOnlyHelpers(this.setAutoSize, this),
             readyHandler = forAliveOnlyHelpers(function() {
                this.showIframeContainer();
                this._removeLoadingIndicator();
                setAutoSize();
                this._notify('onContentReady');
             }, this),
             readyDfrs, iframeBody, images, links, styles;

         if (document) {
            iframeBody = document.body;

            images = $('img', iframeBody);
            links = $('link', document);

            //В тэгах style могут быть @import
            styles = $('style', document);
         } else {
            images = $();
            links = $();
            styles = $();
         }

         readyDfrs = images.toArray().reduce(function(res, img) {
            var dfr, callback;
            if (!imageLoaded(img)) {
               dfr = new cDeferred();
               callback = dfr.callback.bind(dfr);
               $(img).bind('load', callback).bind('error', callback);

               res.push(dfr);
            }
            return res;
         }, []);

         //Пересчёт размеров по загрузке стилей
         if (links.length || styles.length) {
            var linkDfrs = links.toArray().map(function(link) {
               var
                  img = $('<img />', {style: 'position: absolute; visibility: hidden; left: 0; top: 0; display: block;'}),
                  dfr = new cDeferred(),
                  callback = forAliveOnlyHelpers(function callback() {
                     // Сначала удалим лишний элемент, а уж потом начнем колбечить
                     img.remove();
                     dfr.callback();
                  }, this);

               img.bind('load', callback).bind('error', callback).appendTo(document.body).prop('src', $(link).attr('href'));

               return dfr;
            }, this);

            readyDfrs = readyDfrs.concat(linkDfrs);

            //На всякий случай (если есть импорты в стилях) пересчитаемся ешё через полсекунды
            cDeferred.fromTimer(500).addCallback(setAutoSize);
         }

         //Пересчёт размеров по загрузке картинок
         if (readyDfrs.length !== 0) {
            var readyParallelDef = new cParallelDeferred({
               steps: readyDfrs
            }).done().getResult().addCallback(setAutoSize);
            cDeferred.nearestOf([
               readyParallelDef,
               cDeferred.fromTimer(2000)
            ]).addBoth(readyHandler);
         } else {
            readyHandler();
         }
      },
      /**
       * Пробрасывает события колёсика из iframe в родительский документ.
       * @remark
       * Обычно iframe захватывают мышиные события и не прокидывают их в родительский документ, что не даёт возможности его крутить, если курсор расположен над iframe.
       * Этот метод устанавливает обработчик события колёсика, который смотрит, находится ли мышиный курсор над чем-то в iframe, у чего есть вертикальная прокрутка (чтобы можно было крутить прокручиваемые области внутри iframe).
       * Если нет, то пробрасывает событие родителям iframe вверх по иерархии.
       * @param {jQuery|HTMLElement} iframe
       */
      _dispatchIframeWheelEventsToParentDocument: function (iframe) {
         if (iframe.contentDocument) {
            var ignoreProps = {
                  target: true, eventPhase: true, explicitOriginalTarget: true, originalTarget: true,
                  timeStamp: true, isTrusted: true, defaultPrevented: true, cancelable: true, bubbles: true
               },
               copyEventProps = function copyEventProps(evt, e) {
                  for (var key in e) {
                     if (!(key in ignoreProps) && key.charAt(0) === key.charAt(0).toLowerCase()) {
                        try {
                           evt[key] = e[key];
                        } catch (err) {
                           //если вдруг встретим неучтённое свойство, которое нельзя копировать
                        }
                     }
                  }
                  return evt;
               },
               doc = $(iframe.contentDocument);

            // Attach a new onmousemove listener
            wheel(doc, function (event) {
               var target = $(event.target, doc),
                  hasScrollable = target.parents().filter(function () {
                     return this.scrollHeight > this.offsetHeight && /auto|scroll/.test($(this).css('overflow-y'));
                  }).length;

               if (!hasScrollable) {
                  var evt,
                     documentToPass = doc.get(0),
                     e = event.originalEvent;

                  if (documentToPass.createEvent) {
                     evt = documentToPass.createEvent("Event");
                     evt.initEvent(e.type, true, false);
                     evt = copyEventProps(evt, e);
                     iframe.dispatchEvent(evt);
                  } else if (documentToPass.createEventObject) {
                     // IE8 не поддерживает метод createEvent на document, поэтому зовем createEventObject
                     evt = documentToPass.createEventObject();
                     evt = copyEventProps(evt, e);
                     iframe.fireEvent('on' + e.type, evt);
                  }

               }
            });
            if (Env.constants.browser.retailOffline) {
               //оффлайн браузер не знает что такое pointer-events поэтому для него надо прокидывать события touch события для скрола пальцем
               doc.bind('touchstart touchmove touchend', function (event) {
                  var documentToPass = doc.get(0),
                     e = event.originalEvent,
                     evt = documentToPass.createEvent("Event");
                  evt.initEvent(e.type, true, false);
                  iframe.dispatchEvent(copyEventProps(evt, e));
               });
            }
         }
      },
      /**
       * Пробрасывает событие нажатия на кнопку Esc в родительский документ.
       * @remark
       * Обычно iframe захватывают события и не прокидывают их в родительский документ, что не даёт возможности закрыть окно по нажатию на Esc.
       * Этот метод устанавливает обработчик события нажатия на Esc, который смотрит, находится ли фокус над чем-то в iframe. Если да, то пробрасывает событие родителям iframe вверх по иерархии.
       * @param {jQuery|HTMLElement} iframe
       */
      _dispatchIframeEscEventsToParentDocument: function(iframe) {
         iframe = $(iframe).get(0);

         if (iframe.contentDocument) {
            var ingnoreProps = {target: true, eventPhase: true, explicitOriginalTarget: true, originalTarget: true,
                  timeStamp: true, isTrusted: true, defaultPrevented: true,  cancelable: true, bubbles: true},
               doc = $(iframe.contentDocument);

            keyDown(doc, function(event) {
               if ( event.which == Env.constants.key.esc ) { //esc
                  var evt = doc.get(0).createEvent("Event"),
                     e = event.originalEvent;

                  evt.initEvent(e.type, true, false);

                  for (var key in e) {
                     if (e.hasOwnProperty(key)) {
                        var
                           value = e[key];
                        if (!(key in ingnoreProps) && key.charAt(0) === key.charAt(0).toLowerCase()) {
                           try {
                              evt[key] = value;
                           } catch (err) {
                              //если вдруг встретим неучтённое свойство, которое нельзя копировать
                           }
                        }
                     }
                  }

                  evt.which = event.which;
                  iframe.dispatchEvent(evt);
               }
            });
         }
      },
      _contentLoaded: function() {
         if(!this._dReady.isReady()){
            this._dReady.callback();
         }

         this._dispatchIframeWheelEventsToParentDocument(this._iframe);
         this._dispatchIframeEscEventsToParentDocument(this._iframe);

         // пробрасываем события мыши из iframe наружу, чтобы Window перестал перетаскиваться за заголовок
         this._mouseUpHandler = function(e) {
            $(this._iframe).trigger(e);
         }.bind(this);
         $(this._iframe.contentDocument).on('mouseup touchend', this._mouseUpHandler);

         //Дожидаемся загрузки всех картинок и css-файлов
         this._waitResources();
      },

      _getIframeBodySize:function(iframeElem, autoWidth, autoHeight){
         var
            doc = iframeElem.contents(),
            body = $('body', doc),
            html = $('html', doc),
            height, width;

         if (body.length > 0 && (autoWidth || autoHeight)) {
            //делаю сброс размеров ифрейма на расчёте - иначе body.prop('scrollWidth/Height') не может быть меньше размеров ифрейма,
            //даже если body пустое
            if(autoWidth){
               iframeElem.css('width', 0);
            } else {
               this._width && iframeElem.css('width', this._width);
            }

            if(autoHeight){
               iframeElem.css('height', 0);
            } else {
               this._height && iframeElem.css('height', this._height);
            }

            html.css('margin', '0');

            if (!autoWidth) {
               html.css('width', '100%');//и ещё нужно body растянуть по ширине родителя, чтобы правильно посчиталась высота
            }

            // посчитали все отступы в документе.
            var bodyPaddings = {
               width: body.outerWidth(true) - body.innerWidth() +
                      html.outerWidth(true) - html.innerWidth(),
               height: body.outerHeight(true) - body.innerHeight() +
                       html.outerHeight(true) - html.innerHeight()
            };

            if (autoWidth) {
               width = Math.max(parseInt(body.prop('scrollWidth'), 10),
                                body.outerWidth(true) + bodyPaddings.width,
                                this._options.minWidth);
            }
            else {
               //если выравнивание Stretch, запретим iframе растягиваться за пределы родителя, для корректной работы скроллов
               width = 0;
            }

            if (autoHeight) {
               height = Math.max(parseInt(body.prop('scrollHeight'), 10),
                                 body.outerHeight(true) + bodyPaddings.height);
            } else {
               //если выравнивание Stretch, запретим iframе растягиваться за пределы родителя, для корректной работы скроллов
               height = 0;
            }

            if (autoHeight && !autoWidth && hasScrollbar.horizontal(body)) {
               height += getScrollWidth();
            }

            if (autoWidth && !autoHeight &&  hasScrollbar.vertical(body)) {
               width += getScrollWidth();
            }

            html.css('width', '');
            html.css('position', '');
            body.css('position', '');
         } else {
            height = autoHeight ? this._options.minHeight : 0;
            width = autoWidth ? this._options.minWidth : 0;
         }

         return { height: height, width: width};
      },

      //Тут _restoreSize нужно заглушить - сброс размеров нужен только TemplatedAreaAbstract
      //TODO: убрать _restoreSize из AreaAbstract тоже - в 3.7.3
      _restoreSize: function () {},

      /**
       * Обновляет ресайзер
       */
      _updateResizer: function(){
         function setDimensions(bodySize) {
            var iframeHeight, iframeWidth,
               resizerHeight, resizerWidth;

            if (this._options.autoHeight) {
               if (this._verticalAlignment == 'Stretch') {
                  iframeHeight = '100%';
               } else {
                  iframeHeight = bodySize.height;
               }
            } else {
               iframeHeight = this._container.height();
            }

            if (this._options.autoWidth) {
               if (this._horizontalAlignment == 'Stretch') {
                  iframeWidth = '100%';
               } else {
                  iframeWidth = bodySize.width;
               }
            } else {
               iframeWidth = this._container.width();
            }

            if(iframeWidth !== '100%'){
               iframeWidth = Math.max(Math.min(parseInt(iframeWidth, 10),
                                      this._options.maxWidth),
                                      this._options.minWidth);
               resizerWidth = iframeWidth;
            } else {
               resizerWidth = 0;
            }

            if(iframeHeight !== '100%'){
               iframeHeight = Math.max(Math.min(parseInt(iframeHeight, 10),
                                       this._options.maxHeight),
                                       this._options.minHeight);
               resizerHeight = iframeHeight;
            } else {
               resizerHeight = 0;
            }

            //TODO: хак: почему-то иногда не хватает нескольких пикселей, и появляется прокрутка. приходится прятать прокрутку
            var html = $('html', iframe.contents());
            if (autoHeight && autoWidth) {
               html.css('overflow', 'hidden');
            } else if (autoWidth) {
               html.css('overflow-x', 'hidden');
            } else if (autoHeight) {
               html.css('overflow-y', 'hidden');
            }

            iframe.width(iframeWidth).height(iframeHeight);

            if (autoWidth) {
               this._container.width(iframeWidth);
            }

            //фиксим высоту iframe, resizer-а и контейнера, если есть горизонтальный скролл и автовысота.
            if (this._options.autoHeight && iframeHeight !== '100%' && (this._container.width() < bodySize.width)) {
               iframeHeight += getScrollWidth();
               resizerHeight = iframeHeight;
            }

            if (autoHeight) {
               // если у ифрейма нецелое значение высоты, его контейнер высчитывает значение height (auto) большее, чем положено.
               // Подстрахуемся и возьмем максимум из этих двух значений
               this._container.height(Math.max(this._iframeContainer.height(), iframeHeight));
            }

            setElementCachedSize(this._resizer, {width: resizerWidth, height: resizerHeight});

            this._resizerHeight = resizerHeight;
            this._resizerWidth = resizerWidth;
            return {width: resizerWidth, height: resizerHeight};
         }

         if(this._options.docType == 'template'){
            HTMLView.superclass._updateResizer();
         }else{
            var iframe = this._getCurrIframeCtrl();
            if(!iframe) {
               return;
            }
            var autoWidth = this._options.autoWidth && this._horizontalAlignment !== 'Stretch',
                autoHeight = this._options.autoHeight && this._verticalAlignment !== 'Stretch',
                bodySize = this._getIframeBodySize(iframe, autoWidth, autoHeight);

            bodySize = setDimensions.call(this, bodySize);

            //TODO: хак: в IE8 и иногда IE7 может неправильно определяться высота/ширина содержимого фрейма
            //надо это проверить и подправить
            if (Env.constants.browser.isIE && (autoWidth || autoHeight)) {
               var doc = iframe.contents(),
                   body = $('body', doc), html;

               if (body.length > 0) {
                  html = $('html', doc);
                  if (autoWidth) {
                     var scrollW = body.prop('scrollWidth');
                     if (scrollW > bodySize.width) {
                        bodySize.width = scrollW + 1;//TODO: IE9 IE8 - хак: в IE9/8 надо добавлять ещё один пиксель, чтоб прокрутки не появлялись во фрейме
                        bodySize = setDimensions.call(this, bodySize);
                     }
                  }

                  if (autoHeight) {
                     var scrollH = body.prop('scrollHeight');
                     if (scrollH > bodySize.height) {
                        bodySize.height = scrollH + 1;//TODO: IE9 IE8 - хак: в IE9/8 надо добавлять ещё один пиксель, чтоб прокрутки не появлялись во фрейме
                        setDimensions.call(this, bodySize);
                     }
                  }
               }
            }
         }
      },
      /**
       * Устанавливает авторазмеры iframe'а.
       */
      setAutoSize:function () {
         if(this._getCurrIframeCtrl()) {

            if (!this._resizer) {
               this._initResizers();
            } else {
               this._updateResizer();
            }

            if (this._resizerHeight !== this._oldResizerHeight || this._resizerWidth !== this._oldResizerWidth) {
               this._notifyOnSizeChanged(this, this);
            }
            this._oldResizerWidth = this._resizerWidth;
            this._oldResizerHeight = this._resizerHeight;
         }
      },

      _loadDescendents: function() {},

      _createIFrame: function(attributes, onLoad) {

         var name = this._createFrameId();

		   //При втором и следующих вызовах setHTML нужно пересоздать _iframeReady
		   //чтобы дожидаться готовности ифрейма
         if (this._iframeReady.isReady()) {
            this._iframeReady = new cDeferred();
         }

         if (typeof attributes == 'function' && typeof onLoad == 'undefined') {
            onLoad = attributes;
            attributes = {};
         }

         this._removeLoadingIndicator();
         this._container.empty();
         this._createLoadingIndicator();
         this._iframeContainer = $('<div />', { id: 'htmlview_' + this.getId() }).appendTo(this._container);

         var patt = /%/,
            width = this._options.autoWidth? 'auto': patt.test(this._options.width) ? this._options.width : this._options.width + "px",
            height = this._options.autoHeight? 'auto': patt.test(this._options.height) ? this._options.height : this._options.height + "px",
            css = {
               'position': 'absolute',
               'left': 0,
               'top': 0,
               'width'  : (this._options.autoWidth && this._horizontalAlignment != 'Stretch'? width : "100%"),
               'height' : (this._options.autoHeight && this._verticalAlignment != 'Stretch'? height : "100%")
            };

         // Хак для айпадов и айфонов - оборачивающему блоку нужно прописать эти стили, чтоб работала прокрутка в ифрейме
         if (Env.constants.browser.isMobileSafari) {
            css['-webkit-overflow-scrolling'] = 'touch';
            css.overflow = 'auto';
         }

         if( Env.constants.browser.isIE ) {
            css.overflow = 'visible';
         }

         this._iframeContainer.css(css);

         this.hideIframeContainer();

         var iframe = $('<iframe>iFrame not supported!</iframe>'),
             attrs = {
                id: name,
                name: name,
                frameborder: 0
             };

         if(this._options.safeContent) {
            attrs.sandbox = "allow-forms allow-popups allow-same-origin";
         }

         iframe.attr(attrs).css({
            width: '100%',
            height: '100%'
         });

         this._notify('onIframeCreate', iframe);
         return iframe.on('load', onLoad.bind(this, iframe.get(0))).attr(attributes).appendTo(this._iframeContainer);
      },

      /**
       * Устанавливает содержимое iframe.
       * @remark
       * При использовании метода происходят события: {@link onIframeCreate} &#8594; {@link onContentSet} &#8594;  {@link onContentReady}.
       * @param {String} html HTML-разметка, из которой будет создан документ, отображаемый в iframe.
       * @param {Number} [maxLength] Устанавливает максимально допустимую длина html для отображения (в символах).
       * @returns {Boolean} Признак: будет ли открыт HTMLView.
       * @see onContentReady
       * @see getHTML
       */
      setHTML: function(html, maxLength) {
         var
            self = this,
            forAliveOnly = function(func) {
               return forAliveOnlyHelpers(func, self);
            };

         if (typeof maxLength === 'number' && html.length > maxLength) {
            // Размер HTML превысил допустимый, не загружаем его в HTMLView и
            // возвращаем false для дальнейшей обработки.
            return false;
         }

         function CreatLinkCss(pathFile) {
            pathFile = getResourceUrl(pathFile);

            return '<link rel="stylesheet" href="' + Env.constants.resourceRoot + pathFile + '">';
         }

         this._options.docType = 'string';
         this._loaded = false;

         this._createIFrame(forAliveOnly(function(iframe) {
            if(!self._loaded) {
               self._loaded = true;
               self._iframe = iframe;

               var
                  elem = self._container.get(0),
                  visibility = (elem && elem.style.visibility) || '',
                  doc = self.getIframeDocument(),
                  win = self.getIframeWindow(),
                  onDocumentReadyHandler, readyEventName;

               self._container.css('visibility', 'visible');

               doc.open();
               doc.write(html);
               doc.close();

               self._container.css('visibility', visibility);

               onDocumentReadyHandler = forAliveOnly(function() {
                  var head, fontsUrl;

                  if (doc.readyState !== 'interactive' && doc.readyState !== 'complete') {
                     // Не запускаем обработку, если документ еще не загружен (актуально в случае
                     // readyStateChange в IE)
                     return;
                  }

                  head = $(doc).find('head');
                  fontsUrl = self._options.tensorFontsUrl || Env.constants.tensorFontsUrl;

                  if (readyEventName) {
                     // Если была сделана подписка, чистим ее
                     doc.removeEventListener(readyEventName, onDocumentReadyHandler);
                  }

                  head.append('<meta name="format-detection" content="telephone=no">');
                  head.append('<style media="screen, print">body { margin: 0; } a[href^="tel:"] { text-decoration: none; color: inherit; }</style>');

                  //Установим минимальную ширину контента(еслиона задана), для того чтобы правильно вычислился размер окна
                  if (self._options.minWidth) {
                     head.append('<style>.ws-register-table { min-width: ' + self._options.minWidth + 'px; } </style>');
                  }

                  if (fontsUrl instanceof Array) {
                     fontsUrl.forEach(function(Url) {
                        if (Url) {
                           head.append(CreatLinkCss(Url));
                        }
                     });
                  } else {
                     if (fontsUrl) {
                        head.append(CreatLinkCss(fontsUrl));
                     }
                  }

                  //Добавляем функцию через eval, потому что добавление тега <script> тут почему-то не срабатывает, хотя документ и готов.
                  //Добавлять же до готовности документа или через doc.write вперемешку с входным html как-то стрёмно
                  var script = 'window.printPage = function printPage() {window.print();};';

                  if (win['eval']) { //в IE8 в ифреймах у окна нет функции eval, а есть execScript
                     win.eval(script);
                  } else {
                     win.execScript(script)
                  }

                  self._iframeReady.addCallback(forAliveOnly(function() {
                     self._notify('onContentSet', 'string', html);
                     self._contentLoaded();
                  }));

                  self._iframeReady.callback();
               }, self);

               if (doc.readyState === 'interactive' || doc.readyState === 'complete') {
                  // DOM документа внутри iframe'а уже загружен
                  onDocumentReadyHandler();
               } else {
                  if (Env.detection.isIE && Env.detection.IEVersion <= 10) {
                     // В IE 10 и ранее (или в IE 11 версии в режиме совместимости с IE 10 для iframe)
                     // DOMContentLoaded не срабатывает. Слушаем вместо него 'readystatechange' и дожидаемся,
                     // когда readyState документа станет 'complete'
                     readyEventName = 'readystatechange';
                  } else {
                     // Не используем jQuery $(doc).ready, потому что он срабатывает слишком рано, нопример
                     // когда doc.write приостанавливается, встретив тег link со ссылкой на стиль. DOMContentLoaded
                     // срабатывает тогда, когда doc.write дописывает все элементы до конца
                     readyEventName = 'DOMContentLoaded';
                  }
                  doc.addEventListener(readyEventName, onDocumentReadyHandler);
               }
            }
         }));

         return true;
      },
      /**
       * Возвращает текущее содержимое body iframe'а
       * @return {String}
       * @see setHTML
       * @see onContentReady
       */
      getHTML: function(){
         return this.getIframeDocument().body.innerHTML;
      },
      /**
       * Устанавливает шаблон для контрола.
       * @remark
       * При выполнении метода генерируется событие {@link onContentSet}.
       * @param {String} templateName
       * @deprecated Не использовать. Без замены. Удаляется с 3.8
       */
      setTemplate: function(templateName){
         var self = this;
         this._options.template = templateName; // Может быть Deferred
         this._options.docType = 'template';
         this._iframe = undefined;

         return this._runInBatchUpdate('setTemplate', function() {
            return self._loadTemplate().addCallback(forAliveOnlyHelpers(function() {
               self._notify('onContentSet', 'template', templateName);
            }, self));
         });
      },
      /**
       * Устанавливает адрес страницы, которая будет загружена в iframe.
       * @remark
       * При использовании метода происходят события: {@link onIframeCreate} &#8594; {@link onContentSet} &#8594;  {@link onContentReady}.
       * @param {String} url
       */
      setUrl: function(url){
         var
            self = this,
            forAliveOnly = function(func) {
               return forAliveOnlyHelpers(func, self);
            };

         this._loaded = false;

         this._createIFrame({ src: url }, forAliveOnly(function(iframe){
            self._iframe = iframe;
            self._loaded = true;

            var doc = self.getIframeDocument();

            $(doc).ready(forAliveOnly(function() {

               self._iframeReady.addCallback(forAliveOnly(function() {
                  self._notify('onContentSet', 'url', url);
                  self._contentLoaded();
               }));

               self._iframeReady.callback();
            }));
         }));
      },
      /**
       * Вызывает печать контрола.
       * @remark
       * При использовании метода происходит событие {@link onBeforePrint}.
       */
      print: function(){
         //Данный деферред стреляет после того, как была вызвана печать, чтобы в callback уничтожить htmlView.
         //Иначе после того как вызван метод print у htmlView не понятно когда можно разрушить область.
         var startPrintDeferred = new cDeferred();
         if(this._iframe){
            if(this._notify('onBeforePrint', this._iframe) !== false){
               var
                  w = this.getIframeWindow(),
                  self = this,
                  forAliveOnly = function(func) {
                     return forAliveOnlyHelpers(func, self);
                  };

               //Унифицируем кросбраузерный зоопарк. Часть браузеров при печати в файл берет имя файла из title
               //основного окна, часть из title у iframe.
               if (!w.document.title) {
                  w.document.title = window.document.title;
               }

               if(Env.constants.browser.opera){
                  var
                     clone = this.getIframeDocument().documentElement,
                     oldDocument = window.document.documentElement,
                     css = $('<style type="text/css">' +
                     '@media screen{' +
                     'body > *, body {display: none !important;}' +
                     '}' +
                     '</style>');

                  window.document.replaceChild(clone, window.document.documentElement);
                  $('head').append(css);
                  setTimeout(forAliveOnly(function(){
                     window.focus();
                     window.print();
                     setTimeout(forAliveOnly(function(){
                        window.document.replaceChild(oldDocument, window.document.documentElement);
                        var iframeDocument = self.getIframeDocument();
                        iframeDocument.replaceChild(clone, iframeDocument.documentElement);
                        setTimeout(forAliveOnly(function(){
                           css.remove();
                           startPrintDeferred.callback();
                        }), 100);
                     }), 100);
                  }), 500);
               } else {
                  var ieHiddenPrintFix = false,       //Если мы печатаем в ие ифрейм, который скрыт сам или находится в блоке с visibility: hidden
                     iframe = $(this._iframe),        //То будет печататься вся страница, а не только ифрейм
                     opacity;                        //Для решения этой проблемы перемещаю ифрейм в боди и делаю видимым, уменьшая прозрачность до 0
                  if(Env.constants.browser.isIE && !iframe.is(':visible')){
                     ieHiddenPrintFix = true;
                     iframe.parents().addBack().each(function(){
                        var $this = $(this);
                        $this.data('display', $this.css('display'));
                        $this.data('visibility', $this.css('visibility'));
                        $this.data('ws-hidden', $this.hasClass('ws-hidden'));
                        $this.css({
                           'display': 'block',
                           'visibility': 'visible'
                        });
                        $this.removeClass('ws-hidden');
                     });
                     opacity = iframe.css('opacity');
                     iframe.css({
                        opacity: 0
                     });
                  }
                  setTimeout(forAliveOnly(function(){
                     (self._iframe.contentWindow || w).focus();
                     setTimeout(forAliveOnly(function(){
                        if (Env.constants.browser.chrome && window.opener) {
                           /*TODO убрать это условие после выхода 36 хрома
                           http://stackoverflow.com/questions/23071291/javascript-window-print-in-chrome-closing-new-window-or-tab-instead-of-cancel*/
                           var incorrectClosingHandler = forAliveOnly(function () {
                              return 'Покидая эту страницу, вы заблокируете родительское окно!\n' +
                                     'Пожалуйста, выберите "Остаться на этой странице" и используйте кнопку' +
                                     '"Отмена" перед закрытием вкладки.\n';
                           });
                           Env.constants.$win.bind('beforeunload', incorrectClosingHandler);
                           w.printPage();
                           Env.constants.$win.unbind('beforeunload', incorrectClosingHandler);
                        }
                        else {
                           w.printPage();
                        }
                        if(ieHiddenPrintFix){
                           iframe.css('opacity', opacity)
                              .parents().addBack().each(function(){
                              var $this = $(this);
                              $this.data('display', $this.css('display'));
                              $this.data('visibility', $this.css('visibility'));
                              $this.css({
                                 'display': $this.data('display'),
                                 'visibility': $this.data('visibility')
                              });
                              if($this.data('ws-hidden')){
                                 $this.addClass('ws-hidden');
                              }
                           });
                        }
                        startPrintDeferred.callback();
                     }), 0);
                  }), 100);
               }
            }
         }
         return startPrintDeferred;
      },
      _createFrameId: function() {
         return this._iframeId || (this._iframeId = randomId('ws-htmlview-frame-'));
      },
      _getCurrIframeCtrl: function(){
         var iframe = $('#' + this._createFrameId());
         if(iframe.length !== 0 && iframe.get(0).contentDocument && iframe.get(0).contentWindow) {
            return iframe;
         } else {
            return false;
         }
      },
      /**
       * Возвращает объект Document для текущего iframe'а.
       * @returns {Document}
       */
      getIframeDocument: function(){
         if (this._iframe && this._iframe.contentDocument) {
            return this._iframe.contentDocument;
         } else {
            if(Env.constants.browser.isIE){
               return window.frames[this._createFrameId()].document;
            }
         }
      },
      /**
       * Возвращает объект Window для текущего iframe'а.
       * @returns {Window}
       */
      getIframeWindow: function(){
         if (this._iframe && this._iframe.contentWindow) {
            return this._iframe.contentWindow;
         } else  {
            if (Env.constants.browser.isIE) {
               return window.frames[this._createFrameId()];
            }
         }
      },
      /**
       * Возвращает deferred, когда контрол готов.
       * @returns {Core/Deferred}
       */
      getReadyDeferred: function(){
         return this._dReady;
      },
      /**
       * Добавляет в iframe новый CSS-стиль.
       * @param {String} path Путь (url) к CSS-файлу.
       * @return {Core/Deferred}
       */
      addStyle: function(path){
         if (this._options.docType === 'template') {
            throw new Error('Функцию $ws.proto.HTMLView.addStyle нельзя использовать при опции docType === "template"');
         }

         var
            self = this,
            forAliveOnly = function(func) {
               return forAliveOnlyHelpers(func, self);
            };

         return this._iframeReady.addCallback(forAliveOnly(function(){
            var
               styleTag = self.getIframeDocument().createElement('link'),
               deferred = new cDeferred(),
               doc = self.getIframeDocument();

            path = path.substr(0, 1) == '/' ? urlWithHost(path) : urlWithHost(Env.constants.wsRoot + path);
            styleTag.setAttribute('rel', 'stylesheet');
            styleTag.setAttribute('href', path);
            $(doc).find('head').append(styleTag);

            var img = $('<img />', {style: 'position: absolute; visibility: hidden; left: 0; top: 0; display: block;'});
            img.on('error', forAliveOnly(function() {
               // Сначала удалим лишний элемент, а уж потом начнем колбечить
               img.remove();
               deferred.callback();
            })).appendTo(doc.body).prop('src', path);

            return deferred;
         }));
      },
      /**
       * Возвращает текущий объект iframe.
       * @returns {HTMLIFrameElement}
       */
      getIframe: function(){
         return this._iframe;
      },
      /**
       * Возвращает html-контейнер, в котором содержится текущий iframe.
       */
      getIframeContainer: function(){
         return this._iframeContainer;
      },
      /**
       * Скрывает html-контейнер, в котором содержится текущий iframe.
       * @see showIframeContainer
       * @see getIframeContainer
       */
      hideIframeContainer: function(){
         if (Env.constants.browser.isIE) {
            this._iframeContainer.css('opacity', 0);
         }
         else if (Env.constants.browser.opera) {
            this._iframeContainer.css('display', 'none');
         }
         else {
            this._iframeContainer.css('visibility', 'hidden');
         }
      },
       /**
        * Отображает html-контейнер, в котором содержится текущий iframe.
        * @see hideIframeContainer
        * @see getIframeContainer
        */
      showIframeContainer: function(){
         if (Env.constants.browser.isIE) {
            this._iframeContainer.css('opacity', 1);
         }
         else if (Env.constants.browser.opera) {
            this._iframeContainer.css('display', 'block');
         }
         else {
            this._iframeContainer.css('visibility', 'visible');
         }
      },
      destroy: function() {
         if (this._iframe && this._iframe.contentDocument) {
            $(this._iframe.contentDocument).off('mouseup touchend', this._mouseUpHandler);
         }
         HTMLView.superclass.destroy.apply(this, arguments);
      }
   });

   return HTMLView;
});
