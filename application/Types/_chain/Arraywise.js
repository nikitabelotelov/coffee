/// <amd-module name="Types/_chain/Arraywise" />
/**
 * Цепочка по массиву.
 * @class Types/_chain/Array
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Arraywise', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/collection'
], function (require, exports, tslib_1, Abstract_1, collection_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Arraywise = /** @class */
    function (_super) {
        tslib_1.__extends(Arraywise, _super);    /** @lends Types/_chain/Array.prototype */
        /** @lends Types/_chain/Array.prototype */
        function Arraywise(source) {
            var _this = this;
            if (!(source instanceof Array)) {
                throw new TypeError('Source should be an instance of Array');
            }
            _this = _super.call(this, source) || this;
            return _this;
        }    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Arraywise.prototype.getEnumerator = function () {
            return new collection_1.enumerator.Arraywise(this._source);
        };
        Arraywise.prototype.each = function (callback, context) {
            for (var i = 0, count = this._source.length; i < count; i++) {
                callback.call(context || this, this._source[i], i);
            }
        };    // endregion Types/_collection/IEnumerable
              // region Types/_chain/DestroyableMixin
        // endregion Types/_collection/IEnumerable
        // region Types/_chain/DestroyableMixin
        Arraywise.prototype.toArray = function () {
            return this._source.slice();
        };
        return Arraywise;
    }(Abstract_1.default);
    exports.default = Arraywise;
    Arraywise.prototype['[Types/_chain/Arraywise]'] = true;
    Object.defineProperty(Arraywise.prototype, 'shouldSaveIndices', { value: false });
});