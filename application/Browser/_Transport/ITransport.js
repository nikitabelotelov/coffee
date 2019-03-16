define('Browser/_Transport/ITransport', [
    'require',
    'exports',
    'Core/core-extend'
], function (require, exports, coreExtend) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Абстрактный транспорт
     *
     * @class Transport/ITransport
     * @author Бегунов А.В.
     * @public
     */
    /**
     * Абстрактный транспорт
     *
     * @class Transport/ITransport
     * @author Бегунов А.В.
     * @public
     */
    var ITransport = coreExtend({}, /** @lends Transport/ITransport.prototype */
    {
        /**
         * Отправка запроса
         *
         * @param data данные
         * @param {Object} [headers] Заголовки запроса
         * @returns {Core/Deferred}
         */
        execute: function (data, headers) {
            throw new Error('Method not implemented');
        }
    });
    exports.default = ITransport;
});