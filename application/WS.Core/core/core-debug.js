define("Core/core-debug", ["require", "exports", "Core/IoC"], function (require, exports, IoC) {
    "use strict";
    /**
     * @class Core/core-debug
     * @public
     */
    var logMethodExecutionTime = false;
    return {
        get logMethodExecutionTime() {
            return logMethodExecutionTime;
        },
        set logMethodExecutionTime(value) {
            logMethodExecutionTime = value;
        },
        /**
         * Проверяет условие, если условие не выполнено, падает ошибка с сообщением
         * @param {*} assert Проверяемое условие
         * @param {String} message Сообщение ошибки в случае невыполненого условия
         * @deprecated Нужно использовать метод checkAssertion из модуля core-debug
         */
        checkAssertion: function (assert, message) {
            if (!assert) {
                throw new Error(message || rk('Ошибка логики'));
            }
        },
        /**
         * Возвращает текущий stack trace
         * @returns {*}
         */
        getStackTrace: function () {
            return (new Error()).stack || '';
        },
        /**
         * Вычисляет и логирует время выполнения функции
         * @param func Функция
         * @param ctx Контекст вызова функции
         * @param args Аргументы функции
         */
        methodExecutionTime: function (func, ctx, args) {
            var time, result, logger;
            if (logMethodExecutionTime) {
                logger = IoC.resolve('ILogger');
                if (typeof logger.methodExecutionStart === 'function') {
                    logger.methodExecutionStart(func);
                }
                time = Date.now();
            }
            try {
                result = func.apply(ctx, args);
            }
            catch (err) {
                throw err;
            }
            finally {
                if (logMethodExecutionTime && typeof logger.methodExecutionFinish === 'function') {
                    logger.methodExecutionFinish(func, Date.now() - time);
                }
            }
            return result;
        }
    };
});
