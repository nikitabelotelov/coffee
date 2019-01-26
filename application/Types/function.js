/// <amd-module name="Types/function" />
/**
 * Библиотека для форматирования.
 * @library Types/function
 * @includes debounce Types/_function/debounce
 * @includes delay Types/_function/delay
 * @includes memoize Types/_function/memoize
 * @includes once Types/_function/once
 * @includes throttle Types/_function/throttle
 * @public
 * @author Мальцев А.А.
 */
define('Types/function', [
    'require',
    'exports',
    'Types/_function/debounce',
    'Types/_function/delay',
    'Types/_function/memoize',
    'Types/_function/once',
    'Types/_function/throttle'
], function (require, exports, debounce_1, delay_1, memoize_1, once_1, throttle_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.debounce = debounce_1.default;
    exports.delay = delay_1.default;
    exports.memoize = memoize_1.default;
    exports.once = once_1.default;
    exports.throttle = throttle_1.default;
});