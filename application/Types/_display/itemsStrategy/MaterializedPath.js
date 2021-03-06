/// <amd-module name="Types/_display/itemsStrategy/MaterializedPath" />
/**
 * Стратегия получения элементов проекции по материализованному пути из порядковых номеров элементов в коллекции
 * @class Types/_display/ItemsStrategy/MaterializedPath
 * @extends Types/_display/ItemsStrategy/Abstract
 * @author Мальцев А.А.
 */
define('Types/_display/itemsStrategy/MaterializedPath', [
    'require',
    'exports',
    'tslib',
    'Types/_display/itemsStrategy/AbstractStrategy',
    'Types/util'
], function (require, exports, tslib_1, AbstractStrategy_1, util_1) {
    'use strict';
    Object.defineProperty(exports, '__esModule', { value: true });
    var MaterializedPath = /** @class */
    function (_super) {
        tslib_1.__extends(MaterializedPath, _super);    /** @lends Types/_display/ItemsStrategy/MaterializedPath.prototype */
        /** @lends Types/_display/ItemsStrategy/MaterializedPath.prototype */
        function MaterializedPath(options) {
            var _this = _super.call(this, options) || this;    /**
             * Соответствие "индекс в коллекции" - "путь"
             */
            /**
             * Соответствие "индекс в коллекции" - "путь"
             */
            _this._indexToPath = [];
            return _this;
        }
        MaterializedPath.prototype.getSorters = function () {
            var _this = this;
            var sorters = [];
            sorters.push({
                name: 'tree',
                enabled: true,
                method: MaterializedPath.sortItems,
                options: function () {
                    return { indexToPath: _this._indexToPath };
                }
            });
            return sorters;
        };
        Object.defineProperty(MaterializedPath.prototype, 'count', {
            //region IItemsStrategy
            get: function () {
                var index = 0;
                while (this.at(index) !== undefined) {
                    index++;
                }
                return index;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MaterializedPath.prototype, 'items', {
            get: function () {
                var index = 0;
                while (this.at(index) !== undefined) {
                    index++;
                }
                return this._getItems();
            },
            enumerable: true,
            configurable: true
        });
        MaterializedPath.prototype.at = function (index) {
            var items = this._getItems();
            if (!items[index]) {
                var collection = this._getCollection();
                var path = this._getPathTo(collection, index);
                var contents = void 0;
                if (path) {
                    contents = this._getItemByPath(collection, path);
                }
                if (contents) {
                    items[index] = this.options.display.createItem({
                        contents: contents,
                        parent: this._getParent(index, path)
                    });
                }
            }
            return items[index];
        };
        MaterializedPath.prototype.splice = function (start) {
            this._getItems().length = start;
            this._indexToPath.length = start;
            return [];
        };    //endregion
              //region Protected
              /**
         * Возвращает путь до элемента с порядковым номером
         * @param {Array|Types/_collection/IList|Types/_collection/IEnumerable} collection Коллекция
         * @param {Number} index Порядковый номер
         * @return {Array.<Number>}
         * @protected
         */
        //endregion
        //region Protected
        /**
         * Возвращает путь до элемента с порядковым номером
         * @param {Array|Types/_collection/IList|Types/_collection/IEnumerable} collection Коллекция
         * @param {Number} index Порядковый номер
         * @return {Array.<Number>}
         * @protected
         */
        MaterializedPath.prototype._getPathTo = function (collection, index) {
            if (this._indexToPath[index]) {
                return this._indexToPath[index];
            }
            var childrenProperty = this._options.childrenProperty;
            var current;
            var path;
            var iterator = function (search, parent, path) {
                var isArray = parent instanceof Array;
                var isList = parent['[Types/_collection/IList]'];
                var isEnumerable = parent['[Types/_collection/IEnumerable]'];
                var enumerator;
                var isLast;
                var item;
                var children;
                var sub;
                var index = 0;
                for (;;) {
                    if (isArray) {
                        isLast = parent.length <= index;
                        if (!isLast) {
                            item = parent[index];
                        }
                    } else if (isList) {
                        isLast = parent.getCount() <= index;
                        if (!isLast) {
                            item = parent.at(index);
                        }
                    } else if (isEnumerable) {
                        if (!enumerator) {
                            enumerator = parent.getEnumerator();
                        }
                        item = enumerator.moveNext() ? enumerator.getCurrent() : undefined;
                        isLast = item === undefined;
                    } else {
                        throw new TypeError('Unsupported object type: only Array, Types/_collection/IList or Types/_collection/IEnumerable are supported.');
                    }
                    if (isLast) {
                        break;
                    }
                    if (search === current) {
                        return path.concat(index);
                    }
                    current++;
                    children = util_1.object.getPropertyValue(item, childrenProperty);
                    if (children instanceof Object) {
                        sub = iterator(search, children, path.concat(index));
                        if (sub) {
                            return sub;
                        }
                    }
                    index++;
                }
            };
            current = 0;
            path = iterator(index, collection, []);
            if (path) {
                this._indexToPath[index] = path;
            }
            return path;
        };    /**
         * Возвращает элемент, находящийся по указанному пути
         * @param {Array|Types/_collection/IList|Types/_collection/IEnumerable} collection Коллекция
         * @param {Array.<Number>} path Путь до элемента
         * @return {*}
         * @protected
         */
        /**
         * Возвращает элемент, находящийся по указанному пути
         * @param {Array|Types/_collection/IList|Types/_collection/IEnumerable} collection Коллекция
         * @param {Array.<Number>} path Путь до элемента
         * @return {*}
         * @protected
         */
        MaterializedPath.prototype._getItemByPath = function (collection, path) {
            var childrenProperty = this._options.childrenProperty;
            var item = collection;
            for (var level = 0; level < path.length;) {
                item = this._getItemAt(collection, path[level]);
                level++;
                if (level < path.length) {
                    collection = util_1.object.getPropertyValue(item, childrenProperty);
                }
            }
            return item;
        };    /**
         * Возвращает родителя элемента с указанными порядковым номером и путем
         * @param {Number} index Порядковый номер элемента
         * @param {Array.<Number>} path Путь до элемента
         * @return {Types/_display/CollectionItem} Родитель элемента
         * @protected
         */
        /**
         * Возвращает родителя элемента с указанными порядковым номером и путем
         * @param {Number} index Порядковый номер элемента
         * @param {Array.<Number>} path Путь до элемента
         * @return {Types/_display/CollectionItem} Родитель элемента
         * @protected
         */
        MaterializedPath.prototype._getParent = function (index, path) {
            var parentPath = path.slice(0, path.length - 1);
            if (parentPath.length) {
                var items = this._getItems();
                var parentContents = this._getItemByPath(this._getCollection(), parentPath);
                if (parentContents) {
                    for (var i = index - 1; i >= 0; i--) {
                        if (items[i] && items[i].getContents() === parentContents) {
                            return items[i];
                        }
                    }
                }
            } else {
                return typeof this._options.root === 'function' ? this._options.root() : this._options.root;
            }
        };    /**
         * Возвращает элемент по индексу в родителе
         * @param {Array|Types/_collection/IList|Types/_collection/IEnumerable} collection Родитель
         * @param {Number} at Индекс элемента
         * @return {*}
         * @protected
         */
        /**
         * Возвращает элемент по индексу в родителе
         * @param {Array|Types/_collection/IList|Types/_collection/IEnumerable} collection Родитель
         * @param {Number} at Индекс элемента
         * @return {*}
         * @protected
         */
        MaterializedPath.prototype._getItemAt = function (collection, at) {
            var isArray = collection instanceof Array;
            var isList = collection['[Types/_collection/IEnumerable]'];
            var isEnumerable = collection['[Types/_collection/IEnumerable]'];
            var item;
            if (isArray) {
                item = collection[at];
            } else if (isList) {
                item = collection.at(at);
            } else if (isEnumerable) {
                var enumerator = collection.getEnumerator();
                var current = void 0;
                var index = 0;
                while (enumerator.moveNext()) {
                    current = enumerator.getCurrent();
                    if (index === at) {
                        item = current;
                        break;
                    }
                    index++;
                }
            } else {
                throw new TypeError('Unsupported object type: only Array, Types/_collection/IList or Types/_collection/IEnumerable are supported.');
            }
            if (item === undefined) {
                throw new ReferenceError('Item at ' + at + ' is out of range.');
            }
            return item;
        };    //endregion
              //region Statics
              /**
         * Создает индекс сортировки по материализованному пути - от корневой вершины вглубь до конечных вершин
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Array.<Number>} current Текущий индекс сортировки
         * @param {Object} options Опции
         * @return {Array.<Number>}
         */
        //endregion
        //region Statics
        /**
         * Создает индекс сортировки по материализованному пути - от корневой вершины вглубь до конечных вершин
         * @param {Array.<Types/_display/CollectionItem>} items Элементы проекции.
         * @param {Array.<Number>} current Текущий индекс сортировки
         * @param {Object} options Опции
         * @return {Array.<Number>}
         */
        MaterializedPath.sortItems = function (items, current, options) {
            var indexToPath = options.indexToPath;
            var stringIndexToPath;
            var stringPathToIndex = {};
            var pathToString = function (path) {
                return path.join('.');
            };
            var getIndexByPath = function (path) {
                return stringPathToIndex[pathToString(path)];
            };
            var comparePaths = function (pathA, pathB) {
                var realIndexA = getIndexByPath(pathA);
                var realIndexB = getIndexByPath(pathB);
                return current.indexOf(realIndexA) - current.indexOf(realIndexB);
            };
            stringIndexToPath = indexToPath.map(pathToString);
            stringIndexToPath.forEach(function (path, index) {
                stringPathToIndex[path] = index;
            });
            return current.slice().sort(function (indexA, indexB) {
                var pathA = indexToPath[indexA];
                var pathB = indexToPath[indexB];
                var pathALength = pathA.length;
                var pathBLength = pathB.length;
                var minLength = Math.min(pathALength, pathBLength);
                var result = 0;    //Going deep into path and compare each level
                //Going deep into path and compare each level
                for (var level = 0; level < minLength; level++) {
                    //Same paths are equal
                    if (pathA[level] === pathB[level]) {
                        continue;
                    }    //Different paths possibly are not equal
                    //Different paths possibly are not equal
                    result = comparePaths(pathA.slice(0, 1 + level), pathB.slice(0, 1 + level));
                    if (result !== 0) {
                        //Paths are not equal
                        break;
                    }
                }    //Equal paths but various level: child has deeper level than parent, child should be after parent
                //Equal paths but various level: child has deeper level than parent, child should be after parent
                if (result === 0 && pathALength !== pathBLength) {
                    result = pathALength - pathBLength;
                }
                return result;
            });
        };
        return MaterializedPath;
    }(AbstractStrategy_1.default    /** @lends Types/_display/ItemsStrategy/MaterializedPath.prototype */);
    /** @lends Types/_display/ItemsStrategy/MaterializedPath.prototype */
    exports.default = MaterializedPath;
    MaterializedPath.prototype._moduleName = 'Types/display:itemsStrategy.MaterializedPath';
    MaterializedPath.prototype['[Types/_display/itemsStrategy/MaterializedPath]'] = true;
});