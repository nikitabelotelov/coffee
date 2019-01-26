/// <amd-module name="Types/_collection/enumerator" />
/**
 * Enumerators library.
 * @library Types/_collection/enumerator
 * @includes Factory Types/_collection/enumerator/factory
* @author Мальцев А.А.
 */
define('Types/_collection/enumerator', [
    'require',
    'exports',
    'Types/_collection/enumerator/Arraywise',
    'Types/_collection/enumerator/Mapwise',
    'Types/_collection/enumerator/Objectwise'
], function (require, exports, Arraywise_1, Mapwise_1, Objectwise_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Arraywise = Arraywise_1.default;
    exports.Mapwise = Mapwise_1.default;
    exports.Objectwise = Objectwise_1.default;
});