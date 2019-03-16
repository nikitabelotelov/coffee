/// <amd-module name="Router/Data" />
define('Router/Data', [
    'require',
    'exports',
    'View/Request',
    'Router/UrlRewriter'
], function (require, exports, Request, UrlRewriter) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var STORAGE_KEY = 'RouterData';
    var CORE_INSTANCE_KEY = 'CoreInstance';
    function getHistory() {
        return _getField('history');
    }
    exports.getHistory = getHistory;
    function setHistory(value) {
        _setField('history', value);
    }
    exports.setHistory = setHistory;
    function getHistoryPosition() {
        return _getField('historyPosition');
    }
    exports.getHistoryPosition = getHistoryPosition;
    function setHistoryPosition(value) {
        _setField('historyPosition', value);
    }
    exports.setHistoryPosition = setHistoryPosition;
    function getRelativeUrl() {
        return _getField('relativeUrl') || _calculateRelativeUrl();
    }
    exports.getRelativeUrl = getRelativeUrl;
    function setRelativeUrl(value) {
        _setField('relativeUrl', value);
    }
    exports.setRelativeUrl = setRelativeUrl;
    function getVisibleRelativeUrl() {
        return _calculateRelativeUrl();
    }
    exports.getVisibleRelativeUrl = getVisibleRelativeUrl;
    function getRegisteredRoutes() {
        return _getField('registeredRoutes');
    }
    exports.getRegisteredRoutes = getRegisteredRoutes;
    function getRegisteredReferences() {
        return _getField('registeredReferences');
    }
    exports.getRegisteredReferences = getRegisteredReferences;
    function getCoreInstance() {
        return _getCoreInstance();
    }
    exports.getCoreInstance = getCoreInstance;
    function _initNewStorage(storage) {
        var currentUrl = _calculateRelativeUrl();
        var initialHistoryState = {
            id: 0,
            state: UrlRewriter.get(currentUrl),
            href: currentUrl
        };
        if (typeof window !== 'undefined') {
            if (window.history.state && typeof window.history.state.id === 'number') {
                initialHistoryState.id = window.history.state.id;
            } else if (!window.history.state) {
                window.history.replaceState(initialHistoryState, initialHistoryState.href, initialHistoryState.href);
            }
        }
        var initialStorage = {
            IS_ROUTER_STORAGE: true,
            history: [initialHistoryState],
            historyPosition: 0,
            registeredRoutes: {},
            registeredReferences: {},
            relativeUrl: initialHistoryState.state
        };
        Object.assign(storage, initialStorage);
    }
    function _getStorage() {
        var currentRequest = Request.getCurrent();
        var storage = currentRequest && currentRequest.getStorage(STORAGE_KEY);
        if (currentRequest && !storage || storage && !storage.IS_ROUTER_STORAGE) {
            _initNewStorage(storage);
        }
        return storage;
    }
    function _calculateRelativeUrl() {
        var currentRequest = Request.getCurrent();
        var location = currentRequest && currentRequest.location;
        if (location) {
            return location.pathname + location.search + location.hash;
        } else {
            return null;
        }
    }
    function _getCoreInstance() {
        var currentRequest = Request.getCurrent();
        var storage = currentRequest && currentRequest.getStorage(CORE_INSTANCE_KEY);
        return storage && storage.instance;
    }
    function _getField(fieldName) {
        return _getStorage()[fieldName];
    }
    function _setField(fieldName, value) {
        var storage = _getStorage();
        return storage[fieldName] = value;
    }
});