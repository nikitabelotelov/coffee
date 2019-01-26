/// <amd-module name="Types/_chain/Enumerable" />
/**
 * Цепочка по IEnumerable.
 * @class Types/Chain/Enumerable
 * @extends Types/Chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Enumerable', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract'
], function (require, exports, tslib_1, Abstract_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Enumerable = /** @class */
    function (_super) {
        tslib_1.__extends(Enumerable, _super);    /** @lends Types/Chain/Enumerable.prototype */
        /** @lends Types/Chain/Enumerable.prototype */
        function Enumerable(source) {
            var _this = this;
            if (!source || !source['[Types/_collection/IEnumerable]']) {
                throw new TypeError('Source must implement Types/collection:IEnumerable');
            }
            _this = _super.call(this, source) || this;
            return _this;
        }    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Enumerable.prototype.getEnumerator = function () {
            return this._source.getEnumerator();
        };
        Enumerable.prototype.each = function (callback, context) {
            return this._source.each(callback, context);
        };    // endregion Types/_collection/IEnumerable
              // region Types/_chain/DestroyableMixin
        // endregion Types/_collection/IEnumerable
        // region Types/_chain/DestroyableMixin
        Enumerable.prototype.toObject = function () {
            if (this._source['[Types/_entity/IObject]']) {
                var result_1 = {};
                this.each(function (key, value) {
                    result_1[key] = value;
                });
                return result_1;
            }
            return _super.prototype.toObject.call(this);
        };
        return Enumerable;
    }(Abstract_1.default);
    exports.default = Enumerable;
    Enumerable.prototype['[Types/_chain/Enumerable]'] = true;
});