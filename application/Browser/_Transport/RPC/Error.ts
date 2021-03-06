/// <amd-module name="Browser/_Transport/RPC/Error" />
import { HTTP as HTTPError } from 'Browser/_Transport/fetch/Errors';

type RPCErrorConfig = {
    message: string;
    httpError?: number | string;
    code?: number | string;
    methodName?: string;
    details?: string;
    url: string;
    classid?: string;
    errType?: string;
    addinfo?: string;
    error_code?: string;
}

/**
 * Ошибка RPC запроса
 * @param {Object} config
 * @param {String} config.message - текст ошибки.
 * @param {String} [config.httpError] - код HTTP ошибки.
 * @param {Number} [config.code] - код ошибки бизнес-логики.
 * @param {String} [config.methodName] - имя вызванного метода бизнес-логики.
 * @param {String} [config.details] - детальное описание ошибки.
 * @param {String} [config.url] - адрес, который загружался.
 * @param {String} [config.classid]
 * @param {String} [config.errType] - Тип ошибки.
 * @param {String} [config.addinfo] - Доп информация.
 * @param {String} [config.error_code] - код ошибки прикладников
 *
 * @name Browser/_Transport/RPC/Error
 * @extends Browser/_Transport/Errors#HTTP
 */
class RPCError extends HTTPError {
    public code: number | string;
    public methodName;
    public classid;
    public errType;
    public addinfo;
    public error_code;
    constructor(config: RPCErrorConfig | string, ...args) {
        let cfg;
        // для обратной совместимсти с Browser/_Transport/TransportError
        if (typeof config === 'string') {
            let [httpError, code, methodName, details, url,
                    classid, errType, addinfo, error_code
                ] = args;
            cfg = {
                message: config,
                httpError, code, methodName, details, url,
                classid, errType, addinfo, error_code
            }
        } else {
            cfg = config;
        }
        super(cfg);
        this.name = 'Transport error';
        this.code = cfg.code || 0;
        this.details = cfg.details || "";
        this.methodName = cfg.methodName || "";
        this.classid = cfg.classid || '';
        this.errType = cfg.errType || 'error';
        this.addinfo = cfg.addinfo || '';
        this.error_code = cfg.error_code;
    }
    toString() {
        // tslint:disable-next-line:max-line-length
        return `${this.name}: ${this.message}; method: ${this.methodName}; code: ${this.code}; httpError: ${this.httpError}; details: ${this.details}`;
    };
}

export default RPCError;
