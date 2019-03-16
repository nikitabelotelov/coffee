define('Browser/_Event/Server/worker/web-socket-connect.worker', [
    'require',
    'exports',
    'tslib',
    'Browser/_Event/Server/native/SockjsEmulator'
], function (require, exports, tslib_1, SockJSTransport) {
    'use strict';
    var ConnectError = /** @class */
    function (_super) {
        tslib_1.__extends(ConnectError, _super);
        function ConnectError() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ConnectError;
    }(Error);
    var ERROR_WEBSOCKET_CONNECT = 'Can\'t create websocket';
    var WebSocketConnect = /** @class */
    function () {
        function WebSocketConnect() {
        }    /**
         * Получение объекта WebSocket или создание его с помощью url
         * @param url - url для подключения вебсокета
         * @return Promise<WebSocket>
         */
        /**
         * Получение объекта WebSocket или создание его с помощью url
         * @param url - url для подключения вебсокета
         * @return Promise<WebSocket>
         */
        WebSocketConnect.getInstance = function (url) {
            if (url === void 0) {
                url = null;
            }
            if (WebSocketConnect.websocket && (WebSocketConnect.url == url || url === null) && [
                    WebSocket.CLOSING,
                    WebSocket.CLOSED
                ].indexOf(WebSocketConnect.websocket.readyState) === -1) {
                return Promise.resolve(WebSocketConnect.websocket);
            }
            if (WebSocketConnect.websocket) {
                WebSocketConnect.websocket.close();
            }
            try {
                var subProtocols = ['stomp'];
                WebSocketConnect.websocket = new SockJSTransport(url, subProtocols);
                return Promise.resolve(WebSocketConnect.websocket);
            } catch (e) {
                // Иногда ff не может корректно создать вебсокет. Подключаемся заново.
                if (e.message.indexOf('NS_ERROR_SOCKET_CREATE_FAILED') > -1) {
                    return Promise.resolve(WebSocketConnect.getInstance(url));
                }
                return Promise.reject(new ConnectError(e.message || ERROR_WEBSOCKET_CONNECT));
            }
        };
        WebSocketConnect.close = function () {
            WebSocketConnect.websocket && WebSocketConnect.websocket.close();
        };
        return WebSocketConnect;
    }();
    return WebSocketConnect;
});