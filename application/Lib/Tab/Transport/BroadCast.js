define("Lib/Tab/Transport/BroadCast", ["require", "exports", "Lib/Storage/utils/item", "Core/helpers/createGUID", "Lib/Tab/Transport/LocalStorage"], function (require, exports, itemUtil, createGUID, LocalStorage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var NAME = 'TabMessage';
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
    var handlers = Object.create(null);
    /**
     * Глобальный обработчик событий от BroadcastChannel
     * @param {MessageEvent} event
     */
    var messageHandler = function (_a) {
        var data = _a.data;
        var message = data.message;
        var messageData = itemUtil.deserialize(data.data);
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
    var BroadCastTransport = /** @class */ (function () {
        function BroadCastTransport(channel) {
            this.uid = createGUID();
            handlers[this.uid] = function (message, data) {
                channel.notify(message, data);
            };
            /*
             * Т.к. изначально был только один транспорт - через LocalStorage
             * возможна ситуация, когда мастер-вкладкой оказалась страница с документом,
             * которую пользователь не хочет обновлять неделями, и нет механизма принудительного отключения мастера
             * Поэтому, чтобы на новых вкладках не потерять события,
             * создаём LocalStorageTransport чтобы только слушать события от мастера.
             *
             * При этом не мастер-вкладки, которые пользователь не захотел обновлять по уведомлению,
             * не получат события от мастер-вкладки на BroadCas.
             * Это можно нормально решить только дублированием событий в оба канала, с последующей фильтрацией дублей
             * Что является слишком затратным по ресурсам. Поэтому так делать не будем
             *
             * TODO удалить после 3.18.400
             */
            this.__ls = new LocalStorage_1.LocalStorageTransport(channel);
        }
        BroadCastTransport.prototype.notify = function (message, data) {
            /*
             * BroadCast позволяет пересылать простые объекты без лишних танцев
             * Но мы должны поддерживать пересылку Types.entity/* и Types/collection.*
             * Поэтому сериализуем сами данные, а внешний-служебный объект оставляем как есть,
             * дабы не создавать себе лишнюю работу
             */
            getBroadCast().postMessage({
                message: message,
                data: itemUtil.serialize(data)
            });
        };
        BroadCastTransport.prototype.destroy = function () {
            delete handlers[this.uid];
            this.__ls.destroy();
        };
        return BroadCastTransport;
    }());
    exports.BroadCastTransport = BroadCastTransport;
});