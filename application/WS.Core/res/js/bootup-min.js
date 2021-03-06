define('bootup-min', [
   'require',
   'Core/Deferred',
   'Core/ParallelDeferred',
   'Env/Event',
   'Core/core-instance',
   'Core/Context',
   'Env/Env',
   'Core/CommandDispatcher',
   'Core/helpers/Array/uniq',
   'Core/helpers/Hcontrol/doAutofocus',
   'Core/helpers/Hcontrol/getChildContainers',
   'Core/Serializer',
   'Core/markup/parse',
   'Core/helpers/Hcontrol/configStorage',
   'Core/moduleStubs',
   'View/decorators',
   'Core/helpers/VdomCtxPlugin',
   'Core/helpers/vdomCtxFields',
   'Core/helpers/Hcontrol/makeInstanceCompatible',
   'is!compatibleLayer?Lib/Control/Control.compatible',
   'is!compatibleLayer?Lib/Control/AreaAbstract/AreaAbstract.compatible',
   'is!compatibleLayer?Lib/Control/BaseCompatible/BaseCompatible'
], function(
   require,
   Deferred,
   ParallelDeferred,
   EnvEvent,
   coreIns,
   Context,
   Env,
   CommandDispatcher,
   ArrayUniq,
   doAutofocus,
   getChildContainers,
   Serializer,
   parseMarkup,
   configStorage,
   mStubs,
   decorators,
   VdomCtxPlugin,
   vdomCtxFields,
   makeInstanceCompatible
) {

   "use strict";

   var rootComponents = [];

   function closeWindowWithIPadFix() {
      // на iPad просто так закрытие окна через window.close не работает, но можно попробовать сделать грязный хак
      // http://stackoverflow.com/questions/10712906/window-close-doesnt-work-on-ios
      if (Env.detection.isMobileSafari) {
         setTimeout(window.close, 301);
      } else {
         window.close();
      }
   }

   function declareCloseCommand(instance) {
      if (coreIns.instanceOfModule(instance, 'Deprecated/Controls/RecordArea/RecordArea') && !window.previousPageURL) {
         instance.close = function() {};
      }
      CommandDispatcher.declareCommand(instance, 'close', instance.close ? instance.close : function() {
         closeWindowWithIPadFix();
      });
   }

   function getAdditionalContainers(body, readyContainers) {
      var components = body.find("[data-component]");
      return components.toArray().filter(function (comp) {
         if (readyContainers.indexOf(comp) === -1) {
            comp.additionalControl = true;
            return true;
         }
      })
   }

   /**
    * Оживляет компоненты на страницы без params
    * @param [bootupReady]
    * @return {Core/Deferred}
    */
   function provideInnerComponents(bootupReady, serializerCtor) {
      var
         $document = $(document),
         containers = getChildContainers($document, "[data-component]", function (elem) {
            return $(elem).parent('#contentArea').length || elem.hasAttribute('page-content');
         });

      /**
       * Находим все элементы с атрибутом config внутри
       * и если один из них построен по маске: cfg-ЧИСЛО - значит это компонент
       * с порядковым номером. Отсортируем оживление верхних контейнером по этим cfg
       * Учитывая, что внутри у нас асинхронности нет - там номера будут идти по порядку.
       */
      var sorted = containers.reduce(function(res, container){
         var configs = $(container).find('[config]');
         container.__minCfg = -1;
         for (var i=0;i<configs.length;i++){
            var str = configs.eq(i).attr("config");
            if (/^cfg-[0-9]+$/.test(str)) {
               container.__minCfg = parseInt(str.split("-")[1],10);
               break;
            }
         }
         res.push(container);
         return res;
      }, []);

      sorted = sorted.sort(function(a, b){
         if (a.__minCfg === -1 && b.__minCfg === -1) {
            return 0;
         } else if (a.__minCfg === -1) {
            return 1;
         } else if (b.__minCfg === -1) {
            return -1;
         } else {
            return (a.__minCfg - b.__minCfg);
         }
      });

      var additionalContainers = getAdditionalContainers($document, sorted),
         configs = sorted.concat(additionalContainers).reduce(function(res, container) {
            // Если на данном элементе уже инициализирован контрол, не делаем повторную инициализацию
            if (!container.wsControl) {
               var
                  component = container.getAttribute("data-component"),
                  module = component,
                  creator;

               if (component === "OnlineSbisRu/Base/View") {
                  /**
                   * Для MinCoreView нам нужно сразу указать желание генерировать
                   * idшники в textMarkupGenerator
                   * Этот компонент рождает компоненты из внутренней верстки, а значит,
                   * все что не лежит в верстке - это новые компоненты, для которых будем генерировать
                   * рандомный ИД
                   */
                  Context.global.setValue('bootupReadyFlagForGenerateId', true);
               }
               if (!container.additionalControl) {
                  creator = function () {
                     var
                        cfg = parseMarkup(container) || {},
                        ctor = require(module);

                     cfg.iWantBeWS3 = true;
                     cfg._fromBootupMin = true;
                     var c = new ctor(cfg);
                     if (c._template) {
                        makeInstanceCompatible(c, cfg);

                        if (c.isBuildVDom()) {
                           var el = cfg.element[0] ? cfg.element[0] : cfg.element;
                           el.wsControl = c;

                           // Для VirtualDom контролов запускаем синхронизацию через привязку к корневому элементу дерева
                           if (!c.VDOMReady) {
                              // При вызове mountToDom или setContainer для vdom
                              // компонента будет вызван _beforeMount. В нем
                              // опции еще не должны быть установлены
                              if (c.mountToDom) {
                                 c.mountToDom($(el), cfg, ctor);
                              } else {
                                 c.setContainer($(el));
                              }

                              // После _beforeMount можно сохранить опции в
                              // инстансе
                              if (c.saveOptions) {
                                 c.saveOptions(cfg);
                              } else {
                                 c._options = cfg;
                              }
                           }
                        } else {
                           c.setParent(null);
                           if (typeof c.init === "function")
                              c.init();
                        }
                     }
                     if (bootupReady && c.getReadyDeferred) {
                        bootupReady.push(c.getReadyDeferred());
                     }
                     if (rootComponents.indexOf(component) > -1) {
                        declareCloseCommand(c);
                     }
                  };

                  res.creators.push(creator);
               }

               res.modules.push(module);
            }

            return res;
         }, {creators: [], modules: []}),
         modulesReady = mStubs.require(ArrayUniq(configs.modules));

      function notifyBootupReady(error) {
         bootupReady && bootupReady.done().getResult().addCallback(function() {
            // Кинем событие о конце загрузки основного шаблона
            EnvEvent.Bus.globalChannel().setEventQueueSize('bootupReady', 1);
            EnvEvent.Bus.globalChannel().notify('bootupReady', {
               error: error
            });
            Context.global.setValue('bootupReadyFlagForGenerateId', true);
         });
      }

      return modulesReady.addCallback(function() {
         var serializer;
         if (typeof window.componentOptions === 'string') {
            if (window.componentOptionsEscaped) {
               window.componentOptions = decorators.unescape(window.componentOptions);
            }
            // Символы начала HTML-комментария экранируются в componentOptions в последовательность !@#$^COMMENT_START^$#@!,
            // чтобы опции можно было безопасно вставить в верстку страницы. Перед десериализацией, опции нужно деэкранировать
            var unescapedCommentsOptions = (window.componentOptions || '{}').replace(/\!\@\#\$\^COMMENT_START\^\$\#\@\!/g, '<!--');
            serializer = new serializerCtor();
            configStorage.merge(JSON.parse(unescapedCommentsOptions, serializer.deserialize));
         }

         // автофокусировка, сфокусирует компонент с классом ws-autofocus
         function doAutoFocus(e) {
            if (doAutofocus.findAutofocus(e.target).length) {
               isAutofocused = doAutofocus(e.target);
            }
         }
         var $body = $('body'),
            isAutofocused = false;
         $body.on('onReady', doAutoFocus);

         configs.creators.forEach(function(creator) {
            creator();
         });

         $body.off('onReady', doAutoFocus);
         if (!isAutofocused) {
            doAutofocus($('[data-component]').eq(0));
         }

         notifyBootupReady();
      }).addErrback(function(error) {
         Env.IoC.resolve('ILogger').error('bootup', (error && error.message) || error);
         // если произошла ошибка, прокинем ее в событие bootupReady
         notifyBootupReady(error);
      });
   }

   /**
    * Может быть вызван в двух вариантах
    *
    * Загрузит страницу page в контейнер container. Не сигнализирует bootupReady.
    * @param {String} page
    * @param {jQuery} container
    * @param {String} [areaTemplate]
    * 1. $ws.core.bootup(page, container, areaTemplate)
    *
    * Найдет все элементы, помеченные class="ws-root-template" и загрузит в них шаблоны, указанные в аттрибуте data-template-name.
    * Сигнализирует bootupReady.
    * 2. $ws.core.bootup()
    */
   function bootup(page, container, areaTemplate, serializer) {
      $(document).ready(function() {
         var bootupReady = new ParallelDeferred({stopOnFirstError: false}),
            params = Context.global.getValue('editParams') || Context.global.getValue("printParams"),
            templates = [];

         Env.constants.decoratedLinkService = '/linkdecorator/service/';

         if (arguments.length === 0 || (arguments.length == 1 && typeof arguments[0] !== 'string')) {
            $('.ws-root-template').each(function() {
               var ctr = $(this),
                  templateName = ctr.data('template-name');

               if (templateName.indexOf('/') > -1 && params == undefined) {
                  rootComponents.push(templateName);
                  ctr.attr('data-component', templateName);
               } else {
                  templates.push({templateName: templateName, ctr: ctr});
               }
            });

            if (templates.length > 0) {
               require(['old-bootup'], function(oldBootupFunction) {
                  for (var i = 0, len = templates.length; i < len; i++) {
                     var def = new Deferred();
                     bootupReady.push(def);
                     oldBootupFunction(templates[i].templateName, templates[i].ctr, null, def);
                  }

                  provideInnerComponents(bootupReady, serializer);
               });
            } else {
               provideInnerComponents(bootupReady, serializer);
            }
         } else {
            require(['old-bootup'], function(oldBootupFunction) {
               oldBootupFunction(page, container, areaTemplate);
            });
         }
      });
   }

   return function(page, container, areaTemplate, serializer) {
      bootup.call(this, page, container, areaTemplate, serializer || Serializer);

      var context = vdomCtxFields();

      VdomCtxPlugin(function() {
         return context;
      });
   };
});
