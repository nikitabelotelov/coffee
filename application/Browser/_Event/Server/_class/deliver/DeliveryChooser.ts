/// <amd-module name="Browser/_Event/Server/_class/deliver/DeliveryChooser" />
// @ts-ignore
import Deferred = require('Core/Deferred');
import { detection } from 'Env/Env';
import { SEB } from "../../interfaces";
import { Notifier } from "Browser/_Event/Server/_class/Notifier";
import { Browser as BrowserDeliver } from "Browser/_Event/Server/_class/deliver/Browser";
import { Page as PageEventDeliver } from "Browser/_Event/Server/_class/deliver/Page";
import { Constructor as IdbCnstr } from "Browser/_Event/Server/_class/deliver/IndexedDB";

/**
 * Создаю один доставщик на страницу.
 * Как бы не менялись транспорты, канал остаётся один.
 * @type {Notifier}
 */
const notifier = new Notifier();
// const DEVELOPER_ID = 7404311; // ka.sannikov
// let isTestIndexedDB: boolean = false;

export class DeliveryChooser {
    constructor(private watcher: SEB.IWatchDog) {
        notifier.setWatcher(watcher);
    }

    choose(transport: SEB.ILazyTransport): Deferred<SEB.IEventDeliver> {
        if (transport.getLocalName() === 'WorkerTransport' || detection.isMobileIOS) {
            return Deferred.success(new PageEventDeliver(notifier));
        }

        let DeliverConstructor: SEB.IEventDeliverConstructor = PageEventDeliver;
        if (transport.getLocalName() !== 'LocalPageTransport') {
            DeliverConstructor = BrowserDeliver;
        }

        // if (isTestIndexedDB) {
        //     return this.tryLazyIndexedDb().addErrback(function (err) {
        //         return new DeliverConstructor(notifier);
        //     });
        // }

        let isIndexedDbDeliver = detection.isMobileAndroid;
        if (isIndexedDbDeliver
            && typeof Promise !== 'undefined'
            && typeof indexedDB !== 'undefined'
            && indexedDB !== null
        ) {
            return this.tryLazyIndexedDb().addErrback(function () {
                return new DeliverConstructor(notifier);
            });
        }

        return Deferred.success(new DeliverConstructor(notifier));
    }

    private tryLazyIndexedDb(): Deferred<SEB.IEventDeliver> {
        var def = new Deferred<SEB.IEventDeliver>();
        /**
         * IndexedDB не надежное. Может просто не ответить.
         */
        var timerIndexDBInit;
        // @ts-ignore
        require(['Browser/_Event/Server/_class/deliver/IndexedDB'], (mdl: { IndexedDB: IdbCnstr }) => {
            if (!mdl) {
                return def.errback();
            }
            try {
                timerIndexDBInit = setTimeout(() => {
                    def.errback('Timeout crete indexedDB');
                }, 3000);
                def.dependOn(mdl.IndexedDB.create(notifier));
            } catch (e) {
                def.errback(e)
            }
        })

        def.addCallback((r) => {
            clearTimeout(timerIndexDBInit);
            return r;
        });

        return def;
    }
}
