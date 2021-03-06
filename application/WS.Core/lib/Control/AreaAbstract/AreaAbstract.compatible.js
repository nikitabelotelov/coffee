/**
 * Created by dv.zuev on 17.04.2017.
 */
define('Lib/Control/AreaAbstract/AreaAbstract.compatible', [
   "Core/Context",
   'Core/helpers/Object/isPlainObject',
   'Core/helpers/isNewEnvironment',
   "Core/core-instance",
   "Core/WindowManager",
   'Core/helpers/Object/find',
   'Core/helpers/Array/findIndex',
   'Env/Env',
   "Core/Deferred",
   "Lib/Control/AttributeCfgParser/AttributeCfgParser",
   'Core/helpers/String/escapeHtml',
   'Core/core-classicExtend',
   'Core/helpers/Hcontrol/getChildContainers',
   'Core/helpers/Hcontrol/isElementVisible',
   'Core/helpers/Hcontrol/focusControl',
   'Core/helpers/Hcontrol/setElementCachedSize',
   "Lib/Control/Control",
   'Core/helpers/String/unEscapeHtml',
   'Vdom/Vdom'
], function (
   Context,
   isPlainObject,
   isNewEnvironment,
   cInstance,
   WindowManager,
   objectFind,
   arrayFindIndex,
   Env,
   cDeferred,
   attributeCfgParser,
   escapeHtml,
   classicExtend,
   getChildContainers,
   isElementVisible,
   focusControl,
   setElementCachedSize,
   baseControl,
   unEscapeHtml,
   Vdom
) {

   /**
    * Так должен себя вести обычный Deferred:
    * если обработчик в цепочке вернул undefined, то отдавать дальше в цепочку не undefined, а предыдущее значение.
    * А то стандартное поведение неочевидно, и сильно портит жизнь прикладникам, особенно когда они подписываются на
    * waitChildByName, и забывают отдавать входной результат.
    */
   var DeferredForWaiters = (function() {
      var
         Deferred = cDeferred,
         DeferredForWaiters = function() {
            Deferred.call(this);
         },
         addCallbacksBase = Deferred.prototype.addCallbacks;

      function ignoreUndefined(cbk) {
         return cbk && function(res) {
               var newRes = cbk(res);
               return newRes === undefined ? res : newRes;
            };
      }

      classicExtend(DeferredForWaiters, Deferred);

      DeferredForWaiters.prototype.addCallbacks = function(cb, eb) {
         return addCallbacksBase.call(this, ignoreUndefined(cb), ignoreUndefined(eb));
      };

      return DeferredForWaiters;
   })();

   function activateSiblingControlOrSelfInt(area, isShiftKey, searchFrom, noFocus) {
      if (!area.isDestroyed()) {
         area._activateSiblingControlOrSelfLow(isShiftKey, searchFrom, noFocus);
      }
   }
   baseControl.ControlBatchUpdater.registerDelayedAction('AreaAbstract.activateSiblingControlOrSelf', activateSiblingControlOrSelfInt, 'FocusActions');

    /**
     * @mixin Lib/Control/AreaAbstract/AreaAbstract.compatible
     * @public
     * @author Крайнов Д.О.
     */
   return /** @lends Lib/Control/AreaAbstract/AreaAbstract.compatible.prototype */{
      /**
       * Устанавливает контекст
       * @protected
       */
      _createContext: function(options, parentContext) {
         var
            result = {},
            contextOpt = options.context,
            recordOpt = options.record,
            linkedContext;

         result.craftedContext = !(contextOpt instanceof Context);

         // Кто-то создал Area и передал в опции готовый контекст
         if (!result.craftedContext) {
            result.context = contextOpt;
         } else {
            linkedContext = (options.linkedContext || parentContext || Context.global);
            if (!(linkedContext instanceof Context)) {
               throw new Error('AreaAbstract._createContext: Опция linkedContext (или аргумент parentContext), если указана, и не равна null/undefined, то должна быть объектом типа Core/Context');
            }
            result.context = Context.createContext(this, null, linkedContext);
         }

         // если нам нужен изолированный контекст, то изолируем его
         result.context.setRestriction(options.independentContext ? 'setget' : (options.contextRestriction || result.context.getRestriction()));

         if (cInstance.instanceOfModule(contextOpt, 'Deprecated/Record')) {
            result.context.replaceRecord(contextOpt);
         } else if (isPlainObject(contextOpt)) {
            // Если нам передали объект, то вставим его в текущий контекст
            result.context.setValueSelf(contextOpt);
         }

         // Если нам передали и запись, то вставим ее в текущий контекст
         // Предыдущий record будет потерян, значения из record перезатрут старые
         if (recordOpt) {
            if (cInstance.instanceOfModule(recordOpt, 'Deprecated/Record')) {
               result.context.replaceRecord(recordOpt);
            } else {
               result.context.setValueSelf('record', recordOpt);
            }
         }

         return result;
      },


      /**
       *
       * Получить индекс активации области.
       * @return {Number}
       */
      getActivationIndex: function(){
         return this._activationIndex;
      },
      /**
       *
       * Проверить видно ли текущее окно.
       * @return {Boolean} Признак: true - видно, false - нет.
       */
      isShow: function(){
         return true;
      },
      /**
       *
       * Получить z-index текущего окна.
       */
      getZIndex: function(){
         return 0;
      },

      /**
       *
       * Установить индекс активации области.
       * @param index
       */
      setActivationIndex: function(index){
         this._activationIndex = index;
      },
      /**
       * Осуществляет привязку атрибутов вложенных элементов разметки к полям из контекста
       * @private
       */
      _markupDataBinding : function(escapeBinded){
         /**
          * Метод перенесен из CompoundControl на уровень выше,
          * чтобы подмешать это поведение в compatible слой для новых контролов.
          *
          */
         var
            hardTypes = {'attr':0,'css':0,'style':0},
            context = this.getLinkedContext(),
            elements = getChildContainers(this._container, '[data-bind]'),
            updateFuncs = [],
            changeHandler,
            cleanupMarkupDataBinding = this._cleanupMarkupDataBinding;

         function changeElement(element, value, property, subProperty){
            switch (property){
               case 'text' :
                  element.html(escapeHtml(value));
                  break;
               case 'html' :
                  element.html(value);
                  break;
               case 'attr' :
                  if (subProperty){
                     element.attr(subProperty, unEscapeHtml(value));
                  }
                  break;
               case 'css' :
                  if (subProperty){
                     element.toggleClass(subProperty, !!value);
                  }
                  break;
               case 'style' :
                  if (subProperty){
                     element.css(subProperty, value);
                  }
                  break;
               case 'visible' :
                  changeElement(element, !value, 'css', 'ws-hidden');
                  break;
            }
         }

         function bind(element, field, property, subProperty){
            var oldValue = undefined;
            function updateCurValue() {
               var curValue = context.getValue(field);
               if (oldValue !== curValue) {
                  oldValue = curValue;
                  changeElement(element, curValue, property, subProperty);
               }
            }

            updateFuncs.push(updateCurValue);
         }

         if (cleanupMarkupDataBinding) {
            this._cleanupMarkupDataBinding = null;
            cleanupMarkupDataBinding();
         }

         for (var e = 0, l = elements.length; e < l; e++){
            var
               element = $(elements[e]),
               dataBindCfg = attributeCfgParser(element.attr('data-bind') || '');


            if (escapeBinded && element.attr('data-binded')) {
               continue;
            }

            element.attr('data-binded', 'true');

            for (var i in dataBindCfg){
               if (dataBindCfg.hasOwnProperty(i)){
                  if (i in hardTypes){
                     var nestedCfg = dataBindCfg[i];
                     for (var j in nestedCfg){
                        if (nestedCfg.hasOwnProperty(j)){
                           bind(element, nestedCfg[j], i, j);
                        }
                     }
                  }
                  else{
                     bind(element, dataBindCfg[i], i);
                  }
               }
            }
         }

         if (updateFuncs.length > 0) {
            changeHandler = function() {
               updateFuncs.forEach(function(func) {
                  func();
               });
            };
            this.subscribeTo(context, 'onFieldsChanged', changeHandler);
            this._cleanupMarkupDataBinding = this.unsubscribeFrom.bind(this, context, 'onFieldsChanged', changeHandler);
            changeHandler();
         }
      },
      /**
       *
       * Получить связанный с контролом контекст.
       * @returns {Core/Context} Связанный с контролом контекст.
       * @example
       * При готовности группы флагов (groupCheckbox) установить в поле контекста значение из пользовательских данных.
       * <pre>
       *    var userData;
       *    groupCheckbox.subscribe('onReady', function() {
       *       this.getContext().setValue(this.getName(), this.getUserData(userData));
       *    });
       * </pre>
       */
      getContext: function(){
         return this._context;
      },

      /**
       *
       * Deferred готовности области. Он завершится успехом в момент, когда все дочерние контролы области готовы.
       * @return {Core/Deferred}
       */
      getReadyDeferred: function() {
         return this._dChildReady.getResult();
      },

      /**
       *
       *
       * Сбросить для кнопки опцию "Кнопка по умолчанию" в значение false.
       * @param {Deprecated/Controls/Button/Button} defButton Экземпляр класса кнопки.
       * @example
       * При готовности контрола сбросить для дочерней кнопки опцию "Кнопка по умолчанию".
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var button = this.getChildControlByName('Зарегистрировать');
       *       this.unregisterDefaultButton(button);
       *    });
       * </pre>
       * @see registerDefaultButton
       * @deprecated Мы избавимся от этого механизма ближе к 3.7.4.200
       */
      unregisterDefaultButton: function(defButton) {
         if (this._defaultButton === defButton) {
            this._defaultButton = null;
         }
      },
      /**
       *
       *
       * Установить для кнопки опцию "Кнопка по умолчанию" в значение true.
       * Свойства такой кнопки:
       * <ol>
       *    <li>Выделена оранжевым цветом.</li>
       *    <li>Активируется при нажатии Ctrl+Enter из любого поля данного контейнера.</li>
       * </ol>
       * Кнопка является "кнопкой по умолчанию" в рамках только той области, в которой она определена.
       * @param {Deprecated/Controls/Button/Button} defButton Экземпляр класса кнопки.
       * @example
       * При готовности контрола установить для дочерней кнопки опцию "Кнопка по умолчанию".
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var button = this.getChildControlByName('Зарегистрировать');
       *       this.registerDefaultButton(button);
       *    });
       * </pre>
       * @see registerDefaultButton
       * @deprecated Мы избавимся от этого механизма ближе к 3.7.4.200
       */
      registerDefaultButton: function(defButton) {
         var self = this;
         if(this._defaultButton)
            this._defaultButton.setDefaultButton(false);
         this._defaultButton = defButton;
         this._defaultButton.subscribe('onDestroy', function() {
            if (self._defaultButton === this) {
               self._defaultButton = null;
            }
         });
      },
      _unregisterDefaultButtonAction: function() {
         var defaultButton = this._defaultButton;
         this._defaultAction = null;
         this._defaultButton = null;
         // делаем кнопку недефолтной, но не запускаем механизм разрегистрации
         defaultButton && defaultButton.setDefaultButton(false, true);
      },

      _registerDefaultButtonAction: function(action, button) {
         this._defaultAction = action;
         this._defaultButton = button;
      },

      _onResizeHandler: function(event, initiator){
         // fix для корневой области устанавливается высота 100%
         this._restoreSize(); // todo ещё раз проверить
         this._resizeChilds();

         if (this._needResizer()){
            if (!this._resizer) {
               this._initResizers();
            } else {
               this._updateResizer();
            }
         }

         if(this._template) {
            if(this._mounted !== false) {
               this._notify('onResize', initiator);
            }
         } else {
            this._notify('onResize', initiator);
         }
      },

      /**
       * Пересчитывает размер видимых дочерних элементов
       * @protected
       */
      _resizeChilds: function(){
         var i, ln, control;

         if(this.isVisible() || this._needRecalkInvisible()){
            for (i = 0, ln = this._childControls.length; i < ln; i++) {
               control = this._childControls[i];
               if (control && control.isVisible()) {
                  control._onResizeHandler();
               }
            }
         }
      },

      /**
       * Запустить <a href='https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/validation/'>валидацию</a> области/контрола.
       * @param {Boolean} [firstRun = true] Признак первого запуска валидации.
       * Значение true информирует о первом запуске валидации контрола или текущей области.
       * @param {Boolean} [forceValidateHidden = false] false - валидировать не смотря на то, что контрол или область скрыты.
       * @param {Boolean} [noFocusOnValidate = false] false - не устанавливать фокус в компонент, не прошедший валидацию.
       * @returns {Boolean} Результат валидации.
       * Возможные значения:
       * <ol>
       *    <li>true - валидация пройдена успешно.</li>
       *    <li>false - ошибка при прохождении валидации.</li>
       * </ol>
       */
      validate: function(firstRun, forceValidateHidden, noFocusOnValidate){
         var isHidden = !this.isVisible(),
            hasErrors;

         if (isHidden && !forceValidateHidden && !this._getOption('validateIfHidden')) {
            return true;
         }
         firstRun = firstRun === undefined ? true : firstRun;
         this._childControls.forEach(function(childControl) {
            if (childControl && childControl.validate) {
               // Запускаем валидацию для childControl только если он видим или для у него есть опция validateIfHidden
               if (childControl.isVisible() || childControl._hasOption('validateIfHidden') && childControl._getOption('validateIfHidden')) {
                  // вызывать validate надо в любом случае, чтобы все контролы были проверены и подсвечены невалидные
                  hasErrors = !childControl.validate(false, false, noFocusOnValidate || isHidden) || hasErrors;
               }
            }
         }, this);
         /**
          * Код ниже перемещает сообщение об ошибке на первое ошибочное поле, если
          * - это "первый запуск", т.е. валидацию запустили на текущей области
          * - есть ошибки
          * - область не скрыта сама по себе
          * - и ее родители тоже не скрыты
          */
         if (!noFocusOnValidate && firstRun && hasErrors && this.isVisible() && this._container.parents('.ws-hidden').length === 0) {
            this._moveFailValidatedToFocus();
         }
         return !hasErrors;
      },

      /**
       * Снимает со всех дочерних контролов на области маркировку об ошибке валидации.
       */
      resetValidation: function() {
         this._childControls.forEach(function(childControl) {
            if (childControl && childControl.clearMark) {
               childControl.clearMark();
            }
            if (childControl && childControl.resetValidation) {
               childControl.resetValidation();
            }
         }, this);
      },
      /**
       * moves first fail validated element to focus
       * this also should cause errorBox showing
       * @protected
       */
      _moveFailValidatedToFocus: function(){
         var
            res = true,
            minTab = -1,
            minEl = -1,
            val,
            children = Object.keys(this._childControls),
            self = this,
            elementFound,
            areaFound;
         // Сортируем элементы по табиндексу
         children.sort(function(a,b) {
            var x = self._childControls[a] && self._childControls[a].getTabindex(),
               y = self._childControls[b] && self._childControls[b].getTabindex();
            x = parseInt(x, 10);
            y = parseInt(y, 10);
            if(!x || x == -1) {
               return 1;
            }
            if(!y || y == -1) {
               return -1;
            }
            return ( (x<y) ? -1 : (x>y) ? 1 : 0 );
         });
         for (var i = 0; i < children.length; ++i){
            var childControl = this._childControls[children[i]];
            if(!childControl){
               continue;
            }
            val = childControl.getTabindex();
            elementFound = childControl.isMarked && childControl.isMarked() && childControl.getContainer && isElementVisible(childControl.getContainer());
            areaFound = childControl._moveFailValidatedToFocus && !childControl._moveFailValidatedToFocus();
            if ( elementFound || // Либо ошибка у контрола
               areaFound ){    // Либо в area есть контрол с ошибкой
               res = false;
               minTab = val;
               minEl = children[i];
               break;
            }
         }
         if (elementFound) { // Если мы нашли элемент (он будет самым первым), то отдаём ему фокус
            this._childControls[minEl].setActive(true);
         }
         return res;
      },
      /**
       *
       * Установить фокус на контрол.
       * Примечание: Порядок установки фокуса
       * При открытии контрола происходит поиск элемента интерфейса,  для которого установлен CSS-класс ws-autofocus.
       * <ol>
       *    <li>Если подходящий контрол найден, фокус устанавливается на него.</li>
       *    <li>Если класс установлен на область, фокус устанавливается на дочерний компонент такой области согласно установленным tabindex.</li>
       *    <li>Если класс установлен на компонент внутри области, то поиск будет происходить внутри нее.</li>
       *    <li>Если класс ws-autofocus не найден, в случае загрузки фокус устанавливается на первый попавшийся компонент. В случае загрузки области происходит поиск согласно установленным tabindex. Если таких компонентов несколько, фокус устанавливается на первый найденный. Если ничего активировать не удается, фокус устанавливается на саму область.</li>
       * </ol>
       * @param {Boolean} active true - перевести фокус на контрол.
       * @param {Boolean} [isShiftKey] Направление перехода фокуса.
       * @param {Boolean} [noFocus] Признак: не передавать (true) или передавать (false) фокус контролу после переключения его состояния.
       * @param {Lib/Control/Control} [focusedControl] Контрол, на который ушёл фокус.
       *
       * Возможные значения:
       * <ol>
       *    <li>true - если у контрола существуют дочерние контролы, то фокус переходит на последний из них.</li>
       *    <li>false - если у контрола существуют дочерние контролы, то фокус переходит на первый из них.</li>
       * </ol>
       * Если контрол не обладает дочерними контролами, то параметр игнорируется.
       * @example
       * При готовности контрола перевести на него фокус.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       this.setActive(true, false);
       *    });
       * </pre>
       * @see activateLastControl
       * @see activateFirtsControl
       * @see onActivate
       */
      setActive: function(active, isShiftKey, noFocus, focusedControl){
         var wasActive = this._isControlActive,
            activeElement = document.activeElement,
            container = this._container[0],
            env;

         if (!active || active !== wasActive && this.getNextActiveChildControl(isShiftKey)) {
            this._isControlActive = active;
            this._updateActiveStyles();
         }

         if (active) {
            // если внутрь активируемого контрола активность не будет спускаться, можно прострелять событие
            if (!(this.getNextActiveChildControl && this.getNextActiveChildControl())) {
               // стреляем событиями onFocusInside у парентов, который в данный момент активны
               this._callOnFocusInside();
            }

            myParent = this.getParent();
            if (myParent && myParent.iWantVDOM) {
               env = myParent._container[0].controlNodes[0].environment;
               env._focused = false;
            }
            if (myParent) {
               myParent._activate(this);
            }
            if(isShiftKey){
               this.activateLastControl(noFocus);
            }
            else{
               this.activateFirstControl(noFocus);
            }
            if (myParent && myParent.iWantVDOM && !noFocus) {
               if (!wasActive && !env._focused) {
                  env._handleFocusEvent({target: container, relatedTarget: activeElement});
               }
            }
         } else if (active !== wasActive) {
            this._notify('onFocusOut', false, focusedControl);
            // если после onFocusOut вернулось состояние компонента в активное, значит произошла отмена дизактивации. останавливаем процесс дизактивации.
            if (!this.isActive()) {
               if (focusedControl) {
                  var filter = function(parent) {
                     return parent === myParent;
                  };

                  var myParent = this.getParent();
                  if (myParent && focusedControl.findParent) {
                     //область надо деактивировать, если новый активный контрол не лежит внутри неё
                     if (!focusedControl.findParent(filter)) {
                        if (focusedControl !== myParent) {
                           myParent.setActive(false, undefined, undefined, focusedControl);
                        } else {
                           // если компонент теряет активность, его предок должен забыть про то, что этот компонент внутри предка - активен
                           myParent._activeChildControl = -1;
                           myParent._activatedWithTabindex = false;
                        }
                     }
                  }
               } else {
                  myParent = this.getParent();
                  if (myParent) {
                     myParent.setActive(false);
                     myParent._activeChildControl = -1;
                     myParent._activatedWithTabindex = false;
                     if (myParent.iWantVDOM) {
                        myParent._blur();
                     }
                  }
               }
            }
         }
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
      _oldActivateFirstControl: function(noFocus){
         this._activateSiblingControlOrSelf(false, -1, noFocus);
      },
      /**
       * Активирует первый контрол и проставляет таб-индекс, если нужного контрола нет
       * @protected
       */
      _activateFirstCtrl : function(){
         this.activateFirstControl();
      },

      /**
       *
       * Получить дочерний контрол, на котором находится фокус.
       * @param {Boolean} [canAcceptFocus = false] Если нужен контрол, который должен получить фокус.
       * @param {Boolean} [recursive = false] искать активный контрол рекурсивно: если найденный активный контрол сам
       * является наследником AreaAbstract, то поискать в нём активный контрол, и т.д. В итоге будет найден самый нижний активный контрол.
       * @returns {Lib/Control/Control|undefined} Дочерний контрол, на котором находится фокус.
       * Возвращается undefined, если фокус не находится ни на одном из дочерних контролов.
       * @example
       * При готовности контрола перевести фокус на дочерний контрол, если фокус неустановлен.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var res = this.getActiveChildControl();
       *       if (res) this.detectNextActiveChildControl(false);
       *    });
       * </pre>
       * Может ли контрол получать фокус.
       * Метод сработает, если контрол видим, активен и у него есть табиндекс.
       */
      getActiveChildControl: function(canAcceptFocus, recursive) {
         var res = this._activatedWithTabindex ? this._childsTabindex[this._activeChildControl] : this._activeChildControl,
            children = this._childControls,
            childControl;

         childControl = canAcceptFocus && children[res] && !children[res].canAcceptFocus() ?
            // если текущий активный не может принять активность, ищем первый по табиндексам
            this.getNextActiveChildControl(undefined, -1) :
            children[res];

         if (recursive && childControl && cInstance.instanceOfMixin(childControl, 'Lib/Control/AreaAbstract/AreaAbstract.compatible')) {
            childControl = childControl.getActiveChildControl(canAcceptFocus, true) || childControl;
         }

         return childControl;
      },
      /**
       * Производит фокусирование нужного элемента управления.
       * @remark
       * <br/>
       * Метод работает следующим образом:
       * <ul>
       *     <li>Через функцию {@link getActiveChildControl} производится поиск дочернего компонента, который сейчас находится в фокусе.</li>
       *     <li>Когда компонент найден, через функцию {@link canAcceptFocus} производится проверка, что найденный компонент может принимать фокус.</li>
       *     <li>Если фокус может быть установлен, то производится проверка на то, что компонент - экземпляр класса {@link Lib/Control/AreaAbstract/AreaAbstract}. Когда условие выполнено, то функция onBringToFront вызывается заново уже для найденного компонента. В ином случае фокус устанавливается на этот компонент.</li>
       *     <li>Если компонент не найден или он не может принимать фокус, то с помощью функции {@link activateFirstCtrl} фокус устанавливается на первый дочерный контрол внутри текущего компонента..</li>
       * </ul>
       */
      onBringToFront: function(){
         if(this._childControls && this._childControls.length) {
            var control = this.getActiveChildControl(true);
            if(control && control.canAcceptFocus()){
               if(cInstance.instanceOfMixin(control, 'Lib/Control/AreaAbstract/AreaAbstract.compatible')){
                  control.onBringToFront();
               }
               else{
                  control.setActive(true);
               }
            }
            else{
               this._activateFirstCtrl();
            }
         }
         else{
            this._moveFocusToSelf();
         }
      },
      /**
       *  Обработка клавиатурных нажатий
       *  @param {Event} e
       */
      _oldKeyboardHover: function(e){
         if(e.which in this._keysWeHandle){
            if(e.which == Env.constants.key.enter) {
               if(!(e.altKey || e.shiftKey) && (e.ctrlKey || e.metaKey)) { // Ctrl+Enter, Cmd+Enter, Win+Enter
                  if (!this._defaultAction) {
                     return true;
                  }
                  return this._defaultAction(e);
               }
            }
            if(e.which == Env.constants.key.tab){
               var curControl = $(e.target).wsControl(),
                  parentControl = curControl && curControl.getParent();
               if (parentControl && !cInstance.instanceOfMixin(parentControl, 'Lib/Mixins/CompoundActiveFixMixin') && parentControl.moveFocus) {
                  // moveFocus необходимо звать от парента того компонента, в котором находится фокус.
                  // moveFocus будет искать следующий после активного элемент по табиндексам,
                  // а если это последний компонент в области, вызовет moveFocus для предка
                  // звать сразу this.moveFocus опасно, потому что может так случиться, что компонент, в котором мы сейчас
                  // находимся может быть не прямым потомком области. Это связано с неправильной версткой, когда физически
                  // компонент лежит не внутри своего логического предка. Например в window.module.js, если мы находимся
                  // в компоненте, который находится в шапке окна (например, DatePicker), и нажимаем tab, this будет самим окном, а предок компонента, в
                  // котором мы находимся - это шаблон окна. moveFocus на самом окне будет искать активного потомка внутри себя, а внутри только один потомок - это шаблон окна.
                  // так как переходы по табу в шаблоне зациклены, мы заберем активность у текущего компонента (DatePicker), и снова будем устанавливать активность в этот же шаблон окна,
                  // а он уже активирует первый компонент, тот же самый, с которого мы уходим (DatePicker).
                  var res = parentControl.moveFocus(e);
                  if (!res) {
                     e.preventDefault();
                  }
                  return res;
               } else {
                  return this.moveFocus(e);
               }
            }
         }
         return true;
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
      _oldActivateLastControl: function(noFocus){
         this._activateSiblingControlOrSelf(true, this._maxTabindex > 0 ? this._maxTabindex + 1 : this._childControls.length, noFocus);
      },

      /**
       * Переводит фокус на следующий/предыдущий дочерний контрол, или на себя, если не найден подходящий
       * @param {Boolean} isShiftKey Если да - то выбирается предыдущий контрол
       * @param {Number} searchFrom С какого контрола искать новый
       * @private
       */
      _activateSiblingControlOrSelf: function(isShiftKey, searchFrom, noFocus) {
         if (isElementVisible(this.getContainer())) {
            if (Env.detection.isMobilePlatform) {
               activateSiblingControlOrSelfInt(this, isShiftKey, searchFrom, noFocus);
            } else {
               baseControl.ControlBatchUpdater.runBatchedDelayedAction('AreaAbstract.activateSiblingControlOrSelf', [this, isShiftKey, searchFrom, noFocus]);
            }
         }
      },
      /**
       *
       * Получить контрол, который открыл окно.
       * Этот контрол может не являться родителем окна.
       * @returns {Lib/Control/Control|undefined} Экземпляр класса контрола.
       * @param {Lib/Control/Control} opener Используется для того чтобы установить логическую связь между двумя окнами. Значение опции - инстанс компонента, который инициировал открытие окна.
       * @see opener
       */
      getOpener: function(){
         return this._opener;
      },
      /**
       * Переносит фокус на себя
       * @param {Boolean} [dontChangeDomFocus=false] Не переносить фокус (предполагается, что он уже установлен каким-то внешним способом,
       * например, в результате выделения текста в вёрстке).
       * @protected
       */
      _moveFocusToSelf: function(dontChangeDomFocus){
         this._activeChildControl = -1;
         if (!this._activateParent()) {
            WindowManager.disableLastActiveControl(this);
         }

         // не устанавливаем фокус на контрол, который не может принять этот фокус
         if (this._canAreaAcceptFocus() && (!this.isEnabled || this.isEnabled())) {
            if (!this._isControlActive) {
               this._isControlActive = true;
               this._updateActiveStyles();

               this._notify('onActivate');
               this._notify('onFocusIn');
            }

            // В юнит тестах нет контейнера, поэтому фокусировать некуда
            // мы смотрим только на свойство _isControlActive у инстанса
            if (!dontChangeDomFocus && this._isControlActive && this._container) {
               if (this._container.length) {
                  if (!$.contains(this._container[0], document.activeElement)) {
                     if (Env.detection.isMobilePlatform) {
                        focusControl(this);
                     } else {
                        baseControl.ControlBatchUpdater.runBatchedDelayedAction('Control.focus', [this]);
                     }
                  }
               } else {
                  Env.IoC.resolve('ILogger').error("AreaAbstract", "У компонента '" + this._moduleName + "' неправильно задан контейнер _container. В нем нет ни одного элемента.");
               }
            }
         }
      },

      /**
       *
       * Убрать сведения о контроле, как о дочернем.
       * Метод удаляет информацию о контроле из массива дочерних контролов, получить который можно с помощью {@link getChildControls}.
       * @param {Lib/Control/Control} control Контрол, который хотим убрать из списка дочерних.
       * @example
       * Убрать контрол из списка дочерних, если его имя "ФильтрДокументов".
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var array = this.getChildControls();
       *       array.forEach(function(element) {
       *          if (element.getName() == 'ФильтрДокументов') {
       *             this.unregisterChildControl(element);
       *          }
       *       });
       *    });
       * </pre>
       * @see getChildControls
       * @see registerChildControl
       */
      unregisterChildControl: function(control){
         var
            controlNumber = arrayFindIndex(this._childControls, function(ctr) {
               return ctr === control;
            }),
            childContainersIdx,
            tabIndexKey;
         if(controlNumber !== -1){
            var
               id = control.getId(),
               name = control.getName();

            if (this._childControls[this._childsMapId[id]] === control) {
               delete this._childsMapId[id];
            }
            if (this._childControls[this._childsMapName[name]] === control) {
               delete this._childsMapName[name];
            }
            delete this._childControls[controlNumber];
            childContainersIdx = arrayFindIndex(this._childContainers, function (ctr) {
               return ctr === control;
            });
            if (childContainersIdx !== -1) {
               delete this._childContainers[childContainersIdx];
            }
            if (this._childsTabindex) {
               tabIndexKey = arrayFindIndex(this._childsTabindex, function(number) {
                  return number === controlNumber;
               });
               if (tabIndexKey !== -1) {
                  delete this._childsTabindex[tabIndexKey];
               }
            }
         }
      },

      /***
       * Метод активирует родительский контрол в том случае, когда эта (дочерняя) область получила фокус сама, и не отдала его дочерним контролам.
       * В этом случае ей нужно активировать родительскую область, чтобы та запомнила последний эту дочернюю как последний активный контрол, и
       * чтоб потом правильно работал обход по табам. Некоторые контролы могут не активировать родительскую область (например, FloatArea или Window),
       * поскольку в них из неё по табу не попасть.
       * @private
       */
      _activateParent: function() {
         var myParent = this.getParent();
         // активируем предка только если на это есть необходимость, то есть его активный потомок - не текущий контрол
         if (myParent && !myParent.isActive()) {
            myParent._activate(this, true);
         }
         return !!myParent;
      },

      _activateSiblingControlOrSelfLow: function(isShiftKey, searchFrom, noFocus){
         if (!this.detectNextActiveChildControl(isShiftKey, searchFrom, noFocus)) {
            this._moveFocusToSelf(noFocus);
         }
      },
      /**
       *
       * Переместить фокус к следующему/предыдущему контролу.
       *
       * Направление перехода зависит от нажатой клавиши Shift:
       * 1. Клавиша нажата. Переход к предыдущему контролу.
       * 2. Клавиша отпущена. Переход к следующему контролу.
       * @param {Object} event Объект события.
       * @return {Boolean} Результат выполнения функции.
       *
       * Возможные значения:
       * 1. true - фокус был отдан родителю. Если родителя не существует, то фокус переходит браузеру.
       * 2. false - фокус переместился к следующему/предыдущему контролу.
       * @example
       * Подписать группу флагов (groupCheckbox) на перемещение фокуса между дочерними контролами при нажатии клавиши "n".
       * <pre>
       *    groupCheckbox.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which == cConstants.key.n) {
       *          this.moveFocus(event);
       *       }
       *    });
       * </pre>
       */
      moveFocus: function(event){
         event.stopPropagation();
         if(!this.detectNextActiveChildControl(event.shiftKey)){//Не смогли найти следующий
            // Мы должны либо отпустить фокус в браузер либо выйти из вложенного ареа
            if(this.focusCatch(event)){
               return true;
            }
         }
         return false;
      },
      /**
       *
       * Установить фокус на следующий/предыдущий контрол, находящийся на одном структурном уровне с родительским контролом.
       *
       * Направление перехода зависит от нажатой клавиши Shift:
       * 1. Клавиша нажата. Переход к предыдущему контролу.
       * 2. Клавиша отпущена. Переход к следующему контролу.
       * @param {Object} event Объект события.
       * @returns {Boolean} Результат выполнения функции.
       *
       * Возможные значения:
       * 1. true - у контрола нет родителя. Фокус перешёл браузеру.
       * 2. false - фокус был передан ближайшему контролу, который находится на одном структурном уровне с родительским контролом.
       * @example
       * Подписать группу флагов (groupCheckbox) на перемещение фокуса на следующий контрол при нажатии клавиши "p".
       * <pre>
       *    groupCheckbox.subscribe('onKeyPressed', function(eventObject, event) {
       *       if (event.which == cConstants.key.p) {
       *          this.focusCatch(event);
       *       }
       *    });
       * </pre>
       */
      focusCatch: function(event){
         var parent = this.getParent();
         if(!parent){ //Если нет парента то это либо окно, либо самая верхняя ареа => отпускаем в браузер
            WindowManager.disableLastActiveControl();
            if(event.shiftKey){
               WindowManager.focusToFirstElement();
            }
            else{
               WindowManager.focusToLastElement();
            }
            return true;
         }
         else{
            //Пытаемся найти следующий, пробегаюсь по своим парентам.
            return parent.moveFocus(event);
         }
      },


      _getNextIndexInfo: function(isShiftKey, searchFrom) {
         var
            curIndex = searchFrom !== undefined ? searchFrom : this._activeChildControl,
            curIndexIsTabIndex = (searchFrom !== undefined || this._activatedWithTabindex) && !!this._childsTabindex,
            childLength = this._childControls.length,
            nextIndex = isShiftKey ? curIndex - 1 : curIndex + 1,
            isOk = curIndexIsTabIndex ? //Проверка следующего табиндекса на доступное значение
               (isShiftKey ? nextIndex > 0 : nextIndex <= this._maxTabindex) :
               (isShiftKey ? nextIndex >= 0 : nextIndex < childLength),
            last, first;

         if (!isOk) {
            last = curIndexIsTabIndex ? this._maxTabindex : childLength - 1;
            first = curIndexIsTabIndex ? 1 : 0;

            nextIndex = isShiftKey ? last : first;
         }

         return {
            nextIndex: nextIndex,
            nextIndexIsTabIndex: curIndexIsTabIndex,
            isNextCycle: !isOk
         };
      },
      /**
       * Ищем такой табиндекс, который соответствует следующему контролу в обходе по табу.
       * Следующий контрол не может совпадать с текущим активным контролом.
       * Если такой табиндекс найден не будет, вернется табиндекс, вышедший за границу промежутка, в котором содержатся существующие табиндексы.
       * @param isShiftKey Обход в обратную сторону
       * @param searchFrom От какого табиндекса начинать поиск
       * @returns {number} Новый табиндекс
       */
      detectNextActiveChildControlIndex: function(isShiftKey, searchFrom) {
         // проверка контрола, в который планируется переход по табу
         function controlOk(idx, idxIsTabIdx) {
            var
               contrIdx = idxIsTabIdx ? self._childsTabindex[idx] : idx,
               contr = contrIdx !== undefined && self._childControls[contrIdx];

            return contr && contr.canAcceptFocus();
         }

         var
            self = this,
            nextIndexInfo = this._getNextIndexInfo(isShiftKey, searchFrom),
            idxIsTabIdx = nextIndexInfo.nextIndexIsTabIndex,
            cur = nextIndexInfo.nextIndex,
            first = idxIsTabIdx ? 1 : 0,
            last = idxIsTabIdx ? this._maxTabindex : this._childControls.length - 1,
            ignoreTabCycles = this._getOption('ignoreTabCycles');

         if (nextIndexInfo.isNextCycle && ignoreTabCycles) {
            //если обход по табу в этом контроле не должен зацикливаться, то заменяем cur на индекс за границами
            //массива дочерних контролов - тогда клиент метода detectNextActiveChildControlIndex обработает это как выход
            //из этого контрола в родительский
            cur = isShiftKey ? first - 1 : last + 1;
         }
         else {
            //ищем индекс подходящего контрола
            while (isShiftKey ? cur >= first : cur <= last) {
               if (controlOk(cur, idxIsTabIdx)) {
                  break;
               }
               cur = isShiftKey ? cur - 1 : cur + 1;
            }

            //если не нашли, и обход по табу должен зацикливаться, то становимся в начало обхода, и ищем подходящий контрол
            if ((cur < first || cur > last) && !ignoreTabCycles) {
               cur = isShiftKey ? last : first;

               while (cur >= first && cur <= last) {
                  if (controlOk(cur, idxIsTabIdx)) {
                     break;
                  }
                  cur = isShiftKey ? cur - 1 : cur + 1;
               }
            }
         }
         return {
            index: cur,
            isTabIndex: nextIndexInfo.nextIndexIsTabIndex,
            isValid: cur >= first && cur <= last
         };
      },

      getNextActiveChildControl: function(isShiftKey, searchFrom) {
         var
            nextInfo = this.detectNextActiveChildControlIndex(isShiftKey, searchFrom),
            next = nextInfo.index,
            res, active;

         if (nextInfo.isValid) {
            //Установка фокуса на найденный контрол
            active = nextInfo.isTabIndex ? this._childsTabindex[next] : next;
            res = this._childControls[active] || null;
         } else {
            res = null;
         }
         return res;
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
      _oldDetectNextActiveChildControl: function(isShiftKey, searchFrom, noFocus) {
         var
            nextInfo = this.detectNextActiveChildControlIndex(isShiftKey, searchFrom),
            next = nextInfo.index,
            res = nextInfo.isValid, active;

         if (res) {
            //Установка фокуса на найденный контрол
            active = nextInfo.isTabIndex ? this._childsTabindex[next] : next;
            res = !!this._childControls[active];
            if (res) {
               this._childControls[active].setActive(true, isShiftKey, noFocus);
            }
         }
         return res;
      },
      /**
       *
       * Делает область активной
       * @param {Lib/Control/Control|undefined} control Контрол, который при этом стал активным
       * @param {Boolean} [dontNotifyOnActivate] Указывает на то, что область не должна сигналить событие onActivate.
       * Такой вариант бывает, если метод activate вызывает дочерняя область из moveFocusToSelf, например - тогда она сама будет сигналить onActivate,
       * и onActivate родительской области будет лишним, вызовет лишние действия, например, в WindowManager-е.
       */
      _activate: function(control, dontNotifyOnActivate){
         var deactivateControl, deactivateWindow;
         if (control) {
            var window = WindowManager.getActiveWindow(false, true);
            if (window) {
               var
                  prevActive = window.getActiveChildControl(),
                  // получаем список всех родителей с помощью DOMEnvironment, потому что он
                  // должен включать в себя и vdom-контролы. Мы не можем использовать
                  // getParent(), так как vdom-контролы его не имеют
                  parentList = Vdom.DOMEnvironment._goUpByControlTree(control._container);

               if (prevActive) {
                  // ищем, не ушла ли активность внутрь компонента, с которого уходим
                  if (prevActive !== control && parentList.indexOf(prevActive) === -1 && prevActive.getParent() === window) {
                     deactivateControl = true;
                  }
               }

               //область надо деактивировать, если новый активный контрол не лежит внутри неё
               if (control !== window && parentList.indexOf(window) === -1) {
                  //если у активной области нет активного дочернего контрола, то надо деактивировать её саму,
                  //потому что иначе она не сможет среагировать на уход фокуса
                  deactivateWindow = true;
               }
            }
         }
         else {
            this._activeChildControl = undefined;
         }

         if (deactivateControl && prevActive.isActive()) {
            prevActive.setActive(false, undefined, undefined, control);
         }
         if (deactivateWindow && window.isActive()) {
            window.setActive(false, undefined, undefined, control);
         }

         this.storeActiveChild(control);

         // OnlineSbisRu/Base/View это особый компонент, который является парентом для окон
         // (раньше у окон не было парента, но теперь есть компонент внутри которого все лежит).
         // Активировать его здесь нельзя, при его активации будут закрыватья все окна, согласно механизму autoHide у FloatArea
         if (!dontNotifyOnActivate && !cInstance.instanceOfModule(this, 'OnlineSbisRu/Base/View')) {
            this._notify('onActivate');
         }
      },

      _storeActiveChildInner: function () {
         var parent = this.getParent();
         if(parent){
            parent.storeActiveChild(this);
         }
      },

      /**
       *
       * Срхраняет информацию о том, что это дочерний контрол был активен, у себя и своих родительских элементов
       * @param {Lib/Control/Control} child Дочерний контрол
       */
      storeActiveChild: function(child){
         this.setChildActive(child);
         this._storeActiveChildInner();
      },
      /**
       *
       * Перевести фокус на дочерний контрол.
       * @param {Lib/Control/Control} child Дочерний контрол.
       * @example
       * При готовности контрола перевести фокус на его первый дочерний контрол.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var array = this.getChildControls();
       *       this.setChildActive(array[0]);
       *    });
       * </pre>
       * @see detectNextActiveChildControl
       * @see getChildControls
       */
      setChildActive: function(child){
         var
            childId = child.getId(),
            wasActive = this._isControlActive;
         if(child.getTabindex() > 0){
            this._activeChildControl = parseInt(child.getTabindex(), 10);
            this._activatedWithTabindex = true;
         }
         else{
            for(var i = 0, l = this._childControls.length; i < l; i++){
               if(this._childControls[i] && this._childControls[i].getId() === childId){
                  this._activeChildControl = i;
                  this._activatedWithTabindex = false;
                  break;
               }
            }
         }
         this._isControlActive = true;
         this._updateActiveStyles();
         if (wasActive !== this._isControlActive && this._isControlActive) {
            this._notify('onFocusIn');
         }
      },

      _canAreaAcceptFocus: function() {
         var thisIsVisible = !this.isVisible || this.isVisible();
         var isVisible = this.iWantVDOM ? thisIsVisible : isElementVisible(this.getContainer());
         return thisIsVisible && this.getTabindex() && isVisible;
      },

      canAcceptFocus: function(){
         function childOk(child) {
            return child && child.canAcceptFocus();
         }

         var
            childs = this._childControls || [],
            result = this._canAreaAcceptFocus();

         childs = childs.filter(function(child) {
            return child.isVisible();
         });

         if (result) {
            //Если дочерние контролы есть, то canAcceptFocus зависит от них. Если нет, то от своего isEnabled
            if (childs.length === 0) {
               result = !this.isEnabled || this.isEnabled();
            } else {
               result = !! objectFind(this._childControls, childOk);
            }
         }

         return result;
      },
      /**
       *
       * Готова ли область.
       * @returns {Boolean} Признак: готова (true) или нет (false).
       * @see isAllReady
       * @see getReadyDeferred
       */
      isReady: function(){
         return this._isReady;
      },
      /**
       *
       * Получить все дочерние контролы. Метод выполняется с рекурсивным обходом.
       * @param {Boolean} [excludeContainers = false] Исключать контейнеры из возвращаемого набора.
       * @param {Boolean|undefined} [recursive = true] Получать контролы всех уровней вложенности.
       * @param {function|undefined} [filter] Функция, фильтрующая набор контролов. Принимает в качестве аргумента контрол.
       * Если контрол нужно включить в результат, функция должна возвращать true, иначе false.
       * Если функция не указана, все контролы попадут в результат.
       * @returns {Array} Массив дочерних контролов.
       * @example
       * Проверить наличие кнопки среди дочерних контролов. При положительном результате изменить активность кнопки.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var array = this.getChildControls(true);
       *       array.forEach(function(element) {
       *          if (element instanceof Deprecated/Controls/ButtonAbstract/ButtonAbstract) {
       *             element.setEnabled(false);
       *          }
       *       });
       *    });
       * </pre>
       * @see getImmediateChildControls
       * @see getChildControlByName
       * @see getChildControlById
       * @see waitChildControlByName
       * @see waitChildControlById
       * @see hasChildControlByName
       * @see getNearestChildControlByName
       * @see getActiveChildControl
       */
      getChildControls: function(excludeContainers, recursive, filter) {
         var children = [];
         for(var i = 0, l = this._childControls.length; i < l; i++) {
            if(i in this._childControls) {
               var c = this._childControls[i];
               if(c){
                  if(typeof c.getChildControls === "function") {
                     if (recursive !== false) {
                        children = children.concat(c.getChildControls(excludeContainers, recursive, filter));
                     }
                     if (excludeContainers) {
                        continue;
                     }
                  }
                  if (!filter || filter(c)) {
                     children.push(c);
                  }
               }
            }
         }
         return children;
      },
      /**
       * Ищет дочерние контролы в детях-контейнерах
       *
       * @param {String} by Как искать ("Id", "Name")
       * @param {String} value Что искать
       * @returns {Lib/Control/Control}
       */
      _searchChildren: function(by, value) {
         var containers = this._childContainers,
            finded = null;
         for(var i = 0, l = containers.length; i < l; i++) {
            if (containers[i] && containers[i]['_getChildControlBy']) { //может быть удалён
               //может быть не floatArea
               finded = containers[i]['_getChildControlBy'](by, value);
               if (finded) {
                  break;
               }
            }
         }
         return finded;
      },

      _checkInCache: function (where, id) {
         if (this['_childsMap'+where+'Cache'][id]) {
            return this['_childsMap'+where+'Cache'][id];
         }
      },

      _getChildControlBy: function(where, id) {

         var cnt = this._checkInCache(where, id);
         if (cnt) {
            return cnt;
         }

         if (this['_childsMap'+where][id] !== undefined) {
            return this._childControls[this['_childsMap'+where][id]];
         }

         return  this._searchChildren(where, id);
      },

      /**
       *
       * Получить дочерний контрол по его идентификатору.
       * @param {String} controlId Идентификатор контрола.
       * @returns {Lib/Control/Control} Экземпляр искомого класса.
       * @throws Error Если элемент с заданным ID не найден.
       * @example
       * Активность дочернего контрола зависит от значения флага (fieldCheckbox).
       * <pre>
       *    fieldCheckbox.subscribe('onChange', function(eventObject, value) {
       *       //получаем экземпляр класса родительского контрола
       *       var parent = this.getParent();
       *       parent.getChildControlById('div_FNPN').setEnabled(value);
       *    });
       * </pre>
       * @see getId
       * @see getChildControlByName
       * @see waitChildControlByName
       * @see waitChildControlById
       * @see hasChildControlByName
       * @see getChildControls
       * @see getNearestChildControlByName
       * @see getImmediateChildControls
       * @see getActiveChildControl
       */
      getChildControlById: function(controlId){
         var atChildren = this._getChildControlBy("Id", controlId);
         if(atChildren) {
            this._childsMapIdCache[controlId] = atChildren;
            return atChildren;
         }
         throw new Error('Control with ID ' + controlId + ' is not present in this container');
      },
      /**
       *
       * Получить дочерний контрол по его имени.
       * @param {String} controlName Имя искомого контрола.
       * @returns {Lib/Control/Control} Экземпляр искомого класса.
       * @throws Error Если контрол с нужным именем не найден.
       * @example
       * Активность дочернего контрола зависит от значения флага (fieldCheckbox).
       * <pre>
       *    fieldCheckbox.subscribe('onChange', function(eventObject, value) {
       *       //получаем экземпляр класса родительского контрола
       *       var parent = this.getParent();
       *       parent.getChildControlByName('ТабличноеПредставление').setEnabled(value);
       *    });
       * </pre>
       * @see name
       * @see getName
       * @see getChildControlById
       * @see waitChildControlByName
       * @see waitChildControlById
       * @see hasChildControlByName
       * @see getChildControls
       * @see getNearestChildControlByName
       * @see getImmediateChildControls
       * @see getActiveChildControl
       */
      getChildControlByName: function(controlName){
         var atChildren = this._getChildControlBy("Name", controlName);
         if(atChildren) {
            this._childsMapNameCache[controlName] = atChildren;
            return atChildren;
         }
         throw new Error('Control with name ' + controlName + ' is not present in this container');
      },

      _onResizeHandlerBatch: function() {
         this._onResizeHandler();

         if ($.dtPostFilter) {
            $.dtPostFilter({dom: this._container});
         }
      },

      _getResizerHeight : function(){
         var isVerticalFixedSize = !this._getOption('autoHeight'),
            maxHeight = 0;

         if(!isVerticalFixedSize || (isVerticalFixedSize && !this.getParent())){
            this._ensureControlsSizes('minHeight');
            for(var id in this._childsSizes){
               if (!this._childsSizes.hasOwnProperty(id)) {
                  continue;
               }

               maxHeight = Math.max(maxHeight, this._childsSizes[id].minHeight);
            }
         }
         // для контролов с фиксированной шириной/высотой устанавливаем ресайзер, равный этой фиксированной ширине/высоте
         if(isVerticalFixedSize && this.getParent()){
            maxHeight = this._container.height();//getMinHeight();
         }
         return maxHeight;
      },

      /**
       * тут инициализируются размеры дочерних контролов, если ещё не инициализированы
       * @param doSetHeight - надо ли проставлять высоты. сделано, чтоб они не проставлялись два раза в _getResizerHeight
       * @private
       */
      _ensureControlsSizes: function(dim) {
         // высоту придётся брать всегда по новой потому что контрол с автовысотой может её изменить
         for(var i in this._childsMapId){
            if (!this._childsMapId.hasOwnProperty(i)) {
               continue;
            }

            var control = this._childControls[this._childsMapId[i]];
            if(control && control._isContainerInsideParent()){
               var size = this._childsSizes[i];
               if(size === undefined) {
                  size = this._childsSizes[i] = {};
               }

               var methods = {minWidth: 'getMinWidth', minHeight: 'getMinHeight'};
               if (size[dim] === undefined) {
                  size[dim] = control[methods[dim]]();
               }
            }
         }
      },

      _getResizerWidth : function(){
         var isHorizontalFixedSize = !this._getOption('autoWidth'),
            maxWidth = 0;
         // if any dimention is "Auto" OR(!!!) this is root control with fixed
         // then calculate it from childsSizes
         if(!isHorizontalFixedSize || (isHorizontalFixedSize && !this.getParent())){
            this._ensureControlsSizes('minWidth');

            for(var id in this._childsSizes){
               if (!this._childsSizes.hasOwnProperty(id)) {
                  continue;
               }

               maxWidth = Math.max(maxWidth, this._childsSizes[id].minWidth);
            }
         }

         // для котнролов с фиксированной шириной/высотой устанавливаем ресайзер, равный этой фиксированной ширине/высоте
         if(isHorizontalFixedSize && this.getParent()){
            maxWidth = this._container.width();//getMinWidth();
         }
         return maxWidth;
      },

      _postUpdateResizer: function(width, height) {
      },

      /**
       * Обновляет ресайзер у контрола на основе текущих размеров вложенных в него контролов
       * (при auto-размере), иначе берет размеры контейнера.
       */
      _updateResizer:function (){
         if (this._needResizer()){
            var
               optMinHeight = parseInt(this._getOption('minHeight'), 10),
               optMinWidth = parseInt(this._getOption('minWidth'), 10),
               maxHeight = Math.max(this._getResizerHeight(), optMinHeight),
               maxWidth = Math.max(this._getResizerWidth(), optMinWidth);

            setElementCachedSize(this._resizer, {height: maxHeight, width: maxWidth});
            this._postUpdateResizer(maxWidth, maxHeight);
         } else if (this._resizer) {
            this._resizer.remove();
            this._resizer = null;
         }
      },

      _onSizeChangedBatch: function(controls) {
         controls.forEach(function(control) {
            delete this._childsSizes[control.getId()];
         }, this);

         if (this._needResizer()) {
            if (this._resizer) {
               this._updateResizer();
            }
            else {
               this._initResizers();
            }
         }

         return true;
      },
      _needResizer: function() {
         return !this._getOption('isRelativeTemplate');
      },
      /**
       * Инициализация ресайзера контрола
       */
      _initResizers:function (){
         if(this._resizer){
            this._resizer.remove();
            this._resizer = null;
         }

         if (this._needResizer()) {
            if(this._getOption('autoHeight')){
               this._container.height('auto');
               this._container.removeClass('ws-area-height-100-fix');
            }
            if(this._getOption('autoWidth')){
               this._container.width('auto');
            }
            if(this._getOption('autoHeight') || this._getOption('autoWidth') || !this.parent){ // создавать ресайзер только если есть авторазмеры или мы корневой элемент

               this._resizer = $('<div />', {
                  'class': 'r',
                  'id': 'resizer-' + this.getId()
               });

               this._container.prepend(this._resizer);
               this._updateResizer();
            }
         }
      },
      _removeControls: function() {
         var controls = [].concat(this._childControls);

         controls.forEach(function (control) {
             control.destroy();
         });

         this._childControls = [];
         this._childsMapId = {};
         this._childsMapName = {};
         this._childContainers = [];
         this._childsSizes = {};
         this._childsTabindex = {};
         this._maxTabindex = 0;

         controls.forEach(function(control) {
            if (!control.isDestroyed()) {
               var
                  err = rk('Деструктор дочернего контрола (id = ' + control.getId() + ', name = ' + control.getName() +
                     ') отработал не полностью. Видимо, где-то забыли вызвать деструктор базового класса. ' +
                     'Родитель: (id = ' + this.getId() +
                     ', name = ' + this.getName() + ')');
               throw new Error(err);
            }
         }, this);
      },
      _subscribeOnReady: function() {
         var self = this;
         // подписываемся на событие onReady с целью остановить всплытие этого события. доплывать до body должны только события верхних компонентов
         if (self._onReadyHandler) {
            self._container.unbind('onReady', self._onReadyHandler);
         }
         this._container.bind('onReady', this._onReadyHandler = function(e) {
            if (!self._container.is(e.target)) {
               e.stopPropagation();
            }
         });
      },
      destroy: function(dontEndBatch){
         var updater = baseControl.ControlBatchUpdater;
         if (!dontEndBatch) {
            updater.beginBatchUpdate('AreaAbstract_destroy');
         }
         try {
            for(var i in this._groupInstances) {
               if(this._groupInstances.hasOwnProperty(i)) {
                  this._groupInstances[i].destroy();
               }
            }

            if (this._onReadyHandler) {
               this._container.unbind('onReady', this._onReadyHandler);
            }

            this._childNonControls = null;
            this._resizer = $();
            this._waitersById = null;
            this._waitersByName = null;
            this._removeControls();

            this.setOpener(null);

            if(this._craftedContext && this._context) {
               // Если контекст изготовлен внутри класса - уничтожаем его
               this._context.destroy();
            }
            this._container.unbind('mousedown.activate');
            this._container.unbind('mousedown.fxselect');
            this._container.unbind('onReady');

            Env.constants.$win.unbind('resize.'+this.getId());
            Env.constants.$doc.unbind('mousedown.'+this.getId());

            WindowManager.removeWindow(this);

            if (typeof this._destroySuperClass === "function") {
               var focusIsLost = $(document.activeElement).closest(this._container).length;
               if (focusIsLost) {
                  // если фокус находится в удаляемом элементе, устанавливаем флаг о восстановлении фокуса
                  WindowManager._doActivateControl = true;
               }
               this._destroySuperClass();
            }
         }
         finally {
            if (!dontEndBatch) {
               updater.endBatchUpdate('AreaAbstract_destroy');
               for (var key in updater._batches) {
                  if (updater._batches.hasOwnProperty(key) && key !== 'AreaAbstract_destroy') {
                     updater.endBatchUpdate(key);
                  }
               }
            }
         }

         this._cleanupMarkupDataBinding = null;
      },
      /**
       *
       * Переустановка opener-а. Нужно для классов-наследников вроде плавающих панелей или окон, которым может быть нужно
       * перед показом панели переустановить opener-а, поскольку старый удалился по какой-то причине (например, шаблон переустановили или ещё что).
       * В этом случае, по событию onDestroy, область автоматически отвяжется от opener-а, и перед повторным показом области (наследника AreaAbstract - плавающей панели или окна)
       * нужно будет установить нового opener-а. Это и можно сделать с помощью метода setOpener.
       * Для примера смотри метод helpers.showFloatArea.
       * @param {Lib/Control/Control} opener Используется для того чтобы установить логическую связь между двумя окнами. Значение опции - инстанс компонента, который инициировал открытие окна.
       * @see opener
       */
      setOpener: function(opener) {
         function checkAndFixOpener(openerArg) {
            function getOpener(control) {
               return control && control.getOpener && control.getOpener();
            }

            function getParent(control) {
               return control && control.getParent && control.getParent();
            }

            function closestWithOpener(control) {
               return (getOpener(control) && control) || closestWithOpener(getParent(control));
            }

            function isChildOrSelf(child, parent) {
               return child && (child === parent || isChildOrSelf(child.getParent(), parent));
            }

            function isChildOrSelfOrOpener(child, parent) {
               return child && (child === parent ||
                  isChildOrSelfOrOpener(getOpener(child) || getParent(child), parent));
            }

            function isLoadingIndicator(control) {
               return  cInstance.instanceOfModule(control, 'Lib/Control/LoadingIndicator/LoadingIndicator') ||
                  ( cInstance.instanceOfModule(control, 'Lib/Control/Window/Window') && control._isIndicator);
            }

            //LoadingIndicator не может быть опенером, потому что он скрывается независимо ни от кого,  и из-за него
            //закрываются панели, хотя не должны (по его скрытию происходит активация последней открытой панели -
            // а у неё может опенером быть этот индикатор - и тогда остальные панели закроются)
            //TODO: убрать LoadingIndicator из фокуса и getActiveWindow, чтобы не писать этих исключений везде
            if (isLoadingIndicator(openerArg)) {
               openerArg = WindowManager._getActiveWindow(function(win) {
                  return !isLoadingIndicator(win);
               });
            }

            //Если по цепочке опенеров и парентов я вышел от аргумента openerArg к себе, то
            //это означает зацикливание цепочки (я прямо или косвенно его опенер или родитель)
            if (isChildOrSelfOrOpener(openerArg, this)) {
               //боремся с зацикливанием
               if (isChildOrSelf(openerArg, this)) {
                  //opener лежит внутри this (по иерархии родителей). в этом случае надо просто оставить тот же opener,
                  //то есть, ничего не делать
                  openerArg = this._opener;
               } else {
                  //Нахожу ближайший родитель аргумента opener, у которого есть свой opener:
                  //это или this, или кто-то кому this является родителем или опереном.
                  //Чтобы не допустить появления цикла в цепочке, нужно её в этой точке разорвать: тогда по цепочке
                  //опенеров и родителей нельзя будет пройти от opener к this, а от this к opener - можно
                  closestWithOpener(openerArg).setOpener(null);
               }
            }
            return openerArg;
         }

         if (opener && !(opener instanceof  baseControl.Control || opener._template)) {
            Env.IoC.resolve('ILogger').error("AreaAbstract", "Ошибка при установке свойства opener, который не является ни контролом, ни null");
            return;
         }

         // Защита от дурака, чтобы не передали убитый opener
         if (opener && !opener.isDestroyed || opener && opener.isDestroyed()) {
            opener = WindowManager.getActiveWindow(false);
         }

         //Проверка зацикливания цепочки опенеров, и устранение циклов
         opener = checkAndFixOpener.call(this, opener);

         if (opener !== this._opener) {
            if (this._opener) {
               if (this._onDestroyOpener) {
                  this._opener.unsubscribe('onDestroy', this._onDestroyOpener);
               }

               if (this._opener.getContainer()) {
                  this._opener.getContainer().trigger('wsWindowClose', this);
               }
            }

            this._opener = opener;
            if (this._opener) {
               if (!this._onDestroyOpener) {
                  this._onDestroyOpener = this.setOpener.bind(this, undefined);
               }

               // подписываемся на событие onDestroy опенера. отписыавемся от этой подписки, если дестроится опенер или this
               this.subscribeTo(this._opener, 'onDestroy', this._onDestroyOpener);

               if (this._opener.getContainer()) {
                  this._opener.getContainer().trigger('wsWindowOpen', this);
               }
            }
         }
      },

      /**
       * @param {Lib/Control/Control} addedChild
       * @private
       */
      _checkWaiters: function(addedChild) {
         var name = addedChild.getName(),
            id = addedChild.getId(),
            d;

         if (this._waitersByName && (name in this._waitersByName)) {
            d = this._waitersByName[name];
            delete this._waitersByName[name];
            d.callback(addedChild);
         }

         if (this._waitersById && (id in this._waitersById)) {
            d = this._waitersById[id];
            delete this._waitersById[id];
            d.callback(addedChild);
         }

         if (this.getParent() !== null) {
            /**
             * Проверим здесь а не ждет ли нас родитель текущего родителя
             * Цепочка проверок в "родителя" рвется на легких инстансах
             * т.к. в AreaAbstract проверяется родитель на принадлежность к классу AreaAbstract
             * Автотест заказан:
             * https://online.sbis.ru/opendoc.html?guid=2af62a0a-0e3b-484d-8bc0-e7e94fbe6129&des=
             * Задача в разработку 31.05.2017 Сделать автотест: Контрол, внутри него вставлен ScrollContainer. Внутри него область по шаблону. У к…
             */
            this.getParent()._checkWaiters(addedChild);
         }
      },
      /**
       * @param {String} by Name или Id
       * @param {String} what кого ищем
       * @returns {Core/Deferred}
       * @private
       */
      _waitUtility: function(by, what) {
         var waitHolderProperty = '_waitersBy' + by,
            searchMethod = 'getChildControlBy' + by,
            control, result;

         if (this.isDestroyed()) {
            result = cDeferred.fail('Can\'t wait for controls in destroyed parent');
         } else {
            try {
               // попробуем найти контрол который хотят
               control = this[searchMethod](what);
            } catch (e) {
               // ignore
            }

            if (control) {
               // если нашли - сразу вернем
               result = new DeferredForWaiters().callback(control);
            } else {
               // иначе либо вернем уже имеющийся ожидающий Deferred, либо создадим новый и вернем (если нету)
               if (!this[waitHolderProperty]){
                  this[waitHolderProperty] = {};
               }
               result = this[waitHolderProperty][what] || (this[waitHolderProperty][what] = new DeferredForWaiters());
            }
         }
         return result;
      },
      /**
       *
       * Ожидать по имени создание дочернего контрола.
       * Метод теряет актуальность, если для родительского контрола произошло событие {@link onReady}.
       *
       * Обязательное условие - вернуть в качестве результата экземпляр класса дочернего контрола.
       * Механизм Deferred построен таким образом, что первый подписант на результат deferred получит ожидаемый дочерний контрол.
       * Второй подписант на этот же deferred получит то, что вернётся из callback первого подписанта.
       * Аналогично третий подписант получит результат второго подписанта, и т.д.
       * @param {String} controlName Имя дочернего контрола.
       * @returns {Core/Deferred} Аргумент callback - экземпляр класса ожидаемого контрола.
       * @example
       * После создания дочернего контрола изменить его активность.
       * <pre>
       *    control.subscribe('onInit', function() {
       *       //ChildName - имя дочернего контрола
       *       this.waitChildControlByName(ChildName).addCallback(function(child) {
       *          child.setEnabled(false);
       *          //выполняем обязательно условие
       *          return child;
       *       });
       *    });
       * </pre>
       * @see waitChildControlById
       * @see hasChildControlByName
       * @see name
       * @see onReady
       */
      waitChildControlByName: function(controlName) {
         return this._waitUtility('Name', controlName);
      },
      /**
       *
       * Ожидать по идентификатору создание дочернего контрола.
       * Метод теряет актуальность, если для родительского контрола произошло событие {@link onReady}.
       *
       * Обязательное условие - вернуть в качестве результата экземпляр класса дочернего контрола.
       * Механизм Deferred построен таким образом, что первый подписант на результат deferred получит ожидаемый дочерний контрол.
       * Второй подписант на этот же deferred получит то, что вернётся из callback первого подписанта.
       * Аналогично третий подписант получит результат второго подписанта, и т.д.
       * @param {String} controlId Идентификатор контейнера контрола.
       * @returns {Core/Deferred} Аргумент callback - экземпляр класса ожидаемого контрола.
       * @example
       * После создания дочернего контрола изменить его активность.
       * <pre>
       *    control.subscribe('onInit', function() {
       *       //ChildId - имя дочернего контрола
       *       this.waitChildControlById(ChildId).addCallback(function(child) {
       *          child.setEnabled(false);
       *          //выполняем обязательно условие
       *          return child;
       *       });
       *    });
       * </pre>
       * @see waitChildControlByName
       * @see getId
       * @see onReady
       * @see hasChildControlByName
       */
      waitChildControlById: function(controlId) {
         return this._waitUtility('Id', controlId);
      },

      _setupChildByAreaEnabled: function(child) {
         var enabled = this._getOption('enabled'),
            prev;

         if (enabled) {
            if (child._prevEnabled !== undefined) {
               prev = child._prevEnabled;
               child._prevEnabled = undefined;
               child.setEnabled(prev);
            }
         } else {
            prev = child._prevEnabled === undefined ? child.isEnabled() : child._prevEnabled;
            child.setEnabled(enabled);
            child._prevEnabled = prev;
         }
      },

      /**
       *
       * Зарегистрировать контрол как дочерний.
       * Метод добавляет контролы в массив дочерних контролов, получить который можно с помощью {@link getChildControls}.
       * @param {Lib/Control/Control} control Контрол, который хотим зарегистрировать как дочерний.
       * @example
       * Если anotherControl не является дочерним, то зарегистрировать его как дочерний.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var array = this.getChildControls();
       *       array.forEach(function(element) {
       *          if (element.getName() != anotherControl.getName()) {
       *             this.registerChildControl(anotherControl);
       *          }
       *       });
       *    });
       * </pre>
       * @see getChildControls
       * @see unregisterChildControl
       */
      registerChildControl: function(control){
         if(control.getParent){
            var oldParent = control.getParent();
            if(oldParent){
               if (oldParent !== this || this._childsMapId[control.getId()]) {
                  Env.IoC.resolve('ILogger').error('AreaAbstract::registerChildControl',
                     rk('Нельзя зарегистрировать этот контрол:') + ' (' + control.getId() + ') ' + rk("в контроле:") + ' ' +
                     this.getId() + ', ' + rk("у него уже есть родитель:") + ' ' + oldParent.getId());
               }
            }
            var cur = this._childControls.length,
               tabindex = control.getTabindex();
            if(tabindex && !this.iWantVDOM){
               var tabindexVal = parseInt(tabindex, 10);

               // Если индекс занят или -1 (авто) назначим последний незанятый
               if(tabindexVal == -1 || this._childsTabindex[tabindexVal] !== undefined){
                  tabindexVal = this._maxTabindex + 1;
                  control.setTabindex(tabindexVal, true);
               }
               if(tabindexVal > 0){
                  this._maxTabindex = Math.max(this._maxTabindex, tabindexVal);
                  if(!this._childsTabindex) {
                     this._childsTabindex = {};
                  }
                  this._childsTabindex[tabindexVal] = cur;
               }
            }
            this._childsMapId[control.getId()] = cur;
            this._childsMapName[control.getName()] = cur;
            this._childControls.push(control);
            if(cInstance.instanceOfModule(control, 'Lib/Control/AreaAbstract/AreaAbstract') || control._template) {
               this._childContainers.push(control);
            }

            control.once('onInit', this._notifyOnChildAdded.bind(this, control));
         }
      },

      /**
       * @param {Lib/Control/Control} child
       * @private
       */
      _notifyOnChildAdded: function(child) {
         var myParent = this.getParent();
         this._checkWaiters(child);
         if ( cInstance.instanceOfModule(myParent, 'Lib/Control/AreaAbstract/AreaAbstract')) {
            myParent._notifyOnChildAdded(child);
         }
      },

      /**
       * <wiTag group="Управление">
       * Изменить {@link tabindex} у переданного контрола.
       * @param {Lib/Control/Control} control Контрол, которому необходимо изменить табиндекс.
       * @param {Number} tabindex Значение табиндекса.
       * @example
       * Изменить табиндекс дочернему контролу Child.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       this.changeControlTabIndex(Child, 1);
       *    });
       * </pre>
       */
      changeControlTabIndex : function(control, tabindex){
         var curTabIndex = control.getTabindex(),
            controlPos =  arrayFindIndex(this._childControls, function (child) {
               return child === control;
            }),
            calcMaxTabIndex = function(){
               if (!this._childsTabindex) {
                  // если _childsTabindex = false, возвращаем сразу 0.
                  // проверка нужна, потому что в IE11 Object.keys(false) падает с ошибкой
                  return 0;
               } else {
                  return Object.keys(this._childsTabindex).reduce(function (memo, key) {
                     return Math.max(memo, key);
                  }, 0);
               }
            }.bind(this),
            enumerateChildByTabIdx = function(func, reverse) {
               var i, child, childId, maxIdx = calcMaxTabIndex();
               function handleTabIdx(i) {
                  if (this._childsTabindex[i] !== undefined) {
                     childId = this._childsTabindex[i];
                     child = this._childControls[childId];
                     if (child) {
                        func.call(this, child, childId);
                     }
                  }
               }
               if (reverse) {
                  for (i = maxIdx; i > 0; i--) {
                     handleTabIdx.call(this, i);
                  }
               } else {
                  for (i = 1; i <= maxIdx; i++) {
                     handleTabIdx.call(this, i);
                  }
               }
            }.bind(this);
         //Если контрол был в обходе
         if (curTabIndex !== 0) {
            delete this._childsTabindex[curTabIndex];
            //Сдвигаем старые индексы
            enumerateChildByTabIdx(function (child, idx) {
               var childTabIndex = child.getTabindex();
               if (childTabIndex > curTabIndex) {
                  delete this._childsTabindex[childTabIndex];
                  this._childsTabindex[childTabIndex - 1] = idx;
                  this._childControls[idx].setTabindex(childTabIndex - 1, true);
               }
            }, false);
         }
         //Если контрол не удаляется вообще из обхода (tabindex !== 0)
         if (tabindex === -1) {
            this._maxTabindex = calcMaxTabIndex() + 1;
            control.setTabindex(this._maxTabindex, true);
            this._childsTabindex[this._maxTabindex] = controlPos;
         } else {
            if (tabindex !== 0) {
               enumerateChildByTabIdx(function (child, idx) {
                  var childTabIndex = child.getTabindex();
                  if (childTabIndex >= tabindex) {
                     delete this._childsTabindex[childTabIndex];
                     this._childsTabindex[childTabIndex + 1] = idx;
                     this._childControls[idx].setTabindex(childTabIndex + 1, true);
                  }
               }, true);
               this._childsTabindex[tabindex] = controlPos;
            }
            control.setTabindex(tabindex, true);
            this._maxTabindex = calcMaxTabIndex();
         }
      },
      /**
       *
       * Присутствует ли дочерний контрол с указанным именем.
       * @param {String} name Имя дочернего контрола.
       * @returns {Boolean} true - да, присутствует.
       * @example
       * Если дочерний контрол присутствует, то изменить его активность.
       * <pre>
       *    control.subscribe('onInit', function() {
       *       //name - имя дочернего контрола
       *       if (this.hasChildControlByName(name)) {
       *          this.waitChildControlByName(name).addCallback(function(child) {
       *             child.setEnabled(false);
       *             return child;
       *          });
       *       }
       *    });
       * </pre>
       * @see waitChildControlByName
       * @see waitChildControlById
       */
      hasChildControlByName: function(name){
         if(this._childsMapName[name] !== undefined){
            return true;
         }
         return !!this._searchChildren('Name', name);
      }
   };
});
