/// <amd-module name="Types/shim" />
/**
 * Compatibility layer library
 * @library Types/shim
 * @includes DestroyableMixin Types/_shim/Map
 * @includes DestroyableMixin Types/_shim/Set
 * @author Мальцев А.А.
 */
define('Types/shim', [
    'require',
    'exports',
    'Types/_shim/Map',
    'Types/_shim/Set'
], function (require, exports, Map_1, Set_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Map = Map_1.default;
    exports.Set = Set_1.default;
});