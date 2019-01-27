/// <amd-module name="Types/_display/Flags" />
/**
 * Проекция типа "Флаги".
 * @class Types/_display/Flags
 * @extends Types/_display/Collection
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/Flags', [
    'require',
    'exports',
    'tslib',
    'Types/_display/Collection',
    'Types/di',
    'Types/_display/FlagsItem'
], function (require, exports, tslib_1, Collection_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });    /**
     * Обрабатывает событие об изменении состояния Flags
     * @param {Core/EventObject} event Дескриптор события
     * @param {String|Array.<boolean|null>} name Название флага
     */
    /**
     * Обрабатывает событие об изменении состояния Flags
     * @param {Core/EventObject} event Дескриптор события
     * @param {String|Array.<boolean|null>} name Название флага
     */
    function onSourceChange(event, name) {
        var _this = this;
        if (Array.isArray(name)) {
            name.forEach(function (selected, index) {
                var item = _this.getItemBySourceIndex(index);
                _this.notifyItemChange(item, 'selected');
            });
        } else {
            var item = this.getItemBySourceItem(name);
            this.notifyItemChange(item, 'selected');
        }
    }
    var Flags = /** @class */
    function (_super) {
        tslib_1.__extends(Flags, _super);    /** @lends Types/_display/Flags.prototype */
        /** @lends Types/_display/Flags.prototype */
        function Flags(options) {
            var _this = _super.call(this, options) || this;
            if (!_this._$collection['[Types/_collection/IFlags]']) {
                throw new TypeError(_this._moduleName + ': source collection should implement Types/_collectionIFlags');
            }
            if (_this._$collection['[Types/_entity/ObservableMixin]']) {
                _this._$collection.subscribe('onChange', _this._onSourceChange);
            }
            return _this;
        }
        Flags.prototype.destroy = function () {
            if (this._$collection['[Types/_entity/DestroyableMixin]'] && this._$collection['[Types/_entity/ObservableMixin]'] && !this._$collection.destroyed) {
                this._$collection.unsubscribe('onChange', this._onSourceChange);
            }
            _super.prototype.destroy.call(this);
        };
        Flags.prototype._bindHandlers = function () {
            _super.prototype._bindHandlers.call(this);
            this._onSourceChange = onSourceChange.bind(this);
        };
        return Flags;
    }(Collection_1.default    /** @lends Types/_display/Flags.prototype */);
    /** @lends Types/_display/Flags.prototype */
    exports.default = Flags;
    Flags.prototype._moduleName = 'Types/display:Flags';
    Flags.prototype['[Types/_display/Flags]'] = true;    // @ts-ignore
    // @ts-ignore
    Flags.prototype._itemModule = 'Types/display:FlagsItem';    // @ts-ignore
    // @ts-ignore
    Flags.prototype._localize = true;
    di_1.register('Types/display:Flags', Flags);
});