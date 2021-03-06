/**
 * Created with JetBrains PhpStorm.
 * User: tm.baeva
 * Date: 22.04.13
 * Time: 10:29
 * To change this template use File | Settings | File Templates.
 */
define('Lib/Control/Master/Master', [
   "Core/core-instance",
   "Core/Deferred",
   "Core/CommandDispatcher",
   "Lib/Control/CompoundControl/CompoundControl",
   "Lib/Control/TemplatedArea/TemplatedArea"
], function(cInstance, cDeferred, CommandDispatcher, CompoundControl, TemplatedArea) {

   'use strict';
   /**
    * @class Lib/Control/Master/Master
    * @extends Lib/Control/CompoundControl/CompoundControl
    * @author Крайнов Д.О.
    * @control
    * @public
    * @category Navigation
    */
   var Master = CompoundControl.extend(/** @lends Lib/Control/Master/Master.prototype */{
      /**
       * @event onStepReady событие при полной загрузке каждого шага
       * Важно: id может быть не равен идентификатору текущего шага
       * @param {Env/Event:Object} eventObject описание в классе Core/Abstract
       * @param {Number} step номер шага в мастере, нумируются с 1
       * @param {String} id идентификатор шага
       */
      /**
       * @event onComplete событие при успешном завершении работы мастера
       * @param {Env/Event:Object} eventObject описание в классе Core/Abstract
       */
      /**
       * @event onCancel событие при отмене работы мастера
       * @param {Env/Event:Object} eventObject описание в классе Core/Abstract
       */
      /**
       * @event onPrevious событие при переключении на предыдующий шаг.
       * Если вернуть из обработчика другой номер шага, то переключиться на него.
       * @param {Env/Event:Object} eventObject описание в классе Core/Abstract
       * @param {Number} step номер нового шага
       * @param {String} id идентификатор нового шага
       * @return {undefined|Number} номер нового шага
       */
      /**
       * @event onNext событие при переключении на следующий шаг.
       * Если вернуть из обработчика другой номер шага, то переключиться на него.
       * @param {Env/Event:Object} eventObject описание в классе Core/Abstract
       * @param {Number} step номер нового шага
       * @param {String} id идентификатор нового шага
       * @return {undefined|Number} номер нового шага
       */
      $protected: {
         _options: {
            /**
             * @cfg {Object} Массив с шагами
             * @example
             * <pre>
             *    steps: [
             *       {
             *          title: 'Шаг 1',            // заголовок шага
             *          id: 'step1',               // идентификатор для внутреннего использования
             *          template: './step1'        // путь к шаблону шага
             *       },
             *       {
             *          title: 'Шаг 2',
             *          id: 'step2',
             *          template: './step2'
             *       }
             *    ]
             * </pre>
             */
            steps: [],
            /**
             * @cfg {Number|String} Ширина контрола
             * 'auto' - автоматически
             */
            width: 'auto',
            /**
             * @cfg {Number|String} Высота контрола
             */
            height: '120px',
            /**
             * @cfg {String|Boolean} Настройки заголовка шага
             * <pre>
             *    false - не отображать заголовок
             *    true - дописывать в заголовок окна
             *    {String} - писать в поле данных
             * </pre>
             */
            showTitle: true
         },
         _steps : {}, //Листы шагов (jQuery обертки, индекс - id шага)
         _controls : {}, //Контрол Area:TemplatedArea для каждого шага
         _loaded : {}, //Флаг, загружен ли темплейт для указанного шага (индекс -  id шага)
         _currStep : undefined, //Номер текущего шага
         _toStep : {}, //Массив соответствия идентификаторов шага их номерам
         _history: [] //История шагов
      },

      $constructor: function(){
         var self = this;
         this._publish('onPrevious','onNext','onStepReady', 'onComplete', 'onCancel');

         CommandDispatcher.declareCommand(this, 'next', this.next);
         CommandDispatcher.declareCommand(this, 'prev', this.prev);
         CommandDispatcher.declareCommand(this, 'complete', this.complete);
         CommandDispatcher.declareCommand(this, 'cancel', this.cancel);

         this._dReady = new cDeferred();

         this._dReady.addCallback(function(){
            self._notify('onReady');
         });
         // сразу заполним массив _toStep, он нам пронадобится в createSteps
         for(var index in this._options.steps){
            if(this._options.steps.hasOwnProperty(index)) {
               var i = parseInt(index,10);
               this._toStep[this._options.steps[i].id] = i + 1;
            }
         }
      },

      init: function(){
         this._createSteps();
         Master.superclass.init.apply(this, arguments);
      },

      getReadyDeferred: function() {
         return this._dReady;
      },

      /**
       * Получить id по номеру шага
       * @param {Number} step номер шага
       */
      _getId : function(step){
         return this._options.steps[step - 1].id ? this._options.steps[step - 1].id : step;
      },
      /**
       * Загружает шаблон для шага
       * Изменяет свойства:
       * _loaded[step]
       * _controls[step]
       * _currStep
       * @param {Number} step номер шага
       */
      _loadContent : function(step, start){
         return this._runInBatchUpdate('Master._loadContent', function() {
            var
               self = this,
               id = this._getId(step),
               result;

            if(!this._loaded[step]){
               this._loaded[step] = true;
               if(this._options.steps[step - 1].template !== undefined){
                  var readyDeferred = new cDeferred(),
                      instance;
                  instance = new TemplatedArea({// cfg
                     autoHeight: true,
                     autoWidth: true,
                     template : this._options.steps[step - 1].template,
                     element : this._getBlockId(id),
                     parent : this,
                     keepSize: false,
                     tabindex : 1,
                     name : 'mysteparea' + id,
                     context : this.getLinkedContext(),
                     handlers: {
                        'onReady' : function(){
                           self._setUpTitle(step);
                           if (self._steps[self._currStep] && !start) {
                              self._steps[self._currStep].addClass('ws-hidden');
                           }
                           self._currStep = step;
                           if(!self._dReady.isReady())
                              self._dReady.callback();
                           else
                              this.setActive(true);
                           readyDeferred.callback();
                        }
                     }
                  });
                  self._controls[step] = instance;
                  result = readyDeferred;
               }
            // можно несколько раз быстро нажать на шаг,
            // в первый раз this._loaded[step] проставится в true
            // при втором нажатии нужно проверять готов ли котрол
            // который создался при первом клике
            } else if (self._controls[step] && !self._controls[step].isReady()) {
               return self._controls[step].getReadyDeferred();
            } else {
               this._setUpTitle(step);
               this._currStep = step;

               result = new cDeferred();
               result.callback();
            }

            result.addCallback(function(){
               var area = self.getChildArea(step);

               area._notifyOnSizeChanged(area, area);
               area._checkDelayedRecalk();

               self._notify('onStepReady', step, id);
            });

            return result;
         });
      },
      /**
       * Создаёт листы шагов
       * Устанавливает свойства:
       * _steps[]
       * _loaded[]
       * _currStep
       */
      _createSteps : function(){
         if(!this._options.steps){
            return;
         }
         // нужно разрешить события, чтоб получить результат сразу
         this._allowEvents();
         var startStep = this._notify('onNext', 1, this._getId(1));
         startStep = this._parseStepValue(startStep) || 1;
         for(var index in this._options.steps){
            if(!this._options.steps.hasOwnProperty(index))
               continue;
            var
                  i = parseInt(index,10) + 1,
                  step = this._options.steps[i - 1],
                  id = (step.id === undefined || step.id === '') ? i: step.id,
                  hiddenClass = (startStep != i) ? ' ws-hidden' : '';

            this._steps[i] = $('<div class="ws-master-div ws-area-height-100-fix' + hiddenClass +
                               '" HorizontalAlignment="Stretch" VerticalAlignment="Stretch" id="'+this._getBlockId(id)+'"></div>')
                  .appendTo(this._container);

            this._loaded[i] = false;

            if(startStep == i){
               this._currStep = i;
               this._loadContent(i, true);
            }
         }
      },
      /**
       * Устанавливает заголовок, в зависимости от свойства showTitle
       * @param {Number} step номер Шага
       */
      _setUpTitle : function(step){
         var showTitle = this._options.showTitle;
         if(showTitle === true){
            var parent = this.getParent();
            while(parent && !( cInstance.instanceOfModule(parent, 'Lib/Control/Window/Window'))){
               parent = parent.getParent();
            }
            if(cInstance.instanceOfModule(parent, 'Lib/Control/AreaAbstract/AreaAbstract') && !parent.isPage()){
               var windowTitle = parent.getTitle(),
                     currentTitle = this._options.steps[this._currStep - 1].title,
                     newTitle = this._options.steps[step - 1].title,
                     patt = new  RegExp(" "+currentTitle+"$");
               if( patt.test(windowTitle) )
                  parent.setTitle(windowTitle.replace(patt, " " + newTitle));
               else
                  parent.setTitle(windowTitle + " " + newTitle);
            }
         }
         else if(showTitle.length){// {String}
            var controls = this._getControls(step);
            if(controls !== undefined){
               for(var i = 0; i < controls.length; i++){
                  var control = controls[i];
                  if(cInstance.instanceOfModule(control, 'Deprecated/Controls/FieldLabel/FieldLabel')
                     && control.getName() === showTitle)
                     control.setValue(this._options.steps[step - 1].title);
               }
            }
         }
      },
      /**
       * Переход к следующему шагу, если возможно
       * @command
       */
      next : function(){
         var step = 1 + this._currStep;
         if(step > this._options.steps.length)
            return true;
         if(this.validate(this._currStep)){
            var nextStep = this._notify('onNext', step, this._getId(step));
            step = (nextStep === undefined) ? step :nextStep;
            this.setStep(step);
         }
         return true;
      },
      /**
       * Переход к предыдущему по истории шагу, если возможно
       * @command
       */
      prev : function(){
         var step = this._history.pop();
         if(step === undefined)
            return true;
         var nextStep = this._notify('onPrevious', step, this._getId(step));
         step = (nextStep === undefined) ? step :nextStep;
         this.setStep(step);
         // при переходе назад в историю добавляется предыдущий шаг, что недопустимо
         this._history.pop();
         return true;
      },
      /**
       * Команда завершения мастера
       * @command
       */
      complete : function(){
         if(this.validate(this._currStep)){
            this._notify('onComplete', this._currStep, this._getId(this._currStep));
         }
         return true;
      },
      /**
       * Команда отмены мастера
       * @command
       */
      cancel : function(){
         var record = this.getLinkedContext().getRecord();
         if(record)
            record.rollback();
         this._notify('onCancel');
         return true;
      },
      _parseStepValue : function(id){
         if (id !== undefined) {
            if (!isNaN(parseFloat(id)) && isFinite(id)) { // {Number}
               if (id > 0 && id <= this._options.steps.length) // in range?
                  return id;
            } else
            if (id.length) { // {String}
               return this._toStep[id];
            }
         }
         return undefined;
      },
      /**
       * Установить текущий шаг
       * Изменяет свойства:
       * _history[] (добавляет текущий шаг в историю шагов)
       * _steps (css property "display")
       * @param {Number|String} id - если число, то номер шага, иначе - идентификатор шага
       */
      setStep : function(id){
         var step = this._parseStepValue(id);
         if(step === null || this._currStep === undefined || this._currStep === step || this._steps[step] === undefined)
            return;

         this._steps[step].removeClass('ws-hidden');

         if(this._steps[this._currStep])
            this._steps[this._currStep].addClass('ws-hidden')

         this._history.push(this._currStep);

         this._loadContent(step);
      },

      /**
       * Получить идентификатор текущего шага
       * @return {String}
       */
      getStepId : function(){
         return this._options.steps[this._currStep - 1].id;
      },
      /**
       * Получить номер текущего шага
       * @return {Number}
       */
      getStep : function(){
         return this._currStep;
      },
      /**
       * Возвращает полное айди блока по короткому
       * @param {String} id
       * @returns {String}
       */
      _getBlockId : function(id){
         return 'ws-master-' + this.getId() + '-' + id;
      },
      /**
       * Возвращает массив контролов, которые находятся внутри шага с заданным идентификатором
       * @param {Number} step номер шага
       * @return {Array} массив контролов текущего шага.
       * При невозможности получить список контролов возвращает пустой массив
       */
      _getControls : function(step, args){
         var control = this._controls[step];
         return (control && cInstance.instanceOfModule(control, 'Lib/Control/AreaAbstract/AreaAbstract')) ?
               control.getChildControls.apply(control, args) : [];
      },
      /**
       * Получить массив контролов, которые находятся внутри ТЕКУЩЕГО шага
       * @return {Array} массив контролов текущего шага
       */
      getChildControls : function(){
         return this._getControls(this._currStep, arguments);
      },
      /**
       * Валидирует контролы, вложенные в заданный шаг. Возвращает результат валидации
       * @param {Number} step номер шага
       * @return {Boolean}
       */
      validate : function(step){
         var stepGood = step ? step : this._currStep, //если валидация пришла сверху, то провалидируем текущий шаг.
             controls = [this._controls[stepGood]] || [];
         if(controls !== undefined){
            var result = true;
            for(var i = 0; i < controls.length; i++){
               var control = controls[i];
               if(control.validate){// или instanceOf FieldAbstract
                  result = (control.validate() === true) && result;
               }
            }
            return result;
         }
         return true;
      },
      /**
       * Возвращает TemplatedArea - шаблон определённого шага мастера
       * @param {Number} step Номер нужного шага
       * @returns {Lib/Control/TemplatedArea/TemplatedArea}
       */
      getChildArea: function(step){
         return this._controls[step];
      },
      /**
       * Возвращает массив с шагами
       * @return {Object} массив шагов
       */
      getSteps: function(){
         return this._options.steps;
      }
   });

   return Master;

});
