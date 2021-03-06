define('Core/WindowManager', [
   'Core/Abstract',
   'Core/ControlBatchUpdater',
   'Core/core-instance',
   'Env/Env',
   'is!browser?jquery'
],function(Abstract, ControlBatchUpdater, cInstance, Env) {
   //MOVE_TO КРАЙНОВ
   var WindowManager, moduleClass;
   /**
    * Менеджер окон
    *
    * @author Бегунов А.В.
    * @class Core/WindowManager
    * @extends Core/Abstract
    * @public
    * @singleton
    */
   var WindowManager = new (moduleClass = Abstract.extend(/** @lends Core/WindowManager.prototype */{
      /**
       * @event onAreaFocus Переход фокуса в какую-то область
       * @param {Env/Event:Object} eventObject Дескриптор события
       * @param {Lib/Control/AreaAbstract/AreaAbstract} area Область, в которую перешёл фокус
       *
       * @event zIndexChanged Изменение максимального z-index, который под модальным окном
       * @param {Env/Event:Object} eventObject Дескриптор события
       * @param {Number} maxZIndexBelowModal Максимальный z-index среди тех, которые находятся под модальными окнами,
       * то есть максимальный, но меньший, чем минимальный модальный z-index
       * @example
       * <pre>
       *   WindowManager.subscribe('zIndexChanged', function(event, maxZIndexBelowModal) {
       *     console.log(maxZIndexBelowModal);
       *   });
       * </pre>
       */
      _windows: [],
      _tabEventEnable: true,
      _focusIn: undefined,
      _focusOut: undefined,
      _focusControlled: false,
      _acquireIndex: 1000,
      _acquiredIndexes: [],
      _modalIndexes: [],
      _maximizedIndexes: [],
      _hintIndexes: [],
      _visibleIndexes: [],
      _windowsStack: [],
      _currentVisibleIndicator: null,
      _zIndexChangedFlag: false,
      _zIndexChanged: 0,

      /**
       * Поднять окно в стеке.
       * Поднимает окно вверх в стеке окон если это возможно.
       * В случае индикатора пытается поднять его именно туда, куда нужно (сложная логика).
       * Возвращает успешность подняние.
       * @param {Lib/Control/Window/Window} window
       * @returns {Boolean} Успешность/доступность поднятия.
       */
      pushUp: function(window) {
         var
            movable = window.isMovableToTop(),
            found = false,
            i,
            item,
            stack = [];
         if (movable === true) {
            // Обычное поведение, просто пушим окно наверх.
            this.popBack(window);
            this._windowsStack.push({
               visible: function() {
                  return window.isVisible();
               },
               window: window
            });
            return true;
         } else if (movable === null) {
            // Нужно пропушить индикатор, над которым есть скрытые индикаторы — пропушим их все сразу.
            for (i = this._windowsStack.length - 1; i >= 0 && !found; --i) {
               item = this._windowsStack[i];
               if (!found && item.window._isIndicator) {
                  stack.push(item);
                  found = item.window === window;
                  this._windowsStack.splice(i, 1);
               }
            }
            for (i = stack.length - 1; i >= 0; --i) {
               this._windowsStack.push(stack[i]);
            }
            return true;
         } else if (movable === false) {
            // Либо не нужно пушить,
            if (!window._isIndicator) {
               return false;
            }
            //    либо нужно пушить индикатор, над которым есть видимые индикаторы.
            i = 0;
            while (i < this._windowsStack.length && found !== null) {
               item = this._windowsStack[i];
               if (found === false) {
                  found = item.window === window;
               }
               if (found === true && item.window._isIndicator) {
                  if (item.window !== window && item.visible()) {
                     found = null;
                     Array.prototype.splice.apply(this._windowsStack, [i, 0].concat(stack));
                  } else {
                     stack.push(this._windowsStack.splice(i, 1)[0]);
                     i--;
                  }
               }
               i++;
            }
         }
         return false;
      },
      /**
       * Удалить окно из стека
       * Удаляет окно из стека без всяких проверок.
       * @param {Lib/Control/Window/Window} window
       */
      popBack: function(window) {
         this._windowsStack = this._windowsStack.filter(function(item) {
            return item.window !== window;
         });
      },
      /**
       * Убрать окно из стека.
       * Пытается удалить окно из стека и показать следующее видимое окно и рассчитать положение следующего видимого индикатора.
       * @param {Lib/Control/Window/Window} window
       */
      popAndShowNext: function(window) {
         if (!window._isIndicator) {
            this.popBack(window);
         }
         var
            windowVisible = false,
            stack = this._windowsStack;
         // возможно стоит добавить проверку, что скрыли верхнее окно? но вроде бы и так хуже не станет
         for (var i = stack.length - 1; i >= 0; i--) {
            var stackItem = stack[i];
            if (stackItem.window._isIndicator && stackItem.window._isIndicatorVisible) {
               // Нашли индикатор (который сейчас был скрыт). Покажем его.
               if (stackItem.window !== window) { // ... кроме случая, когда его же только что и скрыли
                  if (!windowVisible) {
                     // Должны показать индикатор с оверлеем поверх всего.
                     if (stackItem.window._myIndicator) {
                        // sbisdoc://1+ОшРазраб+27.02.14+84600+2DBDF88C-35F7-4D89-A64B-3FFA3E7584F+
                        stackItem.window._myIndicator.show();
                     }
                  } else if (this._pendingIndicator === stackItem.window._myIndicator) {
                     // Пытаемся показать индикатор, который покажем поверх всего чуть позже,
                     //    ... поэтому здесь и сейчас ничего не будем с ним делать.
                  }
                  else {
                     // У нас есть окна над индикатором. Покажем индикатор с оверлеем под окнами.
                     stackItem.window.show(true);
                     this.setCurrentVisibleIndicator(stackItem.window._myIndicator);
                     stackItem.window._myIndicator._isVisible = true;
                  }
               }
               return;
            } else if (stackItem.visible()) {
               // Нашли окно. Оно уже видмо. Ничего не неужно делать. Запомним это.
               windowVisible = true;
               // Если скрывали не индикатор, то ничего делать больше не нужно.
               if (!window._isIndicator) {
                  break;
               }
            }
         }
      },
      /**
       * Получить стек окон
       * @returns {Array}
       */
      getStack: function() {
         return this._windowsStack;
      },
      /**
       * Получить текущий видимый индикатор
       * @returns {null|Lib/Control/LoadingIndicator/LoadingIndicator}
       */
      getCurrentVisibleIndicator: function() {
         return this._currentVisibleIndicator;
      },
      /**
       * Установить текущий видимый индикатор
       * @param {null|Lib/Control/LoadingIndicator/LoadingIndicator} indicator
       */
      setCurrentVisibleIndicator: function(indicator) {
         this._currentVisibleIndicator = indicator;
      },
      acquireZIndex: function(isModal, isMaximized, isHint) {
         this._acquireIndex += 10;
         var index = this._acquireIndex;
         this._acquiredIndexes.push(index);
         if (isModal) {
            this._modalIndexes.push(index);
         }
         if (isMaximized) {
            this._maximizedIndexes.push(index);
         }
         if (isHint) {
            this._hintIndexes.push(index);
         }

         this._notifyZIndexChanged();

         return index;
      },
      _notifyZIndexChanged: function() {

         function isVisible(value) {
            return self._visibleIndexes && self._visibleIndexes.indexOf(value) !== -1;
         }

         function _getMaxZIndex() {
            var zIndex = WindowManager.getDefaultZIndex(),
               maxIndex;

            maxIndex = this._modalIndexes.concat(this._maximizedIndexes).concat(this._hintIndexes).reduce(function(memo, value) {
               return isVisible(value) ?
                  Math.min(value, memo) :
                  memo;
            }, Infinity);

            this._acquiredIndexes.forEach(function(value) {
               if (isVisible(value)) {
                  if (value > zIndex && value < maxIndex) {
                     zIndex = value;
                  }
               }
            });
            return zIndex;
         }

         var self = this;
         if (!this._zIndexChangedFlag) {
            this._zIndexChangedFlag = true;

            setTimeout(function() {
               self._zIndexChangedFlag = false;
               var maxZIndexBelowModal = _getMaxZIndex.apply(self);
               if (maxZIndexBelowModal != self._zIndexChanged) {
                  self._zIndexChanged = maxZIndexBelowModal;
                  self._notify('zIndexChanged', maxZIndexBelowModal);
               }
            }, 0);
         }
      },
      setVisible: function(index) {
         if (this._visibleIndexes.indexOf(index) == -1) {
            this._visibleIndexes.push(index);
            this._notifyZIndexChanged();
         }
      },
      setHidden: function(index) {
         var pos = this._visibleIndexes.indexOf(index);
         if (pos >= 0) {
            this._visibleIndexes.splice(pos, 1);
            this._notifyZIndexChanged();
         }
      },
      getDefaultZIndex: function () {
          return 1000;
      },
      releaseZIndex: function(index) {
         ['acquired', 'visible', 'modal', 'maximized', 'hint'].forEach(function(name) {
            var arr = this['_' + name + 'Indexes'] || [],
               pos = arr.indexOf(index);
            if (pos >= 0) {
               arr.splice(pos, 1);
            }
         }.bind(this));

         this._acquireIndex = Math.max.apply(Math, [this.getDefaultZIndex()].concat(this._acquiredIndexes));

         this._notifyZIndexChanged();
      },
      getMaxVisibleZIndex: function() {
         var r = 0;
         this._visibleIndexes.forEach(function(n) {
            if (n > r && this._modalIndexes.indexOf(n) != -1) {
               r = n;
            }
         }, this);
         return r;
      },
      isMaximizedWindowExists: function() {
         return !!WindowManager._maximizedIndexes.length;
      },

      /**
       * Инициализирует менеджер
       */
      init: function() {
         moduleClass.superclass.init.call(this);
         //После загрузки страницы поставим фэйковые узлы для работы с фокусами.
         //PostInit зовется в core-init.js, который и делает require windowManager'у
         //Но core-init-min о windowManager о нем не знает, мэнэджер подгружается отдельно и нужно, чтобы он сам мог
         //Понять, когда выполнить postInit.
         if (typeof $ !== 'undefined') { //WindowManager может инициализироваться на сервере, там $ нет
            $(document).ready(this.postInit.bind(this));
         }
         this._publish('onAreaFocus', 'zIndexChanged');
      },
      /**
       * Инициализация, требующая jQuery
       */
      postInit: function() {
         $(function() {
            this._createFirstElementToFocus();
            this._createLastElementToFocus();
         }.bind(this));
      },
      /**
       * Находит окно, у котрого нужно активировать первый/последний контрол
       * @return {Lib/Control/AreaAbstract/AreaAbstract|undefined}
       */
      _findActiveWindow: function() {
         var activeWindow = WindowManager.getActiveWindow(true);
         if (activeWindow) {
            activeWindow = activeWindow.findParent(function(area) {
                  return cInstance.instanceOfModule(area, 'Lib/Control/FloatArea/FloatArea');
               }) || activeWindow.getTopParent();
            return activeWindow;
         }
         return undefined;
      },
      /**
       * Создаёт первый элемент для фокуса
       * @private
       */
      _createFirstElementToFocus: function() {
         if (this._focusIn) {
            this._focusIn.remove();
         }
         var self = this,
            moveFocus = function() {
               if (!self._focusControlled) {
                  var activeWindow = self._findActiveWindow();
                  if (activeWindow) {
                     // исключительная ситуация, когда в yandex открываем видео, и переключаемся на другую вкладку.
                     // видео открывается в отдельном окошке, оторванном от страницы. в этой ситуации звать фокусировку не надо
                     if (Env.constants.browser.yandex) {
                        if (activeWindow.getContainer() && !activeWindow.getContainer().closest('body').length) {
                           return;
                        }
                     }

                     activeWindow.activateFirstControl();
                  }
               }
            };
         if (Env.constants.compat) {
            this._focusIn = $('<a class="ws-focus-in" tabindex="1"></a>').prependTo('body')
               .bind('focusin', moveFocus);
         }
      },
      /**
       * Создаёт последний элемент для фокуса
       * @private
       */
      _createLastElementToFocus: function() {
         if (this._focusOut) {
            this._focusOut.remove();
         }
         var self = this;
         if (Env.constants.compat) {
            this._focusOut = $('<a class="ws-focus-out" tabindex="0"></a>').appendTo('body');
         }
      },
      /**
       * Переносит фокус на первый элемент
       */
      focusToFirstElement: function() {
         if (this._focusIn) {
            this._focusControlled = true;
            this._focusIn.focus();
            this._focusControlled = false;
         }
      },
      /**
       * Переносит фокус на последний элемент
       */
      focusToLastElement: function() {
         if (this._focusOut) {
            this._focusControlled = true;
            if (Env.constants.compat) {
               $('body').append(this._focusOut);
            }
            this._focusOut.focus();
            this._focusControlled = false;
         }
      },

      _findWindowIndex: function(window) {
         var i, windows = this._windows, ln = windows.length;
         for (i = 0; i !== ln; i++) {
            if (windows[i] === window) {
               return i;
            }
         }
         return -1;
      },

      _checkRegisterBatchUpdaterActions: function() {
         //Функция выполняется только один раз
         this._checkRegisterBatchUpdaterActions = function() {};

         var self = this;
         //Активирует последний активный контрол с последнего активного окна
         ControlBatchUpdater.registerDelayedAction('WindowManager.activateControl', function() {
            // проверим виден ли активный элемент, потому что он мог еще не скрыться, хотя на него уже повешен ws-hidden.
            // потому что в ws/core/ControlBatchUpdater.js добавили runDelayed (делается requestAnimationFrame, а не setTimeout)
            var wsControl = $(document.activeElement).wsControl();
            // Если установлен флаг об активации или фокус слетел в body, нужно восстановить фокус в актуальный контрол
            // В FF если активный элемент сделать невидимым то активность не слетает на body? проверяем виден ли активный элемент
            // в IE activeElement может быть null
            if (self._doActivateControl ||
               !document.activeElement ||
                $(document.activeElement).is(document.body) ||
                (wsControl && !wsControl.isVisibleWithParents())) {
               self._doActivateControl = false;
               // находим последнюю активную панель, которая сможет принять фокус
               var nextWindow = self.getActiveWindow(true);
               if (nextWindow) {
                  nextWindow.onBringToFront();
               }
            }
         });
      },

      /**
       * @param {Lib/Control/AreaAbstract/AreaAbstract} window
       */
      addWindow: function(window) {
         if (this._findWindowIndex(window) === -1) {
            var self = this;

            this._checkRegisterBatchUpdaterActions();
            this._windows.push(window);

            if (cInstance.instanceOfMixin(window, 'Lib/Control/AreaAbstract/AreaAbstract.compatible')) {
               window.subscribe('onActivate', function(event) {
                  if (event.getTarget() === this) {
                     self.onActivateWindow(this);
                  }
               });
            }
         }
      },

      /**
       * Удаляет окно из менеджера
       * @param {Lib/Control/AreaAbstract/AreaAbstract} window Окно, которое необходимо удалить
       */
      removeWindow: function(window) {
         this.deactivateWindow(window, function(idx) {
            if (idx !== -1) {
               this._windows.splice(idx, 1);
            }
         }.bind(this));
      },

      /**
       * Общая служебная функция-обвязка для различных способов деактивации окна. Используется при удалении окна в деструкторе и вызове removeWindow,
       * а также при нестандартном скрытии окна в плавающей панели, например.
       * @param window Окно, которое будет деактивироваться.
       * @param deactivateFn Пользовательская функция деактивации. В неё передаётся индекс этого окна в менеджере окон. Если окно уже удалено из менеджера, передастся -1.
       */
      deactivateWindow: function(window, deactivateFn) {
         var idx = this._findWindowIndex(window);
         if (idx !== -1) {
            deactivateFn(idx);
            ControlBatchUpdater.runBatchedDelayedAction('WindowManager.activateControl');
         } else {
            deactivateFn(-1);
         }
      },

      /**
       * Обработчик события активации окна
       * @param window
       */
      onActivateWindow: function(window) {
         if (window) {
            // делаем window последней активной областью только если она может принимать на себя активность
            // если так не сделать, будем потом активировать в WindowManager.activateControl и активируем неактивируемое
            window.setActivationIndex(this.getMaxActivisionIndex() + 1);
            this._notify('onAreaFocus', window);
         }
      },

      disableTabEvent: function() {
         this._tabEventEnable = false;
      },
      enableTabEvent: function() {
         this._tabEventEnable = true;
      },
      getTabEvent: function() {
         return this._tabEventEnable;
      },
      /**
       * Получить отображаемое окно с максимальным z-index
       * @param {Function} [filterFunc] функция-фильтр, указывающая, учитывать ли окно в поиске
       */
      getMaxZWindow: function(filterFunc) {
         var maxZ = -1, maxWindow, i, zIndex,
            windows = this._windows, ln = windows.length, win;
         for (i = 0; i !== ln; i++) {
            win = windows[i];
            if ((!filterFunc || filterFunc(win)) && win.isShow()) {
               zIndex = win.getZIndex();
               if (zIndex > maxZ) {
                  maxZ = zIndex;
                  maxWindow = win;
               }
            }
         }
         return maxWindow;
      },
      /**
       * Получить отображаемое _модальное_ окно с максимальным z-index среди модальных
       */
      getMaxZModalWindow: function() {
         return this.getMaxZWindow(function(win) {
            return win.isModal();
         });
      },
      /**
       * Возвращает максимальный z-index из всех окон
       * @return {Number}
       */
      getMaxZIndex: function() {
         var maxWindow = this.getMaxZWindow();
         return maxWindow && maxWindow.getZIndex() || 1000;
      },
      /**
       * Возвращает, может ли область получить фокус с учётом родителей
       * @private
       */
      _isWindowAcceptFocus: function(window) {
         var parent = window;
         while (parent) {
            var
               canAcceptFocusRes,
               isVisibleRes = !parent.isVisible || parent.isVisible(); // only visible windows can be focused

            // если мы в состоянии вычисления активного окна, можем использовать кеш с результатами вызовов canAcceptFocus для контролов.
            // это тяжелая функция и она тут зовется для одних и тех же компонентов
            if (this._getCalculatingState() === true && parent.getId()) {
               if (this._canAcceptFocusCache[parent.getId()] !== undefined) {
                  canAcceptFocusRes = this._canAcceptFocusCache[parent.getId()];
               } else if (parent.canAcceptFocus) {
                  canAcceptFocusRes = parent.canAcceptFocus();
                  this._canAcceptFocusCache[parent.getId()] = canAcceptFocusRes;
               } else {
                  return false;
               }
            } else {
               canAcceptFocusRes = parent.canAcceptFocus();
            }


            if (!canAcceptFocusRes || !isVisibleRes) {
               return false;
            }

            // смотрим паренты только внутри LikeWindowMixin.
            if (cInstance.instanceOfMixin(parent, 'Lib/Mixins/LikeWindowMixin')) {
               break;
            }
            parent = parent.getParent();
         }
         return true;
      },

      /**
       * Возвращает, может ли область получить фокус с учётом родителей
       * @param {Lib/Control/AreaAbstract/AreaAbstract} window
       * @private
       */
      _isWindowActivable: function(window) {
         //_isWindowActivable должна принимать и выключенные области, поскольку иначе возвращение фокуса после закрытия панели/диалога,
         //открытых из панели, где выключены все контролы, приведёт к закрытию этой панели
         return window.isVisibleWithParents();
      },

      // изменение состояния вычисления активного окна
      _setCalculatingState: function (state) {
         this._activeWindowCalculating = state;
         this._canAcceptFocusCache = {};
      },
      // возвращает состояние вычисления активного окна
      _getCalculatingState: function () {
         return this._activeWindowCalculating;
      },

      _getActiveWindow: function(filterFn) {
         var
            idxMax = -1, winMax, i, idx, win,
            windows = this._windows, ln = windows.length;

         this._setCalculatingState(true); // переключаемся в состояние вычисления активного окна
         for (i = 0; i !== ln; i++) {
            win = windows[i];
            if (!filterFn || filterFn(win)) {
               idx = win.getActivationIndex();

               if (idx > idxMax) {
                  idxMax = idx;
                  winMax = win;
               }
            }
         }
         this._setCalculatingState(false); // выключаем состояние вычисления активного окна

         return winMax;
      },

      /**
       * Возвращает последнее активированное окно
       * @param {Boolean} [forFocus] Найти последнее активированное окно из тех, в которых есть элементы, которые могут принимать фокус (поля ввода, кнопки, и т.п.).
       * @param {Boolean} [forDeactivation] Использовать при деактивации, начинает искать среди всех окон, даже скрытых. Актуально, если не forFocus.
       * @return {Lib/Control/AreaAbstract/AreaAbstract}
       */
      getActiveWindow: function(forFocus, forDeactivation) {
         var filterFn = forFocus ?
            this._isWindowAcceptFocus :
            forDeactivation ?
               function() {
                  return true;
               } :
               this._isWindowActivable;
         //Для параметра forFocus: Если нет активного окно, могущего взять фокус, отдадим просто последнее активированное окно
         // (чтобы getActiveWindow всегда возвращал окно)
         return this._getActiveWindow(filterFn.bind(this));
      },

      /**
       * Возвращает индекс последнего активного окна
       * @return {Lib/Control/AreaAbstract/AreaAbstract}
       */
      getMaxActivisionIndex: function() {
         //для получения макс. индекса нужно учитывать все области, даже невидимые,
         //(иначе новые индексы будут перемешиваться с индексами скрытых)
         var maxWindow = this.getActiveWindow(false, true);
         return maxWindow && maxWindow.getActivationIndex() || 0;
      },
      /**
       * Выключает последний активный контрол
       * @param {Lib/Control/Control} control Контрол, на который перешёл фокус
       */
      disableLastActiveControl: function(control) {
         var window = this.getActiveWindow();
         if (window) {
            var prevActive = window.getActiveChildControl();
            if (prevActive) {
               if (prevActive.getParent() === window && prevActive !== control) {
                  prevActive.setActive(false, undefined, undefined, control);
               }
            } else {
               window.setActive(false, undefined, undefined, control);
            }
         }
      }
   }))();


   return WindowManager;
});
