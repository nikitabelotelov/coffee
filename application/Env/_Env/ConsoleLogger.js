define('Env/_Env/ConsoleLogger', [
    'require',
    'exports',
    'Env/Constants',
    'Env/_Env/IoC'
], function (require, exports, Constants_1, IoC_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Этот класс задаёт реализацию интерфейса ILogger по умолчанию в ws, обеспечивает работу механизма {@link https://ru.wikipedia.org/wiki/Инверсия_управления ioc}.
     * Доступ к реализации осуществляется с помощью вызова конструкции Env/Ioc.resolve('ILogger').
     * @class Env/ConsoleLogger
     * @extends Env/ILogger
     * @public
     * @author Бегунов А.В.
     */
    /**
     * Этот класс задаёт реализацию интерфейса ILogger по умолчанию в ws, обеспечивает работу механизма {@link https://ru.wikipedia.org/wiki/Инверсия_управления ioc}.
     * Доступ к реализации осуществляется с помощью вызова конструкции Env/Ioc.resolve('ILogger').
     * @class Env/ConsoleLogger
     * @extends Env/ILogger
     * @public
     * @author Бегунов А.В.
     */
    var LOG_LEVEL = {
        'info': 0,
        'warning': 1,
        'error': 2
    };
    var ConsoleLogger = /** @class */
    function () {
        function ConsoleLogger() {
            var global = function () {
                return this || (0, eval)('this');    // eslint-disable-line no-eval
            }();
            // eslint-disable-line no-eval
            if ('jstestdriver' in global) {
                this._con = global.jstestdriver.console;
            } else if ('console' in global) {
                this._con = global.console;
            }
        }
        ConsoleLogger.prototype.log = function (tag, message) {
            if (LOG_LEVEL[Constants_1.constants.logLevel] > LOG_LEVEL.info) {
                return;
            }
            if (this._con && typeof this._con === 'object' && 'log' in this._con && typeof this._con.log === 'function') {
                this._con.log(tag + ': ' + message + '\n');
            } else {
                try {
                    this._con.log(tag + ': ' + message + '\n');
                } catch (e) {
                }
            }
        };
        ConsoleLogger.prototype.warn = function (tag, message) {
            if (LOG_LEVEL[Constants_1.constants.logLevel] > LOG_LEVEL.warning) {
                return;
            }
            if (this._con && typeof this._con === 'object' && 'warn' in this._con && typeof this._con.warn === 'function') {
                this._con.warn(tag + ': ' + message + '\n');
            } else {
                this.log(tag, message);
            }
        };
        ConsoleLogger.prototype.error = function (tag, message, exception) {
            if (LOG_LEVEL[Constants_1.constants.logLevel] > LOG_LEVEL.error) {
                return;
            }
            message = message + (exception && exception.stack ? '\nStack: ' + exception.stack : '');
            if (this._con && typeof this._con === 'object' && 'error' in this._con && typeof this._con.error === 'function') {
                this._con.error(tag + ': ' + message);
            } else {
                try {
                    this._con.error(tag + ': ' + message + '\n');
                } catch (e) {
                    this.log(tag, message);
                }
            }
        };
        ConsoleLogger.prototype.info = function () {
            if (LOG_LEVEL[Constants_1.constants.logLevel] > LOG_LEVEL.info) {
                return;
            }
            if (this._con && typeof this._con === 'object' && 'info' in this._con && typeof this._con.info === 'function') {
                this._con.info.apply(this._con, arguments);
            } else {
                try {
                    this._con.info.apply(this._con, arguments);
                } catch (e) {
                }
            }
        };
        ConsoleLogger.prototype.methodExecutionStart = function (func) {
            this.log('methodExecutionStart', func.name);
        };
        ConsoleLogger.prototype.methodExecutionFinish = function (func, executionTime) {
            this.log('methodExecutionFinish', func.name + ' execution time = ' + executionTime + 'ms');
        };
        return ConsoleLogger;
    }();
    if (!IoC_1.default.has('ILogger')) {
        IoC_1.default.bindSingle('ILogger', new ConsoleLogger());
    }
    exports.default = ConsoleLogger;
});