/// <amd-module name="Types/_chain/Uniquely" />
/**
 * Звено цепочки, обеспечивающее уникальность.
 * @class Types/_chain/Uniquely
 * @extends Types/_chain/Abstract
 * @public
 * @author Мальцев А.А.
 */
define('Types/_chain/Uniquely', [
    'require',
    'exports',
    'tslib',
    'Types/_chain/Abstract',
    'Types/_chain/UniquelyEnumerator'
], function (require, exports, tslib_1, Abstract_1, UniquelyEnumerator_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Uniquely = /** @class */
    function (_super) {
        tslib_1.__extends(Uniquely, _super);    /** @lends Types/_chain/Uniquely.prototype */
                                                /**
         * Конструктор звена цепочки, обеспечивающего уникальность.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {function(*): String|Number} [idExtractor] Возвращает уникальный идентификатор для каждого элемента.
         */
        /** @lends Types/_chain/Uniquely.prototype */
        /**
         * Конструктор звена цепочки, обеспечивающего уникальность.
         * @param {Types/_chain/Abstract} source Предыдущее звено.
         * @param {function(*): String|Number} [idExtractor] Возвращает уникальный идентификатор для каждого элемента.
         */
        function Uniquely(source, idExtractor) {
            var _this = _super.call(this, source) || this;
            _this._idExtractor = idExtractor;
            return _this;
        }
        Uniquely.prototype.destroy = function () {
            this._idExtractor = null;
            _super.prototype.destroy.call(this);
        };    // region Types/_collection/IEnumerable
        // region Types/_collection/IEnumerable
        Uniquely.prototype.getEnumerator = function () {
            return new UniquelyEnumerator_1.default(this._previous, this._idExtractor);
        };
        return Uniquely;
    }(Abstract_1.default);
    exports.default = Uniquely;
    Object.assign(Uniquely.prototype, {
        '[Types/_chain/Uniquely]': true,
        _idExtractor: null
    });
});