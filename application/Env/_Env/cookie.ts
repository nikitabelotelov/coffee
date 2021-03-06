/// <amd-module name="Env/_Env/cookie" />
import { constants }  from 'Env/Constants';
const MS_IN_DAY = 24 * 60 * 60 * 1000;

function getRequest() {
    // @ts-ignore
    return (process && process.domain && process.domain.req) || {};
}

function getHeaderSetCookies(name, value, options) {
    const expires = options.expires ? `; expires=${options.expires}` : '';
    const path = options.path ? `; path=${options.path}` : '';
    const domain = options.domain ? `; domain=${options.domain}` : '';
    const secure = options.secure ? '; secure' : '';

    return [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
}

/**
 * Модуль для работы с cookie.
 * @class Core/_Util/cookie
 * @public
 * @author Мальцев А.А.
 */
const cookie = /** @lends Core/_Util/cookie.prototype */{
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
    get(name) {
        if (constants.isNodePlatform || constants.isServerScript) {
            const request = getRequest();
            return request.cookies ? request.cookies[name] : null;
        }

        let value = null;

        if (document.cookie) {
            const cookies = document.cookie.split(';');
            let item;

            for (let i = 0; i < cookies.length; i++) {
                item = String(cookies[i]).trim();
                if (item.substring(0, name.length + 1) === (`${name}=`)) {
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
    set(name, value, options) {
        const optionsCookie = Object.assign({}, options);
        let valueCookie = value;

        if (constants.isServerScript) {
            throw new Error('Set cookie on server is not supported');
        }

        if (valueCookie === null) {
            valueCookie = '';
            optionsCookie.expires = -1;
        }

        if (optionsCookie.expires) {
            let date;

            if (typeof optionsCookie.expires === 'number') {
                date = new Date();
                date.setTime(date.getTime() + (optionsCookie.expires * MS_IN_DAY));
            } else if (optionsCookie.expires.toUTCString) {
                date = optionsCookie.expires;
            } else {
                throw new TypeError('Option "expires" should be a Number or Date instance');
            }

            optionsCookie.expires = date;
        }

        if (constants.isNodePlatform) {
            // @ts-ignore
            process.domain.res.cookie(name, value, optionsCookie);
        } else {
            optionsCookie.expires = optionsCookie.expires && optionsCookie.expires.toUTCString();
            document.cookie = getHeaderSetCookies(name, value, optionsCookie);
        }
    }
};

export default cookie;
