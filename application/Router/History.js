/// <amd-module name="Router/History" />
define('Router/History', [
    'require',
    'exports',
    'Router/UrlRewriter',
    'Router/Data'
], function (require, exports, UrlRewriter, Data) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function getPrevState() {
        return Data.getHistory()[Data.getHistoryPosition() - 1];
    }
    exports.getPrevState = getPrevState;
    function getCurrentState() {
        return Data.getHistory()[Data.getHistoryPosition()];
    }
    exports.getCurrentState = getCurrentState;
    function getNextState() {
        return Data.getHistory()[Data.getHistoryPosition() + 1];
    }
    exports.getNextState = getNextState;
    function back() {
        var history = Data.getHistory();
        var historyPosition = Data.getHistoryPosition();
        if (historyPosition === 0) {
            var currentUrl = Data.getVisibleRelativeUrl();
            history.unshift({
                id: history[0].id - 1,
                state: UrlRewriter.get(currentUrl),
                href: currentUrl
            });
        } else {
            Data.setHistoryPosition(historyPosition - 1);
        }
        _updateRelativeUrl();
    }
    exports.back = back;
    function forward() {
        var history = Data.getHistory();
        var newHistoryPosition = Data.getHistoryPosition() + 1;
        Data.setHistoryPosition(newHistoryPosition);
        if (newHistoryPosition === history.length) {
            var currentUrl = Data.getRelativeUrl();
            history.push({
                id: history[newHistoryPosition - 1].id + 1,
                state: UrlRewriter.get(currentUrl),
                href: currentUrl
            });
        }
        _updateRelativeUrl();
    }
    exports.forward = forward;
    function push(newState) {
        var history = Data.getHistory();
        var historyPosition = Data.getHistoryPosition();    // remove all states after the current state
        // remove all states after the current state
        history.length = historyPosition + 1;    // add new history state to the store
        // add new history state to the store
        newState.id = history[historyPosition].id + 1;
        history.push(newState);
        Data.setHistoryPosition(historyPosition + 1);    // update the URL
        // update the URL
        _updateRelativeUrl();
        var displayUrl = newState.href || newState.state;
        window.history.pushState(newState, displayUrl, displayUrl);
    }
    exports.push = push;
    function _updateRelativeUrl() {
        Data.setRelativeUrl(Data.getHistory()[Data.getHistoryPosition()].state);
    }
});