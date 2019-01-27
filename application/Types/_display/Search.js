/// <amd-module name="Types/_display/Search" />
/**
 * Проекция для режима поиска. Объединяет развернутые узлы в один элемент с "хлебной крошкой" внутри.
 * @class Types/_display/Search
 * @extends Types/_display/Tree
 * @public
 * @author Мальцев А.А.
 */
define('Types/_display/Search', [
    'require',
    'exports',
    'tslib',
    'Types/_display/Tree',
    'Types/_display/itemsStrategy/Search',
    'Types/di'
], function (require, exports, tslib_1, Tree_1, Search_1, di_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var Search = /** @class */
    function (_super) {
        tslib_1.__extends(Search, _super);    /** @lends Types/_display/Search.prototype */
        /** @lends Types/_display/Search.prototype */
        function Search() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Search.prototype._createComposer = function () {
            var composer = _super.prototype._createComposer.call(this);
            composer.append(Search_1.default);
            return composer;
        };
        return Search;
    }(Tree_1.default    /** @lends Types/_display/Search.prototype */);
    /** @lends Types/_display/Search.prototype */
    exports.default = Search;
    Search.prototype._moduleName = 'Types/display:Search';
    Search.prototype['[Types/_display/Search]'] = true;
    di_1.register('Types/display:Search', Search);
});