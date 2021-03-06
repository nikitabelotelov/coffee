define('Lib/Control/CompoundControl/CompoundControl', [
   'require',
   'Core/helpers/Number/randomId',
   "Core/core-instance",
   "Core/moduleStubs",
   'Core/Abstract.compatible',
   'Lib/Control/Control.compatible',
   'Lib/Control/AreaAbstract/AreaAbstract.compatible',
   'Lib/Control/BaseCompatible/BaseCompatible',
   'Env/Event',
   "Core/ParallelDeferred",
   "Lib/Control/AreaAbstract/AreaAbstract",
   'Core/markup/parse',
   'Core/helpers/Hcontrol/configStorage',
   "Core/ContextBinder",
   'View/Executor/Utils',
   'Core/helpers/Hcontrol/getChildContainers',
   'Core/helpers/Hcontrol/replaceContainer',
   'Core/helpers/Hcontrol/makeInstanceCompatible',
   'Core/library',
   "Lib/Control/AttributeCfgParser/AttributeCfgParser",
   "Lib/Control/Control",
   "i18n!Lib/Control/CompoundControl/CompoundControl",
   'View/decorators',
   'Vdom/Vdom',
   'Core/Context'
], function(
   require,
   randomId,
   cInstance,
   moduleStubs,
   AbstractCompatible,
   ControlCompatible,
   AreaAbstractCompatible,
   BaseCompatible,
   EnvEvent,
   cParallelDeferred,
   AreaAbstract,
   parseMarkup,
   configStorage,
   ContextBinder,
   Utils,
   getChildContainers,
   replaceContainer,
   makeInstanceCompatible,
   Library
) {
   /**
    * Модуль "Составной компонент".
    *
    * @class Lib/Control/CompoundControl/CompoundControl
    * @extends Lib/Control/AreaAbstract/AreaAbstract
    * @author Крайнов Д.О.
    * @public
    */
   var global =  (function() {
      return this || (0, eval)('this');
   })();

   var globalRequireMap = {};

   function clearNodeConfig(cObj) {
      if (cObj.node.removeAttribute) {
         cObj.node.removeAttribute('config');
      }
   }

   function makeInst(cObj,i,array) {
      var
         cfg = cObj.cfg,
         Ctor = cObj.ctor,
         hasMarkup = cObj.hasMarkup,
         context = this.getLinkedContext(),
         binder,
         inst;

      /*Такой вариант может быть если в контентной опции есть контролы и они вся контентная область перерисовалась*/
      if (cfg.parent && cfg.parent.isDestroyed()) {
         cfg.parent = null;
      }

      /**
       * Когда в ScrollContainer рождается старый контрол, внутри которого есть другой контрол
       * то на уровне шаблонизатора этому второму контролу устанавливается свойство parent = ScrollContainer
       * Проверим здесь, что если желаемый parent - это легкий инстанс, значит попробуем найти текущий объект внутри желаемого парента
       * и если он там, тогда установим в качестве parent текущий контрол
       */
      if (cfg.parent && cfg.parent._template) {
         /**
          * Так как есть одна попытка поправить код, нужно учесть все самые странные вариации
          */
         if (!cfg.parent._container || //Если у парента нет контейнера
               !cfg.parent.isGoodContainer() ||  //Если контейнер плохой
               !this._container || //Если у текущего контрола нет контейнера
               !this._container.attr || //Или это не jQuery контейнер
               cfg.parent._container.find('#'+this._container.attr("id")).length > 0 //Или если контейнер текущего контрола лежит внутри контейнера того кого хотели установить парентом
            ) {
            cfg.parent = null; //Обнулим parent, чтобы потом установить сюда this
         }
      }

      var useNewWave = ('function' === typeof Ctor.prototype._template );
      if (useNewWave && cInstance.instanceOfModule(this, 'Lib/Control/SwitchableArea/SwitchableAreaItem')) {
         cfg.parent = null;
      }

      cfg.linkedContext = this.getLinkedContext();
      cfg.parent = cfg.parent || this;

      //TODO:закрыл ибо излишне
      //cfg.currentTemplate =  array.template;


      if (useNewWave) {

         /*Последствия вставки vdom в Compound без слоя совместимости*/

         inst =  cObj.instance || cObj.cfg;

         /**
          * Найдены варианты, когда контрол висит в воздухе и привязан к тому же EventBus что и контрол, который отображен на странице
          * рендеринг внутри DataGridView
          * Тогда при перерисовке разрушается только тот что лежит в верстке
          */

         if (inst && inst._eventBusChannel && inst._eventBusChannel.isDestroyed()){
            inst.destroy();
            return;
         }
         /**
          * Если контрол VDOMный вызовем рендер, чтобы замаунтить его
          * Не вызываем рендеринг тут, если здесь верстка уже построена
          * Если контейнер - COMPONENT - значит верстки еще нет и контрол был
          * вставлен в старом стиле
          */
         if (!inst.isBuildVDom || (inst.isBuildVDom() && !inst._isRendered && inst.getContainer().attr('hasmarkup') !== 'true') || inst.containerIsComponent()) {
            /**
             * Установим свойство, которое запрещает оживление внутренних компонентов,
             * пока не установлен родительский контрол
             * В коде прикладников в init внутренних контролов есть код, который берет topParent и ищет соседний контрол
             * Пока parent у легкого инстанса нет, getChildControlByName не найдет
             * компоненты, которые в нем только что родились
             */
            inst._waitWhileSetParent = true;
            inst.render();
            inst._waitWhileSetParent = false;
         }
         /**
          * В baseCompatible определил метод, который перепривязывает биндинги к правильному контексту
          * это нужно, потому что новые контролы могут быть частью старых контролов и будут
          * привязаны к контексту на стадии шаблонизации. При этом, порядок контекстов может быть сбит
          * Здесь восстанавливаем корректный порядок.
          * */

         //
            if (!inst.setContext) {
               var ignore = ['_forceUpdate', '_getMarkup', '_notify'];

               for (var j in AbstractCompatible) {
                  if (ignore.indexOf(j) === -1) {
                     inst[j] = AbstractCompatible[j];
                  }
               }
               for (var k in ControlCompatible) {
                  if (ignore.indexOf(k) === -1) {
                     inst[k] = ControlCompatible[k];
                  }
               }
               for (var l in AreaAbstractCompatible) {
                  if (ignore.indexOf(l) === -1) {
                     inst[l] = AreaAbstractCompatible[l];
                  }
               }
               for (var i in BaseCompatible) {
                  if (ignore.indexOf(i) === -1) {
                     inst[i] = BaseCompatible[i];
                  }
               }

               inst.deprecatedContr(inst._options);
            }
         inst.setContext(cfg.parent.getLinkedContext());
         inst.setParent(cfg.parent);
         if (!inst.iWantVDOM) {
            inst.reviveSuperOldControls();
         }
      } else {

         //Обработка очердной вариативности:
         //В шаблоне редактирования по месту могут указать контентную опцию type=string
         //в ней будет ws:COMPONENT
         //это будет старый компонент
         //Тогда при инициализации редактирования по месту этот контрол оживет и будет прав, НО
         //до этого он попадает в список контролов для оживления у родителя редактирования по месту
         //менять логику набора тегов для оживления нельзя, а вот тут проверить что компонент уже жив можно
         //ведь он проходил ровно по этой же ветке
         if (cfg && cfg.element && (cfg.element.wsControl || cfg.element[0] && cfg.element[0].wsControl)){
            return  cfg.element.wsControl || cfg.element[0] && cfg.element[0].wsControl;
         }

         //Вся беда в type=string и XHTML
         //Дочерние контролы пересоздаются вместе с родителями, что приводит к тому, что в списке компоентов
         //на оживление мы имеем тех, кого уже удалили из дома
         //Поэтому проверим что элемент есть в доме, если в доме есть
         //родительский элемент.
         //Тогда останется работать логика создания компонента в нибитие, и
         //корректно проверим, что контейнер на самом деле был удален из дома
         if (cfg.element && cfg.parent && cfg.parent._container){
            if (!jQuery.contains(document, cfg.element[0] || cfg.element)
               && jQuery.contains(document, cfg.parent._container[0])) {
               return;
            }
         }

         binder = ContextBinder.initBinderForControlConfig(cfg);
         if (!hasMarkup) {
            delete cfg.bindings;
            cfg = binder.getConstructorOptions(context, Ctor, cfg);
         }


         var defaultOpts = Utils.OptionsResolver.getDefaultOptions(Ctor);
         Utils.OptionsResolver.resolveOptions(Ctor, defaultOpts, cfg, cfg.parent && cfg.parent._moduleName ? cfg.parent._moduleName : "");
         inst =  new Ctor(cfg);

         // текущий контекст мог измениться, и нужно в bindControl передать актуальный
         context = this.getLinkedContext() || context;

         if (hasMarkup) {
            //Если была опция buildMarkupWithContext, и в разметке контекст применён, то
            //синхронизацию всё равно надо вызвать, потому что buildMarkupWithContext работает
            //только с одним контекстом - с тем, который передан в buildMarkup, а на момент конструирования контрола
            //родительские контролы могут создать и изменить свои контексты, и свойства, заданные от контекста из buildMarkup,
            //будут отличаться от свойств, полученных из контекста после конструирования
            binder.bindControl(inst, context, 'syncControl');
         } else {
            binder.bindControl(inst, context);
         }
      }

      if (typeof inst.getReadyDeferred === 'function') {
         this._dChildReady.push(inst.getReadyDeferred());
      }
      return inst;
   }

   function prepareConfigForControl(cfg, collectionItem, eventMap, cName, config) {
      var
         moduleName,
         instance,
         cnstr,
         parseLib;

      if (cfg && cfg.amdModuleName) {
         moduleName = cfg.amdModuleName;
      }
      if (!moduleName) {
         moduleName = (cName ? cName : cfg._moduleName);
      }
      if (globalRequireMap[moduleName]) {
         cnstr = globalRequireMap[moduleName];
      } else {
         parseLib = Library.parse(moduleName);
         // Ветка при которой в старых компонентах используются библиотеки
         // т.е. в data-component попадает строка вида x/y/z:a.b.c
         if (parseLib.path.length) {
            cnstr = require(parseLib.name);
            parseLib.path.forEach(function(property) {
               cnstr = cnstr[property];
            });
         } else {
            cnstr = require(moduleName);
         }
         globalRequireMap[moduleName] = cnstr;
      }

      cfg.eventBusId = (cfg.name && eventMap[cfg.name]) ? eventMap[cfg.name] : randomId();
      if (cnstr.prototype && cnstr.prototype._template) {
         collectionItem.setAttribute('newconfig', config);
         cfg.parent = this;
         if (!cfg._thisIsInstance) {
            cfg.container = window ? $(cfg.element) : cfg.element;
            cfg.linkedContext = this.getLinkedContext();

            if (cfg.container[0] && cfg.container[0].wsControl) {
               cfg._container = window ? $(cfg.element) : cfg.element;
               instance = cfg.container[0].wsControl;
               cfg = instance._options;
            } else {
               var binder = ContextBinder.initBinderForControlConfig(cfg),
                  context = this.getLinkedContext();

               /*if (!hasMarkup) {
                delete cfg.bindings;
                cfg = binder.getConstructorOptions(context, Ctor, cfg);
                }*/

               // Выключаем enabled у потомка, если у предка он выключен, а у потомка не проставлен. Опция allowChangeEnable может отменить этот механизм.
               if (cfg.parent && !('enabled' in cfg) && !cfg.parent.isEnabled() && (cfg.allowChangeEnable !== false)) {
                  cfg.enabled = cfg.parent.isEnabled();
                  cfg.enable = cfg.parent.isEnabled();
               }

               //Эта опция нигде не описана и она нужна чтобы
               //при созаднии инстанса нового поколения не проставлялся parent здесь,
               //он проставится в makeInst методом setParent
               var doNotSetParent = cfg.doNotSetParent;
               cfg.doNotSetParent = true;
               var defaultOpts = Utils.OptionsResolver.getDefaultOptions(cnstr);
               Utils.OptionsResolver.resolveOptions(cnstr, defaultOpts, cfg, cfg.parent && cfg.parent._moduleName ? cfg.parent._moduleName : "");

               if (cnstr.prototype._template) {
                  if (cfg.VDOMReady) {
                     instance = cfg;
                  } else {
                     if (cfg._options) {
                        if (cfg.setContainer) {
                           cfg.setContainer(cfg._options.element);
                        } else {
                           /* Если мы создаем VDOM контрол внутри CompoundControl
                           * при этом мы стартуем с главной, но на прототипе класса нет стилей и нам нужно
                           * добавить недостающие методы на конкретный инстанс, чтобы он был совместимый
                           * остальные компоненты должны общаться без совместимости друг с другом */
                           makeInstanceCompatible(cfg);
                           cfg.setContainer(cfg.element || cfg._options.element);
                        }
                     } else {
                        if (cfg.element.controlNodes && cfg.element.controlNodes[0] && cfg.element.controlNodes[0].control) {
                           instance = cfg.element.controlNodes[0].control;
                        } else {
                           cfg.iWantBeWS3 = true;
                           instance = cnstr.createControl(cnstr, cfg, cfg.element);
                        }
                     }
                  }
               } else {
                  instance = new cnstr(cfg);
               }
               cfg.doNotSetParent = doNotSetParent;

               var configObj = {};
               configObj[config] = instance;
               configStorage.merge(configObj);

               context = this.getLinkedContext() || context;
               binder.bindControl(instance, context, 'syncControl');
            }
         } else {
            cfg._container = window ? $(cfg.element) : cfg.element;
            instance = cfg;
            cfg = instance._savedOptions?instance._savedOptions:instance._options;
            cfg.element = instance._container;
            instance._options = cfg;
         }


      }

      if (cfg.name && !eventMap[cfg.name]){
         EnvEvent.Bus.channel(cfg.eventBusId, {
            waitForPermit: true
         });
         eventMap[cfg.name] = cfg.eventBusId;
      }
      return { cnstr: cnstr, cfg: cfg, instance: instance, cName: cName };
   }

   var CompoundControl = AreaAbstract.extend(/** @lends Lib/Control/CompoundControl/CompoundControl.prototype */{
      _$isRelativeTemplate: true,
      _$autoHeight: true,
      _isCoreCompound: true,
      _moduleName: 'Lib/Control/CompoundControl/CompoundControl',
      /**
       * Селектор, по которому будут инстанцироваться дочерние компоненты при инициализации
       * Некоторые дочерние компоненты могут инстанцироваться отложенно
       * В случае, если данные селектор равен пустой строке, будут инстанцироваться все дочерние
       */
      _createChildOnInitSelector: '',
      _childEventBusHashMap : null,
      _cleanupMarkupDataBinding: null,

      constructor: function CompoundControl(cfg) {
         this._childEventBusHashMap = this._childEventBusHashMap || {};

         CompoundControl.superclass.constructor.call(this, cfg, true);

         // создаём eventBus-ы для компонентов, которые будут инстанцироваться при инициализации
         this._prepareControlsConfig({
            selector: this._createChildOnInitSelector
         });

         this._initInstance();
      },

      /**
       * Возвращает EventBus дочернего комопнента
       * @param {String} name имя
       * @returns {cEventBus}
       */
      getEventBusOf: function(name){
         var eventBus = null;

         if (this._childEventBusHashMap[name]) {
            var eventBusId = this._childEventBusHashMap[name];
            if (EnvEvent.Bus.hasChannel(eventBusId)){
               eventBus = EnvEvent.Bus.channel(eventBusId);
            }
         }

         if (eventBus === null){
            throw new Error('Component with name "' + name + '" doesn`t exists in CompoundComponent with name "' + this.getName() + '"');
         }
         else{
            return eventBus;
         }
      },

      /**
       * Пересчёт своего размера и внутренней раскладки по событию изменения дочерних компонентов.
       * В базовом классе, который описывает общий случай, не зная вёрстки, мы не знаем, привело ли изменение в дочернем контроле к изменению размеров родителя, или нет.
       * Поэтому всегда считаем, что изменение есть.
       * @private
       */
      _onSizeChangedBatch: function() {
         return this._haveAutoSize() && (this._horizontalAlignment !== 'Stretch' || this._verticalAlignment !== 'Stretch');
      },



      /**
       * Подготавливаем конфигурацию компонентов, строим eventBus для всех, у кого есть имя
       * @private
       */
      _prepareControlsConfig: function(options){

         options = options || {};

         var
            selector = options.selector,
            root = options.container || this._container,
            idField = 'data-component',
            collection = getChildContainers(root, selector || '[' + idField + ']'),
            collectionItem,
            configArray = [],
            moduleName,
            resultConfig,
            eventMap = this._childEventBusHashMap,
            cfg, cnstr, dataId, cName, instance = null,
            config;

         for (var i = 0, l = collection.length; i < l; i++) {
            collectionItem = collection[i];
            dataId = collectionItem.getAttribute(idField);
            cName = collectionItem.getAttribute('data-component');
            config = collectionItem.getAttribute('config');
            if (cName) {
               if (!config) {
                  config = collectionItem.getAttribute('newconfig')||randomId('cfg-');
                  collectionItem.setAttribute('config', config);
               }
               cfg = parseMarkup(collectionItem, null);
               if (cfg && cfg.__doubleconfig) {
                  cfg = cfg[0];
                  config = cfg.__$config;
               }
               resultConfig = prepareConfigForControl.call(this, cfg, collectionItem, eventMap, cName, config);
               configArray.push({
                  ctor: resultConfig.cnstr,
                  cfg: resultConfig.cfg,
                     instance: resultConfig.instance,
                     cName: resultConfig.cName,
                     node: collectionItem,
                     hasMarkup: collectionItem.getAttribute('hasMarkup') === 'true'
                  });
            }
         }
         return configArray;
      },
       /**
        *
        * @param container
        * @returns {*|Core/Deferred}
        */
      reviveComponents: function(container) {
         var configArray, pdLoadResult,
            self = this;

         configArray = this._prepareControlsConfig({container: container});

         configArray = configArray.filter(function (item) {
            //Здесь контрол не убираем из обещго списка, у него не проставлен parent!
            //Нужно чтобы контрол попал в makeInst и там был вызван setParent
            return !item.node.wsControl || item.node.wsControl._template;
         });

         pdLoadResult = configArray.reduce(function(pd, config){
            if (!config.ctor) {
               pd.push(moduleStubs.require(config.cName).addCallback(function(mods){
                  config.ctor = mods[0];
                  return mods;
               }));
            }
            return pd;
         }, new cParallelDeferred());

         return pdLoadResult.done(configArray).getResult().addCallback(function(config){
            return this._loadControlsFromConfigArray(new cParallelDeferred(), '', config, true).getResult().createDependent();
         }.bind(this));
      },

      /**
       * Во время инициализации инстанцирует компоненты, указанные в разметке составного комопнента.
       * Если у текущего компонента в protected-свойстве _createChildOnInitSelector указан селектор, по которому
       * инстанцировать дочерние при инициализации, то инстанцирует по нему. Иначе инстанцирует все дочерние.
       * В отличие от метода AreaAbstract._loadControls, конфиг компонентов берёт не из родительского шаблона (currentTemplate), а из разметки,
       * и создаёт их синхронно, надеясь на то, что все зависимости уже указаны в define и загружены.
       * Теоретически, потом можно для большей скорости брать из шаблона.
       * @private
       */
      _loadControls: function(pdResult, template, parentId, checkDestroyed, errorHandler) {
         return this._loadControlsBySelector(pdResult, template, this._createChildOnInitSelector);
      },

      _loadControlsFromConfigArray: function(pdResult, template, configArray, withRebuildMarkup) {
         return this._runInBatchUpdate('_loadControls - ' + this._id, function() {
            //TODO:закрыл ибо лишнее
            //configArray.template = template;
            var instancesArray = configArray.map(makeInst, this);

            configArray.forEach(clearNodeConfig,this);

            this._markupDataBinding();

            var result = pdResult.done(instancesArray);
            return result;
         });
      },
      /**
       * Инстанцирует все компоненты, указанные в разметке составного комопнента, по селектору
       * @private
       */
      _loadControlsBySelector: function(pdResult, template, selector) {
         return this._loadControlsFromConfigArray(pdResult, template, this._prepareControlsConfig({
            selector: selector
         }));
      },


      /**
       * Пересоздаёт компонент с установленными опциями в том же html-контейнере.
       * @remark
       * Использование функции актуально в ряде прикладных задач, когда проще пересоздать компонент, чем обрабатывать изменения опций.
       * С точки зрения производительности пересоздание компонента не является оптимальным подходом.
       */
      rebuildMarkup: function(asynchronous) {
         if (this._dotTplFn) {
            if (asynchronous) {
               replaceContainer(this._container, this._buildMarkup(this._dotTplFn, this._getOptions(), undefined, undefined, this.getLinkedContext()));
               setTimeout(function() {
                  this._removeControls();
                  this.reviveComponents();
               }.bind(this), 0);
            } else {
               this._removeControls();
               replaceContainer(this._container, this._buildMarkup(this._dotTplFn, this._getOptions(), undefined, undefined, this.getLinkedContext()));
               this.reviveComponents();
            }
         }
      },

      /**
       * Тут мы пока не можем посчитать мин. размеры через дочерние контролы, поскольку не знаем, какая тут вёрстка: абсолютная или ещё какая.
       * Старая модель расчёта мин. размеров (как у AreaAbstract) тут не годится.
       * @private
       */
      _calcMinHeight: function() { return this._getOption('minHeight'); },

      /**
       * Тут мы пока не можем посчитать мин. размеры через дочерние контролы, поскольку не знаем, какая тут вёрстка: абсолютная или ещё какая.
       * Старая модель расчёта мин. размеров (как у AreaAbstract) тут не годится.
       * @private
       */
      _calcMinWidth: function() { return this._getOption('minWidth'); }
   });

   CompoundControl.beforeExtend = function (classPrototype, mixinsList, classExtender) {
      CompoundControl.prototype._setCompatibleOptions(classPrototype, mixinsList, classExtender);
   };

   return CompoundControl;
});
