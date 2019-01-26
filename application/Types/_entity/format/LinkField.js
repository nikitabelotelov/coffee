/// <amd-module name="Types/_entity/format/LinkField" />
/**
 * Формат поля "Связь".
 *
 * Создадим поле c типом "Связь":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'link'
 *    };
 * </pre>
 * @class Types/Format/LinkField
 * @extends Types/Format/Field
 * @deprecated Модуль будет удален в 3.18.10
 * @author Мальцев А.А.
 */
define('Types/_entity/format/LinkField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var LinkField = /** @class */
    function (_super) {
        tslib_1.__extends(LinkField, _super);    /** @lends Types/Format/LinkField.prototype */
        /** @lends Types/Format/LinkField.prototype */
        function LinkField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return LinkField;
    }(Field_1.default    /** @lends Types/Format/LinkField.prototype */);
    /** @lends Types/Format/LinkField.prototype */
    exports.default = LinkField;
    LinkField.prototype['[Types/_entity/format/LinkField]'] = true;
    LinkField.prototype._moduleName = 'Types/entity:format.LinkField';
    LinkField.prototype._typeName = 'Link';
    LinkField.prototype._$defaultValue = 0;
});