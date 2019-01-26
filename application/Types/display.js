/// <amd-module name="Types/display" />
/**
 * Displays library
 * @library Types/display
 * @includes DestroyableMixin Types/_display/DestroyableMixin
 * @includes Collection Types/_display/Collection
 * @includes Enum Types/_display/Enum
 * @includes Flags Types/_display/Flags
 * @includes Ladder Types/_display/Ladder
 * @includes Search Types/_display/Search
 * @includes Tree Types/_display/Tree
 * @author Мальцев А.А.
 */
define('Types/display', [
    'require',
    'exports',
    'Types/_display/Abstract',
    'Types/_display/Collection',
    'Types/_display/CollectionItem',
    'Types/_display/Enum',
    'Types/_display/Flags',
    'Types/_display/FlagsItem',
    'Types/_display/GroupItem',
    'Types/_display/itemsStrategy',
    'Types/_display/Ladder',
    'Types/_display/Search',
    'Types/_display/Tree',
    'Types/_display/TreeItem'
], function (require, exports, Abstract_1, Collection_1, CollectionItem_1, Enum_1, Flags_1, FlagsItem_1, GroupItem_1, itemsStrategy, Ladder_1, Search_1, Tree_1, TreeItem_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    exports.Abstract = Abstract_1.default;
    exports.Collection = Collection_1.default;
    exports.CollectionItem = CollectionItem_1.default;
    exports.Enum = Enum_1.default;
    exports.Flags = Flags_1.default;
    exports.FlagsItem = FlagsItem_1.default;
    exports.GroupItem = GroupItem_1.default;
    exports.itemsStrategy = itemsStrategy;
    exports.Ladder = Ladder_1.default;
    exports.Search = Search_1.default;
    exports.Tree = Tree_1.default;
    exports.TreeItem = TreeItem_1.default;
});