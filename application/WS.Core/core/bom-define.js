"use strict";
/// <amd-module name="Core/bom-define" />
var global = (function () {
    return this || (0, eval)('this');
})();
if (typeof (window) === 'undefined') {
    global.window = undefined;
}
if (typeof (document) === 'undefined') {
    global.document = undefined;
}
if (typeof (navigator) === 'undefined') {
    global.navigator = undefined;
}
if (typeof (process) === 'undefined') {
    global.process = undefined;
}
