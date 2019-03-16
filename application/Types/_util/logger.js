/**
 * Logger
 * @public
 * @author Мальцев А.А.
 */
define('Types/_util/logger', [
    'require',
    'exports',
    'Env/Env'
], function (require, exports, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var STACK_DETECTOR = /:[0-9]+:[0-9]+/;
    var SELF_STACK_DEPTH = 2;
    var stackPoints = {};
    var logger = {
        /**
         * Пишет в лог сообщение
         * @param tag Метка
         * @param message Сообщение
         */
        log: function (tag, message) {
            if (arguments.length === 1) {
                message = tag;
                tag = 'Log';
            }
            Env_1.IoC.resolve('ILogger').log(tag, message || '');
        },
        /**
         * Пишет в лог сообщение об ошибке
         * @param tag Метка
         * @param message Сообщение
         */
        error: function (tag, message) {
            if (arguments.length === 1) {
                message = tag;
                tag = 'Critical';
            }
            Env_1.IoC.resolve('ILogger').error(tag, message || '');
        },
        /**
         * Пишет в лог информационное сообщение
         * @param tag Метка
         * @param message Сообщение
         * @static
         */
        info: function (tag, message) {
            if (arguments.length === 1) {
                message = tag;
                tag = 'Warning';
            }
            Env_1.IoC.resolve('ILogger').warn(tag, message || '');
        },
        /**
         * Пишет в лог предупреждение с указанием файла, спровоцировавшего это предупреждение.
         * Для каждой точки файла предупреждение выводится только один раз.
         * @param message Сообщение
         * @param [offset=0] Смещение по стеку
         * @param [level=info] Уровень логирования
         */
        stack: function (message, offset, level) {
            offset = offset || 0;
            level = level || 'info';
            var error = new Error(message);
            var at = SELF_STACK_DEPTH + offset;    // this scope -> logStack() called scope -> error scope
            // this scope -> logStack() called scope -> error scope
            var callStack = '';
            var hash = '';
            if ('stack' in error) {
                var stack = String(error.stack).split('\n');
                if (!STACK_DETECTOR.test(stack[0])) {
                    // Error text may be at first row
                    at++;
                }
                callStack = stack.slice(at).join('\n').trim();    // Don't repeat the same message
                // Don't repeat the same message
                hash = message + callStack;
                if (stackPoints.hasOwnProperty(hash)) {
                    return;
                }
                stackPoints[hash] = true;
            }
            Env_1.IoC.resolve('ILogger')[level](error.message, callStack);
        }
    };
    exports.default = logger;
});