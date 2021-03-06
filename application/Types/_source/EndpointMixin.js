/// <amd-module name="Types/_source/EndpointMixin" />
/**
 * Миксин, позволяющий задавать конечную точку доступа.
 * @mixin Types/_source/EndpointMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/EndpointMixin', [
    'require',
    'exports',
    'tslib'
], function (require, exports, tslib_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var EndpointMixin = /** @lends Types/_source/EndpointMixin.prototype */
    {
        '[Types/_source/EndpointMixin]': true,
        /**
         * @cfg {Types/_source/IProvider/Endpoint.typedef[]|String} Конечная точка, обеспечивающая доступ клиента к
         * функциональным возможностям источника данных.
         * @name Types/_source/EndpointMixin#endpoint
         * @remark
         * Можно успользовать сокращенную запись, передав значение в виде строки - в этом случае оно будет
         * интерпретироваться как контракт (endpoint.contract).
         * @see getEndPoint
         * @example
         * Подключаем пользователей через HTTP API:
         * <pre>
         *    var dataSource = new HttpSource({
         *       endpoint: {
         *          address: '/api/',
         *          contract: 'users/'
         *       }
         *    });
         * </pre>
         * Подключаем пользователей через HTTP API с использованием сокращенной нотации:
         * <pre>
         *    var dataSource = new HttpSource({
         *       endpoint: '/users/'
         *    });
         * </pre>
         * Подключаем пользователей через HTTP API с указанием адреса подключения:
         * <pre>
         *    var dataSource = new RpcSource({
         *       endpoint: {
         *          address: '//server.name/api/rpc/',
         *          contract: 'Users'
         *       }
         *    });
         * </pre>
         */
        _$endpoint: null,
        constructor: function (options) {
            this._$endpoint = this._$endpoint || {};
            if (options) {
                // Shortcut support
                if (typeof options.endpoint === 'string') {
                    options.endpoint = { contract: options.endpoint };
                }
                if (options.endpoint instanceof Object) {
                    options.endpoint = tslib_1.__assign({}, this._$endpoint, options.endpoint);
                }
            }
        },
        getEndpoint: function () {
            return tslib_1.__assign({}, this._$endpoint);
        }
    };
    exports.default = EndpointMixin;
});