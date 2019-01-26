/// <amd-module name="Types/_chain/Objectwise" />
/**
 * Цепочка по объекту.
 * @class Types/Chain/Object
 * @extends Types/Chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Objectwise', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/collection'
], function (require, exports, tslib_1, Abstract_1, collection_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Objectwise = /** @class */
    function (_super) {
        tslib_1.__extends(Objectwise, _super);    /** @lends Types/Chain/Object.prototype */
        /** @lends Types/Chain/Object.prototype */
        function Objectwise(source) {
            var _this = this;
            if (!(source instanceof Object)) {
                throw new TypeError('Source should be an instance of Object');
            }
            _this = _super.call(this, source) || this;
            return _this;
        }    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Objectwise.prototype.getEnumerator = function () {
            return new collection_1.enumerator.Objectwise(this._source);
        };
        Objectwise.prototype.each = function (callback, context) {
            var keys = Object.keys(this._source);
            var count = keys.length;
            var key;
            for (var i = 0; i < count; i++) {
                key = keys[i];
                callback.call(context || this, this._source[key], key);
            }
        };
        Objectwise.prototype.value = function (factory) {
            if (factory instanceof Function) {
                return _super.prototype.value.call(this, factory);
            }
            return this.toObject();
        };
        return Objectwise;
    }(Abstract_1.default);
    exports.default = Objectwise;
    Objectwise.prototype['[Types/_chain/Objectwise]'] = true;
});