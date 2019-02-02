/// <amd-module name="Types/_entity/functor" />
/**
 * Functors library.
 * @library Types/_entity/functor
 * @includes Compute Types/_entity/functor/Compute
 * @author Мальцев А.А.
 */
define('Types/_entity/functor', [
    'require',
    'exports',
    'Types/_entity/functor/Compute'
], function (require, exports, Compute_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Compute = Compute_1.default;
    exports.IComputeFunctor = Compute_1.IFunctor;
});