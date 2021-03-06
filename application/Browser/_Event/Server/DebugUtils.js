define('Browser/_Event/Server/DebugUtils', [
    'require',
    'exports'
], function (require, exports) {
    /// <amd-module name="Browser/_Event/Server/DebugUtils" />
    'use strict';
    var DebugUtils;
    (function (DebugUtils) {
        function addSharedBusLog() {
            if (typeof Promise !== 'function') {
                return;
            }
            var beautyLog = function (item) {
                var channel = '';
                if (item['headers'] && item['headers']['event-type']) {
                    channel = item['headers']['event-type'];
                }
                console.log('[EventLog]', new Date(item.timestamp).toLocaleString(), channel, item);    // eslint-disable-line no-console
            };
            // eslint-disable-line no-console
            var show = function (reader, filter) {
                reader.query(filter).then(function (d) {
                    d.forEach(beautyLog);
                });
            };    /**
             * @type {Browser/_Event/Server/native/_IndexedDB/Reader}
             */
            /**
             * @type {Browser/_Event/Server/native/_IndexedDB/Reader}
             */
            var reader;    /**
             * Функция отображения собранны серверных событий
             * TODO использовать COnnectorIE и обрабатывать ошибки прилетающие от Connector::connect()
             * @param {string | RegExp} filter
             */
            /**
             * Функция отображения собранны серверных событий
             * TODO использовать COnnectorIE и обрабатывать ошибки прилетающие от Connector::connect()
             * @param {string | RegExp} filter
             */
            window['sharedBusLog'] = function (filter) {
                if (reader) {
                    show(reader, filter);
                    return;
                }    // @ts-ignore
                // @ts-ignore
                require(['Browser/_Event/Server/native/_IndexedDB'], function (module) {
                    var Connector = module.Connector;
                    var AdapterStomp = module.AdapterStomp;
                    Connector.connect(Connector.DB_DEBUG, Connector.DEBUG_STORE_NAME, new AdapterStomp()).addCallback(function (connect) {
                        reader = connect.createReader();
                        show(reader, filter);
                    });
                });
            };
        }
        var watcherEnable = false;
        function addSharedBusWatcher() {
            if (watcherEnable) {
                return;
            }
            watcherEnable = true;    // @ts-ignore
            // @ts-ignore
            require([
                'Browser/_Event/Server/Bus',
                'Browser/_Event/Server/_class/logger/ConsoleWatchDog'
            ], function (seb, module) {
                seb['addWatchDog'](new module.ConsoleWatchDog());
            });
        }
        function attachDebugFn() {
            if (!window) {
                return;
            }
            addSharedBusLog();
            window['sharedBusWatch'] = addSharedBusWatcher;
        }
        DebugUtils.attachDebugFn = attachDebugFn;
    }(DebugUtils || (DebugUtils = {})));
    return DebugUtils;
});    /**
 * Функция вывода последних 100 событий полученных браузером
 * @function window.sharedBusLog
 * @param filter {string|RegExp|null} Фильтр по названию канала
 */