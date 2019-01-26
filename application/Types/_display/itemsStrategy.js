/// <amd-module name="Types/_display/itemsStrategy" />
/**
 * Items strategy library
 * @library Types/_display/itemsStrategy
 * @includes DestroyableMixin Types/_display/itemsStrategy/DestroyableMixin
 * @includes Direct Types/_display/itemsStrategy/Direct
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy', [
    'require',
    'exports',
    'Types/_display/itemsStrategy/AbstractStrategy',
    'Types/_display/itemsStrategy/AdjacencyList',
    'Types/_display/itemsStrategy/Composer',
    'Types/_display/itemsStrategy/Direct',
    'Types/_display/itemsStrategy/Group',
    'Types/_display/itemsStrategy/MaterializedPath',
    'Types/_display/itemsStrategy/Root',
    'Types/_display/itemsStrategy/Search',
    'Types/_display/itemsStrategy/User'
], function (require, exports, AbstractStrategy_1, AdjacencyList_1, Composer_1, Direct_1, Group_1, MaterializedPath_1, Root_1, Search_1, User_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.AbstractStrategy = AbstractStrategy_1.default;
    exports.AdjacencyList = AdjacencyList_1.default;
    exports.Composer = Composer_1.default;
    exports.Direct = Direct_1.default;
    exports.Group = Group_1.default;
    exports.MaterializedPath = MaterializedPath_1.default;
    exports.Root = Root_1.default;
    exports.Search = Search_1.default;
    exports.User = User_1.default;
});