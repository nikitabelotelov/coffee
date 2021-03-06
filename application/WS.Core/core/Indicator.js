define('Core/Indicator', ['Core/helpers/isNewEnvironment', 'require'], function(isNewEnvironment, require) {
   /**
    * @class Core/Indicator
    * @public
    * @author Бегунов А.В.
    * @singleton
    */
   var Indicator = /** @lends Core/Indicator.prototype */{
      _container: undefined,
      _ready: false,
      _delay: 2000,
      _loading: false,

      _init: function(cfg, callback) {
         if (this._isNewEnvironment()) {
            requirejs(['Controls/Popup/Manager/ManagerController'], function(ManagerController) {
               if (callback) {
                  callback(ManagerController.getIndicator());
               }
            });
            return;
         }

         var self = this;

         var loadIndic = function() {
            require(['Lib/Control/LoadingIndicator/LoadingIndicator'], function(LoadingIndicator) {
               self._container = new LoadingIndicator(cfg);

               if (self.callback) {
                  for (var i = 0; i < self.callback.length; i++) {
                     self.callback[i](self._container);
                     if (self._container.isDestroyed()) {
                        // Если LoadingIndicator был уничтожен в коллбэке, значит нужно прервать их применение.
                        // Оставшиеся коллбэки (если они есть) будут применены к новому LoadingIndicator'у, который
                        // уже создается. Если этого не сделать, индикатор может "зависнуть" на экране. Пример:
                        // Indicator.show().progressBar(true).progressBar(false).hide()
                        break;
                     }
                  }

                  // Удаляем из self.callback все вызванные callback'и
                  self.callback = self.callback.slice(i + 1);
               }
            });
         };

         this.callback = this.callback || [];
         if (callback) {
            this.callback.push(callback);
         }
         if (!cfg) {
            cfg = {};
         }
         cfg.handlers = {
            'onReady': function() {
               self._ready = true;
            }
         };
         if (!this._loading) {
            this._loading = true;
            require(['optional!Controls/Popup/Compatible/Layer'], function(Layer) {
               if (Layer){
                  Layer.load().addCallback(function(){
                     loadIndic();
                  });
               } else {
                  loadIndic();
               }
            });
         }
      },
      /**
       * Показывает индикатор
       * @param {Boolean} delay - отображать с задержкой.
       * @returns {Object} возвращает самого себя.
       */
      show: function(delay) {
         if (!this._ready) {
            var self = this;
            this._init({delay: delay}, function(inst) {
               if (self._isNewEnvironment()) {
                  if (delay) {
                     delay = self._delay;
                  }
                  inst.show({delay: delay});
               } else {
                  inst.show();
               }
               return inst;
            });
         }
         else {
            this._container.setDelay(delay);
            this._container.show();
         }
         return this;
      },
      /**
       * Устанавливает сообщение и показывает индикатор, если он скрыт
       * @param {String} message - сообщение.
       * @param {Boolean} delay - показать с задержкой.
       * @returns {Object} возвращает самого себя.
       */
      setMessage: function(message, delay) {
         var self = this;
         
         if (!this._ready) {
            this._init({delay: delay}, function(inst) {
               if (self._isNewEnvironment()) {
                  if (delay) {
                     delay = self._delay;
                  }
                  inst.show({message: message, delay: delay});
               } else {
                  inst.setMessage(message);
                  inst.subscribe('onReady', function() {
                     this.setMessage(message);
                  });
               }
               return inst;
            });
         }
         else {
            this._container.setDelay(delay);
            
            // Если индикатор уже отображается, то просто меняем сообщение после задержки
            if (this._container.isVisible() && delay) {
               this._container.show();
               this._container._getDelay().addCallback(function(res) {
                  self._container.setMessage(message);
                  return res;
               });
            } else {
               self._container.setMessage(message);
               this._container.show();
            }
         }
         return this;
      },
      /**
       * Скрывет индикатор
       * @returns {Object} возвращает самого себя.
       */
      hide: function() {
         if (this._ready)
            this._container.hide();
         else {
            this._init({}, function(inst) {
               inst.hide();
               return inst;
            });
         }
         return this;
      },
      /**
       * Переключает вид индикатора: true - индикатор с прогрессбаром, false - без него
       * @param {Boolean} state.
       * @returns {Object} возвращает самого себя.
       */
      progressBar: function(state) {
         var self = this;
         if (!this._ready) {
            this.destroy();
            this._init({progressBar: state});
         }
         else {
            if (!(this._container._myProgressBar && state)) {
               this.destroy();
               this._init({progressBar: state});
            }
         }
         return self;
      },
      /**
       * Устанавливает прогресс идкатора в режиме прогрессбара
       * Предварительно нужно переключить вид индикатора Indicatior.progressBar(true).
       * @param {Number} progress - количество процентов.
       * @returns {Object} возвращает самого себя.
       */
      setProgress: function(progress) {
         if (!this._ready)
            this._init({}, function(inst) {
               inst.setProgress(progress);
               inst.subscribe('onReady', function() {
                  this.setProgress(progress);
               });
               return inst;
            });
         else
            this._container.setProgress(progress);
         return this;
      },
      /**
       * Уничтожает индикатор
       * @returns {Object} возвращает самого себя.
       */
      destroy: function() {
         var self = this;
   
         if (this._ready) {
            self._ready = false;
            this._container.destroy();
         }
         else {
            this._init({}, function(inst) {
               self._ready = false;
               if (self._isNewEnvironment()) {
                  inst.hide();
               } else {
                  inst.destroy();
               }
               return inst;
            });
         }
         this._container = undefined;
         this._loading = false;
         return this;
      },
      _isNewEnvironment: function() {
         // Отключил показ вдомных индикаторов, открываемых через старые контролы.
         // Сейчас получается разница в логике, новые индикаторы показываются всегда выше всех
         // Старые показываются выше окон, открытых на текущий момент
         // В старых шаблонах пользователи написали код с расчетом на такое поведение, что их окно может открыться поверх индикатора.
         return false;
      }
   };

   return Indicator;

});
