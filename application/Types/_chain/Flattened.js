/// <amd-module name="Types/_chain/Flattened" />
/**
 * Разворачивающее звено цепочки.
 * @class Types/Chain/Flattened
 * @extends Types/Chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Flattened', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/FlattenedEnumerator'
], function (require, exports, tslib_1, Abstract_1, FlattenedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Flattened = /** @class */
    function (_super) {
        tslib_1.__extends(Flattened, _super);    /** @lends Types/Chain/Flattened.prototype */
        /** @lends Types/Chain/Flattened.prototype */
        function Flattened() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Flattened.prototype.getEnumerator = function () {
            return new FlattenedEnumerator_1.default(this._previous);
        };
        return Flattened;
    }(Abstract_1.default);
    exports.default = Flattened;
    Flattened.prototype['[Types/_chain/Flattened]'] = true;
});