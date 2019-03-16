define('Browser/_Event/Server/_class/logger/WatchDogAggregator', [
    'require',
    'exports'
], function (require, exports) {
    /// <amd-module name="Browser/_Event/Server/_class/logger/WatchDogAggregator" />
    /**
     * @author Санников К.А.
     */
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var WatchDogAggregator = /** @class */
    function () {
        function WatchDogAggregator(container) {
            if (container === void 0) {
                container = [];
            }
            this.container = container;
        }
        WatchDogAggregator.prototype.reg = function (watcher) {
            this.container.push(watcher);
        };
        WatchDogAggregator.prototype.logStomp = function (message) {
            for (var _i = 0, _a = this.container; _i < _a.length; _i++) {
                var watcher = _a[_i];
                try {
                    watcher.logStomp(message);
                } catch (e) {
                }
            }
        };
        WatchDogAggregator.prototype.logEvent = function (channelName, eventName, data) {
            for (var _i = 0, _a = this.container; _i < _a.length; _i++) {
                var watcher = _a[_i];
                try {
                    watcher.logEvent(channelName, eventName, data);
                } catch (e) {
                }
            }
        };
        WatchDogAggregator.prototype.logConnect = function (data) {
            for (var _i = 0, _a = this.container; _i < _a.length; _i++) {
                var watcher = _a[_i];
                try {
                    if (!watcher['logConnect']) {
                        continue;
                    }
                    watcher.logConnect(data);
                } catch (e) {
                }
            }
        };
        WatchDogAggregator.prototype.logDisconnect = function (e) {
            for (var _i = 0, _a = this.container; _i < _a.length; _i++) {
                var watcher = _a[_i];
                try {
                    if (!watcher['logDisconnect']) {
                        continue;
                    }
                    watcher.logDisconnect(e);
                } catch (e) {
                }
            }
        };
        return WatchDogAggregator;
    }();
    exports.WatchDogAggregator = WatchDogAggregator;
});