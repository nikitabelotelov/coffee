define('Lib/Control/AreaAbstract/AreaAbstract', [
   'require',
   "Core/core-extend",
   "Lib/Control/AreaAbstract/AreaAbstract.compatible",
   "Core/ControlBatchUpdater",
   'Core/core-clone',
   'Core/helpers/Object/find',
   'Core/helpers/Hcontrol/getElementCachedDim',
   "Core/WindowManager",
   "Core/ParallelDeferred",
   "Core/Deferred",
   'Env/Env',
   "Lib/Control/Control",
   "Core/core-instance",
   "Core/CommandDispatcher",
   "Lib/Mixins/BreakClickBySelectMixin",
   'Browser/Transport',
   'Core/helpers/Object/isPlainObject',
   'Core/helpers/Array/findIndex',
   "Core/Context",
   "css!Lib/Control/AreaAbstract/AreaAbstract",
   "i18n!Lib/Control/Control"
],
   function(
      require,
      cExtend,
      AreaAbstractcompatible,
      ControlBatchUpdater,
      coreClone,
      objectFind,
      getElementCachedDim,
      WindowManager,
      cParallelDeferred,
      cDeferred,
      Env,
      baseControl,
      cInstance,
      CommandDispatcher,
      BreakClickBySelectMixin,
      Transport
   ) {

   'use strict';

   /**
    * Need it for compatibility. We shouldn't allow AreaAbstract to move focus by click. That's why click
    * event will be stopped after it handled in DOMEnvironment.
    * @param elem
    * @private
    */
   function isVdomTarget(elem) {
      var fromVdom = false,
         curTarget = elem;
      while (curTarget) {
         if (curTarget.wsControl && !curTarget.wsControl._template) {
            fromVdom = false;
            break;
         }
         if (curTarget.controlNodes) {
            fromVdom = true;
            break;
         }
         curTarget = curTarget.parentElement;
      }
      return fromVdom;
   }

   function sortControlsByTabIndex(a, b) {
      if (a && b) {
         var vA = +a.tabindex,
             vB = +b.tabindex;

         if (isNaN(vA) || vA == -1) {
            return 1;
         }

         if (isNaN(vB) || vB == -1) {
            return -1;
         }

         return vA - vB;
      } else {
         return 0;
      }
   }

   var GroupWrapper = cExtend({},{
      $protected: {
         _group: []
      },
      $constructor: function(group) {
         this._group = group;
      },
      _setEnabled: function(enabled) {

      },
      setVisible: function(visible) {

      },
      getGroupContainers: function() {

      },
      destroy: function() {
         this._group = null;
      }
   });

   // компонент, действие которого разрегистрируется в данный момент, происходит на дестрой этого компонента
   var unregisterButton = null,
      unregisterControl = null;

   var CompatibleBreakClickBySelectMixin = {
      _hasSelectionInContainer: BreakClickBySelectMixin._hasSelectionInContainer,
      _getSelection: BreakClickBySelectMixin._getSelection,
      _onClickHandler: BreakClickBySelectMixin.around._onClickHandler
   };

   // Существует ли уже AreaAbstract, подписанная на resize у window
   var existsResizedAreaAbstract = false;

   /**
    * Абстрактная область-контейнер
    *
    * @class Lib/Control/AreaAbstract/AreaAbstract
    * @author Крайнов Д.О.
    * @extends Lib/Control/Control
    * @public
    *
    * @mixes Lib/Control/AreaAbstract/AreaAbstract.compatible
    * @mixes Lib/Mixins/BreakClickBySelectMixin
    */
   var AreaAbstract = baseControl.Control.extend([AreaAbstractcompatible, CompatibleBreakClickBySelectMixin], /** @lends Lib/Control/AreaAbstract/AreaAbstract.prototype */{
      /**
       * @event onResize При изменении размеров контейнера
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onResize', function(event) {
       *       CoreFunctions.alert('Зачем ты меняешь мои размеры? Тебе разве не нравится, как я выгляжу?');
       *    });
       * </pre>
       * @see setSize
       */
      /**
       * @event onReady При полной готовности области
       * Все контролы внутри уже построились и готовы.
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onReady', function(event) {
       *       CoreFunctions.alert(this.getName()+ ' Готов к труду и обороне!');
       *    });
       * </pre>
       */
      /**
       *
       * @event onActivate При переходе фокуса в область
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onActivate', function(event) {
       *       this.setValue('Im activated');
       *       event.setResult(true);
       *    });
       * </pre>
       * @see tabindex
       */
      /**
       * @event onBeforeControlsLoad Перед началом загрузки контролов
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onBeforeControlsLoad', function(event) {
       *       log('Контролы еще не загружены');
       *    });
       * </pre>
       * @see onAfterLoad
       * @see onBeforeLoad
       */
      /**
       * @event onBeforeShow Перед открытием области
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onBeforeShow', function(event) {
       *       alert(this.getName() + ': Меня еще не видно, но я уже загрузился');
       *    });
       * </pre>
       * @see onBeforeShow
       */
      /**
       * @event onAfterShow После открытия области
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onAfterShow', function(event) {
       *       alert(this.getName() + ': вот я во всей своей красе!');
       *    });
       * </pre>
       * @see onAfterShow
       */
      /**
       * @event onBeforeLoad Перед загрузкой данных области
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onBeforeLoad', function(event) {
       *       alert(this.getName() + ': Трепещите! Я начинаю загружаться.');
       *    });
       * </pre>
       * @see onAfterLoad
       * @see onBeforeControlsLoad
       */
      /**
       * @event onAfterLoad После загрузки данных области
       * @param {Env/Event:Object} eventObject Дескриптор события.
       * @example
       * <pre>
       *    control.subscribe('onAfterLoad', function(event) {
       *       this.setValue('Im loaded');
       *       event.setResult(true);
       *    });
       * </pre>
       * @see onBeforeLoad
       * @see onBeforeControlsLoad
       */

      /**
       * @cfg {Core/Context|false} Контекст
       * @remark
       *
       * Свой собственный контекст данной области.
       * Если не передан, создастся новый из предыдущего (родительского) контекста.
       * Если нет родителя (не передали), то создаётся из Глобального контекста.
       * @see independentContext
       * @noShow
       */
      _$context: null,

      /**
       * @cfg {Boolean} Независимый контекст
       * @remark
       *
       * Возможность установить для данной области независимый контекст.
       * ВНИМАНИЕ! Может испортить контекст, переданный в опции {@link context} и {@link  Lib/Control/Control#linkedContext},
       * поменяв предка контексту! Передавайте данные объектом.
       * Будет создан новый контекст, зависимый от глобального. Т.е. контролы смогут обмениваться информацией с
       * внешним миром, если в глобальном контексте присутствует устанавливаемое локально значение.
       * @see context
       */
      _$independentContext: false,

      /**
       * @cfg {String} ограничить контекст
       * @remark
       *
       * Возможность установить для контекста данной области ограничения.
       * Работа только с текущим контекстом, игнорируется previousContext
       * Если значение set, то запись происходит только в текущий контекст, чтение не ограничено
       * Если значение setget, то запись происходит только в текущий контекст, чтение только из текущего контекста
       * @see context
       */
      _$contextRestriction: '',

      /**
       * @cfg {Object} Заменить контекст ( Core/Context )
       *
       * @noShow
       */
      _$record: false,

      /**
       * @cfg {Boolean} Модальность
       *
       */
       //ToDo: опция должна находиться в классе Window. Необходим рефакторинг.
      _$modal: false,

      /**
       * @cfg {Boolean} Валидация области, даже если она является скрытой
       * @remark
       * При валидации области валидируются все внутренние компоненты области.
       * Если область скрыта, по умолчанию внутренние компоненты такой области не валидируются.
       * Но для некоторых областей может потребоваться валидация внутренних компонентов несмотря на скрытость,
       * для этого используется данная опция.
       */
      _$validateIfHidden: false,

      /**
       * @cfg {Boolean} Если опция равна true, переходы по табу не будут зацикливаться в данной области.
       * @remark
       * Вместо циклического перехода по табу будет вызван метод focusCatch:
       * Установится фокус на следующий/предыдущий контрол, находящийся на одном структурном уровне с родительским контролом.
       * @see focusCatch
       */
      _$ignoreTabCycles: true,

      _$groups: null,
      _$handleFocusCatch: false,
      _$currentTemplate: '',
      _$isRelativeTemplate: false,
      _$children: [],
      _$_doGridCalculation: false,

      _moduleName: 'Lib/Control/AreaAbstract/AreaAbstract',
      _horizontalAlignment: 'Left',
      _pending: null,
      _pendingTrace: null,
      _waiting: null,
      _groupInstances: null,
      _activeChildControl: -1,      //Табиндекс контрола, на котором находится фокус.
                                    //Если для контрола запрещён табиндекс, то это его номер в массиве дочерних контролов.
      _activatedWithTabindex: true, //true - означает, что _activeChildControl является табиндексом контрола, на котором находится фокус.
      _childControls: null,           //Массив child'ов
      _childNonControls: null,        //Массив non-child'ов (всякий текст)
      _childsMapName: null,           //Мап с child'ами по имени
      _childsMapId: null,             //Мап с child'ами по id
      _childContainers: null,         //Массив детей-контейнеров для рекурсивного поиска
      _childsTabindex : false,
      _childsMapNameCache: null,
      _childsMapIdCache: null,
      _childsSizes: null,
      _maxTabindex : 0,
      _dChildReady : null,
      _keysWeHandle: null,
      _resizer: null,
      _toolbarCount: null,  //Хранит инфу о количестве тулбаров, лежащей в ней
      _defaultButton: null,
      _activationIndex: 0,          //Индекс последней активации области
      _opener: undefined,           //Контрол, который открыл окно, но может не являться родителем области
      _isModal: false,
      _isReady: false,
      _waitersByName: null,
      _waitersById: null,
      _onDestroyOpener: null,
      _isInitComplete: false, //Флаг отвечающий за прохождение _initComplete

      constructor: function AreaAbstract(cfg, skipInit) {
         cfg = cfg || {};
         this._$groups = {};
         this._pending = this._pending || [];
         this._pendingTrace = this._pendingTrace || [];
         this._waiting = this._waiting || [];
         this._groupInstances = this._groupInstances || {};
         this._childControls = this._childControls || [];
         this._childNonControls = this._childNonControls || [];
         this._childsMapName = this._childsMapName || {};
         this._childsMapId = this._childsMapId || {};
         this._childContainers = this._childContainers || [];
         this._childsSizes = this._childsSizes || {};

         this._childsMapNameCache = this._childsMapNameCache || {};
         this._childsMapIdCache = this._childsMapIdCache || {};

         this._keysWeHandle = this._keysWeHandle || [
            Env.constants.key.tab,
            Env.constants.key.enter
         ];
         this._toolbarCount = {top: 0, right: 0, bottom: 0, left: 0};
         this._waitersByName = {};
         this._waitersById = {};

         this._baseTabIndex = cfg.tabindex;

         AreaAbstract.superclass.constructor.call(this, cfg, true);

         var self = this;
         this._publish('onResize', 'onActivate', 'onBeforeShow', 'onAfterShow', 'onBeforeLoad', 'onAfterLoad', 'onBeforeControlsLoad', 'onBatchFinished');

         this._isModal = this._getOption('modal');
         this._dChildReady = new cParallelDeferred();

         if (!this._isCorrectContainer()) {
            this._container = $('<div></div>', {tabindex: this._getOption('tabindex') >= 0 ? 0 : -1 })
               .bind('click', this._onActionHandler.bind(this));

            if (this._checkClickByTap) {
               this._container.bind('touchstart touchmove touchend', this._onActionHandler.bind(this));
            }

            this._container[0].wsControl = this;
            if (this._getOption('cssClassName')) {
               this._container.addClass(this._getOption('cssClassName'));
            }

            this._initKeyboardMonitor();
         }



         /* Обработка клика на Area. Рассылает событие container-clicked.
          ($.event используется для того, чтобы не использовать остановку события,
          но предотвратить его всплытие(обработку) во всех родительских Area.
          При клике на Area устанавливается флаг, а когда событие завершается - флаг снимается.)
          */
         this._container.bind('mousedown.activate', function() {
            //локализую проблему во время перехода на jQuery 3
            if(!$.event.props) {
                $.event.props = [];
            }
            if (!$.event.props['ws-area-activated-id']) {
               // Рассылаем кастомное jQ сообщение о клике на контейнер
               self._container.trigger('container-clicked');
               $.event.props['ws-area-activated-id'] = self.getId();
            }
         });

         // Если внутри vdom появляется CompoundControl, могло случиться так, что Env/Env:constants
         // уже подгружен, и в нем нет jQuery-элемента $doc
         if (!Env.constants.$doc) {
            // Если он отсутствует, добавляем его
            Env.constants.$doc = $(document);
         } else if (!Env.constants.$doc.bind) {
            // Если он уже есть, но не является jQuery-элементом, оборачиваем его, так как
            // дальше он будет использоваться как jQuery-документ
            Env.constants.$doc = $(Env.constants.$doc);
         }

         Env.constants.$doc.bind('mousedown.' +  this.getId(), function() {
             //локализую проблему во время перехода на jQuery 3
             if(!$.event.props) {
                 $.event.props = [];
             }
            if (self.getId() == $.event.props['ws-area-activated-id']) {
               $.event.props['ws-area-activated-id'] = null;
            }
         });
         // Firefox по Ctrl+клик выделяет всю страницу, сбрасываем его выделение по mousedown
         if (Env.detection.firefox) {
            this._container.bind('mousedown.fxselect', function(e) {
               if (e.ctrlKey) {
                  e.preventDefault();
               }
            });
         }

         // Для вызова события onResize при изменении размеров окна, нужно подписаться
         // на событие resize у window. Сделать это должна только самая верхняя AreaAbstract
         // на странице. Самой верхней она является если у нее нет родителя, либо если
         // еще ни одна AreaAbstract не подписана на изменение размеров окна. Например у
         // корневой AreaAbstract на vdom-странице есть родитель (Controls/Application),
         // но она все равно должна подписаться на resize
         if (!this.getParent() || !existsResizedAreaAbstract) {
            this._subscribeToWindowResize();
            existsResizedAreaAbstract = true;
         }

         this._dChildReady.getResult().addCallback(function() {
            self._childNonControls = self._container.children(Env.constants.NON_CTRL);
         });

         this.setOpener(cfg && cfg.opener);

         CommandDispatcher.declareCommand(this, 'registerDefaultButtonAction', function() {
            self.sendCommand('resizeYourself');
         });

         // команда регистрации, для каждой AreaAbstract вверх по предкам начиная с текущей проставляем действие по умолчанию
         // до тех пор, пока не встретим AreaAbstract у которого уже есть команда по умолчанию, либо пока не дойдем до LikeWindowMixin
         CommandDispatcher.declareCommand(this, 'registerDefaultButtonAction', function(defaultAction, button) {
            if (self._defaultButton) {
               return true;
            }
            self._registerDefaultButtonAction(defaultAction, button);
            return !!cInstance.instanceOfMixin(self, 'Lib/Mixins/LikeWindowMixin');
         });

         // команда разрегистрации, отменяем регистрацию на действие вверх по предкам начиная с текущей до тех пор,
         // пока отменяемое действие совпадает с действием текущей AreaAbstract либо пока не встретили LikeWindowMixin.
         // чтобы зарегистрировать новое действие, нужно сначала отменить регистрацию предыдущего
         CommandDispatcher.declareCommand(this, 'unregisterDefaultButtonAction', function() {
            // храним, какой контрол инициировал разрегистрацию
            if (!unregisterControl) {
               unregisterControl = self;
            }
            // если unregisterButton нет, то есть мы в не процессе разрегистрации кнопки, и у нас есть _defaultButton, то есть действие по умолчанию, то мы начинаем процесс разгрегистрации
            // процесс разрегистрации отменяет действие по умолчанию для всех парентов, которые имеют такое же действие как разрегистрируемое.
            if (self._defaultButton && !unregisterButton) {
               unregisterButton = self._defaultButton;
            } else if (self === unregisterButton) {
               // пытаемся позвать разрегистрацию кнопки на самой кнопке, просто останавливаем такую команду
               return true;
            } else if (self !== unregisterControl && (!self._defaultButton || unregisterButton !== self._defaultButton) ) {
               // если мы в процессе разрегистрации, и встретили действие, которое отличается от разрегистрируемого, то останавливаем процесс
               unregisterButton = null;
               unregisterControl = null;
               return true;
            }

            // сама разрегистрация действия на компоненте
            self._unregisterDefaultButtonAction();

            // останавливаем процесс разрегистрации, когда команда дошла до окна, до верхнего компонента страницы, или у компонента нет парента
            var res = !!cInstance.instanceOfMixin(self, 'Lib/Mixins/LikeWindowMixin') || !!cInstance.instanceOfModule(self, 'OnlineSbisRu/Base/View') || !self.getParent();
            if (res) {
               unregisterButton = null;
               unregisterControl = null;
            }
            return res;
         });

         if (!skipInit) {
            this._initInstance();
         }
      },


      /**
       * Подписка на изменение размера окна браузера. Некоторым наследникам, например, FloatArea, нужно его переопределить,
       * (FloatArea выключает эту подписку).
       * @private
       */
      _subscribeToWindowResize: function() {
         Env.constants.$win.bind('resize.' + this.getId(), this._onResizeHandler.bind(this));
      },

      /**
       *
       * Добавить отложенную асинхронную операцию в очередь ожидания окна.
       * @param {Core/Deferred} dOperation Отложенная операция.
       * @returns {Boolean} "true", если добавление операции в очередь успешно.
       * @see waitAllPendingOperations
       */
      addPendingOperation: function(dOperation) {
         var result = !!(dOperation && (dOperation instanceof cDeferred));
         if (result) {
            this._pending.push(dOperation);
            this._pendingTrace.push(Env.coreDebug.getStackTrace());
            dOperation.addBoth(this._checkPendingOperations.bind(this));
         }
         return result;
      },
      _finishAllPendingsWithSave: function() {
         this._pending.forEach(function(pending) {
            pending.callback(true);
         });
      },
      /**
       * Получение информации о добавленных пендингах, включая информацию, откуда был добавлен пендинг
       * @returns {Array} Массив объектов, хранящих пендинг и информацию, откуда был добавлен пендинг
       */
      getAllPendingInfo: function() {
         var res = [],
            self = this;
         this._pending.forEach(function(pending, index) {
            res.push({
               pending: pending,
               trace: self._pendingTrace[index]
            })
         });
         return res;
      },
      /**
       *
       * Добавить асинхронное событие на завершение всех отложенных операций.
       * Добавить асинхронное событие, которое сработает в момент завершения всех отложенных операций,
       * добавленных с помощью {@link addPendingOperation}.
       * Если очередь пуста, то сработает сразу.
       * Если попытаться передать Deferred, находящийся в каком-либо состоянии (успех, ошибка), то метод вернет false и
       * ожидающий не будет добавлен в очередь.
       * @param {Core/Deferred} dNotify Deferred-объект, ожидающий завершения всех отложенных операций.
       * @returns {Boolean} "true", если добавление в очередь ожидающих успешно.
       * @see addPendingOperation
       */
      waitAllPendingOperations: function(dNotify) {
         if(dNotify && (dNotify instanceof cDeferred) && !dNotify.isReady()) {
            if(this._pending.length === 0)
               dNotify.callback();
            else
               this._waiting.push(dNotify);
            return true;
         } else
            return false;
      },
      _checkPendingOperations: function(res) {
         var totalOps = this._pending.length, result;

         // Сперва отберем Deferred, которые завершились
         result = this._pending.filter(function(dfr){
            return dfr.isReady();
         });

         // Затем получим их результаты
         result = result.map(function(dfr) {
            return dfr.getResult();
         });

         // If every waiting op is completed
         if(result.length == totalOps) {
            this._pending = [];
            this._pendingTrace = [];
            while(this._waiting.length > 0) {
               this._waiting.pop().callback(result);
            }
         }
         // if res instanceof Error, return it as non-captured
         return res;
      },

      init: function() {
         WindowManager.addWindow(this);

         AreaAbstract.superclass.init.apply(this, arguments);

         this._subscribeOnReady();

         this._runInBatchUpdate('AreaAbstract - init - ' + this._id, function() {
            return cDeferred.callbackWrapper(this._loadDescendents(),
                                               this._childrenLoadCallback.bind(this));
         });

         // нужно для новой системы фокусов, чтобы было понятно, с какого табиндекса уходим
         var newTabindex = this._baseTabIndex;
         if (newTabindex === 0) {
            newTabindex = -1;
         }
         if (newTabindex !== undefined) {
            this._getElementToFocus()[0].setAttribute('tabindex', newTabindex);
            this._container[0].setAttribute('tabindex', newTabindex);
         }
      },

      _buildMarkup: function(dotTplFn, options, vStorage, attrsToMergeFn, context) {
         options.className = options.className || '';
         return AreaAbstract.superclass._buildMarkup.apply(this, arguments);
      },


      /**
       *  Обработка клавиатурных нажатий
       *  @param {Event} e
       */
      _keyboardHover: function(e){
         return this._oldKeyboardHover.apply(this, arguments);
      },

      /**
       *
       * Перевести фокус на первый дочерний контрол.
       * @example
       * При нажатии клавиши "n" фокус переходит на следующий дочерний контрол (движение вниз).
       * Если переход фокуса на следующий дочерний контрол невозможен или контрола нет, то фокус переходит на первый дочерний контрол.
       * <pre>
       *    control.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which == cConstants.key.n) {
       *          var res = this.detectNextActiveChildControl();
       *          if (!res) {
       *             this.activateFirstControl();
       *          }
       *       }
       *    });
       * </pre>
       * @see setActive
       * @see onActivate
       * @see activateLastControl
       */
      activateFirstControl: function(noFocus){
         return this._oldActivateFirstControl.apply(this, arguments);
      },
      /**
       *
       * Перевести фокус на последний дочерний контрол.
       * @example
       * При нажатии клавиши "p" фокус переходит на предыдущий дочерний контрол (движение вверх).
       * Если переход фокуса на предыдущий дочерний контрол невозможен или контрола нет, то фокус переходит на последний дочерний контрол.
       * <pre>
       *    control.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which == cConstants.key.p) {
       *          var res = this.detectNextActiveChildControl();
       *          if (!res) {
       *             this.activateLastControl();
       *          }
       *       }
       *    });
       * </pre>
       * @see activateFirstControl
       * @see setActive
       * @see onActivate
       */
      activateLastControl: function(noFocus){
         return this._oldActivateLastControl.apply(this, arguments);
      },

      /**
       *
       * Переместить фокус на следующий/предыдущий дочерний контрол.
       * @param {Boolean} isShiftKey Направление перехода фокуса.
       *
       * Возможные значения:
       * 1. true - фокус перейдёт на предыдущий дочерний контрол, если он существует.
       * 2. false - фокус перейдёт на следующий дочерний контрол, если он существует.
       * @param {Number} [searchFrom = undefined] С номера какого дочернего контрола искать следующий, на который перевести фокус.
       * Нумерация дочерних контролов начинается с 1.
       *
       * В значении undefined поиск будет произведён:
       *    a) С первого дочернего контрола.
       *    b) С дочернего контрола, который в данный момент находится в фокусе.
       * @return {Boolean} Результат поиска и перемещения фокуса.
       *
       * Возможные значения:
       * 1. true - следущий/предыдущий дочерний контрол найден и на него переведён фокус.
       * 2. false - следущий/предыдущий дочерний контрол не найден или он не может принимать фокус.
       * Фокус остаётся в прежней позиции.
       * @example
       * При нажатии клавиши "n" перевести фокус на следующий дочерний контрол, который является полем ввода.
       * <pre>
       *    var i = 0,
       *        fields; //массив с номерами полей ввода
       *    control.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which == cConstants.key.n) {
       *          this.detectNextActiveChildControl(false, fields[i]);
       *          i++;
       *       }
       *    });
       * </pre>
       * @see setChildActive
       * @see getChildControls
       */
      detectNextActiveChildControl: function(isShiftKey, searchFrom, noFocus) {
         return this._oldDetectNextActiveChildControl.apply(this, arguments);
      },


      _childrenLoadCallback: function() {
         this._notify('onBeforeShow');
         this._notifyBatchDelayed('onAfterShow');
      },

      _createCheckDestroyedFunc: function(funcName, areaName, errorHandler) {
         var self = this;
         return function(silent) {
            if(self.isDestroyed()){
               var err = new Error(funcName + ": " + rk("Область") + ' ' + areaName + ", id = " + self._id + rk("была уничтожена до начала создания дочерних контролов."));
               if (silent) {
                  err.silent = true;
                  errorHandler(err, true);
               } else {
                  //Область уже уничтожена (во время загрузки шаблона), кидаем ошибку,
                  // которая вернётся в деферреде setTemplate/prepareTemplate и других функциях, пользующихся _loadTemplate
                  throw err;
               }
            }
            return self.isDestroyed();
         }
      },

      _makeLoadErrorHandler: function(parallelDeferred) {
         return function(e) {
            if (!e.silent) {
               var message = e.message,
                   notifierDiv = $('#onlineChecker'),
                   notifierDivContent = notifierDiv.find('#warningText'),
                   isOnline = window.navigator.onLine;

               if(e instanceof Transport.fetch.Errors.HTTP){
                  message += ', ' + e.url;
               }

               Env.IoC.resolve('ILogger').error("AreaAbstract", rk("Ошибка при загрузке дочерних компонентов") + " (" + message + ")", e);
               if(isOnline) {
                  notifierDivContent.text(rk('Произошла ошибка при попытке загрузки ресурса. Пожалуйста, обновите страницу'));
                  notifierDiv.css('display', '');
                  notifierDiv.css('zIndex', 9999);
               }
            }

            try {
               var errorDeferred = new cDeferred();
               errorDeferred.addErrback(function (e) {
                  return e;
               });
               errorDeferred.errback(e);

               parallelDeferred.push(errorDeferred);//Передаём ошибку в виде деферреда, ибо иначе никак
               parallelDeferred.done();
            } catch (err) {
            }
            return e;
         }.bind(this);
      },

      _createChildrenLoadCallback: function() {
         var
            self = this,
            pdResult = new cParallelDeferred(),
            innerCallback = this._dChildReady.getResult().addCallback(this._templateInnerCallback.bind(this)).createDependent();

         pdResult.getResult().addErrback(function (e) {
            //Для родительского контейнера: нужно _dChildReady засигналить ошибкой, а то его родитель ждёт.
            //Ошибка пройдёт в родительский _dChildReady и выше.
            //
            //addErrback нужно добавлять первым, чтобы ошибка в _templateInnerCallback не вызывала бы этот код, и не было бы второго done у _dChildReady
            var errorDeferred = new cDeferred();
            self._dChildReady.push(errorDeferred.errback(e)).done();
            return e;
         }).addCallback(function () {
            self._dChildReady.done();
            return innerCallback;
         });

         return pdResult;
      },

      _showControls: function(){
         this._notify('onAfterLoad');
      },

      _collectControlsToBuild: function(template, parentId){
         var result = this._getOption('children');
         if (!result.length && template) {
            result = template.getControls(parentId, this.getContainer());
         }
         return result;
      },
      /**
       * Отдает список контролов для построения в порядке tabindex (если указан)
       * @param {String} template
       * @param {String} parentId
       * @returns {Array}
       * @private
       */
      _getControlsToBuild: function(template, parentId) {
         var result = this._collectControlsToBuild(template, parentId);

         if (!template || template.needSetZindexByOrder()) {
            result = result.map(function(i, idx){
               i.zIndex = ('zIndex' in i) ? i.zIndex : idx + 1;
               return i;
            });
         }

         result = result.sort(sortControlsByTabIndex);
         return result;
      },

      _loadControls: function(pdResult, template, parentId, checkDestroyed, errorHandler) {
         return this._runInBatchUpdate('_loadControls - ' + this._id, function() {
            var
               self = this,
               controls = this._getControlsToBuild(template, parentId);

            controls = coreClone(controls).map(function(control){
               var type = control.type,
                   typeDesc,
                   result,
                   coreModules =  ['Deprecated', 'Lib'],
                   moduleName = type.indexOf('/') > 0 ? type.split('/')[0] : false;
               if (moduleName && (coreModules.indexOf(moduleName) > -1 || Object.keys(Env.constants.modules).some(function (name) {
                      return Env.constants.modules[name] === moduleName;
                   })) ||
                   (type.indexOf('SBIS3.') === -1 && type.indexOf('/') > -1) && type.indexOf('Control/') == -1
               ) {
                  result = {
                     ctor: require(type),
                     config: control
                  };
               } else {
                  moduleName = type;

                  result = {
                     ctor: require(moduleName),
                     config: control
                  };
               }

               return result;
            });

            controls.forEach(function(control){
               var
                   containerEl = self._container[0],
                   controlConfig = control.config,
                   ctor = control.ctor,
                   instance;

               try {
                  controlConfig.element = $('#' + controlConfig.id, containerEl);
                  controlConfig.parent = self;
                  controlConfig.linkedContext = self._context;
                  controlConfig.currentTemplate = template;
                  controlConfig.supportOldJinneeMarkup = true;

                  instance = new ctor(controlConfig);

                  if (typeof instance.getReadyDeferred === 'function') {
                     self._dChildReady.push(instance.getReadyDeferred());
                  }

                  // На VDOM контролах нет метода getAlignment, поэтому для vdom контролов ничего не делаем
                  if (!instance._template) {
                     var alignment = instance.getAlignment();
                     if (alignment.horizontalAlignment != 'Stretch' || alignment.verticalAlignment != 'Stretch') {
                        self._doGridCalculation = true;
                     }
                  }
               }
               finally {
                  //если внутри try вылетит исключение, то оно пройдёт в errorHandler, прицепленный в addErrback
               }
            });

            pdResult.done();

            return pdResult;
         });
      },
      /**
       * Загрузка потомков
       * Возвращает Deferred, который происходит после завершения инициализации всех контролов, или undefined, если инициализация прошла синхронно.
       * Этот же Deferred генерирует всем onBeforeLoad
       * @returns {cDeferred|undefined}
       */
      _loadDescendents:function (){
         return this._runInBatchUpdate('_loadDescendents - ' + this._id, function() {
            var
               dMultiResult = this._createChildrenLoadCallback(),
               errorHandler = this._makeLoadErrorHandler(dMultiResult),
               template = this._getOption('currentTemplate'),
               templateName,
               checkDestroyed = this._createCheckDestroyedFunc('_loadDescendents', this._getOption('name'), errorHandler);

            this._notify('onBeforeLoad');    //По-видимому, onBeforeLoad должен происходить всё же ДО загрузки
            this._notify('onBeforeControlsLoad');
            try {
               this._isPage = !!(template && template.isPage());
               this._loadControls(dMultiResult, template, this.getId(), checkDestroyed, errorHandler);
            } catch (e) {
               templateName = (template && template.getName) ? template.getName() : '<неизвестном>';
               e.message += ' - в шаблоне ' + templateName;
               errorHandler(e);
            }

            return dMultiResult.getResult().createDependent();
         });
      },

      /**
       *
       *
       * Готова ли area и всё её дочерние area
       * @returns {Boolean}
       */
      isAllReady: function(){
         var controls = this.getChildControls();
         for(var i = 0; i < controls.length; ++i){
            if(controls[i].isReady && !controls[i].isReady()){
               return false;
            }
         }
         return true;
      },

      /**
       * Метод, перекрываемый в потомках. Нужен, чтобы выполнить какой-то код после готовности области, но до отработки пользовательских событий готовности (onReady+onAfterLoad)
       * @private
       */
      _templateInnerCallbackBeforeReady: function() {
      },

      _templateInnerCallback: function() {
         this._isReady = true;

         this._initResizers();

         ControlBatchUpdater.runBatchedDelayedAction('resizeYourself');
         this._templateInnerCallbackBeforeReady();

         this._notifyOnReady();
         this._showControls();
      },
      _notifyOnReady: function(){
         this._notify('onReady');
         this._container.trigger('onReady');
      },
      /**
       * Обработчик клика по области
       * @param {Event} event стандартный jQuery-ивент
       * @private
       */
      _onClickHandler: function(event){

         CompatibleBreakClickBySelectMixin._onClickHandler.call(this, function() {
            if (!isVdomTarget(event.target)) {
               if (this._getOption('activableByClick')) {
                  this.onBringToFront();
               }
            }
            this._notify('onClick', event);
         }, event);
      },
      /**
       *
       *
       * Переместить область "выше" остальных. Актуально в случае окон.
       * @example
       * После отрытия окна переместить его выше остальных.
       * <pre>
       *    window.subscribe('onAfterShow', function() {
       *       this.moveToTop();
       *    });
       * </pre>
       */
      moveToTop: function(){
      },


      _restoreSize:function () {
         if (this._width || this._height) {
            this._container.css({
               width: this._getOption('autoWidth') || this._horizontalAlignment === "Stretch" ? 'auto' : this._width,
               height: this._getOption('autoHeight') || this._verticalAlignment === "Stretch" ? 'auto' : this._height
            });
         }
      },

      /**
       *
       * Установить размеры области.
       * @param {Object} size Объект, описыващий размеры области.
       * @example
       * 1. Структура передаваемого объекта. Значения опций указаны в pixel.
       * <pre>
       *    var object = {
       *       //ширина в 250px
       *       width: 250,
       *       height: 380
       *    };
       * </pre>
       *
       * 2. Перед открытием окна (window) задать ему размеры 300x300 px.
       * <pre>
       *    window.subscribe('onBeforeShow', function() {
       *       this.setSize({
       *          width: 300,
       *          height: 300
       *       });
       *    });
       * </pre>
       * @see onResize
       */
      setSize: function(size) {
         if (this._getOption('autoHeight')) {
            size['height'] = 'auto';
         } else {
            this._getFixedHeight.reset();
         }

         if (!this._getOption('autoWidth')) {
            this._getFixedWidth.reset();
         }

         this._container.css(size);
         this._resizeChilds();
         this._notify('onResize');
      },

      /**
       *
       * Отдает объект, для выполнения массовых действий над контролами группы
       *
       * @param {String} name Имя группы
       * @return {GroupWrapper} Враппер группы или null если такой группы не существует
       */
      getNamedGroup: function(name) {
         if(name in this._getOption('groups')) {
            if(name in this._groupInstances) {
               return this._groupInstances[name];
            }
            else {
               var group = [];
               var groupMembers = this._getOption('groups')[name];
               for(var i = 0, l = groupMembers.length; i < l; i++) {
                  try {
                     group.push(this.getChildControlById(groupMembers[i]));
                  } catch (e) {
                     // ignore
                  }
               }
               return (this._groupInstances[name] = new GroupWrapper(group));
            }
         } else {
            return null;
         }
      },

      /**
       *
       * Находит ближайший контрол по имени
       * @param {String} name Имя нужного контрола
       * @param {Boolean} [subAreas] Нужен ли поиск в дочерних контейнерах, или только "вверх"
       */
      getNearestChildControlByName: function(name, subAreas){
         var marks = {},
            queue = [],
            parent,
            append = function(area){
               if(area && !marks[area.getId()]){
                  marks[area.getId()] = true;
                  queue.push(area);
               }
            };
         if(subAreas){
            append(this);
            while(queue.length){
               var areas = queue.shift();
               if(areas.hasChildControlByName){
                  if(areas.hasChildControlByName(name)){
                     return areas.getChildControlByName(name);
                  }
               }
               else if(areas.getName && areas.getName() === name){
                  return areas;
               }
               parent = areas.getParent();
               if(parent){
                  append(parent);
               }
               if(areas.getOpener){
                  append(areas.getOpener());
               }
               if(areas._childContainers){
                  for(var i = 0, len = areas._childContainers.length; i < len; ++i){
                     append(areas._childContainers[i]);
                  }
               }
            }
         }
         else{
            parent = this;
            while(parent){
               if(parent.hasChildControlByName){
                  if(parent.hasChildControlByName(name)){
                     return parent.getChildControlByName(name);
                  }
               }
               parent = parent.getParent() || (parent.getOpener && parent.getOpener());
            }
         }
         return undefined;
      },

      /**
       *
       * Получить непосредственные дочерние контролы.
       * @returns {Array} Массив дочерних контролов.
       * @example
       * Получить непосредственные дочерние контролы. Среди них найти кнопку и табличное представление.
       * Установить табличное представление владельцем кнопки.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var array = this.getImmediateChildControls(),
       *           button,
       *           tableView;
       *       array.forEach(function(element) {
       *          if (element instanceof Deprecated/Controls/ButtonAbstract/ButtonAbstract) {
       *             button = element;
       *          } else if (element instanceof Deprecated/Controls/TableView/TableView) {
       *             tableView = element;
       *          }
       *       });
       *       button.setOwner(tableView);
       *    });
       * </pre>
       * @see getChildControls
       * @see getChildControlByName
       * @see getChildControlById
       * @see waitChildControlByName
       * @see waitChildControlById
       * @see hasChildControlByName
       * @see getNearestChildControlByName
       * @see getActiveChildControl
       */
      getImmediateChildControls: function() {
         var filtered = [];
         for (var i = 0; i < this._childControls.length; i++) {
            if(this._childControls[i]) {
               filtered.push(this._childControls[i]);
            }
         }
         return filtered;
      },
      /**
       *
       */
      _isActiveByTabindex : function(){
         return this._childsTabindex &&
                this._activeChildControl in this._childsTabindex &&
                this._childControls[this._childsTabindex[this._activeChildControl]];
      },
      /**
       *
       * ToDo: опция modal должна находиться в классе Window. Поэтому и метод к ней тоже нужен в Windows. Необходим рефакторинг.
       */
      isModal: function() { return this._isModal; },


      /**
       * НИКОГДА НЕ ЗОВИТЕ ЭТОТ МЕТОД!
       * @private
       */
      _destroySuperClass: function(){
         AreaAbstract.superclass.destroy.apply(this, arguments);
      },
      /**
       *
       * Разрушить дочерний контрол c указанным идентификатором.
       * @param {String} id Идентификатор дочернего контрола.
       * @example
       * При клике на кнопку уничтожать последний дочерний флаг (fieldCheckbox).
       * <pre>
       *    //массив с идентификаторами флагов
       *    var flags;
       *    button.subscribe('onClick', function() {
       *       var number = this.getUserData('NumberOfFlags');
       *       if (number > 0) {
       *          var parent = this.getParent();
       *          parent.destroyChild(flags[number-1]);
       *          this.setUserData('NumberOfFlags', number-1);
       *       }
       *    });
       * </pre>
       */
      destroyChild: function(id){
         var childControlNumber = this._childsMapId[id];
         if(childControlNumber !== undefined){
            var childControl = this._childControls[childControlNumber];
            if(childControl){
               this.unregisterChildControl(childControl);
               childControl.destroy();
            }
         }
      },
      /**
       *
       * Убрать фокус с дочернего контрола.
       * @param {Boolean} [selfOnly = false] Убрать фокус только с контрола.
       *
       * Возможные значения:
       * 1. true - убрать фокус только с контрола.
       * 2. false - убрать фокус с контрола и области, на которой он построен.
       * @example
       * При нажатии клавиши "n" перевести фокус на следующий дочерний контрол, который является полем ввода.
       * Если переход невозможен, то убрать фокус с дочернего контрола.
       * <pre>
       *    var i = 0,
       *        fields; //массив с номерами полей ввода
       *    control.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which == cConstants.key.n) {
       *          var res = this.detectNextActiveChildControl(false, fields[i]);
       *          //в зависимости от результата либо увеличиваем индекс, либо снимаем фокус
       *          res ? i++ : this.disableActiveCtrl();
       *       }
       *    });
       * </pre>
       * @see getActiveChildControl
       */
      disableActiveCtrl : function(selfOnly){
         var activeControl = this.getActiveChildControl();

         if (activeControl && activeControl.isActive()){
            var isArea = activeControl instanceof AreaAbstract;
            if(isArea && !selfOnly || !isArea){
               activeControl.setActive(false);
            }
         }
      },
      hide: function() {
         var
            activeChild = this.getActiveChildControl(undefined, true);
         if (activeChild) {
            // костыль. не всегда успевает активироваться до конца компонент. раз мы тут нашли его как активный,
            // значит на всякий случай проставим _isControlActive, чтобы при его дизактивации он смог вообще дизактивироваться (там идет проверка на _isControlActive)
            activeChild._isControlActive = true;
            activeChild.setActive(false, undefined, undefined, this.getParent());
         }
         AreaAbstract.superclass.hide.apply(this, arguments);
      },
      /**
       *
       * Получить число тулабаров с определённой стороны области.
       * @param {String} side Сторона:
       * <ol>
       *    <li>top - сверху;</li>
       *    <li>right - справа;</li>
       *    <li>bottom - снизу;</li>
       *    <li>left - слева.</li>
       * </ol>
       * @example
       * <pre>
       *    if (this.getToolBarCount('top') === 0) {
       *       Core.attachInstance('Deprecated/Controls/ToolBar/ToolBar', {
       *          position: 'top',
       *          buttonsSide: 'right',
       *          subBtnCfg: [
       *          //конфигурация кнопок
       *          ]
       *       });
       *       this.increaseToolBarCount('top');
       *    }
       * <pre>
       * @see increaseToolBarCount
       */
      //TODO: надо убрать
      getToolBarCount: function(side){
         return this._toolbarCount[side];
      },
      /**
       *
       * Увеличить число тулабаров с какой-либо стороны области.
       * @param {String} side Сторона:
       * <ol>
       *    <li>top - сверху;</li>
       *    <li>right - справа;</li>
       *    <li>bottom - снизу;</li>
       *    <li>left - слева.</li>
       * </ol>
       * @example
       * <pre>
       *    toolbar.subscribe('onReady', function() {
       *       area.increaseToolBarCount('top');
       *    });
       * </pre>
       * @see getToolBarCount
       */
      //TODO: надо убрать
      increaseToolBarCount: function(side){
         ++this._toolbarCount[side];
      },



      /**
       *
       * Изменяет статус включенности элемента и всех его дочерних элементов.
       * При смене состояния в false - меняет всем дочерним контролам состояние на false, в противном случае
       * меняет состояние дочерних элементов на то, которое было до переключение в false.
       * @param {Boolean} enabled Статус "включенности" элемента управления.
       * @example
       * <pre>
       *    if(control.isEnabled())
       *       control.setEnabled(false);
       * </pre>
       */
      setEnabled : function(enabled) {
         var prev = this._getOption('enabled');
         AreaAbstract.superclass.setEnabled.apply(this, arguments);

         if (this._getOption('enabled') !== prev) {
            this.getImmediateChildControls().forEach(this._setupChildByAreaEnabled, this);
         }
      },
      _getAutoHeight: function() {
         return this._resizer ?
                getElementCachedDim(this._resizer, 'height') :
                this._container.outerHeight();
      },

      _getAutoWidth: function() {
         return this._resizer ?
                getElementCachedDim(this._resizer, 'width') :
                this._container.outerWidth();
      },

      /**
       * Вычисляет свою возможную минимальную высоту
       * @return {Number}
       * @private
       */
      _calcMinHeight: function() {
         var result, size;
         if (this._resizer) {
            result = getElementCachedDim(this._resizer, 'height');
         } else {
            result = Math.max(this._getOption('minHeight'), this._getResizerHeight());
         }
         return result || 0;
      },
      /**
       * Вычисляет свою возможную минимальную ширину
       * @return {Number}
       * @private
       */
      _calcMinWidth: function() {
         var result, size;
         if (this._resizer) {
            result = getElementCachedDim(this._resizer, 'width');
         } else {
            result = Math.max(this._getOption('minWidth'), this._getResizerWidth());
         }
         return result || 0;
      },



      /**
       *
       * Получить ресайзер.
       * @returns {null|*}
       */
      getResizer: function(){
         return this._resizer;
      },

      _haveAutoSize: function() {
         return this._getOption('autoHeight') || this._getOption('autoWidth');
      },

      _haveStretch: function() {
         return this._horizontalAlignment === 'Stretch' || this._verticalAlignment === 'Stretch';
      },




      /**
       *
       * Является ли область страницей.
       * @returns {Boolean} Признак: true - является, false - нет.
       */
      isPage : function(){
         return this._isPage;
      },

      /**
       * Есть ли активный дочерний контрол
       * @return {boolean}
       */
      hasActiveChildControl: function() {
         return !! objectFind(this._childControls, function(child) {
            if (child.isActive()) {
               return true;
            }
            if (child instanceof AreaAbstract) {
               return child.hasActiveChildControl();
            }
         });
      }
   });

   AreaAbstract.beforeExtend = function (classPrototype, mixinsList, classExtender) {
      AreaAbstract.prototype._setCompatibleOptions(classPrototype, mixinsList, classExtender);
   };

   return AreaAbstract;
});
