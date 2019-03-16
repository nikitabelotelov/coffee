/// <amd-module name="Env/_Env/ILogger" />
define('Env/_Env/ILogger', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Интерфейс предназначен для организации логирования в приложениях.
     * Работа с интерфейсом обеспечивается с помощью механизма {@link https://ru.wikipedia.org/wiki/Инверсия_управления ioc}
     * Это важно учитывать при вызове методов класса.
     * Доступ к реализации осуществляется с помощью вызова конструкции $ws.single.ioc.resolve('ILogger').
     * По умолчанию в ws для интерфейса ILogger включена реализация {@link Env/ConsoleLogger}.
     * @class Env/ILogger
     * @public
     * @author Бегунов А.В.
     */
    /**
     * Интерфейс предназначен для организации логирования в приложениях.
     * Работа с интерфейсом обеспечивается с помощью механизма {@link https://ru.wikipedia.org/wiki/Инверсия_управления ioc}
     * Это важно учитывать при вызове методов класса.
     * Доступ к реализации осуществляется с помощью вызова конструкции $ws.single.ioc.resolve('ILogger').
     * По умолчанию в ws для интерфейса ILogger включена реализация {@link Env/ConsoleLogger}.
     * @class Env/ILogger
     * @public
     * @author Бегунов А.В.
     */
    var ILogger = function () {
    };    /**
     * Задать текст выводимого сообщения.
     * @param {String} tag Заголовок.
     * @param {String} message Текст выводимого сообщения.
     * @example
     * <pre>
     *     // в консоль будет выведено сообщение вида "tag: message"
     *     // (при условии, что реализация интерфейса настроена на Env/ConsoleLogger)
     *     $ws.single.ioc.resolve('ILogger').log('tag','message')
     * </pre>
     * @see error
     * @see info
     */
    /**
     * Задать текст выводимого сообщения.
     * @param {String} tag Заголовок.
     * @param {String} message Текст выводимого сообщения.
     * @example
     * <pre>
     *     // в консоль будет выведено сообщение вида "tag: message"
     *     // (при условии, что реализация интерфейса настроена на Env/ConsoleLogger)
     *     $ws.single.ioc.resolve('ILogger').log('tag','message')
     * </pre>
     * @see error
     * @see info
     */
    ILogger.prototype.log = function (tag, message) {
        throw new Error('ILogger::log method is not implemented');
    };    /**
     * Задать тест выводимой информации.
     * Текст будет со специальной пометкой "информация" в начале.
     * Данный метод удобно использовать для предупреждения о различных событиях.
     * @example
     * <pre>
     *     $ws.single.ioc.resolve('ILogger').info('Информация для пользователя')
     * </pre>
     * @see log
     * @see error
     */
    /**
     * Задать тест выводимой информации.
     * Текст будет со специальной пометкой "информация" в начале.
     * Данный метод удобно использовать для предупреждения о различных событиях.
     * @example
     * <pre>
     *     $ws.single.ioc.resolve('ILogger').info('Информация для пользователя')
     * </pre>
     * @see log
     * @see error
     */
    ILogger.prototype.error = function (tag, message) {
        throw new Error('ILogger::error method is not implemented');
    };
    ILogger.prototype.info = function () {
    };
    ILogger.prototype.warn = function () {
    };
    ILogger.prototype.methodExecutionStart = function (funcName) {
    };
    ILogger.prototype.methodExecutionFinish = function (funcName, executionTime) {
    };
    exports.default = ILogger;
});