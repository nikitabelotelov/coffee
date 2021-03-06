/**
 * Created by dv.zuev on 17.04.2017.
 */
define('Core/Abstract.compatible', [
   'Env/Event',
   'Core/helpers/Object/find',
   'Env/Env',
   'Core/helpers/Object/isPlainObject'
], function (
   EnvEvent,
   objectFind,
   Env,
   isPlainObject
) {
   'use strict';

   function onceInner(event, handler, control) {
      if (control._getChannel) {
         control._getChannel().once(event, handler, control);
      } else {
         control.once(event, handler, control);
      }
   }
   function subscribeInner(event, handler, control) {
      if (control._getChannel) {
         control._getChannel().subscribe(event, handler, control);
      } else if (control.subscribe) {
         control.subscribe(event, handler, control);
      }
   }
   function unsubscribeInner(event, handler, control) {
      if (control._getChannel) {
         control._getChannel().unsubscribe(event, handler);
      } else if (control.unsubscribe) {
         control.unsubscribe(event, handler);
      }
   }

   function filterSubs(self, control, event, handler, onceWrapper, needUnsub) {
      return self._subscriptions.filter(function(sub) {
         var ok = (control === undefined || control === sub.control) &&
            (event === undefined || event === sub.event) &&
            (handler === undefined || handler === sub.handler) &&
            (onceWrapper === undefined || onceWrapper === sub.onceWrapper);

         return needUnsub ? ok : !ok;
      });
   }

   function filterControlDestroys(self, control, event, handler, onceWrapper, needUnsub) {
      return self._subDestroyControls.filter(function(controlSub) {
         var ok = !objectFind(self._subscriptions, function(sub) {
            return sub.control === controlSub.control;
         });
         return needUnsub ? ok : !ok;
      });
   }

   /**
    * Проверяет, что массив аргументов соответствует виду нового _notify
    */
   function isNewNotifyArgs(args) {
      return args.length <= 3 && // Максимум 3 аргумента:
         typeof args[0] === 'string' && // Первый обязательный аргумент - название события
         (!args[1] || Array.isArray(args[1])) && // Второй необязательный аргумент - массив параметров
         (!args[2] || isPlainObject(args[2])); // Третий необязательный аргумент - опции события (простой объект)
   }

   /**
    * Конвертирует аргументы старого _notify к виду нового _notify
    * Старый notify: _notify(eventName, arg1, arg2, arg3, ...)
    * Новый notify: _notify(eventName, [arg1, arg2, ...], { opt1: v1, ... })
    */
   function convertNotifyArgsIfNeeded(args) {
      if (isNewNotifyArgs(args)) {
         // Если аргументы уже в новом виде, не изменяем их
         return args;
      }

      // Первый аргумент - название события, остальные перемещаем в массив аргументов (опций нет)
      var
         eventName = args[0],
         eventArgs = Array.prototype.slice.call(args, 1);

      return [eventName, eventArgs];
   }

    /**
     * @public
     * @mixin Core/Abstract.compatible
     * @public
     * @author Крайнов Д.О.
     */
   var AbstractObj = /** @lends Core/Abstract.compatible.prototype */ {

      _getOptions: function() {
         return this._options || {};
      },

      _setOptions: function (options, silent) {
         if (options instanceof Object) {
            var names = Object.keys(options),
               i;
            for (i = 0; i < names.length; i++) {
               this._setOption(names[i], options[names[i]], silent);
            }
         }
      },

      /**
       * Получение опции по имени, возвращает значение опции
       * @param name
       * @returns {*}
       * @private
       */
      _getOption: function (name) {
         //для обратной совместимости
         if (this._options && (name in this._options)) {
            return this['_$' + name] = this._options[name];
         }
         if (('_$' + name) in this) {
            return this['_$' + name];
         }
         /*На сборке множество инфо сообщений при обработке WaSaby контролов
         * */
         if (name === 'enabled') {
            return true;
         }
         Env.IoC.resolve('ILogger').info(this._moduleName || 'Abstract', 'Метод _getOption вызвали для несуществующей опции "' + name + '"');
      },

      /**
       * Выставление значения по имени, возвращет this
       * @param name
       * @param value
       * @returns {*}
       * @private
       */
      _setOption: function (name, value, silent) {
         //для обратной совместимости
         var exists = this._options && (name in this._options) || ('_$' + name) in this;

         if (!silent && !exists) {
            Env.IoC.resolve('ILogger').info(this._moduleName || 'Abstract', 'Метод _setOption вызвали для несуществующей опции "' + name + '"');
         }

         if (exists) {
            this['_$' + name] = value;
            if (this._options) {
               this._options[name] = value;
            }
         }
      },

      _hasOption: function (name) {
         //для обратной совместимости
         if (this._options && (name in this._options)) {
            return true;
         }
         return ('_$' + name) in this;
      },


      /**
       * Производит подписку на событие, которое происходит другого контрола или канала событий. Преимущество метода в автоматической отписке от события.
       * @remark
       * Подписка на событие у другого контрола или канала событий. Преимущество в автоматической отписке от события при
       * разрушении собственного экземпляра класса контрола или того контрола, на чье событие подписка.
       * Настоятельно рекомендуется использование именно этого метода, а не {@link subscribe}.
       * @param {Core/Abstract|Lib/Control/Control|Env/Event:Bus} control Объект, на чьё событие происходит подписка.
       * @param {String} event Название события, на которое производим подписку.
       * @param {Function} handler Обработчик, который выполняется в контексте объекта (первый параметр, control).
       * В этом случае this возвратит сам объект.
       * @return {Core/Abstract|Lib/Control/Control|Env/Event:Bus} Возвращает этот же объект.
       */
      subscribeTo: function(control, event, handler) {
         return this._subscribeTo(control, event, handler, false);
      },

      /**
       * Подписка на событие у другого контрола (или канала событий - см. EventBusChannel), с автоматической отпиской
       * после срабатывания события, а также при разрушении объекта, который подписывается, или того, на чьё событие происходит подписка.
       * @param {Core/Abstract|Lib/Control/Control|Env/Event:Bus} control Объект, на чьё событие происходит подписка
       * @param {String} event Событие
       * @param {Function} handler Обработчик
       * @return {Core/Abstract} Возвращает этот же объект.
       */
      subscribeOnceTo: function(control, event, handler) {
         return this._subscribeTo(control, event, handler, true);
      },

      _subscribeTo: function(control, event, handler, once) {
         if (!control.isDestroyed || (!control.isDestroyed() && !this.isDestroyed())) {
            /**
             * Если кто-то хочет подписаться так, то это слой совместимости
             * и если сейчас notify не из слоя совместимости, значит пропатчим его и позовем еще
             * и из слоя совместимости
             */
            makeNotifyCompatible(this);
            makeNotifyCompatible(control);

            if (typeof handler !== 'function') {
               throw new Error(rk('Аргумент handler у метода subscribeTo должен быть функцией'));
            }

            var sub, onceWrapper, contr;
            if (once) {
               onceInner(event, handler, control);
            } else {
               subscribeInner(event, handler, control);
            }

            if (once) {
               onceWrapper = function() {
                  this._unsubscribeFrom(control, event, handler, onceWrapper);
               }.bind(this);

               this._subscriptions.push({
                  handler: handler,
                  control: control,
                  event: event,
                  onceWrapper: onceWrapper
               });

               onceInner(event, onceWrapper, control);
            }
            else {
               sub = objectFind(this._subscriptions, function(sub) {
                  return sub.control === control && sub.handler === handler &&
                     sub.event === event && sub.onceWrapper === undefined;
               });

               if (!sub) {
                  this._subscriptions.push({
                     handler: handler,
                     control: control,
                     event: event
                  });
               }
            }

            /**
             * Если нет события onDestroy значит идет подписка, к какому-то "недокомпоненту"
             * например к модели, модель при разрушении не сигналит об этом. Чаще всего модель даже не разрушается
             * на нее просто пропадаетс ссылка
             */
            if (!control.hasEvent || !control.hasEvent('onDestroy')){
               return;
            }

            contr = objectFind(this._subDestroyControls, function(sub) {
               return sub.control === control;
            });

            if (!contr) {
               var onDestroy = function(event) {
                  //нужно отписываться только на onDestroy своего контрола
                  if (event.getTarget() === control) {
                     if(onceWrapper) {
                        control.unsubscribe(event, onceWrapper);
                     }
                     // отписка от всего
                     this.unsubscribeFrom(control);
                  }
               }.bind(this);
               this._subDestroyControls.push({control: control, handler: onDestroy});

               //тут я ожидаю, что отписка внутри notify('onDestroy') не испортит уже выполняющуюся цепочку onDestroy
               //(см. EventBusChannel.notify) - иначе пользовательские onDestroy, подписанные после служебного onDestroy,
               //не выполнятся, поскольку служебный onDestroy отписывает все мои обработчики всех событий этого контрола.
               subscribeInner('onDestroy', onDestroy, control);
            }
         }

         return this;
      },

      /**
       * Производит отписку от события объекта, на который была произведена подписка методом {@link subscribeTo}.
       * @param {Core/Abstract|Lib/Control/Control|Env/Event:Bus} [control] Объект, от чьего события происходит отписка.
       * Если не указан, то отписка пойдёт по всем подписанным контролам по параметрам event и handler.
       * @param {String} [event] Событие. Если не указано, то будет отписка от всех событий объекта, указанного в параметре control,
       * или всех подписанных объектов (если параметр control не передан)
       * Если при этом указан обработчик - аргумент handler,
       * то отписан от всех подписанных событий будет именно этот обработчик, а остальные, если они есть, останутся.
       * @param {Function} [handler] Обработчик. Если не указан, то будут отписаны все обработчики события,
       * указанного в аргументе event, или вообще все обработчики всех событий, если аргумент event не задан.
       * @return {Core/Abstract|Lib/Control/Control|Env/Event:Bus} Возвращает этот же объект.
       */
      unsubscribeFrom: function(control, event, handler) {
         return this._unsubscribeFrom(control, event, handler);
      },

      _unsubscribeFrom: function(control, event, handler, onceWrapper) {
         var self = this;

         var unsubs = filterSubs(self, control, event, handler, onceWrapper, true);

         this._subscriptions = filterSubs(self, control, event, handler, onceWrapper, false);

         //если _unsubscribeFrom вызывается из onceWrapper (см. subscribeTo+once), то источник - sub.control
         //уже сам отписал обработчики у себя, и приёмнику отписываться не надо (и нельзя, потому что тогда источник отпишет не once-обработчики с таким вот handler)
         if (!onceWrapper) {
            unsubs.forEach(function(sub) {
               if (!sub.control.isDestroyed || !sub.control.isDestroyed()) {
                  unsubscribeInner(sub.event, sub.handler, sub.control);
                  if (sub.onceWrapper) {
                     unsubscribeInner(sub.event, sub.onceWrapper, sub.control);
                  }
               }
            });
         }

         //оставляем те обработчики удаления контрола, для которых есть какие-то подписки на этот контрол
         var unsubControls = filterControlDestroys(self, control, event, handler, onceWrapper, true);
         this._subDestroyControls = filterControlDestroys(self, control, event, handler, onceWrapper, false);

         unsubControls.forEach(function(sub) {
            if (!sub.control.isDestroyed || !sub.control.isDestroyed()) {
               unsubscribeInner('onDestroy', sub.handler, sub.control);
            }
         });

         return this;
      },

      /**
       * Включает отсылку событий.
       * Подробнее см. метод Env/Event:Bus.allowEvents.
       */
      _allowEvents: function() {
         this._getChannel().allowEvents();
      },

      /**
       * Показывает, включена ли отсылка событий.
       * Подробнее см. метод Env/Event:Bus.eventsAllowed.
       * @returns {boolean}
       */
      _eventsAllowed: function() {
         return this._getChannel().eventsAllowed();
      },

      _getChannel: function() {
         if (!this._eventBusChannel) {
            //if (this._options && !this._options.eventBusId)
            //   this._options.eventBusId = "eb_" + this._options.id;

            this._eventBusChannel = EnvEvent.Bus.channel(this._getOption('eventBusId'), {
               waitForPermit: true,
                /*
                 * для поддержки работоспособности Deprecated/Record(Set)
                 * они для заполнения используют события и оставлять их без них на СП нельзя
                 * получение параемтра через this._options. т.к. _getOption упадёт что не нашёл эту опцию практически на всех компонентах
                 */
               subscribeOnPS: this._options && this._options.subscribeOnPS
            });
         }
         return this._eventBusChannel;
      },
      /**
       *
       * Возвращает признак того, удалён объект или нет (отработала ли функция destroy).
       * @returns {Boolean} true - объект удалён, false - объект не удалён, функция {@link destroy} не отработала.
       * @remark
       * Функция полезна в обработчиках асинхронных вызовов, обращающихся к объектам, которые могли быть удалены за время
       * асинхронного вызова.
       * @example
       * <pre>
       *     var FloatArea = testFloatArea,
       *        bl = testBLogic;
       *     bl.addCallback(function() {
       *         if(!FloatArea.isDestroyed()) {
       *         //Если юзер не закрыл окошко, то грузим новый шаблон
       *            bodyArea.setTemplate('загрузили шаблон Б');
       *        }
       *     });
       * </pre>
       * @see destroy
       */
      isDestroyed: function() {
         return this._isDestroyed;
      },

      /**
       * Декларирует наличие у объекта событий
       * События могут быть переданы в виде строки, в виде массива строк.
       */
      _publish: function(/*$event*/) {
         for (var i = 0, li = arguments.length; i < li; i++) {
            var event = arguments[i], handlers = this._handlers[event], j, lh;
            if (handlers) {
               if (typeof handlers === 'function') {
                  this.subscribe(event, handlers);
                  this._handlers[event] = null;
               }
               else {
                  lh = handlers.length;
                  if (lh) {
                     for (j = 0; j < lh; j++) {
                        this.subscribe(event, handlers[j]);
                     }
                     this._handlers[event] = null;
                  }
               }
            }
         }
      },
      /**
       * Извещает всех подписантов события
       * Все аргументы после имени события будут переданы подписантам.
       * @param {string} event Имя события.
       * @param [arg1, [...]] Параметры, получаемые подписантами.
       */
      _notify: function(event/*, payload*/) {
         var
            channel = this._getChannel(),
            args = Array.prototype.slice.call(arguments, 1),
            result = channel._notifyWithTarget(event, this, args),
            globalChannel = EnvEvent.Bus.globalChannel();

         globalChannel._notifyWithTarget(event, this, args);

         return result;
      },

      /**
       *
       * Выполнить обработчик события единожды.
       * @param {String} event Имя события, при котором следует выполнить обработчик.
       * @param {Function} handler Обработчик события.
       * @example
       * Отправить подписчикам первый DOM-элемент, над которым откроется Инфобокс.
       * <pre>
       *     Infobox.once('onShow', function() {
       *        this._notify('onFirstShow', this.getCurrentTarget());
       *     });
       * </pre>
       * @see unsubscribe
       * @see unbind
       * @see getEvents
       * @see hasEvent
       * @see getEventHandlers
       * @see hasEventHandlers
       */
      once: function(event, handler) {
         this.subscribeOnceTo(this, event, handler);
      },
      /**
       * Добавить обработчик на событие контрола.
       *
       * @param {String} event Имя события.
       * @param {Function} $handler Обработчик события.
       * @throws {Error} Выкидывает исключение при отсутствии события и передаче делегата не функции.
       * @return {Core/Abstract} Экземпляр класса.
       * @example
       * При клике на кнопку (btn) восстановить начальное состояние группы флагов (groupCheckbox).
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       var record = groupCheckbox.getDefaultValue();
       *       groupCheckbox.setValue(record);
       *    });
       * </pre>
       * @see once
       * @see unsubscribe
       * @see unbind
       * @see getEvents
       * @see hasEvent
       * @see getEventHandlers
       * @see hasEventHandlers
       */
      subscribe: function(event, $handler) {
         this.subscribeTo(this, event, $handler);
         return this;
      },
      /**
       *
       * Снять обработчик с указанного события.
       * @param {String} event Имя события.
       * @param {Function} handler Обработчик события.
       * @return {Core/Abstract} Экземпляр класса.
       * @example
       * Задать/снять обработчик клика по кнопке (btn) в зависимости от значения флага (fieldCheckbox).
       * <pre>
       *    var handler = function() {
       *       //некая функция
       *    };
       *    fieldCheckbox.subscribe('onChange', function(eventObject, value) {
       *       if (value) {
       *          btn.subscribe('onClick', handler);
       *       } else {
       *          btn.unsubscribe('onClick', handler);
       *       }
       *    });
       * </pre>
       * @see once
       * @see subscribe
       * @see unbind
       * @see getEvents
       * @see hasEvent
       * @see getEventHandlers
       * @see hasEventHandlers
       */
      unsubscribe: function(event, handler) {
         this._getChannel().unsubscribe(event, handler);
         this.unsubscribeFrom(this, event, handler);
         return this;
      },
      /**
       *
       * Снять все обработчики с указанного события.
       * @param {String} event Имя события.
       * @return {Core/Abstract} Экземпляр класса.
       * @example
       * При клике на кнопку (btn) снять все обработчики c события onSome.
       * <pre>
       *    btn.subscribe('onClick', function() {
       *       this.getParent().unbind('onSome');
       *    });
       * </pre>
       * @see once
       * @see subscribe
       * @see unsubscribe
       * @see getEvents
       * @see hasEvent
       * @see getEventHandlers
       * @see hasEventHandlers
       */
      unbind: function(event) {
         this._getChannel().unbind(event);
         return this;
      },
      /**
       * Разрушает экземпляр класса компонента.
       * @remark
       * Разрушение означает удаление контейнера визуального отображения (DOM-элемента) из разметки веб-страницы, а также отписку других компонентов, которые подписаны на разрушаемый экземпляр класса.
       * При этом сам экземпляр класса не производит отписку от событий <a href="/docs/js/Core/Context/">контекста</a> или <a href="/docs/js/Core/EventBus/">шины событий</a>.
       * Последнее можно реализовать, переопределив метод destroy.
       * <br/>
       * При вызове метода происходит событие {@link onDestroy}.
       * @example
       * При клике на кнопку (btn) уничтожить один из контролов.
       * <pre>
       *    btn.subscribe('onClick', function()
       *       control.destroy();
       *    }):
       * </pre>
       * @see init
       * @see describe
       * @see isDestroyed
       */
      destroy: function() {
         if (this._eventBusChannel) {
            //onDestroy нужно вызывать на контроле, чтобы в объекте события был target (контрол, у которого onDestroy вызывается)
            this._notify('onDestroy');

            //отписываю канал от всех событий, чтобы он повторно не кинул onDestroy при вызове destroy()
            this._eventBusChannel.unsubscribeAll();
            this._eventBusChannel.destroy();
         }

         this.unsubscribeFrom();//Отписываемся ото всего у всех, на кого подписались

         this._handlers = {};
         this._isDestroyed = true;
      },

      /**
       *
       * Проверить наличие указанного события у контрола.
       * @param {String} name Имя события.
       * @return {Boolean} Признак: событие присутствует (true) или нет (false).
       * @example
       * Снять обработчики с события, если оно определено для контрола.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (this.hasEvent('onSome')) {
       *          this.unbind('onSome');
       *       }
       *    });
       * </pre>
       * @see once
       * @see subscribe
       * @see unsubscribe
       * @see unbind
       * @see getEvents
       * @see getEventHandlers
       * @see hasEventHandlers
       */
      hasEvent: function(name) {
         return this._getChannel().hasEvent(name);
      },
      /**
       *
       * Проверить наличие обработчиков на указанное событие у контрола.
       * @param {String} name Имя события.
       * @return {Boolean} Признак: обработчики присутствуют (true) или нет (false).
       * @example
       * Если для контрола определены обработчики на указанное событие, снять их.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       if (this.hasEventHandlers('onSome')) {
       *          this.unbind('onSome');
       *       }
       *    });
       * </pre>
       * @see once
       * @see subscribe
       * @see unsubscribe
       * @see unbind
       * @see hasEvent
       * @see getEvents
       * @see getEventHandlers
       */
      hasEventHandlers: function(name) {
         return this._getChannel().hasEventHandlers(name);
      },

      /**
       * Метод показывает, сконструирован ли объект полностью (завершены конструкторы всех классов, методы init, и initComplete).
       * События откладываются до окончания конструирования объекта.
       * После окончания конструирования, когда isInitialized начнёт выдавать true, отложенные события запускаются в порядке поступления.
       * Это нужно для того, чтобы обработчики событий срабатывали только на полностью доконструированном контроле,
       * а не в каком-то промежуточном состоянии.
       * @return {boolean}
       */
      isInitialized: function() {
         return this._isInitialized;
      },

      /**
       *
       * Получить список событий контрола.
       * @return {Array} Массив, в котором каждый элемент - это имя события.
       * @example
       * Передать подписчикам список событий контрола.
       * <pre>
       *    control.subscribe('onReady', function() {
       *       var events = this.getEvents(),
       *           flag,
       *           eventName;
       *       events.forEach(function(element, index, array) {
       *          flag = element == eventName ? true : false;
       *       });
       *       if (!flag) {
       *          this.subscribe(eventName, function() {
       *             //какой-то функционал
       *          });
       *       }
       *    });
       * </pre>
       * @see once
       * @see subscribe
       * @see unsubscribe
       * @see unbind
       * @see hasEvent
       * @see getEventHandlers
       * @see hasEventHandlers
       */
      getEvents: function() {
         return this._getChannel().getEvents();
      },

      /**
       *
       * Получить обработчики указанного события у контрола.
       * @param {String} name Имя события.
       * @returns {Array} Массив, в котором каждый элемент - это обработчик указанного события.
       * @example
       * Передать подписчикам контрола обработчики события onSome.
       * @example
       * <pre>
       *    var handlers = object.getEventHandlers('onSomeEvent'),
       *        handler = function() {
       *           //do something
       *        };
       *    //проверим подписаны ли мы уже на это событие.
       *    //если нет, то подписываемся.
       *    if (handlers.indexOf(handler) === -1) {
       *       object.subscribe('onSomeEvent', handler);
       *    }
       * </pre>
       * @see once
       * @see subscribe
       * @see unsubscribe
       * @see unbind
       * @see hasEvent
       * @see getEvents
       * @see hasEventHandlers
       */
      getEventHandlers: function(name) {
         return this._getChannel().getEventHandlers(name);
      }

   };

   /**
    * Проверяет, является метод _notify компонента вдомным, и если является,
    * заменяет его на специальную версию _notify, которая пробрасывает события
    * и по старому, и по новому
    */
   function makeNotifyCompatible(control) {
      if (control && !control._notifyOriginCompat && control._notify && control._notify._isVdomNotify) {
         control._notifyOriginCompat = control._notify;
         control._notify = function() {
            var res;
            if (control._mounted || !control._destroyed) {
               // Вызвать событие по новому можно только в случае, если
               // компонент смонтирован в DOM, либо если его там нет, но
               // при этом он не задестроен (например <invisible-node/>
               // не монтируются)
               res = control._notifyOriginCompat.apply(control, convertNotifyArgsIfNeeded(arguments));
            }
            res = AbstractObj._notify.apply(control, arguments) || res;
            return res;
         };
      }
   }

   return AbstractObj;
});
