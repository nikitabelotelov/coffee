/// <amd-module name="Types/_chain/Reversed" />
/**
 * Реверсивное звено цепочки.
 * @class Types/_chain/Reversed
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Reversed', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/ReversedEnumerator'
], function (require, exports, tslib_1, Abstract_1, ReversedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Reversed = /** @class */
    function (_super) {
        tslib_1.__extends(Reversed, _super);    /** @lends Types/_chain/Reversed.prototype */
        /** @lends Types/_chain/Reversed.prototype */
        function Reversed() {
            return _super !== null && _super.apply(this, arguments) || this;
        }    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Reversed.prototype.getEnumerator = function () {
            return new ReversedEnumerator_1.default(this._previous);
        };
        return Reversed;
    }(Abstract_1.default);
    exports.default = Reversed;
    Reversed.prototype['[Types/_chain/Reversed]'] = true;
});