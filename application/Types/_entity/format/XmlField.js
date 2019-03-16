/// <amd-module name="Types/_entity/format/XmlField" />
/**
 * Формат поля для строки в формате XML.
 *
 * Создадим поле c типом "XML":
 * <pre>
 *    var field = {
 *       name: 'foo',
 *       type: 'xml'
 *    };
 * </pre>
 * @class Types/_entity/format/XmlField
 * @extends Types/_entity/format/Field
 * @public
 * @author Мальцев А.А.
 */
define('Types/_entity/format/XmlField', [
    'require',
    'exports',
    'tslib',
    'Types/_entity/format/Field'
], function (require, exports, tslib_1, Field_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var XmlField = /** @class */
    function (_super) {
        tslib_1.__extends(XmlField, _super);    /** @lends Types/_entity/format/XmlField.prototype */
        /** @lends Types/_entity/format/XmlField.prototype */
        function XmlField() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return XmlField;
    }(Field_1.default    /** @lends Types/_entity/format/XmlField.prototype */);
    /** @lends Types/_entity/format/XmlField.prototype */
    exports.default = XmlField;
    XmlField.prototype['[Types/_entity/format/XmlField]'] = true;
    XmlField.prototype._moduleName = 'Types/entity:format.XmlField';
    XmlField.prototype._typeName = 'Xml';
    XmlField.prototype._$defaultValue = '';
});