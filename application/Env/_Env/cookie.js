define('Env/_Env/cookie', [
    'require',
    'exports',
    'Env/Constants'
], function (require, exports, Constants_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MS_IN_DAY = 24 * 60 * 60 * 1000;
    function getRequest() {
        // @ts-ignore
        return process && process.domain && process.domain.req || {};
    }
    function getHeaderSetCookies(name, value, options) {
        var expires = options.expires ? '; expires=' + options.expires : '';
        var path = options.path ? '; path=' + options.path : '';
        var domain = options.domain ? '; domain=' + options.domain : '';
        var secure = options.secure ? '; secure' : '';
        return [
            name,
            '=',
            encodeURIComponent(value),
            expires,
            path,
            domain,
            secure
        ].join('');
    }    /**
     * Модуль для работы с cookie.
     * @class Core/_Util/cookie
     * @public
     * @author Мальцев А.А.
     */
    /**
     * Модуль для работы с cookie.
     * @class Core/_Util/cookie
     * @public
     * @author Мальцев А.А.
     */
    var cookie = /** @lends Core/_Util/cookie.prototype */
    {
        /**
         * @typedef {Object} CookieOptions
         * @property {Number|Date} [expires] Дата окончания действия cookie. Если не указана,
         * то cookie исчезнет после завершении сессии браузера.
         * @property {String} [path] Путь на сервере, для которого действует cookie. По умолчанию - текущий путь.
         * @property {String} [domain] Домен, на который следует установить cookie. По умолчанию - текущий домен.
         * @property {Boolean} [secure=false] Передавать cookie только через безопасный протокол
         */
        /**
         * Возвращает значение cookie с указанным именем
         * @param {String} name Имя cookie
         * @returns {*} Значение cookie
         */
        get: function (name) {
            if (Constants_1.constants.isNodePlatform || Constants_1.constants.isServerScript) {
                var request = getRequest();
                return request.cookies ? request.cookies[name] : null;
            }
            var value = null;
            if (document.cookie) {
                var cookies = document.cookie.split(';');
                var item = void 0;
                for (var i = 0; i < cookies.length; i++) {
                    item = String(cookies[i]).trim();
                    if (item.substring(0, name.length + 1) === name + '=') {
                        value = decodeURIComponent(item.substring(name.length + 1));
                        break;
                    }
                }
            }
            return value;
        },
        /**
         * Устанавливает cookie с указанным именем
         * @param {String} name Имя cookie
         * @param {String} value Значение cookie
         * @param {CookieOptions} [options] Дополнительные свойства для установки cookie
         */
        set: function (name, value, options) {
            var optionsCookie = Object.assign({}, options);
            var valueCookie = value;
            if (Constants_1.constants.isServerScript) {
                throw new Error('Set cookie on server is not supported');
            }
            if (valueCookie === null) {
                valueCookie = '';
                optionsCookie.expires = -1;
            }
            if (optionsCookie.expires) {
                var date = void 0;
                if (typeof optionsCookie.expires === 'number') {
                    date = new Date();
                    date.setTime(date.getTime() + optionsCookie.expires * MS_IN_DAY);
                } else if (optionsCookie.expires.toUTCString) {
                    date = optionsCookie.expires;
                } else {
                    throw new TypeError('Option "expires" should be a Number or Date instance');
                }
                optionsCookie.expires = date;
            }
            if (Constants_1.constants.isNodePlatform) {
                // @ts-ignore
                process.domain.res.cookie(name, value, optionsCookie);
            } else {
                optionsCookie.expires = optionsCookie.expires && optionsCookie.expires.toUTCString();
                document.cookie = getHeaderSetCookies(name, value, optionsCookie);
            }
        }
    };
    exports.default = cookie;
});