define('Types/_formatter/jsonReplacer', [
    'require',
    'exports'
], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /// <amd-module name="Types/_formatter/jsonReplacer" />
    /// <amd-module name="Types/_formatter/jsonReplacer" />
    function jsonReplacer(name, value) {
        if (value === Infinity) {
            return { $serialized$: '+inf' };
        } else if (value === -Infinity) {
            return { $serialized$: '-inf' };
        } else if (value === undefined) {
            return { $serialized$: 'undef' };
        }    //@ts-ignore
        else //@ts-ignore
        if (Number.isNaN(value)) {
            return { $serialized$: 'NaN' };
        }
        return value;
    }
    exports.default = jsonReplacer;
});