/// <amd-module name="Types/_collection/format" />
/**
 * Formats library.
 * @library Types/_collection/format
 * @includes Factory Types/_collection/format/factory
 * @includes Format Types/_collection/format/Format
 * @author Мальцев А.А.
 */
define('Types/_collection/format', [
    'require',
    'exports',
    'Types/_collection/format/factory',
    'Types/_collection/format/Format'
], function (require, exports, factory_1, Format_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.factory = factory_1.default;
    exports.Format = Format_1.default;
});