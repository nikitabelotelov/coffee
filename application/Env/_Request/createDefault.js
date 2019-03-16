define('Env/_Request/createDefault', [
    'require',
    'exports',
    'Env/_Request/Console',
    'Env/_Request/StateReceiver',
    'Core/constants',
    'Env/_Request/Storage'
], function (require, exports, Console_1, StateReceiver_1, constants, Storage_1) {
    'use strict';
    var _this = this;
    Object.defineProperty(exports, '__esModule', { value: true });
    var global = function () {
        return _this || (0, eval)('this');
    }();
    var getRequest = function () {
        return process && process.domain && process.domain.req || {};
    };
    var getForBrowser = function () {
        var _a;
        var console = new Console_1.Console({
            console: global.console,
            // @ts-ignore
            logLevel: constants.logLevel
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
        var NodeCookie;
        try {
            NodeCookie = require('Env/_Request/_Storage/NodeCookie');
        } catch (e) {
            // сервеный JS
            NodeCookie = null;
        }
        var console = new Console_1.Console({
            console: 'jstestdriver' in global ? global.jstestdriver.console : global.console,
            logLevel: constants.logLevel
        });
        return {
            console: console,
            location: extractLocationFromNodeRequest(getRequest()),
            stateReceiver: new StateReceiver_1.default({ console: console }),
            storageMap: (_a = {}, _a[Storage_1.Key.cookie] = NodeCookie ? new NodeCookie.default() : Storage_1.create(Storage_1.Key.object), _a)
        };
    };    /**
     *
     * @param {Env/IRequestConstructor} RequestConstructor
     * @return {IRequest}
     */
    /**
     *
     * @param {Env/IRequestConstructor} RequestConstructor
     * @return {IRequest}
     */
    var create = function (RequestConstructor) {
        var requestConfig;
        if (constants.isBrowserPlatform) {
            requestConfig = getForBrowser();
        } else {
            requestConfig = getForNode();
        }
        return new RequestConstructor(requestConfig);
    };    // tslint:disable-next-line
    // tslint:disable-next-line
    exports.default = create;
});