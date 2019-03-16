/// <amd-module name="Types/_entity/format/UniversalField" />
define('Types/_entity/format/UniversalField', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var UniversalField    /** @lends Types/_entity/format/UniversalField.prototype */ = /** @lends Types/_entity/format/UniversalField.prototype */
    /** @class */
    function () {
        function UniversalField() {
        }
        return UniversalField;
    }();
    exports.default = UniversalField;
    Object.assign(UniversalField.prototype, {
        '[Types/_entity/format/UniversalField]': true,
        _moduleName: 'Types/entity:format.UniversalField',
        type: '',
        name: '',
        defaultValue: null,
        nullable: false,
        meta: null
    });
});