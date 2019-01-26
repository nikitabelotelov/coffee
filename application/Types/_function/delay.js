/// <amd-module name="Types/_function/delay" />
define('Types/_function/delay', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Модуль, в котором описана функция <b>delay(fn)</b>.
     *
     * Метод Вызывает функцию асинхронно, через requestAnimationFrame, или на крайний случай setTimeout
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>fn</b> {Function} - исходная функция, вызов которой нужно асинхронно.</li>
     * </ul>
     *
     * @class Types/_function/delay
     * @public
     * @author Мальцев А.А.
     */
    /**
     * Модуль, в котором описана функция <b>delay(fn)</b>.
     *
     * Метод Вызывает функцию асинхронно, через requestAnimationFrame, или на крайний случай setTimeout
     *
     * <h2>Параметры функции</h2>
     * <ul>
     *     <li><b>fn</b> {Function} - исходная функция, вызов которой нужно асинхронно.</li>
     * </ul>
     *
     * @class Types/_function/delay
     * @public
     * @author Мальцев А.А.
     */
    function runDelayed(original) {
        var win = typeof window !== 'undefined' ? window : null;
        if (win && win.requestAnimationFrame) {
            win.requestAnimationFrame(original);
        } else {
            setTimeout(original, 0);
        }
    }
    exports.default = runDelayed;
});