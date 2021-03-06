define('Browser/_TransportOld/FastTemplate',[
   'Browser/_TransportOld/Template',
   'Env/Env',
   'Core/helpers/Number/randomId',
   'Core/core-attach',
   'Core/Context',
   'Core/Deferred',
   'Core/CommandDispatcher',
   'Core/core-instance',
   'Core/moduleStubs'
], function(
   Template,
   Env,
   randomId,
   core_attach,
   Context,
   Deferred,
   CommandDispatcher,
   cInstance,
   moduleStubs
) {
   var FastTemplate;

   var forEach = function (obj, iterateCallback, context) {
      if (obj === null || obj === undefined || obj.length === 0)
         return;

      var i, l, key;
      if (obj instanceof Array) {
         if (obj.forEach) {
            //В Firefox-е именно здесь глючит цикл обхода - пропускает некоторые итерации
            //Заменяю forEach на родной массивский - он работает нормально
            obj.forEach(iterateCallback, context);
         } else {
            l = obj.length;
            for (i = 0; i < l; i++) {
               if (i in obj) {
                  iterateCallback.call(context, obj[i], i, obj);
               }
            }
         }
      } else if ('length' in obj && (obj.length - 1) in obj) {
         /**
          * Это место переписано так не случайно.
          * При необъяснимых обстоятельствах на iOS 8.1 старая проверка
          * (obj.length === +obj.length) для obj === { 0: ??? }
          * давала положительный результат (obj.length в момент проверки был === 1)
          * Но следующая строка при чтении obj.length уже давала как и положено `undefined`
          * Как показали опыты, переписанная нижеследующим образом проверка не багает
          */
         l = parseInt(obj.length, 10);
         for (i = 0; i < l; i++) {
            if (i in obj) {
               iterateCallback.call(context, obj[i], i, obj);
            }
         }
      } else {
         for (key in obj) {
            if (obj.hasOwnProperty(key)) {
               iterateCallback.call(context, obj[key], key, obj);
            }
         }
      }
   };

   var filter = function (obj, iterateCallback, context) {
      var results = [];
      if (obj === null || obj === undefined)
         return results;

      //todo: обработать jqueryObj
      forEach(obj, function (value, index, list) {
         if (iterateCallback) {
            if (iterateCallback.call(context, value, index, list))
               results[results.length] = value;
         } else if (!!value) {
            results[results.length] = value;
         }
      }, context);

      return results;
   };

   var reduce = function (obj, iterator, memoInitial, context) {
      var initial = arguments.length > 2, memo = memoInitial;

      if (obj === null || obj === undefined)
         obj = [];
      //todo: обработать jqueryObj
      forEach(obj, function (value, index, list) {
         if (!initial) {
            memo = value;
            initial = true;
         } else {
            memo = iterator.call(context, memo, value, index, list);
         }
      });

      if (!initial)
         throw new TypeError('Reduce of empty array with no initial value');

      return memo;
   };


   var insertCss = function (style, waitApply, hint) {
      /**
       * Возвращает тэг для вставки css
       * @return {*}
       */
      function getCurStyleHolder() {
         var tag;
         if ("getElementsByClassName" in document) {
            tag = document.getElementsByClassName("ws-style-holder-current")[0];
         }
         else {
            var styles = document.getElementsByTagName("style");
            for (var i = 0, l = styles.length; i < l; i++) {
               if (hasClass(styles[i], "ws-style-holder-current")) {
                  tag = styles[i];
                  break;
               }
            }
         }
         tag = tag || createStyleHolder();
         return tag;
      }

      /**
       * Создает новый тэг style
       * @return {HTMLElement}
       */
      function createStyleHolder() {
         var sHolder = document.createElement('style');
         var head = document.getElementsByTagName('head')[0];

         sHolder.setAttribute('type', 'text/css');
         sHolder.setAttribute('media', 'all');
         sHolder.className = 'ws-style-holder ws-style-holder-current';
         head.appendChild(sHolder);

         return sHolder;
      }

      /**
       * Проверяет есть ли у элемента указанные классы
       * @param {HTMLElement} element.
       * @param {String} cls классы через пробел.
       * @return {Boolean}
       */
      function hasClass(element, cls) {
         var
            className = ' ' + element.className + ' ',
            m = cls.split(" ");
         for (var i = 0, l = m.length; i < l; i++) {
            if (className.indexOf(' ' + m[i] + ' ') == -1) {
               return false;
            }
         }
         return true;
      }

      /**
       * Функция проверки применения стилей
       * @returns {boolean}
       */
      function checkMarkerDiv() {
         var pos = markerDiv.css('position'),
            ok = (pos === 'absolute'),
            timeout = +new Date() - start > Env.constants.styleLoadTimeout,
            notifierDiv = $('#onlineChecker');

         if (ok || timeout) {
            markerDiv.remove();
            if (waitInterval) {
               clearInterval(waitInterval);
               if(timeout) {
                  notifierDiv.text(rk("Страница загружается слишком долго. Попробуйте перезагрузить страницу"));
                  notifierDiv.css('display', '');
                  notifierDiv.css('zIndex', 9999);
                  result.callback();
               } else {
                  result.callback();
               }
            }
         }
         return ok;
      }

      var
         markerCss = '',
         result = null,
         markerDivId, markerDiv, waitInterval, start, styleHolder;

      if (waitApply) {
         markerDivId = randomId('cssReady-');

         markerDiv = $('<div id="' + markerDivId + '" style="display: none;" />').appendTo($('body'));
         markerCss = '#' + markerDivId + ' { position: absolute; }';
      }

      if (Env.compatibility.standartStylesheetProperty) {
         styleHolder = createStyleHolder();
         styleHolder.appendChild(document.createTextNode(style + markerCss));
      }
      else {
         styleHolder = getCurStyleHolder();
         style = style + markerCss;
         var
            cssText = styleHolder.styleSheet.cssText,
            curRulesCnt = (cssText.match(/\{|,/g) || []).length,
            insRulesCnt = (style.match(/\{|,/g) || []).length;

         if (curRulesCnt + insRulesCnt > 4000) {
            styleHolder.className = 'ws-style-holder';
            styleHolder = createStyleHolder();
         }

         try {
            styleHolder.styleSheet.cssText += style;
         } catch (e) {
            Env.IoC.resolve('ILogger').error('insertCss', 'Failed to insert styles to document! IE8/9 Stylesheet limit exceeded (31 per document)?');
            throw e;
         }
      }

      if (waitApply) {
         start = +new Date();
         if (!checkMarkerDiv()) {
            result = new Deferred();
            result.addErrback(function (e) {
               return e;
            });
            waitInterval = setInterval(checkMarkerDiv, 1);
         }
      }

      return result;
   };

   FastTemplate = Template.extend({
      $protected: {
         _options: {
            template: ''
         },
         _dom: null,
         _rootConfig: {},
         _controlsConfig: []
      },
      $constructor: function() {
         var self = this;
         this._dom = document.createElement('div');
         this._dom.innerHTML = this._options.template;
         if (!this._dom.firstChild) {
            throw new Error("Wrong template (" + this.getName() + ") came from server");
         }

         var firstChild = this._dom.firstChild;
         this._rootConfig = JSON.parse(firstChild.getAttribute('templateConfig'));
         this._controlsConfig = JSON.parse(firstChild.getAttribute('config'));

         firstChild.removeAttribute('templateConfig');
         firstChild.removeAttribute('config');

         for (var key in this._controlsConfig.functions) {
            if (this._controlsConfig.functions.hasOwnProperty(key)) {
               var
                  val = this._controlsConfig.functions[key],
                  path = '["' + val.split('/').join('"]["') + '"]',
                  acessor = new Function("s", "val", "return arguments.length == 1 ? s" + path + " : (s" + path + " = val);"),
                  configRoot = self._controlsConfig,
                  fSpec = acessor(configRoot).split('#');
               switch (fSpec[0]) {
                  case 'function':
                     self._dReady.push(core_attach.getHandler(fSpec[1]).addCallback(function(f) {
                        acessor(configRoot, f);
                     }));
                     break;
                  case 'moduleFunc':
                     var
                        m = fSpec[1].split("/"),
                        fName = m.length > 1 ? m.pop() : '',
                        mName = m.join('/');
                     self._dReady.push(moduleStubs.require(mName).addCallback(function(mod) {
                        var fn = mod[0][fName];
                        if (!fn) {
                           Env.IoC.resolve('ILogger').error(rk('Шаблон') + ' ' + self.getName(),
                              rk('В шаблоне указан обработчик, но в модуле') + ' ' + mName + ' ' + rk('не найдена функция')
                              + ' ' + fName + ' ' + rk('для этого обработчика'));
                        } else {
                           fn.wsHandlerPath = mName + (fName ? ':' + fName : '');
                           acessor(configRoot, fn);
                        }
                     }));
                     break;
                  case 'floatArea':
                     acessor(configRoot, function(event) {
                        var topParentContainer = this.getTopParent().getContainer();
                        this.setEnabled(false);//Отключаем кнопку, чтобы юзер 100500 раз панельку не вызывал
                        core_attach.attachInstance('Lib/Control/FloatArea/FloatArea', {
                           opener: this,
                           template: fSpec[1],
                           target: topParentContainer,//$('body'),
                           side: 'right',
                           autHide: true,
                           animationLength: 300,
                           offset: {
                              x: 0,
                              y: (window.scrollY > topParentContainer.offset().top) ? window.scrollY : 0
                           },
                           handlers: {
                              'onAfterClose': function() {
                                 this.getOpener().setEnabled(true);//включаем обратно
                              }
                           }
                        });
                     });
                     break;
                  case 'dialog':
                     acessor(configRoot, function() {
                        var
                           finishContextDfr = new Deferred(),
                           linkedCtx = Context.createContext(finishContextDfr, null, this.getLinkedContext());

                        core_attach.attachInstance('Lib/Control/Dialog/Dialog', {
                           template: fSpec[1],
                           opener: this,
                           context: linkedCtx,
                           handlers: {
                              onDestroy: function() {
                                 finishContextDfr.callback();
                              }
                           }
                        });
                     });
                     break;
                  case 'command':
                     var fn = function(event) {
                        event.setResult(CommandDispatcher.sendCommand.apply(CommandDispatcher, [
                           this, fSpec[1]
                        ].concat(Array.prototype.slice.call(arguments, 1))));
                     };
                     fn.isCommand = true;
                     acessor(configRoot, fn);
                     break;
                  case 'newpage':
                  case 'page':
                     acessor(configRoot, function() {
                        var link = typeof this.getOpenLink === 'function' ? this.getOpenLink() || fSpec[1] : fSpec[1];
                        if (fSpec[0] == 'page') {
                           window.location = link;
                        } else {
                           window.open(link);
                        }
                     });
                     break;
                  case 'menu':
                     acessor(configRoot, function() {
                        if (cInstance.instanceOfModule(this, 'Deprecated/Controls/Button/Button')) {
                           this._options.menuName = fSpec[1];
                           this.unsubscribe('onActivated', arguments.callee);
                           this._initMenu();
                           this._notify('onActivated');
                        }
                     });
                     break;
               }
            }
         }

         for (var key in this._rootConfig) {
            if (this._rootConfig.hasOwnProperty(key)) {
               var
                  val = this._rootConfig[key];
               if (key.substr(0, 2) == 'on') {
                  var
                     handlers = val.split('|');
                  handlers.forEach(function(val, idx) {
                     self._dReady.push(core_attach.getHandler(val).addCallback(function(f) {
                        self._loadedHandlers[key] = self._loadedHandlers[key] || [];
                        self._loadedHandlers[key][idx] = f;
                        return f;
                     }));
                  });
               }
            }
         }
         if (this._rootConfig.style) {
            var cssReady = insertCss(this._rootConfig.style, true, this.getName());
            if (cssReady) {
               this._dReady.push(cssReady);
            }
         }

         var include = filter(this._dom.firstChild.childNodes, function(child) {
            return child.nodeName == 'I';
         });
         if (include.length > 0) {
            // Не может быть несколько инклюдов... Всегда берем первый
            var spec = include[0].getAttribute('spec');
            if (spec) {
               try {
                  spec = JSON.parse(spec);
               } catch (e) {
                  spec = false;
               }
               if (spec) {
                  spec.js && self._dReady.push(core_attach.attachSequentally(spec.js));
                  spec.css && self._dReady.push(core_attach.attachSequentally(spec.css));
               }
            }
         }

         this._dReady.done();
      },

      _getIncludeDescriptorNodes: function() {
         return filter(this._dom.firstChild.childNodes, function(child) {
            return child.nodeName == 'I';
         });
      },

      _collectAllControlsToPreload: function(source) {
         return reduce(source, function(res, item) {
            if (item.children && item.children.length) {
               res = res.concat(this._collectAllControlsToPreload(item.children));
            }
            res.push(item);
            return res;
         }, [], this);
      },

      isPage: function() {
         return !this._rootConfig.isApplication;
      },

      getConfig: function() {
         for (var attr in this._rootConfig) {
            if (this._rootConfig.hasOwnProperty(attr)) {
               this._mergeAttrToConfig(this._configuration, attr, this._rootConfig[attr]);
            }
         }
         return this._configuration;
      },
      getStyle: function() {
         return this._rootConfig.windowStyle || "";
      },
      getAlignment: function() {
         var
            h = this._rootConfig.HorizontalAlignment,
            v = this._rootConfig.VerticalAlignment;
         return {
            horizontalAlignment: !h ? 'Stretch' : h,
            verticalAlignment: !v ? 'Stretch' : v
         };
      },
      getTitle: function() {
         return this._rootConfig.title;
      },
      createMarkup: function(container) {
         container.html(this._dom.firstChild.innerHTML);
      },
      getDimensions: function() {
         var
            width = this._rootConfig.width + "",
            height = this._rootConfig.height + "";
         return {
            width: !width ? '' : width.toLowerCase() === 'auto' ? 'auto' : width.indexOf('%') >= 0 ? width : parseInt(width, 10) + 'px',
            height: !height ? '' : height.toLowerCase() === 'auto' ? 'auto' : height.indexOf('%') >= 0 ? height : parseInt(height, 10) + 'px'
         };
      },
      getControls: function(parent) {
         if (parent) {
            return [];
         }
         return this._controlsConfig.children;
      },
      needSetZindexByOrder: function() {
         return true;
      }
   });

   return FastTemplate;
});
