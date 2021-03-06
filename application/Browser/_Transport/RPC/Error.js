define('Browser/_Transport/RPC/Error', [
    'require',
    'exports',
    'tslib',
    'Browser/_Transport/fetch/Errors'
], function (require, exports, tslib_1, Errors_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
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
    var RPCError = /** @class */
    function (_super) {
        tslib_1.__extends(RPCError, _super);
        function RPCError(config) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var _this = this;
            var cfg;    // для обратной совместимсти с Browser/_Transport/TransportError
            // для обратной совместимсти с Browser/_Transport/TransportError
            if (typeof config === 'string') {
                var httpError = args[0], code = args[1], methodName = args[2], details = args[3], url = args[4], classid = args[5], errType = args[6], addinfo = args[7], error_code = args[8];
                cfg = {
                    message: config,
                    httpError: httpError,
                    code: code,
                    methodName: methodName,
                    details: details,
                    url: url,
                    classid: classid,
                    errType: errType,
                    addinfo: addinfo,
                    error_code: error_code
                };
            } else {
                cfg = config;
            }
            _this = _super.call(this, cfg) || this;
            _this.name = 'Transport error';
            _this.code = cfg.code || 0;
            _this.details = cfg.details || '';
            _this.methodName = cfg.methodName || '';
            _this.classid = cfg.classid || '';
            _this.errType = cfg.errType || 'error';
            _this.addinfo = cfg.addinfo || '';
            _this.error_code = cfg.error_code;
            return _this;
        }
        RPCError.prototype.toString = function () {
            // tslint:disable-next-line:max-line-length
            return this.name + ': ' + this.message + '; method: ' + this.methodName + '; code: ' + this.code + '; httpError: ' + this.httpError + '; details: ' + this.details;
        };
        ;
        return RPCError;
    }(Errors_1.HTTP);
    exports.default = RPCError;
});