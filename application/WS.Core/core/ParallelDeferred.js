define('Core/ParallelDeferred', [
   'Core/core-extend', 'Core/Deferred'
], function(coreExtend, Deferred) {
   var ParallelDeferred;
   /**
    * Класс для работы нескольких Deferred (процессов, работающих параллельно). Условием успеха является успешное завершение всех экземпляров.
    *
    * Алгоритм работы:
    * <ul>
    *    <li>Создать экземпляр ParallelDeferred. При необходимости передать в конструктор массив операций, окончания которых будет ожидать этот экземпляр.
    *    Каждая операция - это Deferred ("энергичная" операция) или функция, возвращающая Deferred ("ленивая" операция).
    *    Объект ParallelDeferred одновременно выполняет не больше "ленивых" операций, чем установлено в опции {@link maxRunningCount}.
    *    Если в {@link push} их передано больше, чем ограничено опцией maxRunningCount, то часть операций выполняется, а часть ждёт в очереди.
    *    Это позволяет запускать выполнение множества ajax-запросов фиксированными "пачками", не перегружая ими веб-браузер.
    *    Если установлена опция {@link stopOnFirstError}, то после первой же ошибки в любой из переданных операций, ни одна "ленивая" операция, переданная в push, или ожидающая в очереди, запущена не будет.</li>
    *    <li>Добавить в набор другие операции с помощью метода {@link push}.</li>
    *    <li>Получить результирующий Deferred с помощью метода {@link getResult}, подписаться на его события.</li>
    *    <li>Завершить создание набора операции с помощью метода {@link done}.</li>
    * </ul>
    *
    * <b>Пример 1.</b> Выполнение "энергичных" операций.
    * <pre>
    * define('SBIS3.MyArea.MyComponent',
    *    [
    *       ... ,
    *       'Core/ParallelDeferred'
    *    ],
    *    function(... , ParallelDeferred) {
    *       ...
    *
    *       // Создаём экземпляр класса и добавляем массив операций
    *       var parallelDeferred = new ParallelDeferred({
    *           steps: [deferred0, deferred1]
    *       });
    *       ...
    *
    *       // Добавляем в набор новые операции
    *       parallelDeferred.push(deferred2);
    *       ...
    *
    *       // Все deferred'ы (от deferred0 до deferredN) будут выполняться параллельно
    *       parallelDeferred.push(deferredN);
    *       ...
    *
    *       // Завершили создание набора операций, получаем результат и подписываемся на успешное выполнение
    *       parallelDeferred.done().getResult().addCallback(function() {
    *
    *           // Все deferred'ы выполнены
    *           alert('All done!');
    *       });
    *       ...
    *    }
    * );
    * </pre>
    * <b>Пример 2.</b> Выполнение "ленивых" операций.
    * <pre>
    * define('SBIS3.MyArea.MyComponent',
    *    [
    *       ... ,
    *       'Core/ParallelDeferred',
    *       'Deprecated/BLObject'
    *    ],
    *    function(... , ParallelDeferred, ClientBLObject) {
    *       ...
    *
    *       // Создаём экземпляр класса
    *       var parallelDeferred = new ParallelDeferred();
    *       ...
    *
    *       // Создаём функцию № 1, возвращающую deferred
    *       var lazy1 = function() {
    *           return new ClientBLObject({...}).call();
    *       };
    *
    *       // Добавляем новую операцию в набор
    *       parallelDeferred.push(lazy1);
    *       ...
    *
    *       // Создаём другую функцию № N, так же возвращающую deferred
    *       var lazyN = function() {
    *           return new ClientBLObject({...}).call();
    *       };
    *
    *       // Функция lazyN будет выполняться тогда, когда число запущенных запросов к бизнес-логике не будет превышать значения из опции maxRunningCount.
    *       // Если для функции нет места, то она будет ожидать в очереди окончания какой-либо операции из "пачки".
    *       parallelDeferred.push(lazyN);
    *       ...
    *       parallelDeferred.done().getResult().addCallback(function() {
    *
    *          // Все deferred'ы выполнены
    *          alert('All done!');
    *       });
    *       ...
    *    }
    * );
    * </pre>
    * <b>Внимание</b>: Использование класса Core/BLObject признано устаревшим, используйте класс {@link Types/source}
    * @class Core/ParallelDeferred
    * @public
    * @author Бегунов А.В.
    */
   ParallelDeferred = coreExtend({}, /** @lends Core/ParallelDeferred.prototype */{
      /**
       * @cfg {Core/Deferred[]} Устанавливает порядковые индексы шагов.
       * @name Core/ParallelDeferred#steps
       * @see done
       * @see push
       * @see getStepsDone
       * @see getStepsSuccess
       * @see getStepsCount
       */
      $protected: {
         _successResult: undefined,
         _ready: false,
         _locked: false,
         _stepsCount: 0,
         _stepsFinish: 0,
         _stepsSuccess: 0,
         _dResult: null,
         _errors: [],
         _results: {},
         _lazyQueue: [],  // очередь на выполнение функций, возвращающих deferred
         _options: {
            /**
             * @cfg {Boolean} Устанавливает признак, по которому готовность экземпляра класса ParallelDeferred наступит при первой ошибке в любой операции.
             * @remark
             * Операции, на результат работы которых производится проверка, добавляют к экземпляру класса ParallelDeferred с помощью метода {@link push}.
             * Если при установленной опции в очереди существуют "ленивые" операции, то ни одна из них запущена не будет.
             * Подробнее о типах операций и возникновении очереди вы можете прочитать в описании к классу {@link Core/ParallelDeferred}.
             * @see push
             */
            stopOnFirstError: true,
            /**
             * @cfg {Number} Устанавливает максимальное количество одновременно выполняющихся "ленивых" операций, переданных методом {@link push}.
             * Подробнее о типах операций и возникновении очереди вы можете прочитать в описании к классу {@link Core/ParallelDeferred}.
             * @see push
             */
            maxRunningCount: 10
         }
      },
      /**
       * @param {Object} cfg
       * @param {Core/Deferred[]} cfg.steps
       */
      $constructor: function(cfg) {
         this._dResult = new Deferred({silent: true});

         if (cfg && cfg.steps) {

            for (var stepId in cfg.steps) {
               if (cfg.steps.hasOwnProperty(stepId)) {
                  this.push(cfg.steps[stepId], stepId);
               }
            }

         }
      },

      _successHandler: function(stepId, res) {
         this._stepsFinish++;
         this._stepsSuccess++;

         this._results[stepId] = res;
         this._check();

         return res;
      },

      _errorHandler: function(stepId, res) {
         this._stepsFinish++;

         this._errors.push(res);
         // Оставим старое поведение, и добавим новое
         // Если у нас стоит флаг "не останавливаться при ошибке",
         // то надо получить все результаты, включая ошибки
         if (!this._options.stopOnFirstError) {
            this._results[stepId] = res;
         }
         this._check();

         return res;
      },

      _isFinishedByError: function() {
         return this._options.stopOnFirstError && this._errors.length > 0;
      },

      _runDfr: function(lazyDfr, isLazy, stepId) {
         var dfr;
         if (isLazy) {
            try {
               dfr = lazyDfr();
            } catch (e) {
               dfr = new Deferred({silent: true});
               dfr.errback(e);
            }
         } else {
            dfr = lazyDfr;
         }
         dfr.addCallbacks(this._successHandler.bind(this, stepId), this._errorHandler.bind(this, stepId));
      },

      /**
       * Добавляет Deferred в набор.
       * @param {Core/Deferred|Function} dOperation Асинхронная операция для добавления в набор.
       * Эта операция может быть экземпляром класса {@link Core/Deferred} или функцией, возвращающей объект такого класса.
       * В первом случае метод получает уже выполняющуюся операцию, во втором получает "ленивый" экземпляр операции - функцию,
       * которая может её запустить и отдать в виде экземпляра класса Core/Deferred.
       * @param {String|Number} [stepId]  Идентификатор шага (операции). Результат шага (операции) с заданным идентификатором будет
       * помещен в результат ParallelDeferred.
       * @returns {Core/ParallelDeferred}
       * @see steps
       * @see maxRunningCount
       * @see stopOnFirstError
       */
      push: function(dOperation, stepId) {
         if (this._locked) {
            return this;
         }

         var self = this,
            isEager = dOperation instanceof Deferred || dOperation instanceof Promise,
            isLazy = typeof dOperation == 'function';

         function checkStepId() {
            if (stepId === undefined) {
               stepId = self._stepsCount;
            }

            self._stepsCount++;

            if (self._results.hasOwnProperty(stepId)) {
               throw new Error(rk('Действие с') + ' id="' + stepId + '" ' + rk('уже есть в этом объекте ParallelDeferred'));
            }

            self._results[stepId] = undefined;
         }

         if (isEager || isLazy) {
            if (this._locked) {
               throw new Error(rk('Нельзя вызывать push после done'));
            }
            else if (!this._isFinishedByError()) { //после остановки по ошибке новые операции игнорируем
               if (isEager) {
                  checkStepId();
                  this._runDfr(dOperation, false, stepId);
               }
               else if (isLazy) {
                  checkStepId();

                  // Если количество выполняющихся процессов меньше максимального, то запускаем новую операцию, иначе добавляем в очередь
                  if (this._stepsCount - this._stepsFinish - this._lazyQueue.length <= this._options.maxRunningCount) {
                     this._runDfr(dOperation, true, stepId);
                  } else {
                     this._lazyQueue.push([dOperation, stepId]);
                  }
               }
            }
         } else {
            throw new Error(rk('Неверный параметр dOperation: требуется Deferred или функция, возвращающая его'));
         }

         return this;
      },
      /**
       * Обозначает окончание добавления всех Deferred в набор.
       * @remark
       * При инициализации набора через конструктор метод done самостоятельно вызван не будет.
       * @param {Object} [successResult] Результат, который будет возвращен в случае успеха в общий callback.
       * @returns {Core/ParallelDeferred}
       * @see steps
       * @see getStepsDone
       */
      done: function(successResult) {
         this._locked = true;
         this._successResult = successResult;
         this._check();
         return this;
      },
      /**
       * Функция, выполняющая проверку, выполнен ли набор, и выполнен ли он успешно
       */
      _check: function() {
         function checkQueue() {
            var op, queueLn = this._lazyQueue.length,
               runningCnt = this._stepsCount - this._stepsFinish - queueLn,
               needUnqueue = queueLn > 0 && runningCnt < this._options.maxRunningCount;

            if (needUnqueue) {
               op = this._lazyQueue.shift();
               this._runDfr(op[0], true, op[1]);
            }

            return needUnqueue;
         }

         if (!this._ready) {
            this._ready = this._locked &&
                          (this._stepsFinish === this._stepsCount || this._isFinishedByError());

            if (this._ready) {
               this._lazyQueue = [];
               if (this._isFinishedByError()) {
                  this._dResult.errback(this._errors[0]);
               } else {
                  this._dResult.callback(this._successResult !== undefined ? this._successResult : this._results);
               }
            } else {
               var ok = checkQueue.call(this);
               while (ok) {
                  ok = checkQueue.call(this);
               }
            }
         }
      },
      /**
       * Возвращает результирующий Deferred, который будет служить индикатором всего набора.
       * @remark
       * Deferred, в случае успеха, в качестве результата вернет successResult, если он был задан в методе {@link done}, или объект с результатами Deferred, составляющих параллельное событие.
       * В объекте в качестве идентификаторов результатов событий будут использоваться stepId, переданные при соответствующих вызовах метода {@link push}, либо порядковые индексы шагов из опции steps.
       * @returns {Core/Deferred}
       * @see done
       * @see push
       */
      getResult: function() {
         return this._dResult;
      },

      /**
       * Возвращает общее число операций, добавленных в набор при конфигурации или методом {@link push}.
       * @returns {Number} Число операций в наборе.
       * @see steps
       * @see push
       * @see getStepsDone
       * @see getStepsSuccess
       */
      getStepsCount: function() {
         return this._stepsCount;
      },

      /**
       * Возвращает общее число оконченных (успешно или нет) операций, добавленных в набор при конфигурации или методом {@link push}.
       * @remark
       * Число успешно оконченных операций можно получить с помощью метода {@link getStepsSuccess}, а число операций в наборе - с помощью метода {@link getStepsCount}.
       * @returns {Number} Число операций, оконченных успешно и безуспешно.
       * @see steps
       * @see push
       * @see getStepsSuccess
       * @see getStepsCount
       */
      getStepsDone: function() {
         return this._stepsFinish;
      },

      /**
       * Возвращает общее число успешно оконченных операций, добавленных в набор при конфигурации или методом {@link push}.
       * @remark
       * Общее число оконченных операций можно получить с помощью метода {@link getStepsDone}, а число операций в наборе - с помощью метода {@link getStepsCount}.
       * @returns {Number} Число успешно оконченных операций.
       * @see push
       * @see steps
       * @see getStepsCount
       * @see getStepsDone
       */
      getStepsSuccess: function() {
         return this._stepsSuccess;
      }
   });

   return ParallelDeferred;
});