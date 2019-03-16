define('Browser/_Storage/utils/prefix', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Browser/_Storage/utils/prefix" />
                                                                      /**
     * Добавляет префикс к строке
     * @param {String} str
     * @param {String} prefix
     * @return {String}
     */
    /// <amd-module name="Browser/_Storage/utils/prefix" />
    /**
     * Добавляет префикс к строке
     * @param {String} str
     * @param {String} prefix
     * @return {String}
     */
    exports.add = function (str, prefix) {
        return prefix && prefix + '/' + str || str;
    };    /**
     * Возвращает строку без профекса
     * @param {String} str
     * @param {String} prefix
     * @return {String}
     */
    /**
     * Возвращает строку без профекса
     * @param {String} str
     * @param {String} prefix
     * @return {String}
     */
    exports.remove = function (str, prefix) {
        return prefix && exports.startsWith(str, prefix) ? str.substr(prefix.length + 1) : str;
    };    /**
     * Проверка начинается ли строка с конструкциюи вида prefix/, если передан префикс.
     * в случае отсуствия префикса вернёт true
     * @param {String} str
     * @param {String} prefix
     * @return {Boolean}
     */
    /**
     * Проверка начинается ли строка с конструкциюи вида prefix/, если передан префикс.
     * в случае отсуствия префикса вернёт true
     * @param {String} str
     * @param {String} prefix
     * @return {Boolean}
     */
    exports.startsWith = function (str, prefix) {
        return !prefix || str.indexOf(prefix + '/') === 0;
    };
});