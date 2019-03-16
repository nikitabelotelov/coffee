define('Browser/_Event/Server/_class/deliver/Browser', [
    'require',
    'exports',
    'Browser/_Event/Broadcast/Message'
], function (require, exports, Message_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Browser = /** @class */
    function () {
        function Browser(notifier) {
            this.notifier = notifier;
            this.onmessageHandler = this.onmessageHandler.bind(this);
            this.taber = new Message_1.default();
            this.taber.subscribe(Browser.ON_MESSAGE, this.onmessageHandler);
        }
        Browser.prototype.onmessageHandler = function (event, data) {
            this.notifier.fire(data.channelName, data.eventName, data.rawData);
        };
        Browser.prototype.deliver = function (channelName, eventName, rawData) {
            this.notifier.fire(channelName, eventName, rawData);
            this.taber.notify(Browser.ON_MESSAGE, {
                channelName: channelName,
                eventName: eventName,
                rawData: rawData
            });
        };
        Browser.prototype.destroy = function () {
            this.taber.unsubscribe(Browser.ON_MESSAGE, this.onmessageHandler);
        };
        Browser.ON_MESSAGE = 'servereventbus_onmessage';
        return Browser;
    }();
    exports.Browser = Browser;
});