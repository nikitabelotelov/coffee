define('View/_Request/createDefault', [
    'require',
    'exports',
    'View/_Request/Console',
    'View/_Request/StateReceiver',
    'Env/Env',
    'View/_Request/Storage',
    'View/_Request/_Storage/NodeCookie'
], function (require, exports, Console_1, StateReceiver_1, Env_1, Storage_1, NodeCookie_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var global = function () {
        return this || (0, eval)('this');
    }();
    var getRequest = function () {
        return process && process.domain && process.domain.req || {};
    };
    var getForBrowser = function () {
        var _a;
        var console = new Console_1.Console({
            console: global.console,
            logLevel: Env_1.constants.logLevel
        });
        return {
            console: console,
            location: global.location,
            stateReceiver: new StateReceiver_1.default({ console: console }),
            storageMap: (_a = {}, _a[Storage_1.Key.cookie] = Storage_1.create(Storage_1.Key.cookie), _a[Storage_1.Key.sessionStorage] = Storage_1.create(Storage_1.Key.sessionStorage), _a[Storage_1.Key.localStorage] = Storage_1.create(Storage_1.Key.localStorage), _a)
        };
    };
    function extractLocationFromNodeRequest(req) {
        var href = req.originalUrl || '';
        var searchIndex = href.indexOf('?');
        var search = searchIndex >= 0 ? href.slice(searchIndex) : '';    // Extracts fields required for location from Presentation Service's
                                                                         // express-like request object
        // Extracts fields required for location from Presentation Service's
        // express-like request object
        return {
            protocol: req.protocol || '',
            host: req.hostname || '',
            hostname: req.hostname || '',
            port: '',
            hash: '',
            href: href,
            pathname: req.path || '',
            search: search
        };
    }
    var getForNode = function () {
        var _a;
        var console = new Console_1.Console({
            console: 'jstestdriver' in global ? global.jstestdriver.console : global.console,
            logLevel: Env_1.constants.logLevel
        });
        return {
            console: console,
            location: extractLocationFromNodeRequest(getRequest()),
            stateReceiver: new StateReceiver_1.default({ console: console }),
            storageMap: (_a = {}, _a[Storage_1.Key.cookie] = NodeCookie_1.default ? new NodeCookie_1.default() : Storage_1.create(Storage_1.Key.object), _a)
        };
    };    /**
     *
     * @param {Core/IRequestConstructor} RequestConstructor
     * @return {IRequest}
     */
    /**
     *
     * @param {Core/IRequestConstructor} RequestConstructor
     * @return {IRequest}
     */
    var create = function (RequestConstructor) {
        var requestConfig;
        if (Env_1.constants.isBrowserPlatform) {
            requestConfig = getForBrowser();
        } else {
            requestConfig = getForNode();
        }
        return new RequestConstructor(requestConfig);
    };
    exports.default = create;
});