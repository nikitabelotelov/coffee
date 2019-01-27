/// <amd-module name="Types/_chain/Sliced" />
/**
 * Вырезающее звено цепочки.
 * @class Types/_chain/Sliced
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Sliced', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/SlicedEnumerator'
], function (require, exports, tslib_1, Abstract_1, SlicedEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Sliced = /** @class */
    function (_super) {
        tslib_1.__extends(Sliced, _super);    /** @lends Types/_chain/Sliced.prototype */
                                              /**
         * Конструктор вырезающего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Number} begin Индекс, по которому начинать извлечение
         * @param {Number} end Индекс, по которому заканчивать извлечение (будут извлечены элементы с индексом меньше end)
         */
        /** @lends Types/_chain/Sliced.prototype */
        /**
         * Конструктор вырезающего звена цепочки.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {Number} begin Индекс, по которому начинать извлечение
         * @param {Number} end Индекс, по которому заканчивать извлечение (будут извлечены элементы с индексом меньше end)
         */
        function Sliced(source, begin, end) {
            var _this = _super.call(this, source) || this;
            _this._begin = begin;
            _this._end = end;
            return _this;
        }    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Sliced.prototype.getEnumerator = function () {
            return new SlicedEnumerator_1.default(this._previous, this._begin, this._end);
        };
        return Sliced;
    }(Abstract_1.default);
    exports.default = Sliced;
    Sliced.prototype['[Types/_chain/Sliced]'] = true;    // @ts-ignore
    // @ts-ignore
    Sliced.prototype._begin = 0;    // @ts-ignore
    // @ts-ignore
    Sliced.prototype._end = 0;
});