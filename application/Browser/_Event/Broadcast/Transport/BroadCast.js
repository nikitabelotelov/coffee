define('Browser/_Event/Broadcast/Transport/BroadCast', [
    'require',
    'exports',
    'Browser/Storage',
    'Core/helpers/createGUID'
], function (require, exports, Storage_1, createGUID) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var NAME = 'TabMessage';    /*
     * Т.к. имя у BroadcastChannel должно совпадать на всех вкладках, то оно должно быть константно,
     * но, если на одной вкладке будет несколько BroadcastChannel, они будут получать события друг от друга.
     * Поэтому BroadcastChannel на страницу делаем в виде синглтона.
     *
     * Навершиваем один глобальный обрабочик события и разриливаем передачу в инстансы BroadCastTransport,
     * Для того чтобы не десериализовать одни и те же данные по несколько раз
     */
                                /**
     * Обёкет с обработчиками
     * @type {Object}
     */
    /*
     * Т.к. имя у BroadcastChannel должно совпадать на всех вкладках, то оно должно быть константно,
     * но, если на одной вкладке будет несколько BroadcastChannel, они будут получать события друг от друга.
     * Поэтому BroadcastChannel на страницу делаем в виде синглтона.
     *
     * Навершиваем один глобальный обрабочик события и разриливаем передачу в инстансы BroadCastTransport,
     * Для того чтобы не десериализовать одни и те же данные по несколько раз
     */
    /**
     * Обёкет с обработчиками
     * @type {Object}
     */
    var handlers = Object.create(null);    /**
     * Глобальный обработчик событий от BroadcastChannel
     * @param {MessageEvent} event
     */
    /**
     * Глобальный обработчик событий от BroadcastChannel
     * @param {MessageEvent} event
     */
    var messageHandler = function (_a) {
        var data = _a.data;
        var message = data.message;
        var messageData = Storage_1.utils.item.deserialize(data.data);
        for (var uid in handlers) {
            handlers[uid](message, messageData);
        }
    };
    var broadcast;
    var getBroadCast = function () {
        if (!broadcast) {
            broadcast = new BroadcastChannel(NAME);
            broadcast.addEventListener('message', messageHandler);
        }
        return broadcast;
    };
    var BroadCastTransport = /** @class */
    function () {
        // @ts-ignore
        function BroadCastTransport(channel) {
            this.uid = createGUID();
            handlers[this.uid] = function (message, data) {
                channel.notify(message, data);
            };
        }
        BroadCastTransport.prototype.notify = function (message, data) {
            /*
             * BroadCast позволяет пересылать простые объекты без лишних танцев
             * Но мы должны поддерживать пересылку Types/entity.* и Types/collection.*
             * Поэтому сериализуем сами данные, а внешний-служебный объект оставляем как есть,
             * дабы не создавать себе лишнюю работу
             */
            getBroadCast().postMessage({
                message: message,
                data: Storage_1.utils.item.serialize(data)
            });
        };
        BroadCastTransport.prototype.destroy = function () {
            delete handlers[this.uid];
        };
        return BroadCastTransport;
    }();
    exports.BroadCastTransport = BroadCastTransport;
});