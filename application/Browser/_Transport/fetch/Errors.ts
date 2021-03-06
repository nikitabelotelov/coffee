/// <amd-module name="Browser/_Transport/fetch/Errors" />
// @ts-ignore
import i18n = require("Core/i18n");
// @ts-ignore
import classicExtend = require('Core/core-classicExtend');

export const ERROR_TEXT = {
    get timeout() {
        return i18n.rk('Таймаут запроса')
    },
    get unknown() {
        return i18n.rk('Неизвестная ошибка')
    },
    get parsererror() {
        return i18n.rk('Ошибка разбора документа')
    },
    get abort() {
        return i18n.rk('Запрос был прерван')
    },
    get lossOfConnection() {
        return i18n.rk('Потеряна связь с сайтом')
    },
    get '401'() {
        return i18n.rk('Ошибка авторизации')
    },
    get '403'() {
        return i18n.rk('У вас недостаточно прав для выполнения данного действия')
    },
    get '404'() {
        return i18n.rk('Документ не найден')
    },
    get '413'() {
        return i18n.rk('Превышен допустимый размер загружаемого файла')
    },
    get '423'() {
        return i18n.rk('Действие заблокировано лицензией')
    },
    get '500'() {
        return i18n.rk('Внутренняя ошибка сервера')
    },
    get '502'() {
        return i18n.rk('Сервис находится на техническом обслуживании')
    },
    get '503'() {
        return i18n.rk('Сервис находится на техническом обслуживании')
    },
    get '504'() {
        return i18n.rk('Сервис находится на техническом обслуживании')
    },
};
export const DETAILS_TEXT = {
    get default() {
        return i18n.rk('Мы знаем об этом и уже исправляем. Попробуйте заглянуть сюда через 15 минут.');
    },
    get lossOfConnection() {
        return i18n.rk('Проверьте настройки подключения к сети')
    },
};

type Config = {
    url: string;
    message: string;
    details?: string;
    name?: string;
}

/**
 * Ошибка работы транспорта
 * @name Browser/_Transport/Errors#Transport
 * @extends Error
 * @param {Object} config
 * @param {String} config.message Сообщение ошибки
 * @param {String} config.url Адрес запроса
 * @param {String} config.details Дополнительная информация
 */
export class Transport {
    public message: string;
    public stack: string;
    public url: string;
    public details: string;
    public name: string = 'TransportError';
    public processed: boolean = false;
    constructor ({url, message, details, name}: Config) {
        this.message = message;
        this.stack = new Error().stack;
        this.url = url;
        this.details = details;
        this.name = this.name || name;
    }
    toString() {
        return `${this.name}: ${this.message}; url: ${this.url}`;
    }
}

// ts-extend Error, Array, Map некоректно отрабатывают без вызова setPrototypeOf почле super
// но такой вариант не работает в IE, поэтому наследуемся через classicExtend
// tslint:disable-next-line:max-line-length
// https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
classicExtend(Transport, Error);

type HTTPConfig = Config & Partial<{
    httpError: number;
    payload: string;
    xhr: XMLHttpRequestLike;
}>

interface XMLHttpRequestLike {
    setRequestHeader(header: string, value: string)
    getResponseHeader(key: string): string
    getAllResponseHeaders(): string
    overrideMimeType(mimeType: string)
    abort()
    send(body?: any)
}

/**
 * HTTP ошибка
 * @param {Object} cfg
 * @param {String} cfg.message Сообщение об ошибке.
 * @param {Number} cfg.status HTTP-код ошибки.
 * @param {String} cfg.url Адрес.
 * @param {String} cfg.payload.
 * @param {String} [cfg.details]
 *
 * @name Browser/_Transport/Errors#HTTP
 * @extends Browser/_Transport/Errors#Transport
 */
export class HTTP extends Transport {
    public xhr: XMLHttpRequestLike;
    public status: number;
    public payload: string;
    // для обратной совместимсти с Browser/_Transport/HTTPError
    public httpError: number | string;
    constructor(cfg: HTTPConfig | string, ...args) {
        let config: HTTPConfig;
        // для обратной совместимсти с Browser/_Transport/HTTPError
        if (typeof cfg == "string") {
            let [status, url, payload, details] = args;
            config = {
                message: cfg,
                httpError: status, url, payload, details
            }
        } else {
            config = cfg;
        }
        super(config);
        this.name = 'HTTP Error';
        this.payload = config.payload || '';
        this.status = config.httpError;
        this.details = this.details || DETAILS_TEXT.default;
        this.xhr = config.xhr;
        // для обратной совместимсти с Browser/_Transport/HTTPError
        this.httpError = typeof this.status !== 'undefined' ? this.status : '';
    }
    toString() {
        return `${this.name}: ${this.message}; httpError: ${this.httpError}; url: ${this.url}`;
    }
}

// tslint:disable max-classes-per-file
/**
 * Ошибка разбора ответа сервера
 * @name Browser/_Transport/Errors#Parse
 * @extends Browser/_Transport/Errors#Transport
 */
export class Parse extends Transport {
    name = 'ParseError';
    constructor ({url, details}) {
        super({
            url, details,
            message: ERROR_TEXT.parsererror,
        });
    }
}

/**
 * Ошибка подключения
 * @name Browser/_Transport/Errors#Connection
 * @extends Browser/_Transport/Errors#Transport
 */
export class Connection extends Transport {
    public name = 'ConnectionError';
    // для обратной совместимсти с Browser/_Transport/HTTPError#offlineModeError
    public _isOfflineMode = true;
    constructor(url) {
        super({
            url,
            message: ERROR_TEXT.lossOfConnection,
            details: DETAILS_TEXT.lossOfConnection
        });
    }
}

/**
 * Ошибка авторизации
 * @name Browser/_Transport/Errors#Auth
 * @extends Browser/_Transport/Errors#Transport
 */
export class Auth extends Transport {
    name = 'AuthError';
    constructor (url) {
        super({
            url,
            message: ERROR_TEXT[401]
        });
    }
}

/**
 * Ошибка, возвращаемая при отмене запроса
 * @name Browser/_Transport/Errors#Abort
 * @extends Browser/_Transport/Errors#Transport
 */
export class Abort extends Transport {
    public canceled = true;
           name: 'AbortError';
    constructor(url: string) {
        super({
            url,
            message: ERROR_TEXT.abort
        });
    }
}
