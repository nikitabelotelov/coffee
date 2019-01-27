/// <amd-module name="Types/_entity/format/RpcFileField" />
/**
 * Формат поля файл-RPC.
 *
 * Создадим поле c типом "Файл-RPC":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'rpcfile'
 *    };
 * </pre>
 * @class Types/_entity/format/RpcFileField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/RpcFileField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var RpcFileField = /** @class */
    function (_super) {
        tslib_1.__extends(RpcFileField, _super);    /** @lends Types/_entity/format/RpcFileField.prototype */
        /** @lends Types/_entity/format/RpcFileField.prototype */
        function RpcFileField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RpcFileField;
    }(Field_1.default    /** @lends Types/_entity/format/RpcFileField.prototype */);
    /** @lends Types/_entity/format/RpcFileField.prototype */
    exports.default = RpcFileField;
    RpcFileField.prototype['[Types/_entity/format/RpcFileField]'] = true;
    RpcFileField.prototype._moduleName = 'Types/entity:format.RpcFileField';
    RpcFileField.prototype._typeName = 'RpcFile';
});