/// <amd-module name="Lib/ServerEvent/Bus" />
/**
 * FIXME проверка названия канала
 * TODO разделить получение канала, не только по имени но и по типу (isChanneled)
 */
"use strict";
import { SEB } from "./interfaces";
import Deferred = require('Core/Deferred');
import CoreConst = require('Core/constants');
import EventBus = require('Core/EventBus');
import LocalStorageNative = require('Core/LocalStorageNative');
import IoC = require("Core/IoC");
import * as CONST from "Lib/ServerEvent/_class/Constants";
import { WatchDogAggregator as Watcher } from "Lib/ServerEvent/_class/logger/WatchDogAggregator";
import { Subscribe } from "Lib/ServerEvent/_class/Subscribe";
import { SubscribeContainer } from "Lib/ServerEvent/_class/SubscribeContainer";
import { ExclusiveProxy as TransportProxy } from "Lib/ServerEvent/_class/transport/ExclusiveProxy";
import { EVENT_DISABLE_SEB } from "Lib/ServerEvent/_class/Events";
import { ConnectWatchDog } from "Lib/ServerEvent/_class/logger/ConnectWatchDog";

/// region evristic ack
LocalStorageNative.setItem('shared-bus-ack', 'true');
/// endregion

/// region channaled scoupes
let allScopes = [CONST.CHANNEL_SCOPE.GLOBAL];
/// endregion

type SUBSCRIBE_OPTIONS = {
    exclusive?: boolean
    isChanneled?: boolean
    url?: string
    scopes?: CONST.CHANNEL_SCOPE[]
};

class AuthError {
    constructor(public message: string="Это приложение не имеет серверных событий") {
    }
}

class Seb {
    private subscribes = new SubscribeContainer();
    private subsDeferred: Deferred<SEB.ITrackedTransport>;
    private isExclusive = false;
    private watcher = new Watcher([new ConnectWatchDog()]);

    constructor() {
        this.subsDeferred = new Deferred();
        this.subscribe = this.subscribeInit.bind(this);
        this.closeChannel = this.closeChannel.bind(this);
        this.closeTransportBehavior = this.closeTransportBehavior.bind(this);
    }

    subscribe(subscribe: SEB.ISubscribe): void {
    }

    private subscribeClear(tw: TransportProxy, subscribe: SEB.IRawChanneledSubscribe): void {
        if (this.subscribes.has(subscribe)) {
            return;
        }
        this.subscribes.add(subscribe);
        try {
            tw.subscribe(subscribe);
        } catch (e) {
            if (e.name !== 'SubscribeExclusiveError') {
                throw e;
            }
            this.isExclusive = true;
            this.reconnect();
        }
    }

    /**
     * В момент переподсоединения транспорта мы должны только запоминать подписки.
     * Иначе возникают гонки и падают ошибки при работе с транспортом
     * @param {SEB.ISubscribe} subscribe
     */
    private subscribeBeforeReconnect(subscribe: SEB.ISubscribe): void {
        if (this.subscribes.has(subscribe)) {
            return;
        }
        this.subscribes.add(subscribe);
    }

    private subscribeDeferred(subscribe): void {
        this.subsDeferred.addCallback((transport: TransportProxy) => {
            this.subscribeClear(transport, subscribe);
            return transport;
        });
    }

    private subscribeInit(subscribe: SEB.ISubscribe): void {
        this.subscribe = this.subscribeDeferred;
        this.subscribeDeferred(subscribe);
        try {
            TransportProxy.init(
                this.isExclusive || subscribe.getDeliveryType() !== CONST.DELIVERY_COMMON,
                this.closeTransportBehavior,
                this.watcher
            ).addCallback((tw: TransportProxy) => {
                this.subscribe = this.subscribeClear.bind(this, tw);
                this.subsDeferred.callback(tw);
            }).addErrback((err: any) => {
                if (err.httpError === 404) {
                    IoC.resolve("ILogger").warn(new AuthError().message);
                    this.subscribe = function () {};
                    return;
                }
                this.subscribe = this.subscribeInit;
                const oldInitDeferred = this.subsDeferred;
                this.subsDeferred = new Deferred();
                oldInitDeferred.dependOn(this.subsDeferred);
                IoC.resolve("ILogger").warn(`Не удалось подписаться на ${subscribe.getChannelName()}`);
            });
        } catch (e) {
            this.subscribe = function () {};
        }
    }

    addWatchDog(watcher: SEB.IWatchDog) {
        this.watcher.reg(watcher);
    }

    private closeTransportBehavior(event: Event) {
        this.watcher.logDisconnect(event);
        if (event === EVENT_DISABLE_SEB) {
            return;
        }
        this.reInit();
    }

    /**
     * Поднимаем новое соединение и переподписываеся
     */
    private reInit() {
        this.subsDeferred = new Deferred();
        this.subscribe = this.subscribeInit;

        let oldSubs = this.subscribes.all();
        this.subscribes.clear();
        for (let subscribe of oldSubs) {
            this.subscribe(subscribe);
        }
    }

    /**
     * Запускаем рестарт подключения. Закрываем текущие соединения.
     */
    reconnect() {
        if (!this.subsDeferred) {
            return this.reInit();
        }
        this.subsDeferred.addCallbacks((tw: SEB.ITrackedTransport) => {
            this.subscribe = this.subscribeBeforeReconnect.bind(this);
            tw.close();
            return tw;
        }, () => {
            this.reInit();
        });
    }

    /**
     * Получаем все подписки и отписываемся от них
     * @param {string} name
     */
    closeChannel(name: string) {
        this.subsDeferred.addCallback((initializer) => {
            let removed = this.subscribes.removeByName(name);
            for (let item of removed) {
                initializer.unsubscribe(item);
            }
            return initializer;
        });
    }
}

let seb = new Seb();

function serverChannel(channelName, options: SUBSCRIBE_OPTIONS) {
    let name = channelName.toLocaleLowerCase();
    let channel = EventBus.channel(name);
    let opts = options || {};
    setTimeout(() => {
        /*
         * Как только все scope поправим, уберём условие
         */
        if (!opts.isChanneled) {
            seb.subscribe(
                Subscribe.create(name, opts.isChanneled, opts.exclusive)
            );
            return;
        }
        if (!opts.scopes) {
            IoC.resolve("ILogger").error(
                'В канализированных событиях необходимо указать options.scopes. \
            https://wi.sbis.ru/docs/js/Lib/ServerEvent/Bus/typedefs/ConnectOptions/?v=3.18.10');
        }
        let scopes = opts.scopes || allScopes;
        for (let scope of scopes) {
            seb.subscribe(
                Subscribe.createRaw(name, opts.isChanneled, opts.exclusive, scope)
            );
        }
    }, 0);

    return channel;
}
serverChannel["reconnect"] = function () { seb.reconnect(); };
serverChannel["close"] = function (channel) { seb.closeChannel(channel); };
serverChannel["SCOPE"] = CONST.CHANNEL_SCOPE;
EventBus["addWatchDog"] = function (watcher: SEB.IWatchDog) { seb.addWatchDog(watcher); };

/* Если выполняемся не на клиенте, то возвращаем просто канал событий */
if (CoreConst.isBrowserPlatform) {
    EventBus["serverChannel"] = serverChannel;
} else {
    EventBus["serverChannel"] = function(channelName) {
        return EventBus.channel(channelName);
    };
}

export = EventBus;

/**
 * @public
 * @class Lib/ServerEvent/Bus
 * @author Санников К.А.
 */
/**
 * @event Lib/ServerEvent/Bus#onready
 * @description Происходит при успешном соединении с каналом серверных событий.
 * @remark
 * В целях устранения потери сообщений, сгенерированных вызовом вашей БЛ, рекомендуется производить его в onready.
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Lib/ServerEvent/Bus'], function(... , bus) {
 *
 *       // в модуле должна быть объявлена именованная функция, на неё производится подписка или отписка
 *       function MyHandler (event, data) {
 *          ...
 *       }
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('MyBLEvent');
 *           // подписываемся на onmessage до onready, т.к. все подписки асинхронные
 *           // а наш deferred иногда отрабатывает синхронно, поэтому call может сработать ранее, чем onmessage,
 *           //  если onready сделать до onmessage
 *           channel.subscribe('onmessage', myHandler);
 *           channel.once('onready', function() {
 *              sbisService.call('generateMyBLEvent');
 *           });
 *           ...
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 */
/**
 * @event Lib/ServerEvent/Bus#onmessage
 * @description Происходит при получении нового сообщения в канале.
 * @remark
 * В целях устранения потери сообщений из канала, рекомендуется сначала производить подписку
 *  на событие {@link Lib/ServerEvent/Bus#onready}, а уже потом на событие onmessage.
 * @param {Core/EventObject} eventObject Дескриптор события.
 * @param {String|Object} data Сообщение, переданное от БЛ-источника.
 * @param {Object} frame Объект сообщения, которое приходит в клиентскую часть приложения от STOMP-сервиса.
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Lib/ServerEvent/Bus'], function(... , bus) {
 *
 *       // в модуле должна быть объявлена именованная функция, на неё производится подписка или отписка
 *       function MyHandler (event, data) {
 *          ...
 *       }
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('informer.counterhasbeenupdated');
 *           channel.subscribe('onmessage', function () { ... });
 *           ...
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 */
/**
 * @event Lib/ServerEvent/Bus#ondisconnect
 * @description Происходит при разрыве соединения с каналом серверных событий.
 * @param {Core/EventObject} eventObject Дескриптор события.
 */

/**
 * @method Lib/ServerEvent/Bus#serverChannel
 * @description Устанавливает канал, из которого клиентское приложение ожидает событие.
 * @param {String} channelName Имя канала.
 * @param {ConnectOptions} [opts] Дополнительные опции.
 * Подробнее о событиях такого типа читайте в разделе
 * {@link https://wi.sbis.ru/doc/platform/developmentapl/cooperationservice/subscription-to-events-in-the-cloud/#channelized-events Канализированные события}
 * @return {Core/EventBusChannel}
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Lib/ServerEvent/Bus'], function(... , bus) {
 *
 *       // в модуле должна быть объявлена именованная функция, на неё производится подписка или отписка
 *       function MyHandler (event, data) {
 *          ...
 *       }
 *       var moduleClass = CompoundControl.extend({
 *          ...
 *          var channel = bus.serverChannel('informer.counterhasbeenupdated');
 *          channel.subscribe('onmessage', MyHandler);
 *          ...
 *
 *          // Подписка на канализированное по пользователю событие
 *          var userChannel = bus.serverChannel('service.myevent:123',
 *                          {isChanneled: true, scopes: [ bus.serverChannel.SCOPE.USER ]});
 *          userChannel.once('onmessage', function() { ... });
 *          userChannel.subscribe('onready', function () {
 *             // Вызов БЛ метода, который генерирует событие service.myevent:123
 *          });
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 * @see {@link Core/EventBusChannel}
 * @see Lib/ServerEvent/Bus.serverChannel.close
 */
/**
 * @method Lib/ServerEvent/Bus#close
 * @description Отключает подписку браузера от сервера на каналзированные события по имени.
 *      <strong>Отписки обработчиков от {@link Core/EventBusChannel} не происходит</strong>
 * @param {String} channelName Имя канала.
 * @example
 * <pre>
 *    define('SBIS3.MyArea.ModuleName', [... , 'Lib/ServerEvent/Bus'], function(... , bus) {
 *       var moduleClass = CompoundControl.extend({
 *           ...
 *           var channel = bus.serverChannel('informer.counterhasbeenupdated:12345',
 *              {isChanneled: true, scopes:[bus.serverChannel.SCOPE.GLOBAL]});
 *           channel.subscribe('onmessage', function () { ... });
 *           ...
 *           bus.serverChannel.close('informer.counterhasbeenupdated:12345');
 *       });
 *       return moduleClass;
 *    });
 * </pre>
 * @see Lib/ServerEvent/Bus#onready
 * @see Lib/ServerEvent/Bus#onmessage
 * @see Lib/ServerEvent/Bus#ondisconnect
 */

/**
 * @typedef ConnectOptions
 * @property {Boolean} [exclusive=false] Признак, по которому будет создано собственное подключение к STOMP-серверу на вкладке.
 * @property {Boolean} [isChanneled=false] Признак, по которому будет произведена подписка на индивидуальный канал событий.
 *   Требуется указать область(scope) канализированных событий
 * @property {String[]} [scopes=[serverChannel.SCOPE.GLOBAL]] Область индивидуальной подписки.
 *      Возможные значения: <ul>
 *          <li>serverChannel.SCOPE.GLOBAL - глобальное канализированное</li>
 *          <li>serverChannel.SCOPE.CLIENT - канализированное по клиенту</li>
 *          <li>serverChannel.SCOPE.USER - канализированное по пользователю</li>
 *      </ul>
 */
