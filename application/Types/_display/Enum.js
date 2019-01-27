/// <amd-module name="Types/_display/Enum" />
/**
 * Проекция типа "Перечисляемое".
 * @class Types/_display/Enum
 * @extends Types/_display/Collection
 * @public
 * @author Ганшнин Ярослав
 */
define('Types/_display/Enum', [
    'require',
    'exports',
    'tslib',
    'Types/_display/Collection',
    'Types/di'
], function (require, exports, tslib_1, Collection_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    function onSourceChange(event, index) {
        this.setCurrentPosition(this.getIndexBySourceIndex(index));
    }
    var Enum = /** @class */
    function (_super) {
        tslib_1.__extends(Enum, _super);    /** @lends Types/_display/Enum.prototype */
        /** @lends Types/_display/Enum.prototype */
        function Enum(options) {
            var _this = _super.call(this, options) || this;
            if (!_this._$collection['[Types/_collection/IEnum]']) {
                throw new TypeError(_this._moduleName + ': source collection should implement Types/_collectionIEnum');
            }
            _this._getCursorEnumerator().setPosition(_this.getIndexBySourceIndex(_this._$collection.get()));
            if (_this._$collection['[Types/_entity/ObservableMixin]']) {
                _this._$collection.subscribe('onChange', _this._onSourceChange);
            }
            return _this;
        }
        Enum.prototype.destroy = function () {
            if (this._$collection['[Types/_entity/DestroyableMixin]'] && this._$collection['[Types/_entity/ObservableMixin]'] && !this._$collection.destroyed) {
                this._$collection.unsubscribe('onChange', this._onSourceChange);
            }
            _super.prototype.destroy.call(this);
        };
        Enum.prototype._bindHandlers = function () {
            _super.prototype._bindHandlers.call(this);
            this._onSourceChange = onSourceChange.bind(this);
        };
        Enum.prototype._notifyCurrentChange = function (newCurrent, oldCurrent, newPosition, oldPosition) {
            var value = null;
            if (newPosition > -1) {
                value = this.getSourceIndexByIndex(newPosition);
            }
            this._$collection.set(value);
            _super.prototype._notifyCurrentChange.call(this, newCurrent, oldCurrent, newPosition, oldPosition);
        };
        Enum.prototype._getSourceIndex = function (index) {
            var enumerator = this._$collection.getEnumerator();
            var i = 0;
            if (index > -1) {
                while (enumerator.moveNext()) {
                    if (i === index) {
                        return enumerator.getCurrentIndex();
                    }
                    i++;
                }
            }
            return -1;
        };
        Enum.prototype._getItemIndex = function (index) {
            var enumerator = this._$collection.getEnumerator();
            var i = 0;
            while (enumerator.moveNext()) {
                if (enumerator.getCurrentIndex() == index) {
                    return i;
                }
                i++;
            }
            return -1;
        };
        return Enum;
    }(Collection_1.default    /** @lends Types/_display/Enum.prototype */);
    /** @lends Types/_display/Enum.prototype */
    exports.default = Enum;
    Enum.prototype._moduleName = 'Types/display:Enum';
    Enum.prototype['[Types/_display/Enum]'] = true;    // @ts-ignore
    // @ts-ignore
    Enum.prototype._localize = true;    // @ts-ignore
    // @ts-ignore
    Enum.prototype._onSourceChange = null;
    di_1.register('Types/display:Enum', Enum);
});