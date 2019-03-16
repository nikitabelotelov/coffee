/// <amd-module name="Types/_entity/relation" />
/**
 * Relations library.
 * @library Types/_entity/relation
 * @includes Hierarchy Types/_entity/relation/Hierarchy
 * @includes IReceiver Types/_entity/relation/IReceiver
 * @author Мальцев А.А.
 */
define('Types/_entity/relation', [
    'require',
    'exports',
    'Types/_entity/relation/Hierarchy',
    'Types/_entity/relation/IReceiver'
], function (require, exports, Hierarchy_1, IReceiver_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Hierarchy = Hierarchy_1.default;
    exports.IReceiver = IReceiver_1.default;
});