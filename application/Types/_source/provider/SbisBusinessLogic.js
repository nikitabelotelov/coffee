/// <amd-module name="Types/_source/provider/SbisBusinessLogic" />
/**
 * JSON-RPC Провайдер для бизнес-логики СБиС
 * @class Types/Source/Provider/SbisBusinessLogic
 * @implements Types/Source/Provider/IAbstract
 * @mixes Types/Entity/OptionsMixin
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/provider/SbisBusinessLogic', [
    'require',
    'exports',
    'tslib',
    'Types/entity',
    'Types/di',
    'Types/util',
    'Transport/RPCJSON'
], function (require, exports, tslib_1, entity_1, di_1, util_1, RpcJson) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var SbisBusinessLogic = /** @class */
    function (_super) {
        tslib_1.__extends(SbisBusinessLogic, _super);
        function SbisBusinessLogic(options) {
            var _this = _super.call(this) || this;
            _this['[Types/_source/provider/IAbstract]'] = true;    /**
             * @cfg {Endpoint} Конечная точка, обеспечивающая доступ клиента к БЛ
             * @name Types/Source/Provider/SbisBusinessLogic#endpoint
             * @see getEndPoint
             * @example
             * <pre>
             *    var dataSource = new SbisBusinessLogic({
             *       endpoint: {
             *          address: '/service/url/',
             *          contract: 'Сотрудник'
             *       }
             *    });
             * </pre>
             */
            /**
             * @cfg {Endpoint} Конечная точка, обеспечивающая доступ клиента к БЛ
             * @name Types/Source/Provider/SbisBusinessLogic#endpoint
             * @see getEndPoint
             * @example
             * <pre>
             *    var dataSource = new SbisBusinessLogic({
             *       endpoint: {
             *          address: '/service/url/',
             *          contract: 'Сотрудник'
             *       }
             *    });
             * </pre>
             */
            _this._$endpoint = {};
            entity_1.OptionsToPropertyMixin.call(_this, options);
            return _this;
        }    /**
         * Возвращает конечную точку, обеспечивающую доступ клиента к функциональным возможностям БЛ
         * @return {Endpoint}
         * @see endpoint
         */
        /**
         * Возвращает конечную точку, обеспечивающую доступ клиента к функциональным возможностям БЛ
         * @return {Endpoint}
         * @see endpoint
         */
        SbisBusinessLogic.prototype.getEndpoint = function () {
            return this._$endpoint;
        };
        SbisBusinessLogic.prototype.call = function (name, args) {
            name = name + '';
            args = args || {};
            var Transport = this._$transport;
            var endpoint = this.getEndpoint();
            var overrideContract = name.indexOf('.') > -1;
            if (!overrideContract && endpoint.contract) {
                name = endpoint.contract + this._nameSpaceSeparator + name;
            }
            return new Transport({ serviceUrl: endpoint.address }).callMethod(name, args);
        };
        return SbisBusinessLogic;
    }(util_1.mixin(Object, entity_1.OptionsToPropertyMixin));
    exports.default = SbisBusinessLogic;
    SbisBusinessLogic.prototype['[Types/_source/provider/SbisBusinessLogic]'] = true;
    SbisBusinessLogic.prototype._$transport = RpcJson;
    SbisBusinessLogic.prototype._nameSpaceSeparator = '.';
    di_1.register('Types/source:provider.SbisBusinessLogic', SbisBusinessLogic, { instantiate: false });
});