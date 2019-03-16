/// <amd-module name="Router/ServerRouting" />
define('Router/ServerRouting', [
    'require',
    'exports',
    'Router/MaskResolver'
], function (require, exports, MaskResolver_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var _baseTemplate = 'wml!Controls/Application/Route';
    function getAppName(request) {
        return MaskResolver_1.getAppNameByUrl(request.path);
    }
    exports.getAppName = getAppName;
    function renderApp(request, response, appName) {
        request.compatible = false;
        response.render(_baseTemplate, { application: appName });
    }
    exports.renderApp = renderApp;
    function setBaseTemplate(newBaseTemplate) {
        _baseTemplate = newBaseTemplate;
    }
    exports.setBaseTemplate = setBaseTemplate;
});