/// <amd-module name="View/Executor/_Markup/Text/FunctionHeaderTemplate" />

export default
`/*#DELETE IT START#*/
function debug() { debugger; }
var thelpers = typeof tclosure === \'undefined\' || !tclosure ? arguments[arguments.length - 1] : tclosure;
if (typeof thelpers === "undefined" || !thelpers._isTClosure) {
eval("var thelpers = null;");
thelpers = (function(){return this || (0, eval)(\'this\')})().requirejs("View/Executor/TClosure");
}
var depsLocal = typeof _deps === \'undefined\' ? undefined : _deps;
if (typeof includedTemplates === "undefined") {
eval("var includedTemplates = undefined;");
includedTemplates = (this && this.includedTemplates) ? this.includedTemplates : {};
}
/*#DELETE IT END#*/
var templateCount = 0;
var key = attr && attr.key || \'_\';
var defCollection = {id: [], def: undefined};
var viewController = thelpers.configResolver.calcParent(this, typeof currentPropertyName === \'undefined\' ? undefined : currentPropertyName, data);`;