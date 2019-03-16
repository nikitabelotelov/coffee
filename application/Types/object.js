/// <amd-module name="Types/object" />
/**
 * Библиотека работы с объектами.
 * @library Types/object
 * @includes isEqual Types/_object/isEqual
 * @includes merge Types/_object/merge
 * @public
 * @author Мальцев А.А.
 */
define('Types/object', [
    'require',
    'exports',
    'Types/_object/isEqual',
    'Types/_object/merge'
], function (require, exports, isEqual_1, merge_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.isEqual = isEqual_1.default;
    exports.merge = merge_1.default;
});