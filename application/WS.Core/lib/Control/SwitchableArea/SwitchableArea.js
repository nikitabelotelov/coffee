define('Lib/Control/SwitchableArea/SwitchableArea',
   [
   "Core/core-merge",
   "Core/helpers/Hcontrol/replaceContainer",
   'Core/helpers/collection',
   "Core/Deferred",
   'Core/moduleStubs',
   "Lib/Control/CompoundControl/CompoundControl",
   "Lib/Control/SwitchableArea/SwitchableAreaItem",
   "tmpl!Lib/Control/SwitchableArea/SwitchableArea",
   "tmpl!Lib/Control/SwitchableArea/SwitchableArea_area",
   'Core/helpers/Number/randomId',
   'Env/Env',
   "Core/Sanitize"
], function (
   cMerge,
   replaceContainer,
   collection,
   cDeferred,
   ModuleStubs,
   CompoundControl,
   SwitchableAreaItem,
   mainTplFn,
   areaTplFn,
   randomId,
   Env,
   Sanitize
) {
      'use strict';

      /**
       * Класс контрола "Переключаемая область", который предназначен для отображения области с контентом.
       * Для контрола может быть установлено несколько областей с контеном (см. {@link items}).
       * В каждый момент времени контрол может отображать только одну область с контентом.
       * @class Lib/Control/SwitchableArea/SwitchableArea
       * @extends Lib/Control/CompoundControl/CompoundControl
       * @author Крайнов Д.О.
       * @control
       * @public
       * @category Containers
       * @initial
       * <component data-component='Lib/Control/SwitchableArea/SwitchableArea' config='{"items":[{}]}'></component>
       *
       * @designTime actions /design/design
       * @designTime plugin /design/DesignPlugin
       */
      var SwitchableArea = CompoundControl.extend(/** @lends Lib/Control/SwitchableArea/SwitchableArea.prototype */{
          /**
           * @event onBeforeChangeActiveArea Происходит перед установкой новой отображаемой области в контроле.
           * @param {Env/Event:Object} eventObject Дескриптор события.
           * @param {Lib/Control/SwitchableArea/SwitchableAreaItem} currentArea Экземпляр класса переключаемой области, которая отображается в контроле. Если область не установлена, возвращается null.
           * @param {Lib/Control/SwitchableArea/SwitchableAreaItem} newArea Экземпляр класса области, которая будет установлена в контроле.
           * @see setActiveArea
           */
          /**
           * @event onAfterChangeActiveArea Происходит после установки новой отображаемой области в контроле.
           * @param {Env/Event:Object} eventObject Дескриптор события.
           * @param {Lib/Control/SwitchableArea/SwitchableAreaItem} currentArea Экземпляр класса области, которая установлена в контроле.
           * @see setActiveArea
           */
         _dotTplFn: mainTplFn,
         $protected: {
            // HashMap вида id: SwitchableAreaItem
            _areaHashMap: {},
            _bindedHandlers: undefined,
            // Id текущей видимой области
            _currentAreaId: null,
            _currentAreaWaitDeferred: undefined, //deferred загрузки дочерних контролов активной области
            _items: [],
            // Разрешаем оживлять только те дочерние компоненты, которые не находятся внутри item'ов (если
            // такие есть), так как они будут оживлены при их создании в _createSwitchableAreaItem.
            // Селектор _createChildOnInitSelector обрабатывается в конструкторе CompoundControl'a
            _createChildOnInitSelector: '> :not(.ws-SwitchableArea__item) [data-component]',
            _options: {
               areaTemplate: areaTplFn,
               /**
                * @cfg {SwitchableAreaItem[]} Устанавливает массив с областями.
                * @example
                * <pre>
                *     <options name="items" type="array">
                *        <options>
                *           <option name="content">Вёрстка одной области</option>
                *           <option name="id">1</option>
                *        </options>
                *        <options>
                *           <option name="content">Вёрстка другой области</option>
                *           <option name="id">2</option>
                *           <option name="visible">true</option>
                *        </options>
                *     </options>
                * </pre>
                */
               items: [],
                /**
                 * @cfg {String} Устанавливает идентификатор области по умолчанию.
                 * @example
                 * <pre>
                 *     <option name="defaultArea">1</option>
                 * </pre>
                 * @see items
                 * @editor ArrayItemSelector
                 * @editorConfig arrayOptionName items
                 * @editorConfig keyFieldName id
                 * @editorConfig displayFieldName name
                 */
               defaultArea: '',
               /**
                * @cfg {String} Устанавливает режим загрузки дочерних контролов.
                * @example
                * <pre>
                *     <option name="loadType">all</option>
                * </pre>
                * @variant all инстанцировать все области сразу;
                * @variant cached инстанцировать только 1 область, при смене предыдущую не уничтожать (кэширование областей).
                */
               loadType : 'cached',
               //Нужно ли динамически подгружать зависимости, прописанные в свойстве итема content в xhtml верстке
               //Genie перевели на имена компонентов без префикса js!. Мы у себя не можем различать, где в зависимости нужно ставить префикс, а где нет
               loadDependencies: true,
               activateArea: true
            }
         },
         $constructor: function () {
            this._publish('onBeforeChangeActiveArea', 'onAfterChangeActiveArea');
            var self = this;
            this._bindedHandlers = {
               handleItemIdChanged: this._handleItemIdChanged.bind(this),
               handleItemContentChanged: this._handleItemContentChanged.bind(this)
            };
            // конвертируем элементы массива items в коллекцию SwitchableAreaItem-ов
            for (var i = 0, l = this._options.items.length; i < l; i++){
               var
                  areaItem = this._createSwitchableAreaItem(this._options.items[i]),
                  areaId = areaItem.getId(),
                  isVisible = this._options.defaultArea === areaId,
                  def;
               this._items[i] = areaItem;
               // заполняем _areaHashMap
               this._areaHashMap[areaId] = areaItem;

               // делаем видимой только дефолтную область
               if (isVisible) {
                  this.setActiveArea(areaId);
               }
               else if (this._options.loadType === 'all') {
                  def = areaItem.loadChildControls();
                  def.addCallback(function() {
                     self.sendCommand('loadChildControls', self.getName(), areaId);
                  });
               }
               areaItem.setVisible(isVisible);
               if (isVisible && !this._currentAreaId){
                  this._currentAreaId = areaId;
               }
            }
            this._items = collection(this._items);
         },

         _modifyOptions: function(options) {
            SwitchableArea.superclass._modifyOptions.call(this, options);

            options.items = options.items.map(function(item, index) {
               item.id = item.id || randomId('ws-area-' + index + '-');
               return item;
            });

            return options;
         },

         // Подмена метода из CompoundControl. Не инстанцируем детей, дети инстанцируются внутри SwitchableAreaItem
         _loadControls: function(pdResult){
            return pdResult.done([]);
         },

         /**
          * Создаёт из объекта, описывающего SwitchableAreaItem, экземпляр SwitchableAreaItem, подписывается на его события
          * @param {Object} itemObj - объект, описывающий SwitchableAreaItem
          * @returns {SwitchableAreaItem} - экземпляр SwitchableAreaItem
          * @private
          */
         _createSwitchableAreaItem: function(itemObj){
            var defaultObj = this._options.defaultArea === itemObj.id;
            var areaItem = new SwitchableAreaItem(
               cMerge(
                  {
                     visible: defaultObj,
                     autoHeight: this._options.autoHeight,
                     parent: this,
                     element: this.getContainer().children('.ws-SwitchableArea__item[data-for="' + itemObj.id + '"]'),
                     contentExistence: this._options.loadType !== "cached" || defaultObj
                  },
                  itemObj));
            areaItem.subscribe('onIdChanged', this._bindedHandlers.handleItemIdChanged);
            areaItem.subscribe('onContentChanged', this._bindedHandlers.handleItemContentChanged);
            areaItem.getContext().setPrevious(this.getContext());
            return areaItem;
         },

         /**
          * Обработчик, подписанный на изменение Id элемента областей, изменяет Id в HashMap и в вёрстке
          * @param {Event} e - событие
          * @param {String} oldId - старый Id области
          * @param {String} newId - новый Id области
          * @private
          */
         _handleItemIdChanged: function(e, oldId, newId){
            if (this._areaHashMap[newId]){
               // если область с таким Id уже есть, то силой меняем обратно (если менять через сеттер, то событие зациклится)
               this._areaHashMap[oldId]._options.id = oldId;
            }
            else if (oldId && this._areaHashMap[oldId]) {
               this._areaHashMap[newId] = this._areaHashMap[oldId];
               delete this._areaHashMap[oldId];

               if (this._currentAreaId === oldId){
                  this._currentAreaId = newId;
               }
               this._areaHashMap[newId].getContainer().attr('data-for', newId);
            }
         },

         _getAreaMarkupContext: function(areaItem) {
            var buildMarkupWithContext = this._options.buildMarkupWithContext || areaItem._options.buildMarkupWithContext;
            return buildMarkupWithContext ? areaItem.getLinkedContext() : undefined;
         },

         /**
          * Обработчик, подписанный на изменение контента элемента областей, переинстанцирует область
          * @param {Event} e - событие
          * @param {String} areaId - Id области
          * @private
          */
         _handleItemContentChanged: function(e, areaId){
            if (this._areaHashMap[areaId]){
               var
                  areaItem = this._areaHashMap[areaId],
                  itemObj = {
                     id: areaItem.getId(),
                     content: areaItem.getContent(),
                     template: areaItem.getTemplate(),
                     componentOptions: areaItem.getComponentOptions() || {}
                  };
               replaceContainer(areaItem.getContainer(), this._buildMarkup(this._options.areaTemplate, {
                  enabled: areaItem._options.enabled,
                  visible: areaItem._options.visible,
                  outer: this._options,
                  item: itemObj,
                  index: this._getItemIndexById(areaId),
                  contentExistence: true
               }, undefined, undefined, this._getAreaMarkupContext(areaItem)));
               if (this._options.loadType === 'all' || areaId === this._currentAreaId){
                  areaItem.loadChildControls();
               }
            }
         },
         /**
          * Возвращает коллекцию областей
          * @return {addHelpersMin.collection} коллекция элементов SwitchableAreaItem, содержащих информацию о вкладке
          */
         getItems: function() {
            return this._items;
         },
         /**
          * Возвращает объект области по Id
          * @param {String} id - Id области
          * @return {SwitchableAreaItem} элемент SwitchableAreaItem
          */
         getItemById: function(id){
            return this._areaHashMap[id] || null;
         },
         /**
          * Возвращает индекс области в коллекции по её Id
          * @param {String} id - Id области
          * @return {Number} индекс области
          * @private
          */
         _getItemIndexById: function(id){
            var areaItem = this.getItemById(id);
            return areaItem ? this.getItems().indexOf(areaItem) : -1;
         },
         /**
          * Устанавливает новый контент для области
          * @param {String} areaId - Id области
          * @param {String} newContent - новый контент
          */
         setAreaContent: function(areaId, newContent){
            this.getItems()[this._getItemIndexById(areaId)].setContent(newContent);
         },

         /**
          * Возвращает Id текущей видимой области
          * @return {String} Id текущей видимой области
          */
         getCurrentAreaId: function(){
            return this._currentAreaId;
         },
         /**
          * Возвращает Id текущей видимой области
          * Алиас к методу {@link getCurrentAreaId} для работы через ContextBinder в паре с методом {@link setActiveArea}.
          * @return {String} Id текущей видимой области
          */
         getActiveArea: function() {
            return this.getCurrentAreaId();
         },
         /**
          * Устанавливает текущую область по Id. В зависимости от режима работы компонента делает следующее:
          * Режим all    - Прячет предыдущую область и показывает область с переданным Id
          * Режим cached - Прячет предыдущую область. Если новая область уже была инстанцирована, то показывает её. Иначе инстанцирует
          * @param {String} id - Id области, которую делаем видимой
          * @returns {Core/Deferred} - Deferred готовности
          */
         setActiveArea: function(id) {
            var
               currentArea = this._areaHashMap[this._currentAreaId],
               newArea = this._areaHashMap[id],
               self = this,
               dependencies = [],
               config,
               def = new cDeferred();
            // запоминаем кнопку по умолчанию в switchableAreaItem,
            // чтобы потом при переключении на эту вкладку кнопку по умолчанию можно было восстановить
            if (currentArea) {
               currentArea._areaDefaultButton = currentArea._defaultButton || currentArea._shouldRegisterButton;
            }
            if (id && this._currentAreaId !== id && newArea){
               this._notify('onBeforeChangeActiveArea', currentArea || null, newArea);
               if (this._currentAreaId && currentArea){
                  /**
                   * Разрегистрация defaultButton здесь - ошибка, при смене любой вкладки -
                   * происходит разрегистрация кнопки на панели выше уровнем
                   */
                  currentArea.hide();
               }
               // если режим с кешированием и область ещё не инстанцирована, то инстанцируем её
               if (!newArea.isLoaded()) {
                  //Ищем в контенте SwitchableAreaItem'a компоненты, которые там используются,
                  //чтобы перед построением шаблона загрузить их
                  if (this._options.loadDependencies) {
                     dependencies = self._getDependencies(newArea.getContent());
                  }

                  if (newArea.getTemplate()) {
                     if (!newArea._loadingTemplate) {
                        newArea._loadingTemplate = true;
                        ModuleStubs.require([newArea.getTemplate(), 'tmpl!Lib/Control/SwitchableArea/SwitchableArea_area_template']).addCallbacks(function(result) {
                           newArea._loadingTemplate = false;
                           config = cMerge(newArea.getComponentOptions(), {
                              element: document.createElement("div"),
                              parent: newArea
                           });

                           var root = newArea._container[0];
                           //По опции добавляем скролл в айтем swArea
                           if (newArea._options.withScroll) {
                              var itemObj = {
                                 id: newArea.getId(),
                                 index: self._getItemIndexById(id),
                                 template: result[0],
                                 componentOptions: newArea.getComponentOptions() || {}
                              };
                              replaceContainer(newArea.getContainer(), result[1](itemObj));
                              root = $('.ws-SwitchableArea__item__root_container', newArea.getContainer())[0];
                              newArea.reviveComponents();
                              config.parent = newArea.getChildControlByName('switchScroll');
                           }

                           root.appendChild(config.element);
                           var childComponent = new result[0](config);
                           newArea.setLoaded(true);
                           newArea.setContentExistence(true);

                           //Ждем отрисовки и нотифаим для скроллКонтейнера об изменении размеров
                           setTimeout(function() {
                              childComponent._notifyOnSizeChanged();
                           }, 10);
                           def.callback();
                        }, function(err) {
                           Env.IoC.resolve('ILogger').error('SwitchableArea::setActiveArea()', err);
                        });
                     }
                  }
                  else if (dependencies.length) {
                     ModuleStubs.require(dependencies).addCallbacks(function() {
                        newArea.loadChildControls().addCallback(function (result) {
                           def.callback();
                           return result;
                        });
                     }, function(err) {
                        Env.IoC.resolve('ILogger').error('SwitchableArea::setActiveArea()', err);
                     });
                  }
                  else {
                     def = newArea.loadChildControls();
                  }
                  def.addCallback(function() {
                     self.sendCommand('loadChildControls', self.getName(), id);
                  });
               }
               else {
                  //Интересный баг, возникает в safari на mac. Даже если нативными методами скрыть область, и нотифицировать
                  //об этом событием onAfterChangeActiveArea, то в итоге в обработчике события, область будет ещё не скрыта.
                  //Видимо связано с оптимизацией перерисовки DOM. Чтобы такого не было, стрельнем событием асинхронно.
                  if (Env.constants.browser.isMacOSDesktop && Env.constants.browser.safari)  {
                     setTimeout(function() {
                        def.callback();
                     }, 1);
                  } else {
                     def.callback();
                  }
               }
               newArea.show();

               this._currentAreaId = id;
               this._currentAreaWaitDeferred = def;
               def.addCallback(function() {
                  // регистрируем кнопку по умолчанию после переключения области в SwitchableArea
                  newArea._areaDefaultButton = newArea._areaDefaultButton || newArea._shouldRegisterButton;
                  newArea._areaDefaultButton && newArea._areaDefaultButton.setDefaultButton(true);
                  self._notify('onAfterChangeActiveArea', newArea);

                  if (self._options.activateArea) {
                     //После того, как итем готов - вызываем фокусировку
                     if (!self.getTopParent() || self.getTopParent().isVisible()) {
                        //передаем фокус первому контролу
                        newArea.activateFirstControl();
                     }
                  }
               });
            }
            else if (this._currentAreaWaitDeferred && !this._currentAreaWaitDeferred.isReady()) { //Если запросили активную area, которая еще грузится, дожидаемся этой загруки
               def = this._currentAreaWaitDeferred;
            }
            else {
               def = (new cDeferred()).callback();
            }

            return def;
         },
         /**
          * Возвращает имена модулей, которые используются в переданной верстке
          */
         _getDependencies: function(content) {
            var dependencies = [];
            if (typeof content === 'string') {
               $('<div>' + Sanitize(content) + '</div>').find('[data-component]').each(function(index, elem) {
                  var component = elem.getAttribute('data-component');
                  dependencies.push(component);
               });
            }
            return dependencies;
         },
         /**
          * Скрывает все области
          */
         hideAll: function(){
            for (var i = 0, l = this.getItems().length; i < l; i++) {
               this.getItems()[i].hide();
            }
            this._currentAreaId = null;
         },
         /**
          * Добавляет новую область
          * @param {String} id - Id новой области
          * @param {String} content - вёрстка контента новой области
          * @returns {Core/Deferred} - Deferred готовности
          */
         addArea: function(id, content, template, componentOptions, item){
            item = item || {};
            var newIndex = this.getItems().length,
               newItemObj = {
                  id: id,
                  content: content || '',
                  template: template,
                  withScroll: item.withScroll,
                  componentOptions: componentOptions || {}
               };
            this.getItems().push(newItemObj);
            return this._initAddedArea(newIndex);
         },
         /**
          * Инициализирует новую область
          * в режиме "инстанцирование всех областей сразу" инстанцирует новую область
          * @param {Number} newIndex - индекс области
          * @returns {Core/Deferred} - Deferred готовности
          * @private
          */
         _initAddedArea: function(newIndex){
            var areaCollection = this.getItems(),
               itemObj = areaCollection[newIndex];
            if (!(itemObj instanceof SwitchableAreaItem)){
               var newItem = this._createSwitchableAreaItem(itemObj);
               newItem.setVisible(false);
               replaceContainer(newItem.getContainer(),
                  this._buildMarkup(this._options.areaTemplate, {
                     outer: this._options,
                     enabled: newItem._options.enabled,
                     visible: newItem._options.visible,
                     item: itemObj,
                     index: newIndex,
                     contentExistence: this._options.loadType !== "cached" || this._options.defaultArea === itemObj.id
                  }, undefined, undefined, this._getAreaMarkupContext(newItem)));
               // если у области не было Id, то он сгенерировался внутри шаблона doT-ом и надо его передать в newItem
               if (newItem.getId() !== itemObj.id){
                  newItem.setId(itemObj.id);
               }
               if (newIndex < areaCollection.length - 1){
                  var nextItem = areaCollection[newIndex + 1];
                  $(newItem.getContainer()).insertBefore(nextItem.getContainer());
               }
               else {
                  this.getContainer().append(newItem.getContainer());
               }

               this.getItems()[newIndex] = newItem;
               this._areaHashMap[newItem.getId()] = newItem;

               if (this._options.loadType === 'all'){
                  return newItem.loadChildControls();
               }
            }
            if (!this._currentAreaId){
               this.setActiveArea(areaCollection[newIndex].getId());
            }

            return (new cDeferred()).callback();
         },
         /**
          * Удаляет область с указанным id
          * Если эта область была активна, то активизирует первую область в списке областей
          * @param {String} id - Id удаляемой области
          */
         removeArea: function(id){
            if (this._areaHashMap[id]){
               // если удаляем активную область - показываем другую
               if (this._currentAreaId === id){
                  // удаляем последнюю область
                  if (Object.keys(this._areaHashMap).length === 1){
                     this._areaHashMap[this._currentAreaId].hide();
                     this._currentAreaId = null;
                  }
                  else {
                     var newAreaIndex = this.getItems()[0].getId() !== id ? 0 : 1;
                     this.setActiveArea(this.getItems()[newAreaIndex].getId());
                  }
               }
               this._areaHashMap[id].unsubscribe('onIdChanged', this._bindedHandlers.handleItemIdChanged);
               this._areaHashMap[id].unsubscribe('onContentChanged', this._bindedHandlers.handleItemContentChanged);
               var areaIndex = this._getItemIndexById(id);
               if (areaIndex >= 0){
                  this.getItems().splice(areaIndex, 1);
               }

               // уничтожаем инстансы дочерних компонент области
               this._areaHashMap[id].destroy();

               delete this._areaHashMap[id];
            }
         },
         /**
          * Очищает кэш инстанцированных областей
          * Уничтожает все инстанцированные компоненты в областях и инстанцирует заново
          */
         clearAreaCache: function(){
            var areaCollection = this.getItems(),
               itemsLen = areaCollection.length,
               i;

            for (i = 0; i < itemsLen; i++){
               var areaItem = areaCollection[i];
               areaItem.destroyChildControls();
               areaItem.setLoaded(false);
               areaItem.setContentExistence(false);
               areaItem._clearContainer();
               var itemObj = {
                  id: areaItem.getId(),
                  content: areaItem.getContent()
               };
               replaceContainer(areaItem.getContainer(),
                  this._buildMarkup(this._options.areaTemplate, {
                     outer: this._options,
                     enabled: areaItem._options.enabled,
                     visible: areaItem._options.visible,
                     item: itemObj,
                     index: i,
                     contentExistence: this._options.loadType !== "cached" || this._options.defaultArea === itemObj.id
                  }, undefined, undefined, this._getAreaMarkupContext(areaItem)));
            }
            if (this._options.loadType === 'all'){
               for (i = 0; i < itemsLen; i++){
                  areaCollection[i].loadChildControls();
               }
            }
            else if(this._currentAreaId) {
               this.getItemById(this._currentAreaId).loadChildControls();
            }
            if (this._currentAreaId){
               this.getItemById(this._currentAreaId).getContainer().removeClass('ws-hidden');
            }
         },

         /**
          * Валидирует дочерние контролы области
          * Возвращает Id невалидной области, либо undefined
          * @returns {Number|undefined} номер невалидной области, либо undefined
          */
         validateAreas: function(){
            var areaCollection = this.getItems(),
               invalidAreaId;
            for (var i = 0, l = areaCollection.length; i < l; i++){
               if (!areaCollection[i].validate(false, true)) {
                  invalidAreaId = (invalidAreaId !== undefined) ? invalidAreaId : areaCollection[i].getId();
               }
            }
            return invalidAreaId;
         },
         _destroyAreas: function() {
            var
               items = this.getItems(),
               itemsLen = items.length,
               areaItem;
            for (var i = 0; i < itemsLen; i++){
               areaItem = items[i];
               areaItem.unsubscribe('onIdChanged', this._bindedHandlers.handleItemIdChanged);
               areaItem.unsubscribe('onContentChanged', this._bindedHandlers.handleItemContentChanged);
               areaItem.destroyChildControls();
               areaItem.setLoaded(false);
               areaItem._clearContainer();
               areaItem.destroy();
            }
         },
         destroy: function() {
            this._destroyAreas();
            SwitchableArea.superclass.destroy.apply(this, arguments);
         }
      });

      return SwitchableArea;
   }
);
