define('Vdom/_private/Utils/DefaultOpenerFinder', [
    'require',
    'exports',
    'Core/core-instance',
    'Env/Env',
    'Vdom/_private/Synchronizer/resources/DOMEnvironment'
], function (require, exports, cInstance, Env_1, DOMEnvironment_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var goUpByControlTree = DOMEnvironment_1.default._goUpByControlTree;
    function find(control) {
        var container;
        if (cInstance.instanceOfModule(control, 'Core/Control')) {
            container = control._container;
        } else if (control instanceof Element) {
            container = control;
        } else {
            Env_1.IoC.resolve('ILogger').error('DOMEnvironment', rk('The arguments should be control or node element'));
        }
        var controlTree = goUpByControlTree(container);
        return controlTree.find(function (ctrl) {
            return ctrl._options.isDefaultOpener;
        });
    }
    exports.find = find;
});