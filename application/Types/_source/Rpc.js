/// <amd-module name="Types/_source/Rpc" />
/**
 * Источник данных, работающий по технологии RPC.
 * Это абстрактный класс, не предназначенный для создания самостоятельных экземпляров.
 * @class Types/_source/Rpc
 * @extends Types/_source/Remote
 * @implements Types/_source/IRpc
 * @public
 * @author Мальцев А.А.
 */
define('Types/_source/Rpc', [
    'require',
    'exports',
    'tslib',
    'Types/_source/Remote'
], function (require, exports, tslib_1, Remote_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Rpc = /** @class */
    function (_super) {
        tslib_1.__extends(Rpc, _super);
        function Rpc() {
            // region IRpc
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this['[Types/_source/IRpc]'] = true;
            return _this;    // endregion
        }
        // endregion
        Rpc.prototype.call = function (command, data) {
            var _this = this;
            return this._callProvider(command, data).addCallback(function (data) {
                return _this._loadAdditionalDependencies().addCallback(function () {
                    return _this._wrapToDataSet(data);
                });
            });
        };
        return Rpc;
    }(Remote_1.default);
    exports.default = Rpc;
    Rpc.prototype._moduleName = 'Types/source:Rpc';
    Rpc.prototype['[Types/_source/Rpc]'] = true;
});