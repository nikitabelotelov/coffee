/// <amd-module name="Router/History" />
define('Router/History', [
    'require',
    'exports',
    'Router/Helper',
    'Router/UrlRewriter'
], function (require, exports, Helper_1, UrlRewriter_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RouterHistoryManager = /** @class */
    function () {
        function RouterHistoryManager() {
            this._localHistory = [];
            this._currentPosition = 0;
            if (typeof window !== 'undefined') {
                var currentUrl = Helper_1.default.getRelativeUrl();
                var firstStateId = 0;    // window can already have state (for example if we reload the page
                                         // that has RouterController on it). In this case, copy the state
                                         // id and start local history with it
                // window can already have state (for example if we reload the page
                // that has RouterController on it). In this case, copy the state
                // id and start local history with it
                if (window.history.state && typeof window.history.state.id === 'number') {
                    firstStateId = window.history.state.id;
                }    // Initialize local history by pushing the current state into it
                // Initialize local history by pushing the current state into it
                this._pushToHistory(firstStateId, UrlRewriter_1.default.get(currentUrl), currentUrl);    // If window doesn't have state, set it to our current state
                // If window doesn't have state, set it to our current state
                if (!window.history.state) {
                    window.history.replaceState(this.getCurrentState(), currentUrl, currentUrl);
                }
            }
        }
        RouterHistoryManager.prototype.getCurrentState = function () {
            return this._localHistory[this._currentPosition];
        };
        RouterHistoryManager.prototype.getPrevState = function () {
            return this._localHistory[this._currentPosition - 1];
        };
        RouterHistoryManager.prototype.getNextState = function () {
            return this._localHistory[this._currentPosition + 1];
        };
        RouterHistoryManager.prototype.back = function () {
            if (this._currentPosition === 0) {
                var goToUrl = Helper_1.default.getRelativeUrl(true);    // Make new state the first state in local history and update
                                                                        // (increase) ids of states that are stored already
                // Make new state the first state in local history and update
                // (increase) ids of states that are stored already
                var newState = this._generateHistoryObject(this.getCurrentState().id, UrlRewriter_1.default.get(goToUrl), goToUrl);
                this._localHistory.forEach(function (state) {
                    return state.id++;
                });    // Save the new state in the start of the local history
                // Save the new state in the start of the local history
                this._localHistory.unshift(newState);
            } else {
                this._currentPosition--;
            }
            Helper_1.default.setRelativeUrl(this.getCurrentState().url);
        };
        RouterHistoryManager.prototype.forward = function () {
            this._currentPosition++;
            if (this._currentPosition === this._localHistory.length) {
                var goToUrl = Helper_1.default.getRelativeUrl();
                this._pushToHistory(this.getPrevState().id, UrlRewriter_1.default.get(goToUrl), goToUrl);
            }
            Helper_1.default.setRelativeUrl(this.getCurrentState().url);
        };
        RouterHistoryManager.prototype.push = function (newUrl, newPrettyUrl) {
            var newStateId;
            if (this.getCurrentState()) {
                newStateId = this.getCurrentState().id + 1;
            } else {
                newStateId = 0;
            }
            this._currentPosition++;
            this._localHistory.splice(this._currentPosition);
            this._pushToHistory(newStateId, newUrl, newPrettyUrl);
            Helper_1.default.setRelativeUrl(newUrl);
            window.history.pushState(this.getCurrentState(), newPrettyUrl, newPrettyUrl);
        };
        RouterHistoryManager.prototype._generateHistoryObject = function (id, url, prettyUrl) {
            return {
                id: id,
                url: url,
                prettyUrl: prettyUrl
            };
        };
        RouterHistoryManager.prototype._pushToHistory = function (id, url, prettyUrl) {
            this._localHistory.push(this._generateHistoryObject(id, url, prettyUrl));
        };
        return RouterHistoryManager;
    }();
    exports.default = new RouterHistoryManager();
});