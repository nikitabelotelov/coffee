define('Types/_util/protect', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Types/_util/protect" />
                                                                      /**
     * Возвращает имя для защищенного свойства
     * @param {String} property Название свойства.
     * @return {Symbol|String} Защищенное имя
     * @public
     * @author Мальцев А.А.
     */
    /// <amd-module name="Types/_util/protect" />
    /**
     * Возвращает имя для защищенного свойства
     * @param {String} property Название свойства.
     * @return {Symbol|String} Защищенное имя
     * @public
     * @author Мальцев А.А.
     */
    function protect(property) {
        return typeof Symbol === 'undefined' ? '$' + property : Symbol(property);
    }
    exports.default = protect;
});