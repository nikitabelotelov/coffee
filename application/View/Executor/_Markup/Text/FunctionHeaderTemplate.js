/// <amd-module name="View/Executor/_Markup/Text/FunctionHeaderTemplate" />
define('View/Executor/_Markup/Text/FunctionHeaderTemplate', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.default = '/*#DELETE IT START#*/\nfunction debug() { debugger; }\nvar thelpers = typeof tclosure === \'undefined\' || !tclosure ? arguments[arguments.length - 1] : tclosure;\nif (typeof thelpers === "undefined" || !thelpers._isTClosure) {\neval("var thelpers = null;");\nthelpers = (function(){return this || (0, eval)(\'this\')})().requirejs("View/Executor/TClosure");\n}\nvar depsLocal = typeof _deps === \'undefined\' ? undefined : _deps;\nif (typeof includedTemplates === "undefined") {\neval("var includedTemplates = undefined;");\nincludedTemplates = (this && this.includedTemplates) ? this.includedTemplates : {};\n}\n/*#DELETE IT END#*/\nvar templateCount = 0;\nvar key = attr && attr.key || \'_\';\nvar defCollection = {id: [], def: undefined};\nvar viewController = thelpers.configResolver.calcParent(this, typeof currentPropertyName === \'undefined\' ? undefined : currentPropertyName, data);';
});