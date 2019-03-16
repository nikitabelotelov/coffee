/// <amd-module name="Env/_Env/bomDefine" />

let global = (function() {
    return this || (0, eval)('this');
})();
declare const process:any;
if (typeof (window) === 'undefined') {
    global.window = undefined;
}
if (typeof (document) === 'undefined') {
    global.document = undefined;
}
if (typeof (navigator) === 'undefined') {
    global.navigator = undefined;
}
// @ts-ignore
if (typeof (process) === 'undefined') {
    global.process = undefined;
}
