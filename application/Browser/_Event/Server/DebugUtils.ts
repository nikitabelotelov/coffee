/// <amd-module name="Browser/_Event/Server/DebugUtils" />
"use strict";

module DebugUtils {
    function addSharedBusLog() {
        if (typeof Promise !== "function") {
            return;
        }
        let beautyLog = (item) => {
            let channel = '';
            if (item["headers"] && item["headers"]["event-type"]) {
                channel = item["headers"]["event-type"];
            }
            console.log('[EventLog]', new Date(item.timestamp).toLocaleString(), channel,
                        item); // eslint-disable-line no-console
        };
        let show = function (reader, filter) {
            reader.query(filter).then((d) => {
                d.forEach(beautyLog);
            });
        };

        /**
         * @type {Browser/_Event/Server/native/_IndexedDB/Reader}
         */
        let reader;
        /**
         * Функция отображения собранны серверных событий
         * TODO использовать COnnectorIE и обрабатывать ошибки прилетающие от Connector::connect()
         * @param {string | RegExp} filter
         */
        window["sharedBusLog"] = function (filter: string | RegExp) {
            if (reader) {
                show(reader, filter);
                return;
            }
            // @ts-ignore
            require(["Browser/_Event/Server/native/_IndexedDB"], function (module) {
                let Connector: typeof import('Browser/_Event/Server/native/_IndexedDB/Connector').Connector = module.Connector;
                let AdapterStomp: typeof import('Browser/_Event/Server/native/_IndexedDB/AdapterStomp').AdapterStomp = module.AdapterStomp;
                Connector.connect(Connector.DB_DEBUG, Connector.DEBUG_STORE_NAME, new AdapterStomp()).addCallback((connect) => {
                    reader = connect.createReader();
                    show(reader, filter);
                });
            });
        };
    }

    let watcherEnable = false;
    function addSharedBusWatcher() {
        if (watcherEnable) {
            return;
        }
        watcherEnable = true;
        // @ts-ignore
        require(["Browser/_Event/Server/Bus", "Browser/_Event/Server/_class/logger/ConsoleWatchDog"], (seb, module) => {
            seb["addWatchDog"](new module.ConsoleWatchDog());
        });
    }

    export function attachDebugFn() {
        if (!window) {
            return;
        }
        addSharedBusLog();
        window["sharedBusWatch"] = addSharedBusWatcher;
    }
}

export = DebugUtils;

/**
 * Функция вывода последних 100 событий полученных браузером
 * @function window.sharedBusLog
 * @param filter {string|RegExp|null} Фильтр по названию канала
 */
