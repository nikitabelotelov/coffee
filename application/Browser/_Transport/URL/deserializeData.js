define('Browser/_Transport/URL/deserializeData', [
    'require',
    'exports',
    'Core/base64'
], function (require, exports, base64) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Переводит строку из base64 в обычную строку.
     * @param {string} serialized
     * @returns {*}
     * @see serializeURLData
     */
    /**
     * Переводит строку из base64 в обычную строку.
     * @param {string} serialized
     * @returns {*}
     * @see serializeURLData
     */
    function default_1(serialized) {
        return JSON.parse(base64.decode(serialized));
    }
    exports.default = default_1;
    ;
});