define('UI/Base', [
    'require',
    'exports',
    'UI/_base/Control',
    'UI/_base/HTML',
    'UI/_base/Document',
    'UI/_base/StateReceiver',
    'UI/_base/Deprecated/AppData',
    'UI/_base/Start',
    'wml!UI/_base/Route'
], function (require, exports, Control_1, HTML_1, Document_1, StateReceiver_1, AppData_1, Start_1, BaseRoute) {
    'use strict';
    return {
        Control: Control_1.default,
        HTML: HTML_1.default,
        Document: Document_1.default,
        StateReceiver: StateReceiver_1.default,
        AppData: AppData_1.default,
        Start: Start_1.default,
        BaseRoute: BaseRoute
    };
});