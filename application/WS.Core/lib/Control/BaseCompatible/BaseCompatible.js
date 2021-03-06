define('Lib/Control/BaseCompatible/BaseCompatible', [
   'View/Runner',
   'Lib/Control/AreaAbstract/AreaAbstract.compatible',
   'Lib/Control/Control.compatible',
   'Core/Abstract.compatible',
   'Env/Event',
   'Core/helpers/Function/shallowClone',
   'Core/core-hash',
   "Core/CommandDispatcher",
   "Core/WindowManager",
   "Core/core-instance",
   'Core/helpers/Function/forAliveOnly',
   'Env/Env',
   "Core/ParallelDeferred",
   'Core/Deferred',
   'Core/markup/parse',
   'Core/helpers/Hcontrol/configStorage',
   "Core/ContextBinder",
   'Core/helpers/Number/randomId',
   'Vdom/Vdom',
   'Core/core-extend-initializer',
   'Core/helpers/Hcontrol/replaceContainer',
   'Core/helpers/Hcontrol/getChildContainers',
   'View/Executor/Expressions',
   'Core/core-extend',
   'Core/core-simpleExtend',
   "Core/ControlBatchUpdater",
   "Core/Context"
], function (runner,
             AreaAbstractCompatible,
             ControlCompatible,
             AbstractCompatible,
             EnvEvent,
             shallowClone,
             hash,
             CommandDispatcher,
             WindowManager,
             cInstance,
             forAliveOnly,
             Env,
             cParallelDeferred,
             Deferred,
             parseMarkup,
             configStorage,
             ContextBinder,
             randomId,
             Vdom,
             coreInitializer,
             replaceContainer,
             getChildContainers,
             Expressions) {
   'use strict';

   var BaseCompatible;


   /**
    * Перенес этот код из файла Control.compatible сюда
    * Для того, чтобы в режиме работы без слоя совместимости у нас работала функция wsControl()
    */
   if (typeof(jQuery) !== 'undefined') {
      (function( $ ) {
         $.fn.wsControl = function() {
            var control = null,
               element;
            try {
               element = this[0];
               while (element) {
                  if (element.wsControl) {
                     control = element.wsControl;
                     break;
                  }
                  element = element.parentNode;
               }
            }
            catch(e) {}
            return control;
         };
      })( jQuery );
   }

   /**
    * Destroys all components tied to children DOM nodes with 'component' attribute and removes
    * them from configStorage
    * @param node DOM element to destroy children components of
    * @param shouldDestroySelf Should it also destroy the passed node's component
    */
   function destroyInnerComponentsWithConfig(node, shouldDestroySelf) {
      var
         configIds = node.getAttribute('__config'),
         i;

      // проверяем, есть ли children. у SVG тега например нет children
      if (node.children) {
         for (i = 0; i < node.children.length; i++) {
            destroyInnerComponentsWithConfig(node.children[i], true);
         }
      }

      if (configIds) {
         if (shouldDestroySelf) {
            var splitIds = configIds.split(',');

            /*
            * One DOM node can have multiple VDOM components attached to it,
            * in which case their configs will be separated by a comma and we
            * need to clear them all
            */
            for (i = 0; i < splitIds.length; i++) {
               var storedConfig = configStorage.getValue(splitIds[i]);

               /*
               * Only call destroy on VDom components in config storage that have a destroy() method.
               * Don't call destroy on CompoundControls, because VDom doesn't manage them and we don't
               * know if they're going to be used later somehow
               */
               if (storedConfig._template &&
                  typeof storedConfig.destroy === 'function' && !storedConfig._destroyed) {
                  storedConfig.destroy();
               }

               // Remove component from configStorage either way, because memory leaks otherwise
               configStorage.deleteKey(splitIds[i]);
            }
         }

         // Config attribute is not needed after VDom synchronization
         node.removeAttribute('__config');
      }
   }

   /**
     * @class Lib/Control/BaseCompatible/BaseCompatible
     * @author Зуев Д. В.
     * @public
     */
   return BaseCompatible = /** @lends Lib/Control/BaseCompatible/BaseCompatible.prototype */{
       /**
        * @event onAfterVisibilityChange Происходит, когда для компонента изменена видимость.
        * @remark
        * Событие происходит при вызове методов {@link setVisible} и {@link finalRegToParent}.
        * @param {Env/Event:Object} eventObject Дескриптор события.
        * @param {Boolean} value Видимость контрола: true - компонент отображает. false - компонент скрыт.
        */

      //Свойство класса, которое определяет первичность вызова constructor относительно $constructor
      //Свойство обрабатывается в core-extend. Если оно определено, тогда сначала вызываем constructor
      // и по его завершению вызываем цепочку $constructor'ов
      _useNativeAsMain: true,
      iWantVDOM: true,
      /**
       * Используется в IconButton и ScrollContainer, чтобы при изменении видимости или доступности
       * не перерисовывать весь компонент, а накинуть только класс, там выставлено в true
       * В остальных контролах не используется
       */
      _doNotSetDirty: false,
      _isSyncClasses: false,
       childControls: null,
      isBuildVDom: function(){
         return this.iWantVDOM && window && this.isGoodContainer();
      },


      _getMarkup: function(rootKey, isRoot, attributes, isVdom) {

         if (!this._template.stable) {
            Env.IoC.resolve('ILogger').error(this._moduleName, 'Check what you put in _template');
            return '';
         }

         this.repairOptions();
         var decOpts = BaseCompatible._prepareDecOptions.call(this, isRoot);

         var needClean = false;
         if(this._getDecOptions && !Expressions.Attr.checkAttr(this._getDecOptions())){
             needClean = true;
             decOpts = this._getDecOptions();
         }else if(Expressions.Attr.checkAttr(decOpts)){
             decOpts = {};
         }

         if (!Expressions.Attr.checkAttr(attributes)){
            decOpts = Expressions.Attr.processMergeAttributes(attributes, decOpts);
            attributes = null;
         }
         delete decOpts.title;
         delete decOpts.disabled;
         var obj = (attributes && attributes.attributes) || decOpts;
         if (!this._options._logicParent || !this._options._logicParent._template) {
            if (!obj.hasOwnProperty('attr:data-component') && obj['data-component']) {
               obj['attr:data-component'] = obj['data-component'];
               delete obj['data-component'];
            }
            if (!obj.hasOwnProperty('attr:config') && obj['config']) {
               obj['attr:config'] = obj['config'];
               delete obj['config'];
            }

            if (!obj.hasOwnProperty('attr:hasMarkup') && obj['hasMarkup']) {
               obj['attr:hasMarkup'] = obj['hasMarkup'];
               delete obj['hasMarkup'];
            }
         }

         return this._template(this, attributes||{attributes:obj}, rootKey, isVdom, {isSetts: true, fullContext: this.__$$__fullContext}, runner.Run);
      },

      //</editor-fold>

      _prepareDecOptions: function(isRoot){
         var decOptions = this._container ? Expressions.Decorate.createRootDecoratorObject(this.getAttr('config')||this._options.__$config||this._options.id, true, this.getAttr('data-component') || (isRoot && this._moduleName), {}) : {},
            attributes = {},
            dComponent = 'data-component';

         if (this._options.__$fixDecOptions){
            decOptions = this._options.__$fixDecOptions;
            this._options.__$fixDecOptions = null;
         }
         decOptions['config'] = decOptions['config'] || this._options.__$config;
         var attrs = this._container?(this._container.attributes || (this._container.length >0?this._container[0].attributes:{})):{};

         for (var atr in attrs) {
            if (attrs.hasOwnProperty(atr)) {
               var name = attrs[atr] && attrs[atr].name ? attrs[atr].name : atr,
                  value = attrs[atr] && attrs[atr].value || attrs[atr];

               if (value === undefined) {
                  continue;
               }

               if (name === "parent" || name.indexOf("on:")>-1) {
                  continue;
               }

               decOptions[name] = attributes[name] = value;

            }
         }
         /**
          * Этот код вызывается перед каждой перерисовкой.
          * Первый раз мы должны получить пользовательские классы,
          * которые были написаны в верстке через атрибут class.
          * Далее для VDOM'a это более не актуально. Для других
          * контролов нужно доставать классы из верстки, поскольку
          * люди вешают классы на контейнер из кода.
          * */
         if(!(this._isSyncClasses && this.iWantVDOM)) {
            var className = this._options['class'] || '';

            /*КОСТЫЛЬ ЧИСТКА КЛАССОВ*/
            if (attributes['class'] && (typeof attributes['class'] === "string")) {
               attributes['class'] = attributes['class'].replace('ws-enabled', '').replace('ws-disabled', '').replace('ws-hidden', '')
                  .replace('controls-Button__primary', '').replace('controls-Button__default', '').replace('controls-Click__active','')
                  .replace('controls-IconButton__doneBorder','').replace('controls-IconButton__errorBorder','');

               var pathClasses = attributes['class'].split(' ');
               pathClasses.forEach(function(clName){
                  if (className.indexOf(clName) === -1) {
                     className += clName + " ";
                  }
               });
            }

            this._options['class'] = className;
            this._isSyncClasses = true;
         }

         decOptions['class'] = this._options['class'];
         this._options['__$config'] = decOptions['config'];
         if (this._decOptions) {
            if (decOptions[dComponent]) {
               this._decOptions[dComponent] = decOptions[decOptions];
            }
            for (var i in decOptions){
               if (!this._decOptions[i]) {
                  this._decOptions[i] = decOptions[i];
               }
            }
         }
         return Expressions.Attr.checkAttr(decOptions) ? {} : decOptions;
      },

      _showExtendedTooltipCompatible: function() {
         var self = this;
         if(self._isCanShowExtendedTooltip()) {
            self._showExtendedTooltip(true);
         }
      },

      _hideExtendedTooltipCompatible: function () {
         var self = this;
         if (self._isCanShowExtendedTooltip()) {
            this._getInfobox(function(Infobox) {
               if (Infobox.isCurrentTarget(self._getExtendedTooltipTarget())) {
                  Infobox.hide(Infobox.HIDE_TIMEOUT);
               }
            });
         }
      },

      _getInfobox: function(callback) {
         var infoboxModule = 'Lib/Control/Infobox/Infobox';
         if (requirejs.defined(infoboxModule)) {
            return callback(requirejs(infoboxModule));
         } else {
            requirejs([infoboxModule], function (Infobox) {
               return callback(Infobox);
            })
         }
      },

      rebuildMarkup: function(){
         BaseCompatible._setDirty.call(this);
      },

      containerIsComponent: function(){
         return window && this._container && this._container.length >0 && this._container[0].tagName === "COMPONENT";
      },

      render: function (redraw, attr, five) {
         if (!this._template.stable) {
            Env.IoC.resolve('ILogger').error(this._moduleName, 'Check what you put in _template');
            return '';
         }
         this.repairOptions();
         this._onceRendered = true;

         var decOptions = this._prepareDecOptions();
         decOptions = this._getDecOptions?this._getDecOptions():decOptions;

         var markup;

         if (this.isBuildVDom()) {
            if (!this.VDOMReady) {
               this.VDOMReady = true;
               this.mountedFromBC = true;
               Vdom.Synchronizer.mountControlToDOM(this, this.constructor.prototype, this._options, this._container);
               this._pathContainer();
               this._finalInit();
            }
            markup = "";
         } else {
            if (attr && attr.__wasOldControl){
               decOptions = Expressions.Attr.checkAttr(decOptions) ? attr : decOptions;
            } else {
               decOptions = (Expressions.Attr.checkAttr(decOptions) ||  Expressions.Attr.checkAttr(attr)) ? attr : decOptions;
            }
            markup = this._template(this, decOptions, this._compatContext, false, five);
            //for example DSMixin
            if (this.containerIsComponent())
               redraw = true;
         }

         if (redraw && window && this.isGoodContainer() && !this.isBuildVDom()) {
            this._container[0].className = "";
            this.destroyChildControls();
            replaceContainer(this._container, markup);
            this.setContainer(this._container);
         } else if (window) {

            if (!this.isGoodContainer()) {
               var cont = $('[config="' + this._options.__$config + '"]');
               if (cont.length > 0) {
                  this._container = cont;
               }
            }

            if (this.isBuildVDom()) {
               if (!this.VDOMReady) {
                  this.VDOMReady = true;
                  this.mountedFromBC = true;
                  Vdom.Synchronizer.mountControlToDOM(this, this.constructor.prototype, this._options, this._container);
                  this._pathContainer();
                  this._finalInit();
               }
            }
            this.setContainer(this._container);
         }

         return markup;
      },


      _pathContainer: function(){
         if (typeof window !== 'undefined' && window.$){
            this._container = $(this._container);
         }
         this._container[0].wsControl = this;
      },

      _finalInit: function(){
         if (!this._isInitComplete) {
            this.init && this.init();
            this._initComplete && this._initComplete();
            this._isInitialized = true;
            this._allowEvents && this._allowEvents();
            this._constructionDone && this._constructionDone();
            this._isInitComplete = true;
            this._notify("onInit");
         }
      },
      setContainer: function(val) {
         if (!val)
            return;

         if (window) {
            this._container = $(val);
         }
         if (window && this.isGoodContainer()) {
            if (this.iWantVDOM) {
               if (!this.VDOMReady) {
                  this.VDOMReady = true;
                  if (!this._decOptions['ws-creates-context']){
                     this._decOptions['ws-creates-context'] = 'true';
                  }
                  if (!this._decOptions['ws-delegates-tabfocus']){
                     this._decOptions['ws-delegates-tabfocus'] = 'true';
                  }
                  this.mountedFromBC = true;

                  /*
                   * Inner components were instantiated while building container markup and
                   * they will be instantiated again during VDom rebuild.
                   * We should destroy currently existing inner components and clear configStorage
                   * to prevent memory leaks.
                   */
                  destroyInnerComponentsWithConfig(this._container[0]);

                  Vdom.Synchronizer.mountControlToDOM(this, this.constructor.prototype, this._options, this._container, this._decOptions);
                  this._pathContainer();
                  this._finalInit();
               }
               return;
            }
            this._container.unbind();

            /*TODO:: ЧЕКНУТЬ ИЛИ РАЗРЕШИТЬ СОЗДАНИЕ НЕСКОЬЛКИХ КОНТРОЛОВ В НОДЕ*/
            this._container[0].wsControl = this;

            this._initKeyboardMonitor();

            this._subscribeOnReady();

            /**
             * Если parent установлен или компонент рождался не из CompoundControl
             * мы можем оживлять дочерние контролы
             */
            if (this._parent || !this._waitWhileSetParent) {
               this.reviveSuperOldControls();
               this._initInnerAction(this._container);
               this._finalInit();
            }

         }
      },

      reviveComponents: function(){
         return new Deferred().callback();
         //this.reviveSuperOldControls();
      },

      destroyChildControls: function(){
         var
            collection = getChildContainers(this._container, '[data-component]');

         for (var i = 0, l = collection.length; i < l; i++) {
            if (collection[i].wsControl)
               collection[i].wsControl.destroy();
         }
      },

      _forceUpdate: function(def){
         this._notify('onPropertyChange');
      },

      /**
       * Find closest parent in a given container.
       * Used for reviving compound controls inside VDOM controls.
       *
       * @param container
       */
      findParentFromContainer: function(container){
         var finded = false;
         while (!finded) {
            container = $(container).parent();
            if (container.length === 0) {
               return null;
            }
            if (container[0].wsControl){
               return container[0].wsControl;
            } else if (container[0].controlNodes &&
                        container[0].controlNodes[0] &&
                        container[0].controlNodes[0].control){
               return container[0].controlNodes[0].control;
            }

         }
      },

      reviveSuperOldControls: function(){
         this._container = $(this._container);
         var
            collection = this._container.find('[data-component]'),
            collectionItem,
            moduleName,
            cfg, cnstr, dataId, cName, instance = null,
            config;

         try {
            for (var i = 0, l = collection.length; i < l; i++) {
               collectionItem = collection[i];
               if (collectionItem.controlNodes && !collectionItem.wsControl) {
                  collectionItem.wsControl = collectionItem.controlNodes[0].control;
               }
               if (collectionItem.wsControl)
                  continue;
               if (!document.body.contains(collectionItem)) {
                  continue;
               }
               dataId = collectionItem.getAttribute('data-component');
               cName = collectionItem.getAttribute('data-component');
               config = collectionItem.getAttribute('config');
               if (cName) {
                  if (!config) {
                     config = collectionItem.getAttribute('newconfig') || randomId('cfg-');
                     collectionItem.setAttribute('config', config);
                  }
                  cfg = parseMarkup(collectionItem, null);
                  moduleName = cName;
                  cnstr = require(moduleName);

                  if(cnstr === '') {
                     Env.IoC.resolve('ILogger').info('BaseCompatible', 'Модуль "' + moduleName + '" отсутствует в списке загруженных');
                  }

                  if (!cfg.element) {
                     cfg.element = $(collectionItem);
                  }
                  cfg.linkedContext = this.getLinkedContext();
                  /*Если мы не создаем контрол, а просто проходим по ожившим ранее легким инстансам (не vdOM)
                  * тогда нам нужно взять их родителя, т.к. он рассчитан правильно в шаблоне*/
                  cfg.parent = cfg._options&&cfg._options.parent?cfg._options.parent:this;
                  cfg.logicParent = cfg._options&&cfg._options.logicParent?cfg._options.logicParent:this;

                  if (cfg.logicParent && cfg.logicParent._children[cfg.name] && cfg.logicParent._children[cfg.name].isDestroyed && !cfg.logicParent._children[cfg.name].isDestroyed()) {
                     cfg.logicParent._children[cfg.name].setContainer(cfg.element);
                  } else if (!cfg._thisIsInstance) {
                     cfg.eventBusId = randomId();
                     if (cfg.name) {
                        EnvEvent.Bus.channel(cfg.eventBusId, {
                           waitForPermit: true
                        });
                     } else {
                        // Generate name to use when destroying control and applying options
                        cfg.name = randomId("name-");
                     }

                     cfg.parent = this.findParentFromContainer(cfg.element);
                     cfg.logicParent = cfg.parent;

                     var binder = ContextBinder.initBinderForControlConfig(cfg);

                     /* Перед созданием компонента, нужно подтянуть данные из контекста
                      * чтобы верстка строилась правильно
                      * */
                     cfg = binder.getConstructorOptions(this.getLinkedContext(), cnstr, cfg);

                     var inst = new cnstr(cfg);

                     if (inst._template) {
                        inst.setContext(this.getLinkedContext());
                     }

                     /*Легкий инстанс - ScrollContainer не добавляет такое старым контролам
                     * в конструктор
                     * Эта конструкция нужна для обновления и разрушения CompoundControl внутри
                     * vdom контрола*/
                     if (inst._options.__vdomOptions && inst._options.__vdomOptions.controlNode) {
                        inst._options.__vdomOptions.controlNode.instance = inst;
                     }
                     var events = Expressions.Subscriber.getEventsListFromOptions(cfg);
                     Expressions.Subscriber.applyEvents(inst, cfg.parent, events);

                     binder.bindControl(inst, this.getLinkedContext(), 'syncControl');

                  } else {


                     cfg._container = window ? $(cfg.element) : cfg.element;
                     instance = cfg;
                     instance.setParent(this);
                     instance.reviveSuperOldControls();
                     if (instance._template) {
                        instance.setContext(this.getLinkedContext());
                     }
                     cfg = instance._options;
                     var binder = ContextBinder.initBinderForControlConfig(cfg);
                     binder.bindControl(instance, this.getLinkedContext(), 'syncControl');
                  }

               }

            }


            if (!this._cleanupMarkupDataBinding) {
               this._markupDataBinding(true);
            }
         } catch(e){
            Env.IoC.resolve('ILogger').error("Revive compound control in VDom", "Component with name: " + this.getName(), e);
            throw e;
         }

         var domEl = this._container && this._container[0] || this._container;
         if (domEl.parentNode === document) {

            /* Если это корневой компонент и есть слой совместимости, то оживить старые контролы мы должны всего раз,
             * то есть, этот метод должен отработать как bootup
             * иначе начинаются гонки, когда компонент хочет пересинхронизирноваться и внутри появляется какой-то
             * coumpoundControl*/
            this.reviveSuperOldControls = function(){};
         }
      },
      _compatContext: null,
      /**
       * Метод для выравнивания последовательности контекстов
       * Используется в CompoundControls
       * Легкий инстанс создается в шаблонизаторе с контекстом, который создан для построения верстки
       * Потом  при создании контролов старого типа им расставляются контексты от своих родителей,
       * если легкий инстанс попадает в эту последовательность - ему также необходимо установить
       * контекст физического родителя.
       * */
      setContext: function(ctx) {
         this._compatContext.setPrevious(ctx);

         var binder = ContextBinder.initBinderForControlConfig(this._options);
         binder.bindControl(this, this.getLinkedContext(), 'syncControl');
      },

      getLinkedContext: function() {
         return this._compatContext;
      },

      getContext: function() {
         return this.getLinkedContext();
      },

      _initInnerAction: function(container)
      {
         if (typeof(this._containerReady) === 'function')
            this._containerReady(container);
      },

      getAttr: function (attrName) {
         if (!window) {
            return (this._container.attributes && this._container.attributes[attrName]) ? this._container.attributes[attrName].value : '';
         } else if (this._container[0] && this._container[0].startTag) {
            return this._container[0].attributes[attrName];
         } else {
            return $(this._container).attr(attrName);
         }
      },

      setIdProperty: function(){

      },

      fixIcon: function() {
         if (this._options.icon && this._options.icon.indexOf(":")>-1){
            this._options.icon = this._options.icon.split(":")[1];
         }
      },

      isReady: function(){
         return true;
      },

      /**
       * Инициализирует опции, которые зависят от наличия или отсутствия разделения опции
       * (То есть по разному, в зависимости от compound/не-compound типа контрола)
       * @param isSeparatedOptions Разделены ли опции
       * @private
       */
      _initSeparatedTypeOptions: function(isSeparatedOptions) {
         if (!isSeparatedOptions) {
            /**
             * Устанавливаем enabled и visible в default значения если родитель не
             * легкий инстанс
             */
            if (!this._options.parent || !this._options.parent._template) {
               if (this._options.enabled === undefined) {
                  this._options.enabled = true;
               }
               if (this._options.visible === undefined) {
                  this._options.visible = true;
               }
            }
         }
      },

      initOptions: function(){
         if (!this._options)
            this._options = {};

         if (!this._options.eventBusId)
            this._options.eventBusId = randomId("ev-");
         if (!this._options.owner)
            this._options.owner = null;

         if (!this._options.primary)
            this._options.primary = false;
         if (this._options.allowChangeEnable === undefined)
            this._options.allowChangeEnable = true;
         if (!this._options.caption)
            this._options.caption = '';
         if (!this._options.tooltip)
            this._options.tooltip = '';
         if (!this._options.icon)
            this._options.icon = '';
         if (!this._options.text)
            this._options.text = '';
         if (this._options.extendedTooltip === undefined)
            this._options.extendedTooltip = false;
         if (!this._options.name)
            this._options.name = this.getId();
         if (this._options.validateIfHidden === undefined)
            this._options.validateIfHidden = false;
         if (!this._options.focusOnActivatedOnMobiles)
            this._options.focusOnActivatedOnMobiles = false;

         if (this._options.isRelativeTemplate === undefined) {
            this._options.isRelativeTemplate = true;
         }

         // инициализируем _baseTabIndex только если он еще не инициализирован (иначе если опции tabindex нет опция будет
         // инициализирована как -1, и при следующем вызове initOptions в _baseTabIndex установится -1)
         if (this._baseTabIndex === undefined) {
            this._baseTabIndex = this._options.tabindex || 0;
         }

         if (this._options.tabindex === undefined){
            this._options.tabindex = -1;
         }

         if (this._options.commandArgs === undefined){
            this._options.commandArgs = [];
         }

         if ('minHeight' in this._options === false) {
            this._options.minHeight = 0;
         }
         if ('minWidth' in this._options === false) {
            this._options.minWidth = 0;
         }
         if ('autoHeight' in this._options === false) {
            this._options.autoHeight = true;
         }
         if ('autoWidth' in this._options === false) {
            this._options.autoWidth = false;
         }

         if (this._options.alwaysShowExtendedTooltip === undefined) {
            this._options.alwaysShowExtendedTooltip = true;
         }

         var className = (this._options['class'] ? this._options['class'] + ' ' : '') +
            (this._options['className'] ? this._options['className'] + ' ' : '') +
            (this._options['cssClassName'] ? this._options['cssClassName'] + ' ' : '');

         this._options['class'] = className;
      },

      // Поскольку контрол может создаваться в различных окружениях, нужна точка
      // которая позволит точно сказать что контейнер готов для мандежа с jQuery
      isGoodContainer: function(){
         // проверяем что контейнер вообще есть, что у него есть метод attr - значит обернут в jQuery
         // [0] - понимаем что внутри jQuery не пустой селектор, !_startTag - понимаем, что это DOM элемент,
         // а не нода созаднная шаблонизатором
         return this._container && (typeof this._container.attr === "function")
           && this._container[0] && !this._container[0].startTag;
      },

      _repairingStep1: function(cfg){
         if (!this._options.name && this._options.container && this._options.container.getAttribute) {
            var iddata = cfg.container.getAttribute('data-id');
            this._options.name = iddata;
            this._options.sbisname = iddata;
            this._options.id = cfg.id||iddata;
         }

         if (this._id) {
            this._options.id = this._id;
         } else {
            if (!this._options.id) {
               this._options.id = randomId("cnt-");
            }
            this._id = this._options.id;
         }
      },

      repairOptions: function(){

         if (this.__$config_back){
            this._options.__$config = this.__$config_back;
         }

         this._repairingStep1(this._options);
         this.fixIcon();
         this.initOptions();
         this._initSeparatedTypeOptions(this._isSeparatedOptions);
      },

      deprecatedContr: function (cfg) {

         this._subscriptions = this._subscriptions || [];
         this._subDestroyControls = this._subDestroyControls || [];
         //Необходимо для сериализации состояния с сервера
         if (!cfg.__$config){
            cfg.__$config = randomId("cfg-");
         }

         this._decOptions = this._decOptions || {};
         /**
          * Опциями для декорирования могут быть лишь фиксированные опции
          */
         if(!Expressions.Attr.checkAttr(cfg)) {
            if (cfg['class'] || cfg['className']) {
               this._decOptions['class'] = (cfg['class']?cfg['class']+' ':'') + (cfg['className']?cfg['className']:'');
            }
            if (cfg['style']) {
               this._decOptions['style'] = cfg['style'];
            }
            if (cfg['data-component']) {
               this._decOptions['data-component'] = cfg['data-component'];
            }

            if (cfg['__$config']) {
               this._decOptions['config'] = cfg['__$config'];
            }
         }

         var sfc = this.saveFullContext;
         this.saveFullContext = function saveFullContext(ctx){
            sfc.call(this, ctx);
            this.__$$__fullContext = ctx;
         };
         this._thisIsInstance = true;
         this._isSeparatedOptions = cfg._isSeparatedOptions;

         /**
          * Пропатчим сами себя, чтобы отчетность могла патчить нас
          */
         if (this._initFakeConstructor) {
            this._initFakeConstructor();
         }

         this._parent = null;
         this._compatContext = null;
         this._$independentContext = false;
         this._$contextRestriction = '';
         this._$record = false;
         this._$modal = false;
         this._$validateIfHidden = false;
         this._$handleFocusCatch = false;
         this._$ignoreTabCycles = true;
         this._$groups = {};
         this._$currentTemplate = '';
         this._$isRelativeTemplate = false;
         this._$children = [];
         this._$_doGridCalculation = false;
         this._horizontalAlignment = 'Left';
         this._pending = [];
         this._pendingTrace = [];
         this._waiting = [];
         this._groupInstances = {};
         this._activeChildControl = -1;
         this._activatedWithTabindex = true;
         this._childControls = [];
         this._childNonControls = [];
         this._childsMapName = {};
         this._childsMapId = {};
         this._childsMapNameCache = {};
         this._childsMapIdCache = {};
         this._childContainers = [];
         this._childsTabindex = false;
         this._childsSizes = {};
         this._maxTabindex = 0;
         this._keysWeHandle = [Env.constants.key.tab,
                               Env.constants.key.enter];

         //Для getReadyDeferred
         this._dChildReady = new cParallelDeferred();
         this._dChildReady.done();
         //Для isInitialized
         this._isInitialized = true;

         //Для isReady
         this._isReady = true;

         this._resizer = null;
         this._toolbarCount =  {top: 0, right: 0, bottom: 0, left: 0};;
         this._defaultButton = null;
         this._activationIndex = 0;
         this._opener = undefined;
         this._isModal = false;


         this._waitersByName = {};
         this._waitersById = {};
         this._onDestroyOpener = null;
         this._isInitComplete = false;


         this._prevEnabled = true;

         if (!cfg.__$config){
            cfg.__$config = randomId("cfg-");
            this.__$config_back = cfg.__$config;
         }

         var ctor = this.constructor,
            defaultInstanceData = coreInitializer.call(ctor);
         //this._options = cFunctions.shallowClone(cfg);
         this._options = coreInitializer.getInstanceOptionsByDefaults(ctor, cfg, {_options:this._options});


         if (cfg.element && cfg.element[0]) {
            var className = cfg.element.attr('class');
            if (className) {
               this._options.className = this._options.className ? this._options.className + ' ' + className : className;
               this._decOptions.class = this._decOptions.class ? this._decOptions.class + ' ' + className : className;
            }
         }


         this._handlers = this._handlers || (cfg && cfg.handlers && typeof cfg.handlers == 'object' ? shallowClone(cfg.handlers) : {});
         this._subscriptions = this._subscriptions || [];
         this._subDestroyControls = this._subDestroyControls || [];
         this._isDestroyed = false;

         this._childControls = [];
         this._childContainers = [];
         this._childsMapId = {};
         this._childsMapName = {};

         this._repairingStep1(cfg);

         this.childControls = {};
         if (!this._children) {
            this._children = {};
         }

         this._logicParent = this._options.logicParent||this._options.parent||this._options._logicParent;

         if (!this._options.logicParent && !this._options.parent && this._options._logicParent) {

            /*
            * Прикрываем дырки
            * CompoundControl сохраняет парента в разные места, и в некоторых случаях этот parent не совсем правильный
            * */
            this._$wasabyChild = true;
         }

         /* Если родительский контрол - Wasaby контрол, то мы должны засунуться к нему в дочерние контролы безусловно,
          * есть проблема, когда на одной ноде несколько контролов, тогда слой совместимости начинает терять ссылки на инстансы
          * В destroy просто destroyим все эти контролы
          * есть проблема, когда на одной ноде несколько контролов, тогда слой совместимости начинает терять ссылки на инстансы
          * В destroy просто destroyим все эти контролы
          * Также пометим эти контролы флагом, чтобы их можно было отличить в setInternalOptions */
         if (this._logicParent && this._logicParent._template) {
            if (!this._logicParent.allChilds) {
               this._logicParent.allChilds = [];
            }
            this._logicParent.allChilds.push(this);
         }

         /*TODO:: check container*/

         if (window) {
            this._container = $(cfg.container || cfg.element || '[config="'+cfg.__$config+'"]');
         } else {
            this._container = cfg.container || cfg.element;
         }

         this.fixIcon();
         this.initOptions();
         this._initSeparatedTypeOptions(cfg._isSeparatedOptions);

         this.applyOptions && this.applyOptions();
         this._applyOptions && this._applyOptions();

         this.publishEvents();
         if (!Env.constants.isBuildOnServer) {
            this.initCompatibleFunc();
         }

         this._keysWeHandle = hash(this._keysWeHandle);

         this._isVisible = this._options.visible;

         if (Env.constants.isBuildOnServer) {
           /**
            * На сервере контекст используется исключительно как источник данных для
            * первичной отрисовки верстки
            */
            this._compatContext = this._options.context || this._options.linkedContext || null;
         } else {
            WindowManager.addWindow(this);
            var obj = this._createContext(this._options);
            this._compatContext = obj.context;
            this._allowEvents();
         }

         //doNotSetParent - значит вызвали из CompoundControl и парент будет проставлен позже
         if (this._options.parent && !this._options.doNotSetParent){
            this.setParent(this._options.parent);
            if (this._options.primary === true) {
               this._registerDefaultButton();
            }
         } else if (this._options.primary === true) {
            this._needRegistWhenParent = true;
         }

         // Если создается вдомный компонент из bootup-min, не нужно рендерить
         // его и устанавливать контейнер. Это сделает сам bootup-min
         var isBootupVdom = this._options._fromBootupMin && this.isBuildVDom();

         if (this.isGoodContainer() && this._container.attr('hasMarkup') !== 'true' && !isBootupVdom) {
            this.render(true, this._decOptions);
         } else {
            this._onceRendered = true;
         }

         if (!this._options.doNotSetParent && !isBootupVdom) {
            this.setContainer(this._container);
         }
      },


      //совместимость для наследников;
      init: function () {

      },

      saveOptions: function(){
         if (typeof window !== 'undefined' && window.$) {
            this._container = $(this._container);
         }
      },

      publishEvents: function() {
         this._publish('onInit', 'onInitComplete', 'onReady', 'onDestroy');//из Abstract
         this._publish('onChange', 'onKeyPressed', 'onClick', 'onFocusIn', 'onFocusOut', 'onStateChanged', 'onTooltipContentRequest',
            'onPropertyChanged', 'onPropertiesChanged', 'onCommandCatch');//из Control
         this._publish('onResize', 'onActivate', 'onBeforeShow', 'onAfterShow',
            'onBeforeLoad', 'onAfterLoad', 'onBeforeControlsLoad', 'onBatchFinished');//Из AreaAbstract
      },

      changeClass: function(fullClass, className, addClass) {
         var splittedClasses, index;

         if(!fullClass) {
            splittedClasses = [];
         } else {
            splittedClasses = fullClass.split(/\s+/);
         }
         index = splittedClasses.indexOf(className);
         if(addClass && index === -1) {
            splittedClasses.push(className);

         } else if(index !== -1) {
            splittedClasses.splice(index, 1);
         } else {
            return splittedClasses.join(' ');
         }
         return splittedClasses.join(' ');
      },

      initCompatibleFunc: function() {

         this._addClassCompatible = function(className){
            this._options.class = this.changeClass(this._options.class, className, true);
            this._decOptions.class = this.changeClass(this._decOptions.class, className, true);
            BaseCompatible._setDirty.call(this);
            return this._container;
         }.bind(this);

         this._removeClassCompatible = function(className){
            this._options.class = this.changeClass(this._options.class, className, false);
            this._decOptions.class = this.changeClass(this._decOptions.class, className, false);
            BaseCompatible._setDirty.call(this);
            return this._container;
         }.bind(this);

         this._mouseEnterCompatible = function(callback){
            this.subscribe('onMouseEnter', function(ev, synEvent){
               callback({currentTarget: this._container});
            });
            return this._container;
         }.bind(this);

         this._mouseLeaveCompatible = function(callback){
            this.subscribe('onMouseLeave', function(ev, synEvent){
               callback({currentTarget: this._container});
            });
            return this._container;
         }.bind(this);

         this._toggleClassCompatible = function (className, state) {
            var hasClass = this._options.class && this._options.class.indexOf(className) !== -1;
            if(!hasClass && state !== false) {
               this._addClassCompatible(className);
            } else if(hasClass && state !==true) {
               this._removeClassCompatible(className);
            }
            return this._container;
         }.bind(this);
      },
      _addClassCompatible: null,
      _removeClassCompatible: null,
      _mouseEnterCompatible: null,
      _mouseLeaveCompatible: null,

      getContainer: function(){
         this._container = $(this._container);
         if (this.iWantVDOM && this._container && this._decOptions) {
            this._container.mouseenter = this._mouseEnterCompatible;
            this._container.mouseleave = this._mouseLeaveCompatible;
            this._container.addClass = this._addClassCompatible;
            this._container.removeClass = this._removeClassCompatible;
            this._container.toggleClass = this._toggleClassCompatible;
         }
         return this._container;
      },

      setClassName: function(className){
         if (!this._options) {
            this._options = {};
         }
         this._options['class'] = className;
         BaseCompatible._setDirty.call(this);
      },

      clearInformationOnParent: function() {
         delete this._parent._childControls[this._parent._childsMapId[this._options.id]];
         delete this._parent._childContainers[this._parent._childsMapId[this._options.id]];
         delete this._parent._childsMapId[this._options.id];
         delete this._parent._childsMapName[this._options.name];
         delete this._parent._childsTabindex[this._options.tabindex];
      },

      destroy: function () {

         if (this._parent && this._parent._rebuildMarkupOrigin) {
            this._parent.rebuildMarkup = this._parent._rebuildMarkupOrigin;
         }

         if (this.allChilds) {
            for (var i = 0; i < this.allChilds.length; i++) {
               if (!this.allChilds[i].isDestroyed()) {
                  this.allChilds[i].destroy();
               }
            }
         }
         this.allChilds = null;

         if (this._options.__$config) {
            //Ранее configStorage чистился в CompoundControl и там лежал объект настроек.
            //Теперь в configStorage складывается инстанс и при пересоздании компонента с тем же
            //config-id - будет найден именно он
            var configObj = {};
            configObj[this._options.__$config] = undefined;
            configStorage.merge(configObj);
         }

         if (this._compatContext){
            this._compatContext.destroy();
         }
         this._invalidateParentCache();
         AreaAbstractCompatible.destroy.call(this);
         AbstractCompatible.destroy.call(this);
         if(this.isActive()){
            this._isControlActive = false;
            this._notify('onFocusOut', true);   //Фокус с элемента уходит
         }

         this._isDestroyed = true;

         if (this._mounted) {
            Vdom.Synchronizer.unMountControlFromDOM(this, this._container);
         }

         if (window && this._container && this._container[0]){
            Vdom.Synchronizer.cleanControlDomLink(this._container);
            this._container[0].wsControl = undefined;
         }

         if (window && this._container && !this.__$destroyFromDirtyChecking) {
            //Если контрол разрушается из DirtyChecking- значит не нужно удалять контейнер из дома
            //это сделает синхронизатор, иначе он упадет при строительстве патча
            $(this._container).remove();
         }


         CommandDispatcher.deleteCommandsForObject(this);

         this._dChildReady = undefined;

         if (this._options.parent && this._options.parent._childsMapId &&
            (this._options.parent._childsMapId[this._options.id] === 0 || this._options.parent._childsMapId[this._options.id])) {
            this.clearInformationOnParent();
         }

         if (this._parent){
            var chC = this._parent._childContainers;
            if (chC){
               this.cleanControlFromArray(chC);
            }
            chC = this._parent._childControls;
            if (chC){
               this.cleanControlFromArray(chC);
            }

            delete this._parent._childsMapId[this._options.id];
            if (this._options.name) {
               delete this._parent._childsMapName[this._options.name];
            }
            delete this._parent._childsTabindex[this._options.tabindex];
         }

         if (this._getEnvironment() && this._container && this._container[0] === this._getEnvironment()._rootDOMNode && this._getEnvironment()._canDestroy(this)) {
            this._getEnvironment().destroy();
         }
      },

      cleanControlFromArray: function(arr){
         for(var k=0;k<arr.length;k++){
            if (arr[k] === this){
               // Из _childControls нужно удалять через delete т.к. старые индексы
               // сохраняются на протяжении всей жизни родительского контрола
               delete arr[k];
               break;
            }
         }
      },

      ///resources/Obmen_soobscheniyami_-_bazovyj/components/SendMessageInternal/SendMessageInternal.module.js : 2438
      setEnabled: function (value) {
         if (this._options.allowChangeEnable === undefined){
            this._options.allowChangeEnable = true;
         }
         if (this._options.allowChangeEnable === false)
            return;


         if (this._doNotSetDirty) {
            ControlCompatible.setEnabled.apply(this, arguments);
            this._childControls.forEach(this._setupChildByAreaEnabled, this);

         } else {
            var oldEnabled = this._options.enabled;
            this._options.enabled = value;
            if (this._options.enabled !== oldEnabled) {
               BaseCompatible._setDirty.call(this);
            }
         }

         this._prevEnabled = true;
      },

      _setEnabled: function(value) {
         if (this._doNotSetDirty) {
            ControlCompatible._setEnabled.apply(this, arguments);
         } else {
            this.setEnabled(value);
         }
      },

      //debug/resources/Obmen_soobscheniyami_-_bazovyj/components/SendMessageInternal/SendMessageInternal.module.js
      isVisible: function () {
         /* В слое совместимости не бывает компонентов с неопределенным visible
          * Старая логика в том, что по умолчанию компонент видим
         * */
         return this._options.visible===undefined?true:this._options.visible;
      },
      //https://test-online.sbis.ru/debug/resources/Obmen_soobscheniyami_-_bazovyj/components/SendMessageInternal/SendMessageInternal.module.js
      setVisible: function (value) {
         var oldVisible = this._options.visible;
         this._options.visible = value;
         if (this._doNotSetDirty) {
            ControlCompatible._setVisibility.call(this, value);
         } else if (oldVisible !== this._options.visible) {
            BaseCompatible._setDirty.call(this);
         }

         if (!this._doNotSetDirty) {
            this._notify('onAfterVisibilityChange', value);
         }
      },

      _setVisibility: function(value) {
         this.setVisible(value);
      },

      setCaption: function(value) {
         var oldCaption = this._options.caption;
         this._options.caption = value||'';

         if (this._options.caption !== oldCaption) {
            BaseCompatible._setDirty.call(this);
         }
      },


      setIcon: function(value) {
         var oldIcon = this.getIcon();
         this._options.icon = value;
         this.fixIcon();
         if (oldIcon !== this.getIcon()) {
            BaseCompatible._setDirty.call(this);
         }
      },

      /**
       * Метод, возвращающий значение служебной опции
       * @param {String} name Имя служебной опции
       * @returns {*} Значение опции
       * @private
       */
      _getInternalOption: function(name) {
         // BaseCompatible не использует разделение опций, поэтому читаем их из _options
         return this._options[name];
      },

      /**
       * Метод задания значения служебной опции
       * @param {String} name Имя служебной опции
       * @param {*} value Значение опции
       * @private
       */
      _setInternalOption: function(name, value) {
         // Не даем устанавливать переменные dirty checking'a
         if (name.toString().indexOf('__dirtyCheckingVars_') === -1) {
            this._options[name] = value;
         }
      },

      _setInternalOptions: function(internal) {
         // setInternalOptions вызывается сразу после конструтора, поэтому часть инициализации
         // parent и logicParent переносится сюда
         if (this._logicParent === undefined || this._$wasabyChild) {
            var allChilds = this._logicParent && this._logicParent.allChilds || [];
            var newParent = internal.logicParent || internal.parent || this._logicParent;

            if (this._logicParent === newParent) {
               //Если logiParen не меняется, то не надо allChild concatить
               allChilds = [];
            } else {
               this._logicParent = newParent;
            }

            /**
             * Чтобы дети не утекли, отдадим ему правильному родителю
             */

            if (this._logicParent && !this._logicParent.allChilds && this._logicParent._template) {
               this._logicParent.allChilds = [];
            }

            if (this._logicParent && this._logicParent.allChilds) {
               this._logicParent.allChilds = this._logicParent.allChilds.concat(allChilds);
            }

            if (internal.parent && !this._options.doNotSetParent){
               this.setParent(internal.parent);
               if (this._options.primary === true) {
                  this._registerDefaultButton();
               }
            } else if (this._options.primary === true) {
               this._needRegistWhenParent = true;
            }
         }
      },

      _setDirty: function () {
         if (this._onceRendered &&  !this.iWantVDOM)
            this.render(true);

         if ( this.iWantVDOM )
            if(this._mounted) {
               this._forceUpdate();
            }
      },

      setPrimary: function(flag){
         var oldPrimary = this._options.primary;
         this._options.primary = !!flag;
         if (this._options.primary !== oldPrimary) {
            BaseCompatible._setDirty.call(this);
         }
      },
      isPrimary: function(){
         return this._options.primary;
      },


      _registerToParent: function(parent){
         if (!parent._childControls) {
            return;
         }
         var cur = parent._childControls.length,
            _id = this.getId(),
            tabindex = this.getTabindex();

         // This method can be called many times for one parent-child pair because of compatibility.
         // Should register only once.
         if (typeof parent._childsMapId[_id] !== 'number') {
            if (parent._doNotSetDirty !== false) {
               var self = this,
                  onAfterVisibilityChange = function(ev, val) {
                     if (self._options.visible === undefined) {
                        self.setVisible(val);
                        self._options.visible = undefined;
                     } else {
                        self._notify('onAfterVisibilityChange', val);
                     }
                  };

               /* Признак того, что над нами не vDom идеология. _doNotSetDirty === true у ScrollContainer
               * _doNotSetDirty === undefined у всех CompoundControls
               * Когда это изменит свою видимость - мы не узнаем, а нам надо перерисоваться,
               * потому что видимость нашего контейнера зависит от parentVisible */
               parent.subscribe('onAfterVisibilityChange', onAfterVisibilityChange);
               self.subscribe('onDestroy', function() {
                  parent.unsubscribe('onAfterVisibilityChange', onAfterVisibilityChange);
               });
            }

            if (tabindex && !parent.iWantVDOM) {
               var tabindexVal = parseInt(tabindex, 10);

               // Если индекс занят или -1 (авто) назначим последний незанятый
               if (tabindexVal == -1 || parent._childsTabindex[tabindexVal] !== undefined) {
                  tabindexVal = parent._maxTabindex + 1;
                  this.setTabindex(tabindexVal, true);
               }

               if (tabindexVal > 0) {
                  parent._maxTabindex = Math.max(parent._maxTabindex, tabindexVal);
                  if (!parent._childsTabindex) {
                     parent._childsTabindex = {};
                  }
                  parent._childsTabindex[tabindexVal] = cur;
               }
            }
            parent._childsMapId[this.getId()] = cur;
            parent._childsMapName[this.getName()] = cur;
            parent._childControls.push(this);
            parent._childContainers.push(this);
            this._notifyToParentAboutChild(this);
            var allChilds = this.getChildControls();
            for(var i=0; i<allChilds.length; i++){
               if (allChilds[i]) {
                  this._notifyToParentAboutChild(allChilds[i]);
               }
            }
         }
         if (this._logicParent.registerToChildMap){
            this._logicParent.registerToChildMap(this);
         }
      },

      _notifyToParentAboutChild: function(cnt){
         var toFindParent = this.getParent();
         while (toFindParent) {
            toFindParent._checkWaiters(cnt);
            toFindParent = toFindParent.getParent();
         }
      },

      recalcSelfTabindex: function() {
         if (this._parent && this._baseTabIndex === undefined && !this.iWantVDOM){
            this.clearInformationOnParent();
            this._options.tabindex = this._baseTabIndex;
            this._registerToParent(this._parent);
         }
      },

      getParent: function(){
         return this._parent||this._options.parent||null;
      },

      registerToChildMap: function(control){
         var self = this;
         self._children[control.getName()] = control;

         if (!Env.constants.isBuildOnServer) {
            control.once('onDestroy', function () {
               delete self._children[control.getName()];
            });
         }
      },
      finalRegToParent: function(){
         this._registerToParent(this._parent);
         var topParent = this.getTopParent();
         if (topParent) {
            if (topParent.isReady()) {
               // находим и кэшируем владельца, но тихо, посколько владелец метки появляется позже
               this.getOwner(true);
            } else {
               if (!Env.constants.isBuildOnServer) {
                  // если родитель еще не готов, дождемся готовности и закэшируем овнера
                  topParent.subscribe('onReady', forAliveOnly(this.getOwner, this));
               }
            }
         }
      },

      _publish: function () {
         /**
          * Не публикуем события на сервере
          */
         if (!Env.constants.isBuildOnServer) {
            AbstractCompatible._publish.apply(this, arguments);
         }
      },

      setNewRebuildMarkup: function() {
         if (this._parent && this._parent.rebuildMarkup) {
            this._parent._rebuildMarkupOrigin = this._parent.rebuildMarkup;
            var self = this;
            this._parent.rebuildMarkup = function() {
               self.destroy();
               self._parent._rebuildMarkupOrigin.apply(self._parent, arguments);
            };
         }
      },

      //for working getChildControlByName
      setParent: function (parent) {
         if (this._options.allowChangeEnable === undefined){
            this._options.allowChangeEnable = true;
         }
         if(!this._parent &&
            this._options.allowChangeEnable !== false &&
            this._options.parentEnabled !== undefined &&
            parent &&
            (!this.isEnabled || this.isEnabled()) === this._options.parentEnabled) {
            this._options.enabled = !!parent.isEnabled && !parent.isEnabled();
            this.setEnabled(!parent.isEnabled || parent.isEnabled());
         }


         if (this._parent && this._parent._rebuildMarkupOrigin) {
            this._parent.rebuildMarkup = this._parent._rebuildMarkupOrigin;
         }

         this._options.parent = parent;
         this._parent = parent;
         this._logicParent = this._logicParent || parent;
         this.setNewRebuildMarkup();

         /*
            По умолчанию опция allowChangeEnable true, поэтому, если она не установлена, считаем что она true
          */
         if (this._options.allowChangeEnable !== false && this._parent && !!this._parent.isEnabled
            && !this._parent.isEnabled() && !this._parent._template) {
            /**
             * TODO: подумать над этой точкой enabled
             */
            /* Если попали в эту точку, нужно чтобы setEnabled отработал полностью, то есть заново проставил классы
             * ws-enabled и ws-disabled, потому что на ПП не работают контексты, и с него прилетает неправильная верстка */
            this._options.enabled = true;
            this.setEnabled(false);
         }



         this.setContainer(this._container);

         if (this._parent){
            this.finalRegToParent();
         }

         if (this._needRegistWhenParent)
         {
            this._needRegistWhenParent = false;
            // запоминаем кнопку в области SwitchableAreaItem, чтобы в дальнейшем зарегистрировать ее при переключении на эту область
            if (cInstance.instanceOfModule(parent, 'Lib/Control/SwitchableArea/SwitchableAreaItem')) {
               parent._shouldRegisterButton = this;
            }
            this._registerDefaultButton();
         }
      },

      setTooltip: function(tooltip)
      {
         var oldTooltip = this._options.tooltip;
         this._options.tooltip = tooltip;
         if (this._doNotSetDirty) {
            this.getContainer().attr('title', this._options.tooltip);
         } else if (oldTooltip !== this._options.tooltip) {
            BaseCompatible._setDirty.call(this);
         }
      },

      getCaption: function() {
         return this._options.caption;
      },

      getIcon: function() {
         return this._options.icon?"sprite:"+this._options.icon:this._options.icon;
      },

      _applyChangedOptions: function(newOptions) {
         Object.getOwnPropertyNames(newOptions).forEach(function (prop) {
            this._options[prop] = newOptions[prop];
         }, this);
      },

      _getOption: function(name){
         if (name === "enabled") {
            if (this._options.enabled === undefined) {
               // True or undefined.
               return this._getInternalOption('parentEnabled') !== false;
            } else {
               return this._options.enabled;
            }
         } else if (name === "visible") {
            if (this._options.visible === undefined) {
               return this._options.parentVisible;
            } else {
               return this._options.visible;
            }
         }
         /**
          * Некоторые опции просто идеологически не нужны в VDom контролах,
          * и могут быть не заданы
          * Поэтому, чтобы не синхронизировать опции Compatible слоя каждый раз
          * при запросе любой опции, просто не будем ничего возвращать если опции
          * нет
          * Сейчас и так все работает, только в консоль пишется белое предупредительное
          * сообщение
          */
         if (AbstractCompatible._hasOption.call(this, name)) {
            return AbstractCompatible._getOption.call(this, name);
         }
      },

      _setOption: function(name, value, silent){
         if (name === "enabled" || name === "visible") {
            this._options[name] = value;
            return;
         }
         return AbstractCompatible._setOption.call(this, name, value, silent);
      },

      _restoreSize: function() {

      },

      _needResizer: function() {
         return false;
      },

      _notify: function(){
         /*
         * Переопределим notify, чтобы новые контролы можно было использовать в старых рельсах
         * */
         AbstractCompatible._notify.apply(this, arguments);
      },
      /**
       *  Обработка клавиатурных нажатий
       *  @param {Event} e
       */
      _keyboardHover: function(e){
         if (!this.iWantVDOM) {
            return this._oldKeyboardHover.apply(this, arguments);
         }
         if(e.which in this._keysWeHandle){
            if(e.which == Env.constants.key.enter) {
               if(!(e.altKey || e.shiftKey) && (e.ctrlKey || e.metaKey)) { // Ctrl+Enter, Cmd+Enter, Win+Enter
                  if (!this._defaultAction) {
                     return true;
                  }
                  return this._defaultAction(e);
               }
            }
         }
         return true;
      },
      activateFirstControl: function(noFocus) {
         // должны производить активацию только если она происходит программно (noFocus=false)
         // или по действию пользователя по переводу фокуса внутрь компонента
         if (!noFocus || !Expressions.Focus.closest(document.activeElement, this._container[0])) {
            return this._oldActivateFirstControl.apply(this, arguments);
         }
      },
      activateLastControl: function(noFocus) {
         if (!noFocus || !Expressions.Focus.closest(document.activeElement, this._container[0])) {
            return this._oldActivateLastControl.apply(this, arguments);
         }
      },
      detectNextActiveChildControl: function(isShiftKey, searchFrom, noFocus) {

         function findEnvironment(component) {
            while (component) {
               var environment = component._getEnvironment();
               if (environment) {
                  return environment;
               }
               component = component._logicParent;
            }
            if (Env.constants.compat) {
               throw new Error('environment не был найден среди предков');
            }
         }

         if (!this.iWantVDOM) {
            return this._oldDetectNextActiveChildControl.apply(this, arguments);
         }

         var target;
         if (isShiftKey === false && searchFrom === -1) {
            target = this._container[0];
         } else if (isShiftKey === true && searchFrom === (this._maxTabindex > 0 ? this._maxTabindex + 1 : this._childControls.length)) {
            target = this._container[0];
         } else {
            target = document.activeElement;
         }

         var res = false,
            environment = findEnvironment(this);
         if (!environment) {
            return true;
         }
         var  rootDOMNode = environment._rootDOMNode,
            getElementProps = Vdom.TabIndex.getElementProps;
         var next = Vdom.TabIndex.findWithContexts(rootDOMNode, target, isShiftKey, getElementProps);
         if (next) {
            // при поиске первого элемента игнорируем vdom-focus-in и vdom-focus-out
            var startElem = isShiftKey ? 'vdom-focus-out' : 'vdom-focus-in';
            var finishElem = isShiftKey ? 'vdom-focus-in' : 'vdom-focus-out';
            if (next.classList.contains(startElem)) {
               next = Vdom.TabIndex.findWithContexts(rootDOMNode, next, isShiftKey, getElementProps);
            }
            if (next.classList.contains(finishElem)) {
               next = null;
            }
         }

         // храним состояние о нажатой клавише таба до следующего такта. Нужно, чтобы различать приход фокуса по табу или по клику
         environment._isTabPressed = {
            isShiftKey: isShiftKey
         };
         setTimeout(function() {
            environment._isTabPressed = null;
         }, 0);

         if (next) {
            if (next.wsControl && next.wsControl.setActive && next !== rootDOMNode) {
               next.wsControl.setActive(true, undefined, noFocus);
               res = true;
            } else {
               if (!noFocus) {
                  $(next).focus();
               }
               // todo тут надо стрелять события об активации? например, поискать среди парентов тот, у кого есть elem.wsControl.setActive и позвать его с noFocus = true
               res = true;
            }
         }
         return res;
      },
      _isCanShowExtendedTooltip: function() {
         return false;
      }
   };

});
