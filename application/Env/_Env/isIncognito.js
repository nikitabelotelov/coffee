define('Env/_Env/isIncognito', [
    'require',
    'exports',
    'Env/_Env/detection'
], function (require, exports, detection) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Определяет, что браузер пользователя находится в инкогнито (приватном) режиме просмотра страниц.
     * <h2>Возвращает</h2>
     * {Promise.<Boolean>}
     * @remark
     * Работает на основании факта, что в инкогнито режиме часть поддерживаемого браузарами API отключена.
     * <h2>Пример использования.</h2>
     * <pre>
     *    require(['Core/detection/isIncognito'], function(isIncognito) {
     *       isIncognito().then(function(enabled) {
     *          console.log('Is incognito:', enabled);
     *       }).catch(console.error);
     *    });
     * </pre>
     *
     * @class Core/detection/isIncognito
     * @public
     * @author Мальцев А.А.
     */
    /**
     * Определяет, что браузер пользователя находится в инкогнито (приватном) режиме просмотра страниц.
     * <h2>Возвращает</h2>
     * {Promise.<Boolean>}
     * @remark
     * Работает на основании факта, что в инкогнито режиме часть поддерживаемого браузарами API отключена.
     * <h2>Пример использования.</h2>
     * <pre>
     *    require(['Core/detection/isIncognito'], function(isIncognito) {
     *       isIncognito().then(function(enabled) {
     *          console.log('Is incognito:', enabled);
     *       }).catch(console.error);
     *    });
     * </pre>
     *
     * @class Core/detection/isIncognito
     * @public
     * @author Мальцев А.А.
     */
    function detectByRequestFileSystem(done, skip) {
        var requestFileSystem = window['RequestFileSystem'] || window['webkitRequestFileSystem'];
        if (!requestFileSystem) {
            return skip();
        }
        requestFileSystem(window['TEMPORARY'], 10, function () {
            done(false);
        }, function () {
            done(true);
        });
    }
    function detectByIndexedDB(done, skip) {
        if (window.indexedDB && detection.firefox) {
            var db;
            try {
                db = window.indexedDB.open('test');
            } catch (err) {
                return done(true);
            }
            return setTimeout(function () {
                if (db.readyState === 'done') {
                    return done(!db.result);
                }
                skip();
            }, 300);
        } else if (detection.IEVersion >= 10) {
            try {
                if (!window.indexedDB) {
                    return done(true);
                }
            } catch (err) {
                return done(true);
            }
            return done(false);
        }
        skip();
    }
    function detectByDB(done, skip) {
        if (!detection.safari) {
            skip();
        }
        try {
            window['openDatabase'](null, null, null, null);
            done(false);
        } catch (_) {
            done(true);
        }
    }
    function detectByNavigator(done, skip) {
        if (!detection.safari) {
            skip();
        }
        done(!navigator.doNotTrack);
    }
    function detectByLocalStorage(done, skip) {
        if (window.localStorage && detection.safari) {
            try {
                window.localStorage.setItem('test', '1');
            } catch (err) {
                return done(true);
            }
            window.localStorage.removeItem('test');
            return done(false);
        }
        skip();
    }
    function detect(done) {
        if (typeof window === 'undefined') {
            throw new Error('This feature available only in browser');
        }
        detectByRequestFileSystem(done, function () {
            detectByIndexedDB(done, function () {
                detectByDB(done, function () {
                    detectByNavigator(done, function () {
                        detectByLocalStorage(done, function () {
                            throw new Error('Feature is not supported at this browser');
                        });
                    });
                });
            });
        });
    }
    function isIncognito() {
        return new Promise(function (resolve, reject) {
            try {
                detect(resolve);
            } catch (err) {
                reject(err);
            }
        });
    }
    exports.default = isIncognito;
    ;
});