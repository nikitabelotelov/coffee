/// <amd-module name="Types/_entity/format/UniversalField" />
/**
 * Универсальное поле.
 * @class Types/Format/UniversalField
 * @author Мальцев А.А.
 */
define('Types/_entity/format/UniversalField', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var UniversalField    /** @lends Types/Format/UniversalField.prototype */ = /** @lends Types/Format/UniversalField.prototype */
    /** @class */
    function () {
        function UniversalField() {
        }
        return UniversalField;
    }();
    exports.default = UniversalField;
    UniversalField.prototype['[Types/_entity/format/UniversalField]'] = true;    // @ts-ignore
    // @ts-ignore
    UniversalField.prototype._moduleName = 'Types/entity:format.UniversalField';
    UniversalField.prototype.type = '';
    UniversalField.prototype.name = '';
    UniversalField.prototype.defaultValue = null;
    UniversalField.prototype.nullable = false;
    UniversalField.prototype.meta = null;
});