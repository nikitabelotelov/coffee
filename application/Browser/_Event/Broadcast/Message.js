define('Browser/_Event/Broadcast/Message', [
    'require',
    'exports',
    'Env/Event',
    'Env/Constants',
    'Core/helpers/createGUID',
    'Browser/_Event/Broadcast/Transport/LocalStorage',
    'Browser/_Event/Broadcast/Transport/BroadCast',
    'Browser/_Event/Broadcast/Transport/Fake',
    'Browser/_Event/Broadcast/FakeMessage'
], function (require, exports, Event_1, Constants_1, createGUID, LocalStorage_1, BroadCast_1, Fake_1, FakeMessage_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var CHANNEL_NAME = 'TabMessage';    /**
     * Выбирает каким транспортом можем пользоваться
     * @return {TransportConstructor}
     */
    /**
     * Выбирает каким транспортом можем пользоваться
     * @return {TransportConstructor}
     */
    var selectTransportConstructor = function () {
        if (!Constants_1.constants.isBrowserPlatform) {
            return Fake_1.FakeTransport;
        }
        if (typeof BroadcastChannel !== 'undefined') {
            return BroadCast_1.BroadCastTransport;
        }
        return LocalStorage_1.LocalStorageTransport;
    };
    var CurrentTransportConstructor;    /**
     * Получение корректного конструктора транспорта с кешированием
     * @return {TransportConstructor}
     */
    /**
     * Получение корректного конструктора транспорта с кешированием
     * @return {TransportConstructor}
     */
    var getTransportConstructor = function () {
        if (!CurrentTransportConstructor) {
            CurrentTransportConstructor = selectTransportConstructor();
        }
        return CurrentTransportConstructor;
    };    /**
     * Класс, позволяющий пересылать сообщения между вкладками
     *
     * <pre>
     *     // ...
     *     tabMessage = new TabMessage();
     *     // подписываемся на изменение статуса загрузки
     *     tabMessage.subscribe("upload-status", function (event, data){
     *          switch (data.get('status')) {
     *              case "start": {
     *                  log("start upload", data.get('file'));
     *                  break;
     *              }
     *              case "finish": {
     *                  log("start finish", data.get('file'), data.get('result'));
     *                  break;
     *              }
     *              case "progress": {
     *                  log("start progress", data.get('file'), );
     *                  break;
     *              }
     *          }
     *     });
     *     // ...
     *     // при старте загрузки с одной вкладки отправляем статус на другие вкладки
     *     self.getChildControlByName("uploadBtn").subscribe("onactivated", function (event){
     *          self.upload();
     *          var record = self.getUploadInfo();
     *          tabMessage.notify("upload-status", record);
     *     });
     * </pre>
     * Уведомление об открытом документе
     * <pre>
     *     // Пример кода, который выполняется при открытии документа
     *     require(["Browser/_Tab/Message"], function (TabMessage) {
     *         var tabMessage = new TabMessage();
     *         var documentId = 245;
     *         var eventName = "document.open:%id".replace("%id", documentId);
     *         tabMessage.subscribe(eventName, function (event, data) {
     *             if (data.readOnly) {
     *                 return;
     *             }
     *             // Нашалогика. Решаем кто и как будет реагировать. Например, покажем пользователю открытый документ*
     *             console.warn("Документ уже открыт на другой вкладке.");
     *             alert("Вот открытый вами документ.");
     *         });
     *         tabMessage.notify(eventName, {readOnly: true})
     *     ;});
     * </pre>
     *
     * @class Browser/_Tab/Message
     * @public
     * @author Заляев А.В.
     */
    /**
     * Класс, позволяющий пересылать сообщения между вкладками
     *
     * <pre>
     *     // ...
     *     tabMessage = new TabMessage();
     *     // подписываемся на изменение статуса загрузки
     *     tabMessage.subscribe("upload-status", function (event, data){
     *          switch (data.get('status')) {
     *              case "start": {
     *                  log("start upload", data.get('file'));
     *                  break;
     *              }
     *              case "finish": {
     *                  log("start finish", data.get('file'), data.get('result'));
     *                  break;
     *              }
     *              case "progress": {
     *                  log("start progress", data.get('file'), );
     *                  break;
     *              }
     *          }
     *     });
     *     // ...
     *     // при старте загрузки с одной вкладки отправляем статус на другие вкладки
     *     self.getChildControlByName("uploadBtn").subscribe("onactivated", function (event){
     *          self.upload();
     *          var record = self.getUploadInfo();
     *          tabMessage.notify("upload-status", record);
     *     });
     * </pre>
     * Уведомление об открытом документе
     * <pre>
     *     // Пример кода, который выполняется при открытии документа
     *     require(["Browser/_Tab/Message"], function (TabMessage) {
     *         var tabMessage = new TabMessage();
     *         var documentId = 245;
     *         var eventName = "document.open:%id".replace("%id", documentId);
     *         tabMessage.subscribe(eventName, function (event, data) {
     *             if (data.readOnly) {
     *                 return;
     *             }
     *             // Нашалогика. Решаем кто и как будет реагировать. Например, покажем пользователю открытый документ*
     *             console.warn("Документ уже открыт на другой вкладке.");
     *             alert("Вот открытый вами документ.");
     *         });
     *         tabMessage.notify(eventName, {readOnly: true})
     *     ;});
     * </pre>
     *
     * @class Browser/_Tab/Message
     * @public
     * @author Заляев А.В.
     */
    var Message = /** @class */
    function () {
        function Message() {
            this._channel = Event_1.Bus.channel(CHANNEL_NAME + '-' + createGUID());
            var Transport = getTransportConstructor();
            this._transport = new Transport(this._channel);
        }    /**
         * Разрушить экземпляр класса.
         * @method
         * @name Browser/_Tab/Message#destroy
         */
        /**
         * Разрушить экземпляр класса.
         * @method
         * @name Browser/_Tab/Message#destroy
         */
        Message.prototype.destroy = function () {
            this._transport.destroy();
            this._channel.unsubscribeAll();
            this._channel.destroy();
        };    /**
         * Добавить обработчик на меж-оконное сообщение.
         * @method
         * @name Browser/_Tab/Message#subscribe
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {Function} handler Функция-делегат, обработчик сообщения.
         * @return {Browser/_Tab/Message} Экземпляр класса.
         * @example
         * <pre>
         *     ...
         *     tabMessage.subscribe("best-button-click", function (e, messageData){
         *          log("my favorite button is click!");
         *     });
         * </pre>
         */
        /**
         * Добавить обработчик на меж-оконное сообщение.
         * @method
         * @name Browser/_Tab/Message#subscribe
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {Function} handler Функция-делегат, обработчик сообщения.
         * @return {Browser/_Tab/Message} Экземпляр класса.
         * @example
         * <pre>
         *     ...
         *     tabMessage.subscribe("best-button-click", function (e, messageData){
         *          log("my favorite button is click!");
         *     });
         * </pre>
         */
        Message.prototype.subscribe = function (messageName, handler) {
            this._channel.subscribe(messageName, handler, this);
            return this;
        };    /**
         * Выполнить обработчик меж-оконного сообщения единожды.
         * @method
         * @name Browser/_Tab/Message#once
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {Function} handler Функция-делегат, обработчик сообщения.
         * @return {Browser/_Tab/Message} Экземпляр класса.
         */
        /**
         * Выполнить обработчик меж-оконного сообщения единожды.
         * @method
         * @name Browser/_Tab/Message#once
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {Function} handler Функция-делегат, обработчик сообщения.
         * @return {Browser/_Tab/Message} Экземпляр класса.
         */
        Message.prototype.once = function (messageName, handler) {
            this._channel.once(messageName, handler, this);
            return this;
        };    /**
         * Снять обработчик с указанного меж-оконного сообщения.
         * @method
         * @name Browser/_Tab/Message#unsubscribe
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {Function} handler Функция-делегат, обработчик сообщения.
         * @return {Browser/_Tab/Message} Экземпляр класса.
         */
        /**
         * Снять обработчик с указанного меж-оконного сообщения.
         * @method
         * @name Browser/_Tab/Message#unsubscribe
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {Function} handler Функция-делегат, обработчик сообщения.
         * @return {Browser/_Tab/Message} Экземпляр класса.
         */
        Message.prototype.unsubscribe = function (messageName, handler) {
            this._channel.unsubscribe(messageName, handler);
            return this;
        };    // dispatchEvent
              /**
         * Отправить меж-оконное сообщение.
         * @method
         * @name Browser/_Tab/Message#notify
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {*} data Данные сообщения.
         * @example
         * <pre>
         *     ...
         *     bestButtonHeandler: function (event){
         *     ...
         *          tabMessage.notify("best-button-click", {
         *              date:       Date.now(),
         *              property:   "text"
         *          });
         *     }
         * </pre>
         */
        // dispatchEvent
        /**
         * Отправить меж-оконное сообщение.
         * @method
         * @name Browser/_Tab/Message#notify
         * @param {String} messageName Имя сообщения, на которое следует подписать обработчик.
         * @param {*} data Данные сообщения.
         * @example
         * <pre>
         *     ...
         *     bestButtonHeandler: function (event){
         *     ...
         *          tabMessage.notify("best-button-click", {
         *              date:       Date.now(),
         *              property:   "text"
         *          });
         *     }
         * </pre>
         */
        Message.prototype.notify = function (messageName, data) {
            if (data == undefined) {
                data = '' + data;
            }
            this._transport.notify(messageName, data);
        };
        return Message;
    }();
    var TabMessage = Constants_1.constants.isBrowserPlatform ? Message : FakeMessage_1.default;
    exports.default = TabMessage;
});