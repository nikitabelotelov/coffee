/// <amd-module name="Types/_collection/factory" />
/**
 * Factories library.
 * @library Types/_collection/factory
 * @includes Factory Types/_collection/factory/list
 * @includes Format Types/_collection/factory/recordSet
 * @author Мальцев А.А.
 */
define('Types/_collection/factory', [
    'require',
    'exports',
    'Types/_collection/factory/list',
    'Types/_collection/factory/recordSet'
], function (require, exports, list_1, recordSet_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.list = list_1.default;
    exports.recordSet = recordSet_1.default;
});