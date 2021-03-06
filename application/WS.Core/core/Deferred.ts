/// <amd-module name="Core/Deferred" />

/**
 * Реализация класса Deferred <br />
 * Абстрактное асинхронное событие, может либо произойти, может сгенерировать ошибку.
 * Подробное описание находится {@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/architecture/deferred/ здесь}.
 * Частично приведено ниже:<br />
 * Deferred - объект, используемый для работы с асинхронными отложенными вычислениями.<br />
 * Ближайшим стандартным аналогом является {@link https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Promise Promise}.
 * К сожалению Deferred в WS не полностью соответствует стандартизованному Promise.
 * Имеются важные фундаментальные отличия.<br />
 * Любой Deferred может иметь три состояния:
 * <ol>
 *    <li>Не определено (в этом состоянии создается изначально любой Deferred).</li>
 *    <li>Завершён успешно.</li>
 *    <li>Завершён ошибкой.</li>
 * </ol>
 * Для перевода Deferred в одно из состояний используются методы:
 * <ul>
 *    <li>.callback(res) - для перевода в состояние "Завершён успешно";</li>
 *    <li>.errback(err) - для перевода в состояние "Завершён с ошибкой";</li>
 * </ul>
 * <b>ВАЖНО!</b> Если при вызове .callback() передать в качестве аргумента объект Error, то это будет равносильно вызову
 * .errback() с тем же аргументом.
 * <b>ВАЖНО!</b> Нельзя использовать методы .callback() и .errback() несколько раз на одном и том же Deferred.
 * При попытке вызвать данные методы повторно будет выброшено исключение. Как правило, повторный вызов свидетельствует
 * об ошибке в коде приложения.<br />
 * Для получения результата используются методы:
 * <ul>
 *    <li>.addCallback(f) - для получения успешного результата;</li>
 *    <li>.addErrback(f) - для получения ошибочного результата;</li>
 *    <li>.addCallbacks(f1, f2) - для получения в первую функцию успешного результата, а во вторую - ошибки;</li>
 *    <li>.addBoth(f) - для подписки на любой результат одной функицией.</li>
 * </ul>
 * Вызов .addBoth(f) эквивалентен .addCallbacks(f, f).
 * Вызов .addCallback(f) эквивалентен .addCallbacks(f, null).
 * Вызов .addErrback(f) эквивалентен .addCallbacks(null, f).<br />
 * Все вышеописанные методы возвращают тот же Deferred, на котором они были вызваны.<br />
 * Deferred позволяет "мутировать" результат в функциях-обработчиках. То, что вернёт функция обработчик, будет передано
 * на вход следующему подписчику.
 * <br />
 * Пример первый:
 * <pre>
 *    var def = new Deferred();
 *    def.callback(10);
 *    def.addCallback(function(res) {
 *       console.log(res);  // 10
 *       return 20;
 *    });
 *    def.addCallback(function(res) {
 *       console.log(res); // 20
 *    });
 * </pre>
 * Обратие внимание: несмотря на то, что обработчики добавлены после перевода Deferred в состояние "Завершён успешно",
 * они все равно выполняются. Deferred сохраняет свой последний результат и передаёт его всем вновь добавленным
 * подписчикам.<br />
 * <b>ВАЖНО!</b>
 * Обратите внимание на последний добавленный колбэк в примере выше. В нём нет return. Что равнозначно return undefined.
 * Это приводит к следующему побочному эффекту:
 * <br />
 * <pre>
 *     // продолжение первого примера...
 *     def.addCallback(function(res) {
 *        console.log(res); // undefined
 *     });
 * </pre>
 * Мутация значения возможна также в том случае, если обработчик выбросит исключение.
 * <br />
 * Пример второй:
 * <pre>
 *    var def = new Deferred();
 *    def.addCallback(function(res) {
 *       throw new Error(123);
 *    });
 *    def.addCallback(function(res) {
 *    // никогда не выполнится
 *    });
 *    def.addErrback(function(err) {
 *       console.log(err); // Error 123
 *    });
 *    def.callback();
 * </pre>
 * Deferred был переведён в состояние "Успешное завершение", но первая функция-обработчик сгенерировала исключение
 * (конечно же оно могло быть сгенерировано не только конструкцией new Error, но и любой некорректной JS-операцией) и
 * Deferred переключился в состояние "Ошибка". По этой причине следующий добавленный обработчик на успешное завершение
 * выполнен не был, а вот обработчик на ошибку уже выполнился и отобразил в консоли текст ошибки.<br />
 * Для переключения Deferred в состояние "ошибка" не обязательно "выбрасывать" исключение. Достаточно просто вернуть из
 * обработчика объект Error. Разница лишь в том, что "выброшенное" исключение будет залогировано в консоли,
 * а возвращенный объект - нет.<br />
 * Верно и обратное. Если в функции-обработчике ошибки вернуть не ошибочное значение, Deferred изменит свое состояние в
 * "завершён успешно". Данный паттерн удобно использовать, например, в следующем случае. Пусть нам надо вызвать метод
 * бизнес-логики и вернуть результат. Но в случае ошибки не нужно пробрасывать её дальше, нужно заменить ошибку
 * некоторым объектом-заглушкой.
 * <br />
 * Пример третий:
 * <pre>
 *     function fetchData(args) {
 *        var stub = {
 *           some: 'stub',
 *           data: true
 *        };
 *        return loadDataSomehow(args).addErrback(function(err) {
 *           return stub;
 *        });
 *     }
 * </pre>
 * Данный пример демонстрирует ещё один правильный паттерн использования Deferred. Если у вас есть некая функция,
 * которая возвращает асинхронный результат в виде Deferred, и вам нужно его как-то модифицировать - не надо создавать
 * новый Deferred и проводить операции с ним, нужно мутировать результат, возвращаемый исходной асинхронной функцией.
 * <br />
 * Пример четвёртый:
 * <pre>
 *    function fetchData(args) {
 *       var stub = {
 *          some: 'stub',
 *          data: true
 *       };
 *       return loadDataSomehow(args).addCallback(function(res) {
 *          return processData(res);
 *       });
 *    }
 * </pre>
 * При данном способе реализации исходная ошибка будет передана далее вызывающей стороне.
 * <br />
 * Одной важной возможностью Deferred является создание цепочек. Например, ваша функция должна вызвать два метода БЛ
 * один за другим. Причём для вызова второго требуется результат первого. Это очень легко сделать.
 * <br />
 * Пример пятый:
 * <pre>
 *    function fetchData(args) {
 *       return doFirstCall(args).addCallback(function(firstResponse) {
 *          return doSecondCall(firstResponse);
 *       });
 *    }
 * </pre>
 * Если из функции обработчика (любого, не важно успеха или ошибки) вернуть Deferred, то следующий обработчик:
 * <ul>
 *   <li>будет ждать результата асинхронной операции, которую "описывает" возвращенный Deferred;</li>
 *   <li>получит состояние, которое вернёт возвращенный Deferred;</li>
 * </ul>
 * <b>ВАЖНО!</b> Deferred, который вернули из обработчика (т.е. который стал частью цепочки) нельзя более
 * использовать для добавления обработчиков. Попытка добавить обработчик как на успешное завершение, так и
 * на ошибку приведёт к выбросу исключения. Проверить заблокировано ли добавление обработчиков можно с
 * помощью метода .isCallbacksLocked(). Если всё же требуется подписаться на результат Deferred, отдаваемый
 * в цепочку, воспользуйтесь следующим паттерном.
 * <br />
 * Пример шестой:
 * <pre>
 *    someDef.addCallback(function(res) {
 *       var def2 = getDeferredSomehow();
 *       var dependent = def2.createDependent();
 *       dependent.addCallback(someHandler);
 *       return def2;
 *    });
 * </pre>
 * Функция .createDependent() позволяет создать новый Deferred, результат которого будет зависеть от данного.<br />
 * Есть и "обратная" функция. def.dependOn(someDef) - позволяет сделать уже существующий Deferred зависимым от данного.
 * @class Core/_Entity/Deferred
 * @public
 * @author Бегунов А.В.
 */
//@ts-ignore
import { constants, IoC, coreDebug as cDebug } from 'Env/Env';

function DeferredCanceledError(message) {
   this.message = message;
   this.canceled = true;
}
DeferredCanceledError.prototype = Object.create(Error.prototype);
const global = function () {
   return this || (0, eval)('this');
}();
global.DeferredCanceledError = DeferredCanceledError;

const WAITING = -1,
   SUCCESS = 0,
   FAILED = 1,
   CANCELED = 2,
   CHAIN_INDEXES = [0, 1, 1],
   STATE_NAMES = {};

STATE_NAMES[WAITING] = 'waiting';
STATE_NAMES[SUCCESS] = 'success';
STATE_NAMES[FAILED] = 'failed';
STATE_NAMES[CANCELED] = 'canceled';

class Deferred {
   protected _chained: boolean;
   protected _chain: Array<Array<Function>>;
   protected _fired: number;
   protected _paused: number;
   protected _results: any[];
   protected _running: boolean;
   protected __parentPromise: any;
   protected _cancelCallback: any;
   protected _hasErrback: boolean;
   protected _logger: any;
   protected _loggerAwait: Function;
   protected _logCallbackExecutionTime: boolean;

   protected get logger() {
      return this._logger || IoC.resolve('ILogger');
   }

   /**
    * @param {Object} [cfg] Конфигурация. Содержит опцию: cancelCallback - функция,
    * реализующая отмену на уровне кода, управляющего этим Deferred-ом.
    * @example
    * <pre>
    *    var dfr;
    *    var timeoutId = setTimeout(function() {
    *      console.log('TIMEOUT'); doSomething(); dfr.callback();
    *    }, 1000);
    *    var dfr = new Deferred({
    *      cancelCallback: function() {
    *         clearTimeout(timeoutId);
    *      }
    *    });
    *    dfr.cancel();//таймаут timeoutId отменится, его обработчик не выполнится (console.log, doSomething, и т.п.)
    * </pre>
    */
   constructor(cfg?) {
      if (cfg) {
         if (cfg.cancelCallback) {
            //@ts-ignore;
            this._cancelCallback = cfg.cancelCallback;
         }

         this._logCallbackExecutionTime = !!cfg.logCallbackExecutionTime;
      }
      this._chained = false;
      this._chain = [];
      this._fired = WAITING;
      this._paused = 0;
      this._results = [null, null];
      this._running = false;
      this._hasErrback = false;
      this._logger = cfg && cfg.logger;
      this._loggerAwait = cfg && cfg.loggerAwait || setTimeout;
   }

   /**
    * установить флаг логгирования данного deferred в сервисе пердставления
    * @param value значение флага
    */
   logCallbackExecutionTime(value) {
      this._logCallbackExecutionTime = !!value;
   }

   /**
    * Отменяет Deferred. Отмена работает только тогда, когда он находится в состоянии ожидания (когда на нём ещё не были
    * вызваны методы callback/errback/cancel), иначе метод cancel не делает ничего.
    * Если в конструкторе в опции cancelCallback ему была передана функция отмены, то при первом вызове метода cancel
    * она вызовется (только если Deferred ещё не сработал и не отменён).
    * @returns {Core/Deferred}
    */
   cancel() {
      if (this._fired === WAITING) {
         // Состояние CANCELED нужно выставить в самом начале, чтобы вызов методов callback/errback,
         // возможный из cancelCallback, срабатывал бы вхолостую, и не мешал бы выполняться обработчикам, вызванным из
         // _fire отмены
         this._fired = CANCELED;
         this._results[CHAIN_INDEXES[this._fired]] = new DeferredCanceledError(
            'Cancel'
         );
         /** Если Deferred получен от Promise, вызываем abort у Promise;
          *  https://online.sbis.ru/opendoc.html?guid=b7d3305f-6805-46e8-8502-8e9ed46639bf
          */
         if (this.__parentPromise && this.__parentPromise.abort) {
            this.__parentPromise.abort()
         }

         if (this._cancelCallback) {
            const cbk = this._cancelCallback;
            this._cancelCallback = null;
            try {
               cbk();
            } catch (err) {
               this.logger.error(
                  'Deferred',
                  `Cancel function throwing an error: ${err.message}`,
                  err
               );
            }
         }

         this._fire();
      }
      return this;
   }

   /**
    * Запускает на выполнение цепочку коллбэков.
    * Метод должен вызываться только на несработавшем или отменённом объекте, иначе он выдаст ошибку.
    * На отменённом объекте (после вызова метода cancel) callback/errback можно вызывать сколько угодно -
    * ошибки не будет, метод отработает вхолостую.
    * @param [res] результат асинхронной операции, передаваемой в коллбэк.
    * @returns {Core/Deferred}
    */
   callback(res?) {
      if (!isCanceled(this)) {
         this._resback(this._check(res));
      }
      return this;
   }

   /**
    * Запуск цепочки обработки err-бэков.
    * Метод должен вызываться только на несработавшем или отменённом объекте, иначе он выдаст ошибку.
    * На отменённом объекте (после вызова метода cancel) callback/errback можно вызывать сколько угодно -
    * ошибки не будет, метод отработает вхолостую.
    * @param [res] результат асинхронной операции.
    * @returns {Core/Deferred}
    */
   errback(res) {
      if (!isCanceled(this)) {
         this._resback(this._check(res, true));
      }
      return this;
   }

   _resback(res) {
      // после вызова callback/errback/cancel отмена работает вхолостую, поэтому функция отмены (cancelCallback) после
      // _resback точно не понадобится, и её можно обнулить, чтобы GC её мог собрать пораньше
      this._cancelCallback = null;

      this._fired = resultToFired(res);
      this._results[CHAIN_INDEXES[this._fired]] = res;

      this._fire();
   }

   _check(res, isError?) {
      let result = res;
      if (this._fired !== WAITING) {
         throw new Error(
            `Deferred is already fired with state "${STATE_NAMES[this._fired]}"`
         );
      }

      if (isDeferredLikeValue(result)) {
         throw new Error(
            'DeferredLike instances can only be chained if they are the result of a callback'
         );
      }

      if (isError) {
         if (!isErrorValue(result)) {
            result = new Error(result);

            // Исправляем поведение IE8.
            // Error(1) == { number: 1 }, Error("1") == { number: 1 }, Error("x1") == { message: "x1" }
            // Если после создания ошибки в ней есть поле number, содержащее число, а в message - пусто,
            // скастуем к строке и запишем в message
            if (result.number !== undefined && !Number.isNaN(result.number) && !result.message) {
               result.message = `${result.number}`;
            }
         }

         if (!constants.isBrowserPlatform) {
            //Save call stack use Error instance
            const rejectionError = new Error(`"${result.message}"`);
            const rejectionAwait = this._loggerAwait;
            //Just wait for the next event loop because error handler can be attached after errback() call
            rejectionAwait(() => {
               if (!this._hasErrback) {
                  this.logger.error(
                     'Deferred',
                     'There is no callbacks attached to handle error',
                     rejectionError
                  );
                  this.logger.error(
                     'Deferred',
                     'Unhandled error',
                     result
                  );
               }
            });
         }
      }

      return result;
   }

   /**
    * Добавляет один коллбэк как на ошибку, так и на успех
    * @param {Function} fn общий коллбэк.
    * @returns {Core/Deferred}
    */
   addBoth(fn) {
      if (arguments.length !== 1) {
         throw new Error('No extra args supported');
      }
      return this.addCallbacks(fn, fn);
   }

    /**
     * Добавляет один коллбэк как на ошибку, так и на успех
     * @param {Function} onFinally функция-обработчик
     * @returns {Promise<any>} Promise<any>
     */
    public finally(onFinally: () => any): Promise<any> {
        let callback: () => any;
        let errback: () => any;

        const promise = new Promise((resolve, reject) => {
            callback = resolve;
            errback = reject;
        }).then(onFinally, onFinally); // finally не поддерживается Node < 10

        this.addCallbacks(/** Результаты пробрасываются дальше в цепочку Deferred */
            (res) => { callback(); return res; },
            (err) => { errback(); return err; });
        return promise;
    }

   /**
    * Добавляет колбэк на успех
    * @param {Function} fn коллбэк на успех.
    * @returns {Core/Deferred}
    */
   addCallback(fn) {
      if (arguments.length !== 1) {
         throw new Error('No extra args supported');
      }
      return this.addCallbacks(fn, null);
   }

    /**
     * Добавляет обработчики на успех и на ошибку
     * @param {Function} onFulfilled функция-обработчик на успех
     * @param {Function} [onRejected] функция-обработчик на ошибку
     * @returns {Promise<any>} Promise<any>
     */
    public then(onFulfilled: (res) => any, onRejected?: (err: Error) => any): Promise<any> {
        let callback: (res: any) => void;
        let errback: (err: Error) => void;

        const promise = new Promise((resolve, reject) => {
            callback = resolve;
            errback = reject;
        }).then(onFulfilled, onRejected);

        this.addCallbacks(/** Результаты пробрасываются дальше в цепочку Deferred */
            (res) => { callback(res); return res; },
            (err) => { errback(err); return err; });
        return promise;
    }

   /**
    * Добавляет колбэк на ошибку
    * @param {Function} fn коллбэк на ошибку.
    * @returns {Core/Deferred}
    */
   addErrback(fn) {
      if (arguments.length !== 1) {
         throw new Error('No extra args supported');
      }
      return this.addCallbacks(null, fn);
   }

    /**
     * Добавляет обработчик на ошибку
     * @param {Function} onRejected функция-обработчик на ошибку
     * @returns {Promise<any>} Promise<any>
     */
    public catch(onRejected: (err: Error) => any): Promise<any> {
        let errback: (err: Error) => void;

        const promise = new Promise((_resolve, reject) => {
            errback = reject;
        }).catch(onRejected);

        this.addErrback(/** Ошибка пробрасывается дальше в цепочку Deferred */
            (err: Error) => { errback(err); return err; });
        return promise;
    }

   /**
    * Добавляет два коллбэка, один на успешный результат, другой на ошибку
    * @param {Function} cb коллбэк на успешный результат.
    * @param {Function} eb коллбэк на ошибку.
    * @returns {Core/Deferred}
    */
   addCallbacks(cb, eb) {
      if (this._chained) {
         throw new Error('Chained Deferreds can not be re-used');
      }

      if (
         (cb !== null && typeof cb !== 'function') ||
         (eb !== null && typeof eb !== 'function')
      ) {
         throw new Error('Both arguments required in addCallbacks');
      }

      if (eb) {
         this._hasErrback = true;
      }

      const fired = this._fired,
         waiting = fired === WAITING || this._running || this._paused > 0;

      if (
         waiting ||
         (cb && fired === SUCCESS) ||
         (eb && (fired === FAILED || fired === CANCELED))
      ) {
         this._chain.push([cb, eb]);

         if (!waiting) {
            // не запускаем выполнение цепочки при добавлении нового элемента, если цепочка уже выполняется
            this._fire();
         }
      }

      return this;
   }

   /**
    * Вся логика обработки результата.
    * Вызов коллбэков-еррбэков, поддержка вложенного Deferred
    */
   _fire() {
      const chain = this._chain;
      let fired = this._fired;
      let res = this._results[CHAIN_INDEXES[fired]];
      const self = this;
      let cb = null;

      while (chain.length > 0 && this._paused === 0) {
         const pair = chain.shift();
         const f = pair[CHAIN_INDEXES[fired]];
         if (f === null) {
            continue;
         }

         try {
            // Признак того, что Deferred сейчас выполняет цепочку
            this._running = true;
            if (this._logCallbackExecutionTime) {
               res = cDebug.methodExecutionTime(f, this, [res]);
            } else {
               res = f(res);
            }
            fired = resultToFired(res);
            if (isDeferredLikeValue(res)) {
               cb = function(cbRes) {
                  self._paused--;
                  self._resback(cbRes);
               };
               this._paused++;
            }
         } catch (err) {
            fired = FAILED;
            res = isErrorValue(err) ? err : new Error(err);
            this.logger.error(
               'Deferred',
               `Callback function throwing an error: ${err.message}`,
               err
            );
         } finally {
            this._running = false;
         }
      }
      this._fired = fired;
      this._results[CHAIN_INDEXES[fired]] = res;

      if (cb && this._paused) {
         res.addBoth(cb);
         res._chained = true;
      }
   }

   /**
    * Объявляет данный текущий Deferred зависимым от другого.
    * Колбэк/Еррбэк текущего Deferred будет вызван при соотвествтующем событии в "мастер"-Deferred.
    *
    * @param {Core/Deferred} master Deferred, от которого будет зависеть данный.
    * @returns {Core/Deferred}
    */
   dependOn(master) {
      master.addCallbacks(
         (v) => {
            this.callback(v);
            return v;
         },
         (e) => {
            this.errback(e);
            return e;
         }
      );

      return this;
   }

   /**
    * Создаёт новый Deferred, зависимый от этого.
    * Колбэк/Еррбэк этого Deferred-а будут вызваны при соотвествтующем событии исходного.
    *
    * @returns {Core/Deferred}
    */
   createDependent() {
      const dependent = new Deferred();
      return dependent.dependOn(this);
   }

   /**
    * Проверяет возможность вызова методов callback/errback
    * @param {Boolean} [withChain=false] Проверять, отработала ли цепочка обработчиков.
    * @returns {Boolean} Готов или нет этот экземпляр (стрельнул с каким-то результатом)
    */
   isReady(withChain?) {
      // Признак _paused тут учитывать не надо, потому что isReady говорит именно о наличии результата этого
      // Deferred-а (и возможности или невозможности вызывать методы callback/errback),
      // а не о состоянии цепочки его обработчиков.
      return this._fired !== WAITING && (withChain ? !this._paused : true);
   }

   /**
    * Показывает, не запрещено ли пользоваться методами, добавляющими обработчики:
    * addCallbacks/addCallback/addErrback/addBoth.
    * Не влияет на возможность вызова методов callback/errback.
    * @return {Boolean} true: добавлять обработчики запрещено. false: добавлять обработчики можно.
    */
   isCallbacksLocked() {
      return this._chained;
   }

   /**
    * Проверяет, завершился ли данный экземпляр успехом
    * @returns {Boolean} Завершился ли данный экземпляр успехом
    */
   isSuccessful() {
      return this._fired === SUCCESS;
   }

   /**
    * Возвращает текущее значение Deferred.
    * @returns Текущее значение Deferred
    * @throws {Error} Когда значения еще нет.
    */
   getResult() {
      if (this.isReady()) {
         return this._results[CHAIN_INDEXES[this._fired]];
      }
      throw new Error('No result at this moment. Deferred is still not ready');
   }

   /**
    * Возвращает Deferred, который завершится успехом через указанное время.
    * @param {Number} delay Значение в миллисекундах.
    * @returns {Core/Deferred}
    * @example
    * <pre>
    *    //выполнит обработчик через 5 секунд
    *    var def = Deferred.fromTimer(5000);
    *    def.addCallback(function(){
    *     //код обработчика
    *    });
    * </pre>
    */
   static fromTimer(delay) {
      const d = new Deferred();
      setTimeout(d.callback.bind(d), delay);
      return d;
   }

   /**
    * Возвращает Deferred, завершившийся успехом.
    * @param {*} [result] Результат выполнения.
    * @returns {Core/Deferred}
    * @example
    * <pre>
    *    var def = Deferred.success('bar');
    *    //выполнит обработчик и передаст в него результат.
    *    def.addCallback(function(res) {
    *       // Выведет в консоль 'bar'
    *       console.log(res);
    *    });
    * </pre>
    */
   static success(result) {
      return new Deferred().callback(result);
   }

   /**
    * Возвращает Deferred, завершившийся ошибкой.
    * @param {*|Error} [result] - результат выполнения.
    * @returns {Core/Deferred}
    * @example
    * <pre>
    *    var def = Deferred.fail('Bug');
    *    // Выполнит обработчик и передаст в него результат.
    *    def.addErrback(function(err) {
    *       console.log(err.message); // Выведет в консоль 'Bug'
    *    });
    * </pre>
    */
   static fail(result) {
      const err =
         result instanceof Error ? result : new Error(result ? String(result) : '');
      return new Deferred().errback(err);
   }

   /**
    * Возвращает Deferred, который завершится успехом или ошибкой, сразу же как завершится успехом или
    * ошибкой любой из переданных Deferred.
    * @param {Array} steps Набор из нескольких отложенных результатов.
    * @returns {Core/Deferred}
    * @example
    * <pre>
    * var query = (new BLObject('Клиент')).call('Параметры');
    *
    * // Если запрос к БЛ займёт более 10 секунд, то Deferred завершится успехом, но вернёт undefined в результате.
    * var def = Deferred.nearestOf([Deferred.fromTimer(10000), query]);
    * def.addCallback(function(res){
    *    if (res.from === 0) {
    *
    *       // Обработка случая не завершённого запроса к БЛ, занимающего продолжительное время.
    *       helpers.alert('Ваш запрос обрабатывается слишком долго.');
    *    } else {
    *       var recordSet = res.data;
    *       // Логика обработки полученных данных.
    *    }
    * });
    * def.addErrback(function(res) {
    *   // В res.data придёт экземпляр ошибки, если один из запросов завершился ошибкой.
    * });
    * </pre>
    */
   static nearestOf(steps) {
      const dResult = new Deferred();

      steps.forEach((step, key) => {
         step.addBoth((r) => {
            if (!dResult.isReady()) {
               if (r instanceof Error) {
                  const res = new Error();
                  //@ts-ignore
                  res.from = key;
                  //@ts-ignore
                  res.data = r;
                  dResult.errback(res);
               } else {
                  dResult.callback({
                     from: key,
                     data: r
                  });
               }
            }
            return r;
         });
      });

      if (steps.length === 0) {
         dResult.callback();
      }

      return dResult;
   }

   /**
    * Если есть deferred, то дожидается его окончания и выполняет callback, иначе просто выполняет callback
    * @param {*} deferred То, чего ждём.
    * @param {Function} callback То, что нужно выполнить.
    * @return {Core/Deferred|*} Если есть деферред, то возвращает его, иначе - результат выполнения функции.
    */

   static callbackWrapper(deferred, callback) {
      if (deferred && deferred instanceof Deferred) {
         return deferred.addCallback(callback);
      }
      return callback(deferred);
   }

   /**
    * Возвращаем Deferred который подхватывает результаты Promise
    * @param {Promise} promise
    * @returns {Deferred}
    */
   static fromPromise(promise) {
      const def = new Deferred();
      /** Сохранить ссылку на Promise, чтобы в def.cancel() вызвать promise.abort();
       * https://online.sbis.ru/opendoc.html?guid=b7d3305f-6805-46e8-8502-8e9ed46639bf
       */
      def.__parentPromise = promise;
      promise.then((res) => {
         def.callback(res);
      }).catch((err) => {
         def.errback(err);
      });

      return def;
   }

   /**
    * Возвращает Promise из Deferred.
    * Не затрагивает цепочку переданного Deferred.
    * @param {Deferred} def
    * @returns {Promise}
    */
   static toPromise(def) {
      return new Promise((resolve, reject) => {
         def.createDependent().addCallbacks((res) => {
            resolve(res);
         }, (err) => {
            reject(err);
         });
      });
   }
}

function isCanceled(dfr) {
   return dfr._fired === CANCELED;
}

function isCancelValue(res) {
   return res instanceof DeferredCanceledError;
}

function isErrorValue(res) {
   return res instanceof Error;
}
/**
 * Проверка принадлежности instance к типу DeferredLike
 * @param {any} instance
 * @returns {boolean} true, если instance :: DeferredLike
 */
function isDeferredLikeValue(instance: any): boolean {
   return instance && !!(instance.addCallback && instance.addErrback);
}

function resultToFired(res) {
   return isCancelValue(res) ? CANCELED : isErrorValue(res) ? FAILED : SUCCESS;
}

export = Deferred;
