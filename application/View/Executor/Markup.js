/// <amd-module name="View/Executor/Markup" />
define('View/Executor/Markup', [
    'require',
    'exports',
    'View/Executor/_Markup/Generator',
    'View/Executor/_Markup/Text/Generator',
    'View/Executor/_Markup/Vdom/Generator',
    'View/Executor/_Markup/Text/FunctionHeaderTemplate'
], function (require, exports, Generator_1, Generator_2, Generator_3, FunctionHeaderTemplate_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Generator = Generator_1.default;
    exports.GeneratorText = Generator_2.default;
    exports.GeneratorVdom = Generator_3.default;
    exports.FunctionHeaderTemplate = FunctionHeaderTemplate_1.default;
});