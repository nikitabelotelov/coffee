define('View/_Request/Console', [
    'require',
    'exports',
    'Env/Env'
], function (require, exports, Env_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var isAllowedLog = function (allowedLevel, methodLevel) {
        return allowedLevel > methodLevel;
    };
    var checkConsoleMethod = function (console, method) {
        return console && typeof console[method] === 'function';
    };
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel['info'] = 0] = 'info';
        LogLevel[LogLevel['warning'] = 1] = 'warning';
        LogLevel[LogLevel['error'] = 2] = 'error';
    }(LogLevel = exports.LogLevel || (exports.LogLevel = {})));
    var Console = /** @class */
    function () {
        function Console(_a) {
            var logLevel = _a.logLevel, console = _a.console;
            this.__logLevel = logLevel || Env_1.constants.logLevel;
            this.__console = console;
        }
        Console.prototype.setLogLevel = function (mode) {
            this.__logLevel = mode;
        };
        ;
        Console.prototype.getLogLevel = function () {
            return this.__logLevel;
        };
        ;
        Console.prototype.info = function () {
            if (isAllowedLog(this.__logLevel, LogLevel.info) && checkConsoleMethod(this.__console, 'info')) {
                console.info(arguments);    // eslint-disable-line no-console
            }
        };
        // eslint-disable-line no-console
        ;
        Console.prototype.log = function () {
            if (isAllowedLog(this.__logLevel, LogLevel.info) && checkConsoleMethod(this.__console, 'log')) {
                console.log(arguments);    // eslint-disable-line no-console
            }
        };
        // eslint-disable-line no-console
        ;
        Console.prototype.warning = function () {
            if (!isAllowedLog(this.__logLevel, LogLevel.warning)) {
                return;
            }
            if (checkConsoleMethod(this.__console, 'error')) {
                return console.warn(arguments);    // eslint-disable-line no-console
            }
            // eslint-disable-line no-console
            if (checkConsoleMethod(this.__console, 'log')) {
                return console.log(arguments);    // eslint-disable-line no-console
            }
        };
        // eslint-disable-line no-console
        ;
        Console.prototype.error = function () {
            if (!isAllowedLog(this.__logLevel, LogLevel.error) || !checkConsoleMethod(this.__console, 'error')) {
                return;
            }
            console.error(arguments);    // eslint-disable-line no-console
        };
        // eslint-disable-line no-console
        ;
        return Console;
    }();
    exports.Console = Console;
});